"""
Router: /survey

Wave 1: endpoints para generar encuestas social/demográficas de percepción
ciudadana sobre residuos sólidos.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.agents.survey_builder import build_survey
from app.agents.survey_pdf import (
    generate_survey_csv_template,
    generate_digital_link_stub,
    try_generate_survey_pdf,
)
from app.agents.schemas import SurveyTemplate

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
