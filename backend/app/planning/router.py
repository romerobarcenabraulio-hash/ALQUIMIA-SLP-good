"""
Router: /api/planning

Wave 1 (M03) — endpoints para Gantt Maestro, PERT y RACI.

Endpoints:
  POST /api/planning/gantt  → GanttPlan
  POST /api/planning/pert   → PertPlan (derivado del Gantt)
  POST /api/planning/raci   → RACIPlan
  POST /api/planning/all    → {gantt, pert, raci} en un solo call
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.agents.schemas import GanttPlan, PertPlan, RACIPlan
from app.planning.builder import build_gantt, build_pert, build_raci
from app.planning.narrative import get_implementation_narrative
from app.planning.weekly_status import (
    build_weekly_status,
    load_latest_weekly_status,
    persist_weekly_status,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Request schema ──────────────────────────────────────────────────────────

class PlanningRequest(BaseModel):
    municipio:        str
    zm:               str
    scenario_id:      str
    n_cas_pequeno:    int = Field(1, ge=0, description="Número de CAs pequeños")
    n_cas_mediano:    int = Field(0, ge=0, description="Número de CAs medianos")
    n_cas_grande:     int = Field(0, ge=0, description="Número de CAs grandes")
    capex_total_mxn:  float = Field(1_500_000.0, ge=0, description="CAPEX total del escenario")
    horizonte_semanas: int = Field(52, ge=12, le=260, description="Horizonte del programa en semanas")


class PlanningAllResponse(BaseModel):
    gantt: Dict[str, Any]
    pert:  Dict[str, Any]
    raci:  Dict[str, Any]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/narrative", summary="Narrativa unificada G1–G5 + actividades + riesgos")
def planning_narrative(
    municipio_id: str | None = Query(None),
    zm: str = Query("SLP"),
    n_cas_pequeno: int = Query(1, ge=0),
    n_cas_mediano: int = Query(0, ge=0),
    n_cas_grande: int = Query(0, ge=0),
    capex_total_mxn: float = Query(1_500_000.0, ge=0),
    horizonte_semanas: int = Query(52, ge=12, le=260),
) -> dict:
    """Retorna fases institucionales con actividades T01–T15 y riesgos por gate."""
    return get_implementation_narrative(
        municipio_id=municipio_id,
        zm=zm,
        n_cas_pequeno=n_cas_pequeno,
        n_cas_mediano=n_cas_mediano,
        n_cas_grande=n_cas_grande,
        capex_total=capex_total_mxn,
        horizonte_semanas=horizonte_semanas,
    )


@router.get("/weekly-status", summary="Reporte semanal KRONOS (último generado)")
def get_weekly_status_cached() -> dict:
    """Retorna el último weekly_status persistido, o 404 si no existe."""
    latest = load_latest_weekly_status()
    if latest is None:
        return {"available": False, "message": "Ejecutar POST /weekly-status/generate primero"}
    return {"available": True, "report": latest}


@router.post("/weekly-status/generate", summary="Generar y persistir reporte semanal")
def post_weekly_status_generate(
    municipio_id: str | None = Query(None),
    db: Session | None = Depends(get_db),
) -> dict:
    """Genera CPI/SPI/EAC, gates, riesgos y precios; persiste en data/planning/."""
    report = build_weekly_status(municipio_id=municipio_id, db=db)
    path = persist_weekly_status(report)
    return {"ok": True, "path": str(path), "report": report}


@router.post("/gantt", response_model=GanttPlan)
async def planning_gantt(req: PlanningRequest) -> GanttPlan:
    """
    Genera el Gantt Maestro del programa municipal de circularidad.
    Retorna las fases, tareas, responsables y costos ordenados cronológicamente.
    """
    return build_gantt(
        municipio=req.municipio,
        zm=req.zm,
        scenario_id=req.scenario_id,
        n_cas_pequeno=req.n_cas_pequeno,
        n_cas_mediano=req.n_cas_mediano,
        n_cas_grande=req.n_cas_grande,
        capex_total=req.capex_total_mxn,
        horizonte_semanas=req.horizonte_semanas,
    )


@router.post("/pert", response_model=PertPlan)
async def planning_pert(req: PlanningRequest) -> PertPlan:
    """
    Genera el diagrama PERT con ruta crítica calculada.
    Incluye tiempos tempranos, tardíos y holgura por tarea.
    """
    gantt = build_gantt(
        municipio=req.municipio,
        zm=req.zm,
        scenario_id=req.scenario_id,
        n_cas_pequeno=req.n_cas_pequeno,
        n_cas_mediano=req.n_cas_mediano,
        n_cas_grande=req.n_cas_grande,
        capex_total=req.capex_total_mxn,
        horizonte_semanas=req.horizonte_semanas,
    )
    return build_pert(gantt)


@router.post("/raci", response_model=RACIPlan)
async def planning_raci(req: PlanningRequest) -> RACIPlan:
    """
    Genera la matriz RACI de procesos clave del programa de circularidad.
    Incluye 15 procesos con responsables, aprobadores, consultados e informados.
    """
    return build_raci(
        municipio=req.municipio,
        zm=req.zm,
        scenario_id=req.scenario_id,
    )


@router.post("/all", response_model=PlanningAllResponse)
async def planning_all(req: PlanningRequest) -> PlanningAllResponse:
    """
    Genera Gantt + PERT + RACI en una sola llamada (optimizado para M03).
    """
    gantt = build_gantt(
        municipio=req.municipio,
        zm=req.zm,
        scenario_id=req.scenario_id,
        n_cas_pequeno=req.n_cas_pequeno,
        n_cas_mediano=req.n_cas_mediano,
        n_cas_grande=req.n_cas_grande,
        capex_total=req.capex_total_mxn,
        horizonte_semanas=req.horizonte_semanas,
    )
    pert = build_pert(gantt)
    raci = build_raci(
        municipio=req.municipio,
        zm=req.zm,
        scenario_id=req.scenario_id,
    )
    return PlanningAllResponse(
        gantt=gantt.model_dump(mode="json"),
        pert=pert.model_dump(mode="json"),
        raci=raci.model_dump(mode="json"),
    )
