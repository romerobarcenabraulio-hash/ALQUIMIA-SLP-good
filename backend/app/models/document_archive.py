"""ARCHIVO MVP — brechas documentales y documentos recibidos por tenant.

Estos modelos registran estado y trazabilidad. No convierten documentos
subidos en datos validados ni publican claims sin revisión humana.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentGap(Base):
    __tablename__ = "document_gaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    module_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    detection_method: Mapped[str] = mapped_column(String(60), nullable=False, default="initial_inference")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    marked_not_applicable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fulfilled_by_document_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class TenantDocument(Base):
    __tablename__ = "tenant_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    uploaded_by_user_id: Mapped[str] = mapped_column(String(64), nullable=False, default="mvp_user")
    module_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(260), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    upload_status: Mapped[str] = mapped_column(String(32), nullable=False, default="received")
    classification_confidence: Mapped[str] = mapped_column(String(32), nullable=False, default="suggested_by_filename")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
