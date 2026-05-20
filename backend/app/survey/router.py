"""
Router: /survey

Wave 1: generar encuestas PDF/CSV para brigadas de campo.
Wave 2: endpoint REST para recibir y agregar respuestas ciudadanas en tiempo real.
         Las respuestas se almacenan en `encuesta_respuestas` (PostgreSQL) y se
         agregan para calcular el IPC (Índice de Preparación Ciudadana) por municipio.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.survey_builder import build_survey
from app.agents.survey_pdf import (
    generate_survey_csv_template,
    generate_digital_link_stub,
    try_generate_survey_pdf,
)
from app.agents.schemas import SurveyTemplate
from app.db.session import get_db
from app.models.proyecto import EncuestaRespuesta

router = APIRouter()
logger = logging.getLogger(__name__)


class SurveyRequest(BaseModel):
    municipio: str
    zm:        str
    riesgos_detectados: Optional[List[str]] = None


class SurveyMetaResponse(BaseModel):
    survey_id:   str
    titulo:      str
    municipio:   str
    zm:          str
    n_preguntas: int
    n_secciones: int
    digital_link: str
    version:     str


@router.post("/generate", response_model=SurveyMetaResponse)
async def generate_survey(req: SurveyRequest) -> SurveyMetaResponse:
    """
    Genera una SurveyTemplate para el municipio dado.
    Retorna metadatos y el link digital.
    """
    survey = build_survey(
        municipio=req.municipio,
        zm=req.zm,
        riesgos_detectados=req.riesgos_detectados,
    )
    link = generate_digital_link_stub(survey)
    return SurveyMetaResponse(
        survey_id=str(survey.survey_id),
        titulo=survey.titulo,
        municipio=survey.municipio,
        zm=survey.zm,
        n_preguntas=len(survey.preguntas),
        n_secciones=survey.n_secciones(),
        digital_link=link,
        version=survey.version,
    )


@router.post("/generate/pdf")
async def generate_survey_pdf_endpoint(req: SurveyRequest) -> Response:
    """
    Genera el PDF branded de la encuesta y lo retorna para descarga.
    """
    survey = build_survey(
        municipio=req.municipio,
        zm=req.zm,
        riesgos_detectados=req.riesgos_detectados,
    )
    pdf_bytes = try_generate_survey_pdf(survey)
    if not pdf_bytes:
        raise HTTPException(
            status_code=503,
            detail="reportlab no disponible en el servidor. Contacta soporte.",
        )
    filename = (
        f"encuesta_{survey.municipio.lower().replace(' ', '_')}_{str(survey.survey_id)[:8]}.pdf"
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/generate/csv")
async def generate_survey_csv_endpoint(req: SurveyRequest) -> Response:
    """
    Genera la plantilla CSV de captura de datos de la encuesta.
    """
    survey = build_survey(
        municipio=req.municipio,
        zm=req.zm,
        riesgos_detectados=req.riesgos_detectados,
    )
    csv_data = generate_survey_csv_template(survey)
    filename = (
        f"encuesta_template_{survey.municipio.lower().replace(' ', '_')}.csv"
    )
    return Response(
        content=csv_data.encode("utf-8"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Wave 2: Respuestas ciudadanas en tiempo real ─────────────────────────────

TIPOS_VIVIENDA_VALIDOS = {"condominio", "privada", "vp"}


class RespuestaRequest(BaseModel):
    municipio_id:    str
    municipio_nombre: Optional[str] = None
    tipo_vivienda:   str = Field(..., description="condominio | privada | vp")
    # Sección A — priming de valores
    sec_a_q1: Optional[int] = Field(None, ge=1, le=5)
    sec_a_q2: Optional[int] = Field(None, ge=1, le=5)
    sec_a_q3: Optional[int] = Field(None, ge=1, le=5)
    # Sección B — comportamiento actual
    sec_b_q1: Optional[int] = Field(None, ge=1, le=5)
    sec_b_q2: Optional[int] = Field(None, ge=1, le=5)
    sec_b_q3: Optional[int] = Field(None, ge=1, le=5)
    # Sección C — compromiso
    sec_c_q1: Optional[int] = Field(None, ge=1, le=5)
    sec_c_q2: Optional[int] = Field(None, ge=1, le=5)
    sec_c_q3: Optional[int] = Field(None, ge=1, le=5)
    # Metadatos de campo opcionales
    canal:   str = "qr"
    colonia: Optional[str] = None
    zona:    Optional[str] = None


class RespuestaResponse(BaseModel):
    id:            str
    municipio_id:  str
    tipo_vivienda: str
    ipc_calculado: float
    created_at:    datetime


class ResultadosEncuesta(BaseModel):
    municipio_id:       str
    n_total:            int
    n_condominio:       int
    n_privada:          int
    n_vp:               int
    ipc_global:         float
    ipc_hemisferio1:    float
    ipc_hemisferio2_vp: float
    ipc_por_segmento:   dict[str, float]
    ultima_respuesta:   Optional[datetime]


def _avg_ipc(respuestas: list[EncuestaRespuesta]) -> float:
    if not respuestas:
        return 0.0
    vals = [r.ipc_calculado for r in respuestas if r.ipc_calculado is not None]
    return round(sum(vals) / len(vals), 1) if vals else 0.0


@router.post("/respuesta", response_model=RespuestaResponse, status_code=201)
async def registrar_respuesta(
    req: RespuestaRequest,
    db: Session = Depends(get_db),
) -> RespuestaResponse:
    """
    Registra una respuesta ciudadana a la encuesta de aceptación.
    Endpoint público (sin autenticación) — accesible desde QR en campo.
    """
    if req.tipo_vivienda not in TIPOS_VIVIENDA_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail=f"tipo_vivienda debe ser uno de: {TIPOS_VIVIENDA_VALIDOS}",
        )

    ipc = EncuestaRespuesta.calcular_ipc(
        sec_a=[req.sec_a_q1, req.sec_a_q2, req.sec_a_q3],
        sec_b=[req.sec_b_q1, req.sec_b_q2, req.sec_b_q3],
        sec_c=[req.sec_c_q1, req.sec_c_q2, req.sec_c_q3],
    )

    respuesta = EncuestaRespuesta(
        municipio_id=req.municipio_id,
        municipio_nombre=req.municipio_nombre,
        tipo_vivienda=req.tipo_vivienda,
        sec_a_q1=req.sec_a_q1, sec_a_q2=req.sec_a_q2, sec_a_q3=req.sec_a_q3,
        sec_b_q1=req.sec_b_q1, sec_b_q2=req.sec_b_q2, sec_b_q3=req.sec_b_q3,
        sec_c_q1=req.sec_c_q1, sec_c_q2=req.sec_c_q2, sec_c_q3=req.sec_c_q3,
        ipc_calculado=ipc,
        canal=req.canal,
        colonia=req.colonia,
        zona=req.zona,
    )
    db.add(respuesta)
    db.commit()
    db.refresh(respuesta)

    return RespuestaResponse(
        id=respuesta.id,
        municipio_id=respuesta.municipio_id,
        tipo_vivienda=respuesta.tipo_vivienda,
        ipc_calculado=ipc,
        created_at=respuesta.created_at,
    )


@router.get("/{municipio_id}/resultados", response_model=ResultadosEncuesta)
async def resultados_encuesta(
    municipio_id: str,
    db: Session = Depends(get_db),
) -> ResultadosEncuesta:
    """
    Agrega todas las respuestas de un municipio y calcula:
    - IPC global (Índice de Preparación Ciudadana 0-100)
    - IPC Hemisferio 1 (condominio + privada)
    - IPC Hemisferio 2 VP (casas en vía pública)

    Si no hay respuestas, devuelve 0 en todos los campos (no 404)
    para que el frontend use el benchmark de fallback.
    """
    todas = (
        db.query(EncuestaRespuesta)
        .filter(EncuestaRespuesta.municipio_id == municipio_id)
        .all()
    )

    condominios = [r for r in todas if r.tipo_vivienda == "condominio"]
    privadas    = [r for r in todas if r.tipo_vivienda == "privada"]
    vps         = [r for r in todas if r.tipo_vivienda == "vp"]
    h1          = condominios + privadas

    ipc_global = _avg_ipc(todas)
    ipc_h1     = _avg_ipc(h1)
    ipc_vp     = _avg_ipc(vps)

    ultima = max((r.created_at for r in todas), default=None)

    return ResultadosEncuesta(
        municipio_id=municipio_id,
        n_total=len(todas),
        n_condominio=len(condominios),
        n_privada=len(privadas),
        n_vp=len(vps),
        ipc_global=ipc_global,
        ipc_hemisferio1=ipc_h1,
        ipc_hemisferio2_vp=ipc_vp,
        ipc_por_segmento={
            "condominio": _avg_ipc(condominios),
            "privada":    _avg_ipc(privadas),
            "vp":         ipc_vp,
        },
        ultima_respuesta=ultima,
    )
