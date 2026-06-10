"""Notification model for alerts: gate approvals, data staleness, new initiatives."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    tipo: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    # gate_approval | data_stale | new_iniciativa | stage_transition | capability_unlocked

    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)

    icon: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    # gate | alert | law-book | rocket | unlock
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # default | success | warning | info

    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    action_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # e.g. { gate_id: "G1", status: "aprobado", ... }

    leido: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    descartado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id: Mapped[str] = mapped_column(String(100), primary_key=True)

    gate_approvals: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    data_staleness: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    new_initiatives: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    stage_transitions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
