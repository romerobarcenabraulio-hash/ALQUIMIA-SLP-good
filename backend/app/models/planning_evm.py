"""Modelos SQLAlchemy — snapshots EVM y log de gates (KRONOS)."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EvmSnapshot(Base):
    __tablename__ = "evm_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    gate_id: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    municipio_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bac: Mapped[float] = mapped_column(Float, nullable=False)
    pv: Mapped[float] = mapped_column(Float, nullable=False)
    ev: Mapped[float] = mapped_column(Float, nullable=False)
    ac: Mapped[float] = mapped_column(Float, nullable=False)
    cpi: Mapped[float | None] = mapped_column(Float, nullable=True)
    spi: Mapped[float | None] = mapped_column(Float, nullable=True)
    tcpi: Mapped[float | None] = mapped_column(Float, nullable=True)
    eac_likely: Mapped[float | None] = mapped_column(Float, nullable=True)
    eac_optimistic: Mapped[float | None] = mapped_column(Float, nullable=True)
    eac_conservative: Mapped[float | None] = mapped_column(Float, nullable=True)
    vac: Mapped[float | None] = mapped_column(Float, nullable=True)
    vac_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    semaforo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GateStatusLog(Base):
    __tablename__ = "gate_status_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    gate_id: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    status_anterior: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status_nuevo: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_cambio: Mapped[date] = mapped_column(Date, nullable=False)
    nota: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
