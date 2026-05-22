"""
Modelos SQLAlchemy — research trazable (Serper → Postgres).
"""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class ResearchItem(Base):
    __tablename__ = "research_items"
    __table_args__ = (UniqueConstraint("hash_canonico", name="uq_research_items_hash"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    municipio_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    zm_id: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    categoria: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    material: Mapped[str | None] = mapped_column(String(20), nullable=True)
    query_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    fuente_url: Mapped[str] = mapped_column(Text, nullable=False)
    fuente_titulo: Mapped[str | None] = mapped_column(String(300), nullable=True)
    fuente_dominio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tier_confianza: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confianza: Mapped[float | None] = mapped_column(Float, nullable=True)
    valor_numerico: Mapped[float | None] = mapped_column(Float, nullable=True)
    unidad: Mapped[str | None] = mapped_column(String(30), nullable=True)
    snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    motor_extraccion: Mapped[str] = mapped_column(String(20), nullable=False, default="serper")
    fecha_publicacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_consulta: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    hash_canonico: Mapped[str] = mapped_column(String(64), nullable=False)
    vigente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PriceSeries(Base):
    __tablename__ = "price_series"
    __table_args__ = (
        UniqueConstraint("material", "fecha", "municipio_id", name="uq_price_series_mat_fecha_mun"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    material: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    precio_mxn: Mapped[float | None] = mapped_column(Float, nullable=True)
    precio_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    fuente_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tier_confianza: Mapped[int | None] = mapped_column(Integer, nullable=True)
    zm_id: Mapped[str | None] = mapped_column(String(10), nullable=True)
    municipio_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    research_item_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    municipio_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    titulo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    tipo: Mapped[str | None] = mapped_column(String(40), nullable=True)
    dof_fecha: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado_vigencia: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fuente_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ModelCalibration(Base):
    __tablename__ = "model_calibrations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scope: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    parametro: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    valor: Mapped[float] = mapped_column(Float, nullable=False)
    unidad: Mapped[str | None] = mapped_column(String(30), nullable=True)
    confianza: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuente_primaria: Mapped[str | None] = mapped_column(String(200), nullable=True)
    metodologia: Mapped[str | None] = mapped_column(Text, nullable=True)
    vigente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fecha_calibracion: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_expiracion: Mapped[date | None] = mapped_column(Date, nullable=True)
