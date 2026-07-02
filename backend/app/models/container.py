"""Tenant-scoped physical container inventory."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Container(Base):
    """Physical waste container registered under one tenant."""

    __tablename__ = "containers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), nullable=False, index=True)

    tipo: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    capacidad_litros: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    material: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)

    ubicacion: Mapped[str] = mapped_column(String(255), nullable=False)
    zona_interna: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    municipio: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    clave_inegi: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    frecuencia_recoleccion: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    proveedor_recoleccion: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    source: Mapped[str] = mapped_column(String(120), nullable=False, default="manual_user_input")
    source_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    source_method: Mapped[str] = mapped_column(String(120), nullable=False, default="container_inventory_api")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_containers_tenant_tipo", "tenant_id", "tipo"),
        Index("idx_containers_tenant_activo", "tenant_id", "activo"),
        Index("idx_containers_tenant_clave_inegi", "tenant_id", "clave_inegi"),
    )
