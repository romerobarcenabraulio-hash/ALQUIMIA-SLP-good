"""
Router: /api/planning/budget

Endpoints EVM para KRONOS (Nivel B — proyecto municipal).
Endpoints AURUM: pipeline de costos, AC, reportes por audiencia.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.planning.budget.evm_engine import EVMResult, calculate_evm
from app.planning.budget.persistence import list_evm_snapshots, save_evm_snapshot
from app.planning.scheduling.gate_tracker import get_current_gate
from modules.planning.budget.cost_structure import build_cost_structure
from modules.planning.budget.hermes_consumer import consume_hermes_feeds
from modules.planning.budget.kronos_publisher import load_latest_ac_update
from modules.planning.budget.pipeline import run_aurum_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)


class EVMRequest(BaseModel):
    bac: float = Field(..., gt=0, description="Budget at Completion en MXN")
    pv: float = Field(..., gt=0, description="Planned Value en MXN")
    ev: float = Field(..., ge=0, description="Earned Value en MXN")
    ac: float = Field(..., gt=0, description="Actual Cost en MXN")
    municipio_id: str | None = Field(None, description="ID municipio contratante (Nivel B EVM)")
    gate_id: str | None = Field(None, description="Gate activo G1-G5; default = gate actual")
    notas: str | None = Field(None, description="Nota opcional del snapshot PMO")


class EVMResponse(BaseModel):
    bac: float
    pv: float
    ev: float
    ac: float
    cv: float
    sv: float
    cv_pct: float
    sv_pct: float
    cpi: float
    spi: float
    tcpi: float
    eac_likely: float
    eac_optimistic: float
    eac_conservative: float
    etc: float
    vac: float
    vac_pct: float
    semaforo: str
    nivel: str = "municipal"
    municipio_id: str | None = None
    gate_id: str | None = None
    snapshot_id: int | None = None
    persisted: bool = False


@router.post("/evm", response_model=EVMResponse, summary="Calcular EVM completo")
def calculate_evm_endpoint(
    req: EVMRequest,
    db: Session | None = Depends(get_db),
) -> EVMResponse:
    """Calcula EVM Nivel B y persiste snapshot en evm_snapshots si hay PostgreSQL."""
    try:
        result: EVMResult = calculate_evm(
            bac=req.bac,
            pv=req.pv,
            ev=req.ev,
            ac=req.ac,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    gate_id = (req.gate_id or get_current_gate() or "G1").upper()
    snapshot_id: int | None = None
    persisted = False

    if db is not None:
        try:
            snapshot_id = save_evm_snapshot(
                db,
                result,
                gate_id=gate_id,
                municipio_id=req.municipio_id,
                notas=req.notas,
            )
            persisted = True
        except Exception as exc:
            logger.warning("EVM calculado pero snapshot no persistido: %s", exc)

    return EVMResponse(
        **result.__dict__,
        nivel="municipal",
        municipio_id=req.municipio_id,
        gate_id=gate_id,
        snapshot_id=snapshot_id,
        persisted=persisted,
    )


@router.get("/evm/snapshots", summary="Historial de snapshots EVM")
def get_evm_snapshots(
    municipio_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session | None = Depends(get_db),
) -> dict:
    """Lista snapshots EVM persistidos (más recientes primero)."""
    if db is None:
        return {"total": 0, "snapshots": [], "db_available": False}
    snapshots = list_evm_snapshots(db, municipio_id=municipio_id, limit=limit)
    return {"total": len(snapshots), "snapshots": snapshots, "db_available": True}


# ─── AURUM · costos granulares ───────────────────────────────────────────────


class AurumPipelineRequest(BaseModel):
    municipio_id: str = Field("slp", description="ID municipio")
    lookback_days: int = Field(14, ge=1, le=90)
    viviendas_activas: int = Field(224_000, ge=1)


@router.post("/aurum/run", summary="Ejecutar pipeline AURUM completo")
def post_aurum_pipeline(req: AurumPipelineRequest) -> dict[str, Any]:
    """Consume HERMES, calcula AC/indicadores, publica a KRONOS y genera reportes."""
    return run_aurum_pipeline(
        req.municipio_id,
        lookback_days=req.lookback_days,
        viviendas_activas=req.viviendas_activas,
    )


@router.get("/aurum/structure", summary="Estructura CAPEX/OPEX/no-calidad (Decimal)")
def get_aurum_structure(
    municipio_id: str = Query("slp"),
) -> dict[str, Any]:
    """Retorna estructura de costos baseline sin ejecutar pipeline completo."""
    structure = build_cost_structure(municipio_id)
    return {"available": True, "structure": structure.to_dict()}


@router.get("/aurum/ac/latest", summary="Último AC publicado hacia KRONOS")
def get_aurum_ac_latest() -> dict[str, Any]:
    """Retorna el evento alquimia/events/planning/ac_update más reciente."""
    payload = load_latest_ac_update()
    if payload is None:
        return {
            "available": False,
            "message": "Ejecutar POST /api/planning/budget/aurum/run primero",
        }
    return {"available": True, "ac_update": payload}


@router.get("/aurum/hermes/status", summary="Estado del consumo del feed HERMES")
def get_aurum_hermes_status(
    municipio_id: str = Query("slp"),
    lookback_days: int = Query(14, ge=1, le=90),
) -> dict[str, Any]:
    feeds, warnings = consume_hermes_feeds(municipio_id, lookback_days=lookback_days)
    return {
        "feeds_found": len(feeds),
        "warnings": warnings,
        "latest_feed": feeds[0].to_dict() if feeds else None,
    }


@router.post("/kronos/sync-hermes", summary="HERMES daily_summary → AURUM AC → listo para EVM")
def post_kronos_sync_hermes(
    municipio_id: str = Query("slp"),
    db: Session | None = Depends(get_db),
) -> dict[str, Any]:
    """Ejecuta pipeline HERMES+AURUM sin cron (útil en dev y post-deploy)."""
    from app.cron.jobs import job_logistics_daily_summary

    return job_logistics_daily_summary(
        municipio_id=municipio_id,
        persist_db=db is not None,
        db=db,
    )
