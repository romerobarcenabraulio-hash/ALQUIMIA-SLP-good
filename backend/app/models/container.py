"""Container inventory: physical waste bins belonging to a tenant/municipio."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Container(Base):
    """Physical waste container registered under a tenant (HasTenantId)."""
    __tablename__ = "containers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("admin_tenants.id"), nullable=False, index=True
    )

    # Classification
    tipo: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    # organicos | reciclables | residuos_mixtos | peligrosos | electronicos | vidrio | carton | metal

    # Physical specs
    capacidad_litros: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    material: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    # PEAD | acero_inoxidable | fibra_de_vidrio | concreto

    # Location
    ubicacion: Mapped[str] = mapped_column(String(255), nullable=False)
    zona_interna: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    municipio: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    clave_inegi: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Operations
    frecuencia_recoleccion: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    # diaria | interdiaria | dos_por_semana | semanal
    proveedor_recoleccion: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Status
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
