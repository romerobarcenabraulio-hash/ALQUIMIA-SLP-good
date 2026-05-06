"""API in-memory para registro predial, inspección y expediente técnico (Q-016 sprint 1 — sin mapa).

`VALOR_UMA_2026` en `escalera_slp.py` y `CatalogoEscalerasSlpResponse.valor_uma_referencia_mxn` deben permanecer alineados (tests de contrato).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.predios.schemas import (
    CatalogoEscalerasSlpResponse,
    ExpedienteSancion,
    ExpedienteSancionCreate,
    InspeccionPredia,
    InspeccionPrediaCreate,
    PredioRegistro,
    PredioRegistroCreate,
)
from app.predios.escalera_slp import VALOR_UMA_2026, elegir_escalera, texto_disclaimer_completo
from app.predios import escalera_slp

router = APIRouter(prefix="/predios", tags=["predios"])

_MUNICIPIO_ESCALERA = "slp"

_predios: dict[str, PredioRegistro] = {}
_inspecciones: dict[str, InspeccionPredia] = {}
_expedientes: dict[str, ExpedienteSancion] = {}


def _municipio_soportado(mid: str) -> bool:
    return mid.strip().lower() == _MUNICIPIO_ESCALERA


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@router.post("/registro", response_model=PredioRegistro, status_code=201)
async def crear_registro(payload: PredioRegistroCreate) -> PredioRegistro:
    pid = uuid.uuid4().hex[:16]
    if not payload.municipio_id.strip():
        raise HTTPException(status_code=422, detail="municipio_id requerido")
    row = PredioRegistro(
        predio_id=pid,
        municipio_id=payload.municipio_id.strip(),
        direccion_texto=payload.direccion_texto.strip(),
        lat=payload.lat,
        lon=payload.lon,
        uso_suelo_declarado=payload.uso_suelo_declarado,
        area_m2=payload.area_m2,
        notas=payload.notas,
    )
    _predios[pid] = row
    return row


@router.get("/catalogo/sanciones-slp", response_model=CatalogoEscalerasSlpResponse)
async def catalogo_escaleras_slp() -> CatalogoEscalerasSlpResponse:
    return CatalogoEscalerasSlpResponse(
        valor_uma_referencia_mxn=VALOR_UMA_2026,
        escaleras=list(escalera_slp.ESCALERA_SLP),
    )


@router.post("/expedientes", response_model=ExpedienteSancion, status_code=201)
async def crear_expediente(payload: ExpedienteSancionCreate) -> ExpedienteSancion:
    ins = _inspecciones.get(payload.inspeccion_id)
    if not ins:
        raise HTTPException(status_code=404, detail="inspeccion no encontrada")
    mid = ins.municipio_id.strip().lower()
    if not _municipio_soportado(mid):
        raise HTTPException(
            status_code=422,
            detail=(
                "En este sprint la escalera UMA sólo está implementada para SLP capital "
                f"(municipio_id=slp); recibido: {ins.municipio_id}"
            ),
        )

    esc = elegir_escalera(ins.tipo_infraccion, payload.nivel_sancion_sugerido)
    uma_med = round((esc.uma_minimo + esc.uma_maximo) / 2.0, 4)
    m_min = round(esc.uma_minimo * VALOR_UMA_2026, 2)
    m_max = round(esc.uma_maximo * VALOR_UMA_2026, 2)

    eid = uuid.uuid4().hex[:16]
    out = ExpedienteSancion(
        expediente_id=eid,
        inspeccion_id=ins.inspeccion_id,
        predio_id=ins.predio_id,
        municipio_id=ins.municipio_id,
        fecha_generacion=_now_iso(),
        tipo_infraccion=ins.tipo_infraccion,
        articulo_reglamento=esc.articulo_reglamento,
        nivel_sancion=esc.nivel,
        uma_aplicado=uma_med,
        valor_uma_mxn=VALOR_UMA_2026,
        monto_min_mxn=m_min,
        monto_max_mxn=m_max,
        genera_clausura=esc.genera_clausura,
        reglamento_verificado_clc=False,
        disclaimer=texto_disclaimer_completo(),
    )
    _expedientes[eid] = out
    return out


@router.get("/expedientes/{expediente_id}", response_model=ExpedienteSancion)
async def get_expediente(expediente_id: str) -> ExpedienteSancion:
    ex = _expedientes.get(expediente_id)
    if not ex:
        raise HTTPException(status_code=404, detail="expediente no encontrado")
    return ex


@router.get("/municipio/{municipio_id}/expedientes", response_model=list[ExpedienteSancion])
async def expedientes_por_municipio(municipio_id: str) -> list[ExpedienteSancion]:
    m = municipio_id.strip().lower()
    return [e for e in _expedientes.values() if e.municipio_id.strip().lower() == m]


@router.get("/{predio_id}", response_model=PredioRegistro)
async def get_predio(predio_id: str) -> PredioRegistro:
    row = _predios.get(predio_id)
    if not row:
        raise HTTPException(status_code=404, detail="predio no encontrado")
    return row


@router.post(
    "/{predio_id}/inspecciones",
    response_model=InspeccionPredia,
    status_code=201,
)
async def crear_inspeccion(predio_id: str, payload: InspeccionPrediaCreate) -> InspeccionPredia:
    predio = _predios.get(predio_id)
    if not predio:
        raise HTTPException(status_code=404, detail="predio no encontrado")
    permiso_ok = payload.permiso_ca_vigente if payload.tiene_permiso_ca else None
    if payload.tiene_permiso_ca is False:
        permiso_ok = None
    iid = uuid.uuid4().hex[:16]
    ins = InspeccionPredia(
        inspeccion_id=iid,
        predio_id=predio_id,
        fecha_inspeccion=payload.fecha_inspeccion.strip(),
        tipo_infraccion=payload.tipo_infraccion,
        descripcion_hallazgo=payload.descripcion_hallazgo.strip(),
        tiene_permiso_ca=payload.tiene_permiso_ca,
        permiso_ca_vigente=permiso_ok,
        inspector_nombre=payload.inspector_nombre,
        inspector_cargo=payload.inspector_cargo,
        municipio_id=predio.municipio_id,
        status="borrador",
    )
    _inspecciones[iid] = ins
    return ins


@router.get("/{predio_id}/inspecciones", response_model=list[InspeccionPredia])
async def listar_inspecciones(predio_id: str) -> list[InspeccionPredia]:
    if predio_id not in _predios:
        raise HTTPException(status_code=404, detail="predio no encontrado")
    return [i for i in _inspecciones.values() if i.predio_id == predio_id]
