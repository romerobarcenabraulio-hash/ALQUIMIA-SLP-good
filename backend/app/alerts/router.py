"""Router Fase 13.9: alertas y notificaciones."""
from __future__ import annotations

from fastapi import APIRouter

from app.alerts.engine import generate_alerts
from app.alerts.schemas import AlertasRequest, AlertasResponse

router = APIRouter()


@router.post("/evaluate", response_model=AlertasResponse)
def evaluate_alerts(req: AlertasRequest):
    return generate_alerts(req)
