"""Partner ecosystem: recyclers, buyers, processors mapped per ZM."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class PartnerOrganization(Base):
    """Recycler, buyer, processor or service provider operating in a ZM."""
    __tablename__ = "partner_organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    nombre_corto: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)

    tipo: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    # recicladora | comprador_ancla | procesador | transportista | consultor | financiero

    zm: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    # SLP, MTY, GDL, CdMx, etc.
    estado_mx: Mapped[str] = mapped_column(String(100), nullable=False)
    municipio: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Materials handled
    materiales: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # ["PET", "cartón", "acero", "vidrio", ...]
    capacidad_ton_mes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precio_compra_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # {"PET": 4500, "cartón": 1200, "acero": 6000, ...}  MXN/ton

    # Contact
    contacto_nombre: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contacto_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contacto_telefono: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Certifications / standards
    certificaciones: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # ["ISO 14001", "NMX-AA-153", ...]

    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fuente: Mapped[str] = mapped_column(String(60), nullable=False, default="manual")
    # manual | denue | google_places

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class TenantPartnerLink(Base):
    """Which partners a tenant has contacted or contracted."""
    __tablename__ = "tenant_partner_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    partner_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    estatus: Mapped[str] = mapped_column(String(30), nullable=False, default="identificado")
    # identificado | contactado | cotizando | contratado | activo | pausado

    material: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    precio_acordado_ton: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    volumen_acordado_ton_mes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
