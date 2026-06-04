"""Notification trigger helpers called from other routers."""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationPreference

logger = logging.getLogger(__name__)


def trigger_gate_approval(
    db: Session,
    user_id: str,
    tenant_id: str,
    gate_id: str,
    status: str,
    decisor: Optional[str] = None,
):
    """Trigger notification when a gate is approved/rejected."""
    if db is None:
        return

    try:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()

        if prefs and not prefs.gate_approvals:
            return

        status_label = "Aprobada" if status == "aprobado" else "Rechazada" if status == "rechazado" else "Actualizada"
        color = "success" if status == "aprobado" else "warning" if status == "rechazado" else "info"
        icon = "check-circle" if status == "aprobado" else "x-circle" if status == "rechazado" else "gate"

        notif = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            tipo="gate_approval",
            titulo=f"Puerta {gate_id} {status_label}",
            descripcion=f"La puerta {gate_id} ha sido {status_label.lower()}.",
            icon=icon,
            color=color,
            action_url=f"/hub",
            action_label="Ir al Hub",
            metadata={
                "gate_id": gate_id,
                "status": status,
                "decisor": decisor,
            },
        )
        db.add(notif)
        db.commit()
        logger.info("notif_gate_approval user=%s gate=%s status=%s", user_id, gate_id, status)
    except Exception as exc:
        logger.error("trigger_gate_approval failed: %s", exc)


def trigger_data_stale(
    db: Session,
    user_id: str,
    tenant_id: str,
    kpi_name: str,
    days_stale: int,
):
    """Trigger notification when data is stale (not updated in X days)."""
    if db is None:
        return

    try:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()

        if prefs and not prefs.data_staleness:
            return

        notif = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            tipo="data_stale",
            titulo=f"Datos desactualizados: {kpi_name}",
            descripcion=f"{kpi_name} no ha sido actualizado en {days_stale} días. Actualiza los datos para mejorar el diagnóstico.",
            icon="alert",
            color="warning",
            action_url=f"/simulator",
            action_label="Ir al Simulador",
            metadata={
                "kpi_name": kpi_name,
                "days_stale": days_stale,
            },
        )
        db.add(notif)
        db.commit()
        logger.info("notif_data_stale user=%s kpi=%s days=%s", user_id, kpi_name, days_stale)
    except Exception as exc:
        logger.error("trigger_data_stale failed: %s", exc)


def trigger_new_iniciativa(
    db: Session,
    user_id: str,
    tenant_id: str,
    clave: str,
    titulo: str,
):
    """Trigger notification when a new regulation is added to catalog."""
    if db is None:
        return

    try:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()

        if prefs and not prefs.new_initiatives:
            return

        notif = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            tipo="new_iniciativa",
            titulo=f"Nueva iniciativa: {clave}",
            descripcion=titulo,
            icon="law-book",
            color="info",
            action_url=f"/hub/catalogo-iniciativas?q={clave}",
            action_label="Ver catálogo",
            metadata={
                "clave": clave,
                "titulo": titulo,
            },
        )
        db.add(notif)
        db.commit()
        logger.info("notif_new_iniciativa user=%s clave=%s", user_id, clave)
    except Exception as exc:
        logger.error("trigger_new_iniciativa failed: %s", exc)


def trigger_stage_transition(
    db: Session,
    user_id: str,
    tenant_id: str,
    new_stage: str,
):
    """Trigger notification when tenant moves to next stage."""
    if db is None:
        return

    try:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()

        if prefs and not prefs.stage_transitions:
            return

        stage_label = {
            "validation": "Validación",
            "planning": "Planeación",
            "execution": "Ejecución",
            "monitoring": "Monitoreo",
        }.get(new_stage, new_stage)

        notif = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            tipo="stage_transition",
            titulo=f"Etapa: {stage_label}",
            descripcion=f"Se ha avanzado a la etapa de {stage_label}.",
            icon="rocket",
            color="success",
            action_url=f"/hub",
            action_label="Ver progreso",
            metadata={
                "new_stage": new_stage,
                "stage_label": stage_label,
            },
        )
        db.add(notif)
        db.commit()
        logger.info("notif_stage_transition user=%s stage=%s", user_id, new_stage)
    except Exception as exc:
        logger.error("trigger_stage_transition failed: %s", exc)
