"""Modelos SQLAlchemy — Data Backbone logístico (HERMES)."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LogisticsKpiSnapshot(Base):
    __tablename__ = "logistics_kpi_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    zm_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    clave_inegi: Mapped[str | None] = mapped_column(String(10), nullable=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    fase_producto: Mapped[str] = mapped_column(String(8), nullable=False, server_default="0-1")
    fuente: Mapped[str] = mapped_column(String(64), nullable=False, server_default="dimensionamiento_conceptual")
    total_camiones_requeridos: Mapped[int] = mapped_column(Integer, nullable=False)
    visitas_mes_estimadas: Mapped[float] = mapped_column(Float, nullable=False)
    brecha_ton_dia: Mapped[float] = mapped_column(Float, nullable=False)
    cap_instalada_ton_dia: Mapped[float] = mapped_column(Float, nullable=False)
    merma_logistica_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    km_recorrido_dia_estimado: Mapped[float | None] = mapped_column(Float, nullable=True)
    pureza_promedio_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    opex_logistica_anual_estimado_mxn: Mapped[float | None] = mapped_column(Float, nullable=True)
    confianza: Mapped[float | None] = mapped_column(Float, nullable=True)
    modulos_prerequisitos_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    advertencia_gate: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("municipio_id", "fecha", name="uq_logistics_kpi_municipio_fecha"),
    )


class LogisticsDailySummary(Base):
    __tablename__ = "logistics_daily_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    zm_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    semaforo: Mapped[str] = mapped_column(String(10), nullable=False)
    costo_logistico_mxn: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    km_totales: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    emisiones_co2e_kg: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    published_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("municipio_id", "fecha", name="uq_logistics_daily_summary_mun_fecha"),
    )


class LogisticsRoutePlan(Base):
    __tablename__ = "logistics_route_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    fuente: Mapped[str] = mapped_column(String(64), nullable=False)
    km_totales: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    plan_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class LogisticsWeightEvent(Base):
    __tablename__ = "logistics_weight_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    fraccion: Mapped[str] = mapped_column(String(32), nullable=False)
    toneladas: Mapped[float] = mapped_column(Float, nullable=False)
    pureza_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
