"""
Router: /api/planning/risk

Endpoints de registro de riesgos y alertas KRONOS.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.planning.risk.alert_engine import get_all_active_alerts
from app.planning.risk.risk_register import (
    load_risk_register,
    update_risk,
)
from app.planning.scheduling.gate_tracker import (
    check_gate_alerts,
    get_current_gate,
    load_gate_status,
    update_gate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class RiskUpdateRequest(BaseModel):
    risk_id: str
    status: Optional[str] = None
    owner: Optional[str] = None
    plan_mitigacion: Optional[str] = None
    evidencia_reciente: Optional[str] = None
    nota: Optional[str] = None


class GateUpdateRequest(BaseModel):
    gate_id: str
    status: str
    fecha_objetivo: Optional[str] = None
    prerequisito_completado: Optional[str] = None
    nota: Optional[str] = None


@router.get("/alerts", summary="Todas las alertas activas de KRONOS")
def get_alerts() -> dict:
    """Retorna todas las alertas activas: gates en riesgo, riesgos ROJO, stale."""
    alerts = get_all_active_alerts()
    return {
        "total": len(alerts),
        "criticos": sum(1 for a in alerts if a["severidad"] == "CRITICO"),
        "rojos": sum(1 for a in alerts if a["severidad"] == "ROJO"),
        "amarillos": sum(1 for a in alerts if a["severidad"] == "AMARILLO"),
        "alertas": alerts,
    }


@router.get("/register", summary="Registro completo de riesgos")
def get_risk_register() -> dict:
    """Retorna el registro completo de riesgos con su estado actual."""
    return {"register": load_risk_register()}


@router.post("/register/update", summary="Actualizar un riesgo")
def update_risk_endpoint(req: RiskUpdateRequest) -> dict:
    """Actualiza el estado, owner o plan de mitigación de un riesgo."""
    try:
        return update_risk(
            risk_id=req.risk_id,
            status=req.status,
            owner=req.owner,
            plan_mitigacion=req.plan_mitigacion,
            evidencia_reciente=req.evidencia_reciente,
            nota=req.nota,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/gates", summary="Estado de gates G1-G5")
def get_gates() -> dict:
    """Retorna el estado actual de todos los gates del proyecto."""
    status = load_gate_status()
    current = get_current_gate()
    alerts = check_gate_alerts()
    return {
        "gate_actual": current,
        "gates": status,
        "alertas_activas": alerts,
    }


@router.post("/gates/update", summary="Actualizar estado de un gate")
def update_gate_endpoint(req: GateUpdateRequest) -> dict:
    """Actualiza el estado de un gate del proyecto."""
    from datetime import date

    fecha_obj = None
    if req.fecha_objetivo:
        try:
            fecha_obj = date.fromisoformat(req.fecha_objetivo)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"fecha_objetivo inválida: {req.fecha_objetivo}. Usar formato YYYY-MM-DD.",
            )

    try:
        return update_gate(
            gate_id=req.gate_id,
            status=req.status,
            fecha_objetivo=fecha_obj,
            prerequisito_completado=req.prerequisito_completado,
            nota=req.nota,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
