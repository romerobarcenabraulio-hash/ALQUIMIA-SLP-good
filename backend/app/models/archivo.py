"""ARCHIVO: document catalog with embeddings and clustering."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ArchivoDocument(Base):
    __tablename__ = "archivo_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    # Source
    source_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    # iniciativa | user_document | guide | standard | case_study
    source_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    # Link to iniciativa.id, tenant document ID, etc.

    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    contenido_completo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Full text for search — optional, can be truncated

    autor: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    fecha_publicacion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Classification
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # e.g. ["RSU", "LGPGIR", "municipal", "compliance"]
    ambito: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    # federal | estatal | norma_tecnica | estandar_internacional

    # Embeddings & similarity
    embedding_vector: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # JSON-encoded embedding array (TF-IDF or sparse representation)
    cluster_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    # Maps to ArchivoCluster.id
    relevance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Similarity to query (0-1), calculated at search time

    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    url_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class ArchivoCluster(Base):
    __tablename__ = "archivo_clusters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tema_principal: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # RSU, RCD, agua, gobernanza, financiero, etc.

    doc_count: Mapped[int] = mapped_column(nullable=False, default=0)
    center_vector: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Centroid of cluster in embedding space

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class ArchivoSearchLog(Base):
    __tablename__ = "archivo_search_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    results_count: Mapped[int] = mapped_column(nullable=False, default=0)

    filters_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)
