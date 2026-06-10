"""
Router: /api/v1/notifications

User notifications: gate approvals, data staleness alerts, new initiatives.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification, NotificationPreference
from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class NotificationDTO(BaseModel):
    id: str
    tipo: str
    titulo: str
    descripcion: str
    icon: Optional[str] = None
    color: Optional[str] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    metadata: dict
    leido: bool
    descartado: bool
    created_at: str


class NotificationListResponse(BaseModel):
    total: int
    unread: int
    items: List[NotificationDTO]


class NotificationPreferenceDTO(BaseModel):
    gate_approvals: bool
    data_staleness: bool
    new_initiatives: bool
    stage_transitions: bool


class UpdatePreferenceRequest(BaseModel):
    gate_approvals: Optional[bool] = None
    data_staleness: Optional[bool] = None
    new_initiatives: Optional[bool] = None
    stage_transitions: Optional[bool] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_notification(
    db: Session,
    user_id: str,
    tenant_id: str,
    tipo: str,
    titulo: str,
    descripcion: str,
    icon: str = "info",
    color: str = "default",
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> Notification:
    """Create a notification."""
    notif = Notification(
        user_id=user_id,
        tenant_id=tenant_id,
        tipo=tipo,
        titulo=titulo,
        descripcion=descripcion,
        icon=icon,
        color=color,
        action_url=action_url,
        action_label=action_label,
        meta=metadata or {},
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_user_preferences(db: Session, user_id: str) -> NotificationPreference:
    """Get or create user notification preferences."""
    prefs = db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
):
    """List user's notifications."""
    if db is None:
        return NotificationListResponse(total=0, unread=0, items=[])

    query = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.descartado == False,
    )

    total = query.count()

    if unread_only:
        query = query.filter(Notification.leido == False)

    unread = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.descartado == False,
        Notification.leido == False,
    ).count()

    items = (
        query
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )

    return NotificationListResponse(
        total=total,
        unread=unread,
        items=[
            NotificationDTO(
                id=n.id,
                tipo=n.tipo,
                titulo=n.titulo,
                descripcion=n.descripcion,
                icon=n.icon,
                color=n.color,
                action_url=n.action_url,
                action_label=n.action_label,
                metadata=n.meta,
                leido=n.leido,
                descartado=n.descartado,
                created_at=n.created_at.isoformat(),
            )
            for n in items
        ],
    )


@router.patch("/{notif_id}/leido")
async def mark_as_read(
    notif_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark notification as read."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user.id,
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.leido = True
    db.commit()
    db.refresh(notif)
    logger.info("notif_mark_read user=%s notif=%s", user.id, notif_id)

    return {"id": notif.id, "leido": notif.leido}


@router.patch("/{notif_id}/descartado")
async def dismiss_notification(
    notif_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss (hide) a notification."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user.id,
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.descartado = True
    db.commit()
    logger.info("notif_dismiss user=%s notif=%s", user.id, notif_id)

    return {"id": notif.id, "descartado": notif.descartado}


@router.get("/preferences")
async def get_preferences(
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationPreferenceDTO:
    """Get user's notification preferences."""
    if db is None:
        return NotificationPreferenceDTO(
            gate_approvals=True,
            data_staleness=True,
            new_initiatives=True,
            stage_transitions=True,
        )

    prefs = get_user_preferences(db, user.id)
    return NotificationPreferenceDTO(
        gate_approvals=prefs.gate_approvals,
        data_staleness=prefs.data_staleness,
        new_initiatives=prefs.new_initiatives,
        stage_transitions=prefs.stage_transitions,
    )


@router.patch("/preferences")
async def update_preferences(
    body: UpdatePreferenceRequest,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationPreferenceDTO:
    """Update user's notification preferences."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    prefs = get_user_preferences(db, user.id)

    if body.gate_approvals is not None:
        prefs.gate_approvals = body.gate_approvals
    if body.data_staleness is not None:
        prefs.data_staleness = body.data_staleness
    if body.new_initiatives is not None:
        prefs.new_initiatives = body.new_initiatives
    if body.stage_transitions is not None:
        prefs.stage_transitions = body.stage_transitions

    db.commit()
    db.refresh(prefs)
    logger.info("notif_prefs_updated user=%s", user.id)

    return NotificationPreferenceDTO(
        gate_approvals=prefs.gate_approvals,
        data_staleness=prefs.data_staleness,
        new_initiatives=prefs.new_initiatives,
        stage_transitions=prefs.stage_transitions,
    )
