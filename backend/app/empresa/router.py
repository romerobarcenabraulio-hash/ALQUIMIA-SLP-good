"""API Q-017 — Perfil de Generación Estimada RSU (estimación voluntaria en memoria)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Body, HTTPException, Query, Response, status

from app.empresa.pdf_perfil import build_perfil_generacion_pdf
from app.empresa.schemas import (
    DeclaracionGeneracionRSU,
    DeclaracionGeneracionRSUCreate,
    DISCLAIMER_VOLUNTARIA,
    GiroScian,
    MSG_GRAN_GENERADOR,
)
from app.empresa.scian_factors import SCIAN_FACTORS, DEFAULT_MATERIAL_KEYS
from app.empresa.company_survey import (
    GIRO_CATALOG,
    get_questions,
    estimate_generation,
)

router = APIRouter(prefix="/empresa", tags=["empresa"])

_decl_store: dict[str, DeclaracionGeneracionRSU] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _normalize_comp(
    incoming: dict[str, float] | None,
    default: dict[str, float],
) -> dict[str, float]:
    if not incoming:
        return {k: float(v) for k, v in default.items()}
    base = {k: float(default.get(k, 0.0)) for k in DEFAULT_MATERIAL_KEYS}
    for k, v in incoming.items():
        if k in base:
            base[k] = float(v)
    s = sum(max(0.0, v) for v in base.values())
    if s <= 0:
        raise HTTPException(
            status_code=422,
            detail="composicion_materiales debe tener valores positivos que sumen > 0",
        )
    return {k: max(0.0, base[k]) / s for k in base}


def _freq(ton_anio: float) -> Literal["diaria", "2x_semana", "semanal", "quincenal"]:
    if ton_anio >= 50.0:
        return "diaria"
    if ton_anio >= 15.0:
        return "2x_semana"
    if ton_anio >= 5.0:
        return "semanal"
    return "quincenal"


def _build_declaracion(payload: DeclaracionGeneracionRSUCreate, giro: GiroScian) -> DeclaracionGeneracionRSU:
    comp = _normalize_comp(payload.composicion_materiales, giro.composicion_tipica)
    total_kg = payload.produccion_anual * giro.factor_generacion_kg_por_unidad
    gen: dict[str, float] = {}
    for mat, pct in comp.items():
        gen[mat] = round((total_kg * pct) / 1000.0, 6)
    total_ton = round(sum(gen.values()), 6)
    gran = total_ton > 10.0
    freq = payload.frecuencia_recoleccion_req or _freq(total_ton)
    return DeclaracionGeneracionRSU(
        declaracion_id=str(uuid4()),
        empresa_nombre=payload.empresa_nombre.strip(),
        rfc=payload.rfc.strip() if payload.rfc else None,
        municipio_id=payload.municipio_id.strip(),
        zm=payload.zm.strip(),
        giro_scian=giro.giro_codigo,
        produccion_anual=payload.produccion_anual,
        unidad_produccion=giro.unidad_produccion,
        generacion_estimada=gen,
        generacion_total_ton_anio=total_ton,
        frecuencia_recoleccion_req=freq,
        tiene_plan_manejo=payload.tiene_plan_manejo,
        es_posible_gran_generador=gran,
        advertencia_gran_generador=MSG_GRAN_GENERADOR if gran else "",
        notas=payload.notas,
        fecha_declaracion=_now_iso(),
        status="borrador",
        sector_catalogo=giro.sector,
        descripcion_giro=giro.descripcion,
        disclaimer_voluntaria=DISCLAIMER_VOLUNTARIA,
    )


@router.get("/scian-factors", response_model=list[GiroScian])
def list_scian_factors():
    return sorted(SCIAN_FACTORS.values(), key=lambda x: x.giro_codigo)


@router.get("/scian-factors/{giro_codigo}", response_model=GiroScian)
def get_scian_factor(giro_codigo: str):
    key = giro_codigo.strip()
    if len(key) != 6 or not key.isdigit():
        raise HTTPException(status_code=422, detail="giro_codigo debe ser 6 dígitos")
    g = SCIAN_FACTORS.get(key)
    if g is None:
        raise HTTPException(status_code=404, detail=f"Giro no catalogado: {key}")
    return g


@router.post("/declaraciones", response_model=DeclaracionGeneracionRSU, status_code=status.HTTP_201_CREATED)
def create_declaracion(body: DeclaracionGeneracionRSUCreate):
    giro = SCIAN_FACTORS.get(body.giro_scian)
    if giro is None:
        raise HTTPException(status_code=404, detail=f"Giro no catalogado: {body.giro_scian}")
    decl = _build_declaracion(body, giro)
    _decl_store[decl.declaracion_id] = decl
    return decl


@router.get("/declaraciones", response_model=list[DeclaracionGeneracionRSU])
def list_declaraciones(municipio_id: str = Query(..., min_length=1)):
    mid = municipio_id.strip()
    rows = [
        d
        for d in _decl_store.values()
        if d.municipio_id == mid and d.status == "confirmada"
    ]
    return sorted(rows, key=lambda x: x.fecha_declaracion, reverse=True)


@router.get("/declaraciones/{declaracion_id}", response_model=DeclaracionGeneracionRSU)
def get_declaracion(declaracion_id: str):
    d = _decl_store.get(declaracion_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Declaración no encontrada")
    return d


@router.patch("/declaraciones/{declaracion_id}/confirmar", response_model=DeclaracionGeneracionRSU)
def confirmar_declaracion(declaracion_id: str):
    d = _decl_store.get(declaracion_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Declaración no encontrada")
    updated = d.model_copy(update={"status": "confirmada"})
    _decl_store[declaracion_id] = updated
    return updated


@router.get("/declaraciones/{declaracion_id}/pdf")
def download_pdf(declaracion_id: str):
    d = _decl_store.get(declaracion_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Declaración no encontrada")
    data, err = build_perfil_generacion_pdf(d)
    if err or data is None:
        raise HTTPException(status_code=503, detail=err or "PDF no disponible")
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="perfil_generacion_rsu_{declaracion_id[:8]}.pdf"'
        },
    )


# ---------------------------------------------------------------------------
# §2 Company survey — per-giro question bank + estimation
# ---------------------------------------------------------------------------

@router.get("/survey/giros")
def list_giros():
    """Return the catalog of supported giro codes with their survey driver unit."""
    return [
        {
            "giro_codigo": code,
            "sector": info["sector"],
            "descripcion": info["descripcion"],
            "unidad": info["unidad"],
        }
        for code, info in GIRO_CATALOG.items()
    ]


@router.get("/survey/preguntas/{giro_codigo}")
def get_survey_questions(giro_codigo: str):
    """Return the per-giro question bank for a specific sector code."""
    questions = get_questions(giro_codigo)
    giro_info = GIRO_CATALOG.get(giro_codigo) or GIRO_CATALOG["000000"]
    return {
        "giro_codigo": giro_codigo if giro_codigo in GIRO_CATALOG else "000000",
        "sector": giro_info["sector"],
        "descripcion": giro_info["descripcion"],
        "preguntas": questions,
    }


@router.post("/survey/estimar")
def estimate_company_generation(
    giro_codigo: str = Query(..., description="Código SCIAN 6 dígitos"),
    respuestas: dict = Body(..., description="Mapa pregunta_id → valor numérico"),
):
    """Deterministic RSU generation estimate for a company given survey answers.

    Returns kg/año, ton/año, material breakdown, semaforo, and full provenance.
    This is illustrative only — not a COA SEMARNAT report.
    """
    if not giro_codigo.strip():
        raise HTTPException(status_code=422, detail="giro_codigo requerido")
    result = estimate_generation(giro_codigo.strip(), respuestas)
    return result
