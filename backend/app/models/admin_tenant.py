"""Modelos Plataforma 0 — tenants, gates, capabilities y auditoria minima."""
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


class AdminTenant(Base):
    __tablename__ = "admin_tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    estado_mx: Mapped[str] = mapped_column(String(100), nullable=False)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    inegi_clave: Mapped[str] = mapped_column(String(16), nullable=False)
    tier_comercial: Mapped[str] = mapped_column(String(40), nullable=False, default="diagnostico")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    state: Mapped["TenantState"] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", uselist=False
    )
    gates: Mapped[list["TenantGate"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="TenantGate.gate_id"
    )
    capabilities: Mapped[list["TenantCapability"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="TenantCapability.module_id"
    )
    audit_log: Mapped[list["TenantAuditLog"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="TenantAuditLog.created_at"
    )
    municipal_profile: Mapped["TenantMunicipalProfile"] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", uselist=False
    )


class TenantState(Base):
    __tablename__ = "tenant_states"

    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("admin_tenants.id"), primary_key=True
    )
    current_stage: Mapped[str] = mapped_column(String(32), nullable=False, default="validation")
    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    fecha_cambio_stage: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    transition_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="manual_only")
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    tenant: Mapped[AdminTenant] = relationship(back_populates="state")


class TenantGate(Base):
    __tablename__ = "tenant_gates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    gate_id: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="no_iniciado")
    evidencia_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidencia_label: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    decisor_humano: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    tenant: Mapped[AdminTenant] = relationship(back_populates="gates")


class TenantCapability(Base):
    __tablename__ = "tenant_capabilities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source: Mapped[str] = mapped_column(String(60), nullable=False, default="tier_default")
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    tenant: Mapped[AdminTenant] = relationship(back_populates="capabilities")


class TenantAuditLog(Base):
    __tablename__ = "tenant_audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    actor: Mapped[str] = mapped_column(String(200), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    tenant: Mapped[AdminTenant] = relationship(back_populates="audit_log")


class TenantMunicipalProfile(Base):
    __tablename__ = "tenant_municipal_profiles"

    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("admin_tenants.id"), primary_key=True
    )
    mode: Mapped[str] = mapped_column(String(32), nullable=False, default="carga_inicial")
    antecedentes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    mapa_social: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    organigrama_servicio: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    provenance_status: Mapped[str] = mapped_column(String(40), nullable=False, default="pendiente_verificacion")
    updated_by: Mapped[str] = mapped_column(String(200), nullable=False, default="system")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    tenant: Mapped[AdminTenant] = relationship(back_populates="municipal_profile")
