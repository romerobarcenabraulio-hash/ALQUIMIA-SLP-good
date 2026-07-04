"""DataPoint V2 Schema — canonical 7-category data model
Core principle: Cero invención · toda cifra justificable con bibliografía
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DataPoint(Base):
    __tablename__ = "data_points"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    module_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    field_key: Mapped[str] = mapped_column(String(200), nullable=False)

    # 7 categories + pending
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # Valid: 'client_document', 'municipal_research', 'state_data', 'metropolitan_zone',
        # 'national_data', 'comparable_city', 'calculated_model', 'pending'
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="verificado",
        # Valid: 'verificado', 'estimado', 'no_disponible'
    )

    # The data point value
    value: Mapped[str] = mapped_column(Text, nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Confidence: 0-100
    confidence: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    # Provenance metadata
    source_id: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    source_name: Mapped[str] = mapped_column(String(300), nullable=False)
    source_institution: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    retrieved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        # Valid: 'manual_entry', 'ocr_pdf', 'api_inegi', 'formula', 'survey', 'audit'
    )
    scope: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Audit trail
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Conflicts
    conflict_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("evidence_conflicts.id"), nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Unique: tenant + module + field_key + (optional value for different values of same field)
    __table_args__ = (
        Index('idx_data_point_tenant_module', 'tenant_id', 'module_id'),
        Index('idx_data_point_source', 'source_id', 'tenant_id'),
    )

    # Relationships
    history: Mapped[list[DataPointHistory]] = relationship(
        "DataPointHistory",
        back_populates="data_point",
        cascade="all, delete-orphan",
        foreign_keys="DataPointHistory.data_point_id",
    )


class DataPointHistory(Base):
    __tablename__ = "data_point_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    data_point_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_points.id"), index=True, nullable=False)

    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text, nullable=False)

    old_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)

    old_confidence: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    new_confidence: Mapped[int] = mapped_column(Integer, nullable=False)

    changed_by: Mapped[str] = mapped_column(String(64), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Relationships
    data_point: Mapped[DataPoint] = relationship(
        "DataPoint",
        back_populates="history",
        foreign_keys=[data_point_id],
    )


class EvidenceConflict(Base):
    __tablename__ = "evidence_conflicts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    data_point_1_id: Mapped[str] = mapped_column(String(36), nullable=False)
    data_point_2_id: Mapped[str] = mapped_column(String(36), nullable=False)

    conflict_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # Valid: 'direct_contradiction', 'temporal_obsolescence', 'scope_mismatch'
    )

    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="warning",
        # Valid: 'critical', 'warning', 'informational'
    )

    resolution_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="unresolved",
        # Valid: 'unresolved', 'documented', 'resolved'
    )

    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    __table_args__ = (
        Index('idx_evidence_conflict_tenant', 'tenant_id'),
    )


class ModuleCompletionStatus(Base):
    __tablename__ = "module_completion_status"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    module_id: Mapped[str] = mapped_column(String(100), nullable=False)

    percent_complete: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    blocking_gate: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    blocking_gate_resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    required_data_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_data_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    minimum_confidence: Mapped[int] = mapped_column(Integer, nullable=False, default=70)

    unblocked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    dependencies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded list

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    __table_args__ = (
        UniqueConstraint('tenant_id', 'module_id', name='uq_tenant_module_completion'),
        Index('idx_completion_blocking', 'tenant_id', 'blocking_gate'),
    )


class BibliographyEntry(Base):
    __tablename__ = "bibliography_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=True)  # NULL = national/estatal

    source_id: Mapped[str] = mapped_column(String(200), index=True, nullable=False)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    authors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded list

    institution: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # Valid: 'official', 'study', 'regulation', 'publication', 'report', 'dataset'
    )

    scope: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # Valid: 'municipal', 'estatal', 'nacional', 'metropolitan'
    )

    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    chicago_citation: Mapped[str] = mapped_column(Text, nullable=False)

    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    retrieved_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index('idx_bibliography_source', 'source_id'),
        Index('idx_bibliography_institution', 'institution', 'year'),
    )


class TenantDataSnapshot(Base):
    __tablename__ = "tenant_data_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    total_data_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Counts by category as JSON: {"client_document": 5, "municipal_research": 3, ...}
    counts_by_category: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    overall_confidence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    conflict_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    can_generate_plan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_generate_declaratoria: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    last_archivo_run: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_manual_update: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    __table_args__ = (
        Index('idx_snapshot_tenant', 'tenant_id'),
    )
