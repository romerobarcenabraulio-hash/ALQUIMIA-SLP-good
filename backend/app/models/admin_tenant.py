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
    analytics_aggregate_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    analytics_aggregate_opt_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    analytics_aggregate_opt_in_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    analytics_aggregate_opt_in_source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
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
    document_drafts: Mapped[list["TenantDocumentDraft"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="TenantDocumentDraft.updated_at"
    )
    inference_corrections: Mapped[list["NousInferenceCorrection"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="NousInferenceCorrection.corrected_at"
    )
    gate_outcomes: Mapped[list["NousGateOutcome"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="NousGateOutcome.closed_at"
    )
    projection_deltas: Mapped[list["NousProjectionDelta"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan", order_by="NousProjectionDelta.created_at"
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


class TenantDocumentDraft(Base):
    __tablename__ = "tenant_document_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="human_review_required")
    qa_status: Mapped[str] = mapped_column(String(24), nullable=False, default="partial")
    version: Mapped[int] = mapped_column(nullable=False, default=1)
    content_md: Mapped[str] = mapped_column(Text, nullable=False)
    claim_ledger: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    standards: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    blockers: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    human_review_sections: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    versions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    review_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_by: Mapped[str] = mapped_column(String(200), nullable=False, default="system")
    updated_by: Mapped[str] = mapped_column(String(200), nullable=False, default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    tenant: Mapped[AdminTenant] = relationship(back_populates="document_drafts")


class NousInferenceCorrection(Base):
    __tablename__ = "nous_inference_corrections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    field_id: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    inferred_value: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    validation_action: Mapped[str] = mapped_column(String(32), nullable=False)
    corrected_value: Mapped[dict] = mapped_column(JSON, nullable=True)
    delta_percentage: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    corrected_by_role: Mapped[str] = mapped_column(String(120), nullable=False)
    corrected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    source_used_for_inference: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    municipality_profile: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    included_in_aggregate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    aggregate_exclusion_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    audit: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    tenant: Mapped[AdminTenant] = relationship(back_populates="inference_corrections")


class NousGateOutcome(Base):
    __tablename__ = "nous_gate_outcomes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    gate: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    outcome: Mapped[str] = mapped_column(String(40), nullable=False)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    days_to_close: Mapped[int] = mapped_column(nullable=False, default=0)
    module_state_at_close: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    municipality_profile: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    political_context: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    payer_configuration: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    included_in_aggregate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    aggregate_exclusion_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    audit: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    tenant: Mapped[AdminTenant] = relationship(back_populates="gate_outcomes")


class NousProjectionDelta(Base):
    __tablename__ = "nous_projection_deltas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_tenants.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    metric_id: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    projected_value: Mapped[str] = mapped_column(String(80), nullable=False)
    actual_value: Mapped[str] = mapped_column(String(80), nullable=False)
    measurement_period: Mapped[str] = mapped_column(String(16), nullable=False)
    delta_absolute: Mapped[str] = mapped_column(String(80), nullable=False)
    delta_percentage: Mapped[str] = mapped_column(String(80), nullable=False)
    delta_direction: Mapped[str] = mapped_column(String(32), nullable=False)
    measurement_quality: Mapped[str] = mapped_column(String(20), nullable=False)
    municipality_profile: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    included_in_aggregate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    aggregate_exclusion_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    audit: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    tenant: Mapped[AdminTenant] = relationship(back_populates="projection_deltas")


class NousPattern(Base):
    __tablename__ = "nous_patterns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    pattern_layer: Mapped[int] = mapped_column(nullable=False)
    pattern_status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft_observed")
    pattern_description_natural: Mapped[str] = mapped_column(Text, nullable=False)
    pattern_description_technical: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    observations_count: Mapped[int] = mapped_column(nullable=False, default=0)
    confidence_level: Mapped[str] = mapped_column(String(32), nullable=False, default="pending_insufficient_data")
    statistical_significance: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    contributing_tenant_profiles: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    bias_check_status: Mapped[str] = mapped_column(String(32), nullable=False, default="not_run")
    founder_gate_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    published_to_clients: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    retired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retired_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audit: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
