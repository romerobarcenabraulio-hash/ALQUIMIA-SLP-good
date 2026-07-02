"""Router de alertas municipales para ALQ-17"""
from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.municipal_alert_service import MunicipalAlertService, AlertSubscriptionService
from app.national.alerts import AlertType, AlertSeverity
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: int
    municipio_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    changed_field: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    triggered_by: str
    created_at: str
    acknowledged: bool
    resolved: bool

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    limit: int
    offset: int


class SubscriptionRequest(BaseModel):
    alert_types: List[str]  # AlertType values
    municipios: Optional[List[str]] = None  # None = todos
    min_severity: str = "medium"  # AlertSeverity value
    notify_via_email: bool = True
    notify_via_dashboard: bool = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/municipio/{municipio_id}", response_model=AlertListResponse)
def list_alerts_by_municipio(
    municipio_id: str,
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    unresolved_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Lista alertas para un municipio específico"""
    alert_type_enum = AlertType[alert_type.upper()] if alert_type else None
    severity_enum = AlertSeverity[severity.upper()] if severity else None

    alerts, total = MunicipalAlertService.list_alerts(
        db,
        municipio_id=municipio_id,
        alert_type=alert_type_enum,
        severity=severity_enum,
        unresolved_only=unresolved_only,
        limit=limit,
        offset=offset,
    )

    return AlertListResponse(
        alerts=[AlertResponse.from_orm(a) for a in alerts],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/", response_model=AlertListResponse)
def list_all_alerts(
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    unresolved_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Lista todas las alertas (requiere auth)"""
    alert_type_enum = AlertType[alert_type.upper()] if alert_type else None
    severity_enum = AlertSeverity[severity.upper()] if severity else None

    alerts, total = MunicipalAlertService.list_alerts(
        db,
        alert_type=alert_type_enum,
        severity=severity_enum,
        unresolved_only=unresolved_only,
        limit=limit,
        offset=offset,
    )

    return AlertListResponse(
        alerts=[AlertResponse.from_orm(a) for a in alerts],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Obtiene una alerta específica"""
    alert = MunicipalAlertService.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse.from_orm(alert)


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Marca una alerta como leída"""
    alert = MunicipalAlertService.acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "acknowledged", "alert_id": alert_id}


@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Marca una alerta como resuelta"""
    alert = MunicipalAlertService.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved", "alert_id": alert_id}


@router.get("/municipio/{municipio_id}/summary")
def alert_summary_by_municipio(
    municipio_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Resumen de alertas abiertas por municipio"""
    summary = MunicipalAlertService.count_unresolved_by_municipio(db, municipio_id)
    return {
        "municipio_id": municipio_id,
        **summary,
    }


@router.post("/subscriptions")
def create_subscription(
    request: SubscriptionRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Crea una suscripción a alertas para el usuario actual"""
    min_severity = AlertSeverity[request.min_severity.upper()]

    subscription = AlertSubscriptionService.create_subscription(
        db,
        user_id=user["sub"],  # JWT subject claim (user ID)
        alert_types=request.alert_types,
        municipios=request.municipios,
        min_severity=min_severity,
        notify_via_email=request.notify_via_email,
        notify_via_dashboard=request.notify_via_dashboard,
    )

    return subscription.to_dict()
