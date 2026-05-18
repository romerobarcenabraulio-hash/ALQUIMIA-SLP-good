"""
Router: /api/standards

Endpoints de cumplimiento con estándares internacionales.

  GET  /readiness/{municipio_id}            → score readiness GRI/SASB/ISO/ODS
  GET  /mappings                            → tabla completa de mapeo KPI → estándares
  GET  /mappings/{campo}                    → mapeo de un KPI específico
  POST /readiness/{municipio_id}/evaluate   → evaluar con datos custom
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.standards.mapper import get_all_mappings, get_mapping, color_semaforo
from app.standards.readiness import calcular_readiness

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request / Response ────────────────────────────────────────────────────────

class ReadinessEvalRequest(BaseModel):
    datos: dict
    contexto: Optional[dict] = None
    periodo: str = "2025-anual"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/readiness/{municipio_id}")
async def get_readiness(municipio_id: str, scenario_id: Optional[str] = None):
    """
    Score de readiness usando datos del escenario más reciente del municipio.
    Sin BD activa, usa datos demo para mostrar la funcionalidad.
    """
    datos_demo = {
        "ton_rsu_generadas_anual": 45_000,
        "ton_rsu_desviadas_anual": 9_500,
        "ton_rsu_relleno_sanitario": 35_500,
        "tasa_desvio_pct": 21.1,
        "co2e_evitadas_ton": 1_800,
        "ingreso_materiales_mxn": 2_400_000,
        "empleos_generados": 12,
        "poblacion_atendida": 180_000,
        "tir_pct": 18.5,
        "capex_total_mxn": 8_500_000,
        "_diagnostico_ok": True,
        "_campeon_ok": True,
        "_plan_ok": True,
    }
    return _build_readiness_response(municipio_id, datos_demo, {}, "2025-demo")


@router.post("/readiness/{municipio_id}/evaluate")
async def evaluate_readiness(municipio_id: str, req: ReadinessEvalRequest):
    """Evalúa readiness con datos reales del cliente."""
    return _build_readiness_response(municipio_id, req.datos, req.contexto or {}, req.periodo)


def _build_readiness_response(municipio_id: str, datos: dict, ctx: dict, periodo: str) -> dict:
    try:
        report = calcular_readiness(municipio_id, periodo, datos, ctx)
        return {
            "municipio_id": municipio_id,
            "periodo": periodo,
            "score_global": report.score_global,
            "nivel": report.nivel,
            "recomendaciones": report.recomendaciones,
            "estandares": {
                "gri306": _score_to_dict(report.gri306),
                "sasb":   _score_to_dict(report.sasb),
                "iso9001": _score_to_dict(report.iso9001),
                "ods":    _score_to_dict(report.ods),
            },
        }
    except Exception as exc:
        logger.error("Error calculando readiness: %s", exc)
        raise HTTPException(500, str(exc))


def _score_to_dict(score) -> dict:
    return {
        "nombre": score.nombre,
        "codigo": score.codigo,
        "score_pct": score.score_pct,
        "disclosures_cubiertos": score.disclosures_cubiertos,
        "disclosures_total": score.disclosures_total,
        "observacion": score.observacion,
        "gaps": [
            {
                "campo": g.campo,
                "label": g.label,
                "descripcion": g.descripcion,
                "prioridad": g.prioridad,
                "accion": g.accion,
            }
            for g in score.gaps
        ],
    }


@router.get("/mappings")
async def get_mappings():
    """Tabla completa de mapeo KPI → GRI / SASB / ODS / ISO 9001."""
    mappings = get_all_mappings()
    return {
        "total": len(mappings),
        "mappings": [
            {
                "campo": m.campo_alquimia,
                "label": m.label,
                "unidad": m.unidad,
                "gri_disclosure": m.gri_disclosure,
                "gri_requerimiento": m.gri_requerimiento,
                "sasb_metric": m.sasb_metric,
                "sasb_code": m.sasb_code,
                "ods_meta": m.ods_meta,
                "ods_descripcion": m.ods_descripcion,
                "iso_clausula": m.iso_clausula,
                "threshold_verde": m.threshold_verde,
                "threshold_amarillo": m.threshold_amarillo,
                "threshold_unidad": m.threshold_unidad,
            }
            for m in mappings
        ],
    }


@router.get("/mappings/{campo}")
async def get_mapping_campo(campo: str):
    """Mapeo de un KPI específico."""
    m = get_mapping(campo)
    if not m:
        raise HTTPException(404, f"Campo '{campo}' no encontrado en el mapa de estándares")
    return {
        "campo": m.campo_alquimia,
        "label": m.label,
        "unidad": m.unidad,
        "gri": {
            "disclosure": m.gri_disclosure,
            "requerimiento": m.gri_requerimiento,
        },
        "sasb": {
            "metric": m.sasb_metric,
            "code": m.sasb_code,
        },
        "ods": {
            "meta": m.ods_meta,
            "descripcion": m.ods_descripcion,
        },
        "iso9001": {
            "clausula": m.iso_clausula,
            "proceso": m.iso_proceso,
        },
        "thresholds": {
            "verde": m.threshold_verde,
            "amarillo": m.threshold_amarillo,
            "unidad": m.threshold_unidad,
        },
        "notas": m.notas,
    }
