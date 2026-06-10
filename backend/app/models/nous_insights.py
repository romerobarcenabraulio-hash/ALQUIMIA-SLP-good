"""NOUS v1: intelligent insights and pattern detection."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, String, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class NousInsight(Base):
    __tablename__ = "nous_insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    tipo: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    # cost_optimization, recovery_potential, compliance_risk, operational_efficiency, etc.

    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    recomendacion: Mapped[str] = mapped_column(Text, nullable=False)

    confianza: Mapped[float] = mapped_column(nullable=False, default=0.5)
    # 0-1 confidence score
    impacto_potencial: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    # alto, medio, bajo

    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    descartado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    datos_respaldo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Raw data supporting the insight

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
