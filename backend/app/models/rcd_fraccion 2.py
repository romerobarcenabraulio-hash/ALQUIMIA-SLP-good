"""RCD (Residuos de Construcción y Demolición) waste composition and fractions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Float, ForeignKey, JSON, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RCDFraccion(Base):
    __tablename__ = "rcd_fracciones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    # Classification
    codigo: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    # e.g. "RCD-001", "RCD-MAD", "RCD-ACE"
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    # Madera, Acero, Concreto, etc.

    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    categoria_principal: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    # construction, demolition, packaging, mixed

    # Composition & density
    densidad_kg_m3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Bulk density for volume-to-weight conversion
    humedad_promedio_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Recovery potential
    recuperable: Mapped[bool] = mapped_column(nullable=False, default=True)
    reciclable: Mapped[bool] = mapped_column(nullable=False, default=True)
    reusable: Mapped[bool] = mapped_column(nullable=False, default=False)

    # Economic
    precio_compra_promedio_ton: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Average price buyers pay per ton (can vary by region)
    precio_venta_recuperador_ton: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # What a recovery center might pay

    tratamiento_recomendado: Mapped[str] = mapped_column(String(100), nullable=False, default="landfill")
    # landfill, recycling, reuse, energy_recovery, composting
    normas_aplicables: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # e.g. ["NOM-083", "NOM-161", "GRI-306"]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )


class SimulationRCDComposition(Base):
    __tablename__ = "simulation_rcd_compositions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    simulation_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Link to Simulation.id if available, or standalone entry

    # Input parameters
    toneladas_rcd_dia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Daily RCD generation in tons
    volumen_m3_dia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Daily volume in cubic meters

    # Composition breakdown by fraction
    composicion_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # {
    #   "RCD-CON": { "pct": 45.0, "ton_dia": 4.5, "recuperable": true },
    #   "RCD-ACE": { "pct": 15.0, "ton_dia": 1.5, "recuperable": true },
    #   ...
    # }

    # Derived metrics
    ton_recuperables_dia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ton_reciclables_dia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ton_disposicion_final_dia: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    valor_economico_diario: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # MXN per day if all recoverable fractions sold

    scenario_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
