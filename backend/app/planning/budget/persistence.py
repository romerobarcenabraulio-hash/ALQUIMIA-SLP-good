"""Persistencia EVM en PostgreSQL (tabla evm_snapshots)."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models.planning_evm import EvmSnapshot, GateStatusLog
from app.planning.budget.evm_engine import EVMResult


def save_evm_snapshot(
    db: Session,
    result: EVMResult,
    *,
    gate_id: str,
    municipio_id: str | None = None,
    notas: str | None = None,
    fecha: date | None = None,
) -> int:
    row = EvmSnapshot(
        fecha=fecha or date.today(),
        gate_id=gate_id,
        municipio_id=municipio_id,
        bac=result.bac,
        pv=result.pv,
        ev=result.ev,
        ac=result.ac,
        cpi=result.cpi,
        spi=result.spi,
        tcpi=result.tcpi,
        eac_likely=result.eac_likely,
        eac_optimistic=result.eac_optimistic,
        eac_conservative=result.eac_conservative,
        vac=result.vac,
        vac_pct=result.vac_pct,
        semaforo=result.semaforo,
        notas=notas,
    )
    db.add(row)
    db.flush()
    return row.id


def list_evm_snapshots(
    db: Session,
    *,
    municipio_id: str | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    q = db.query(EvmSnapshot).order_by(EvmSnapshot.created_at.desc())
    if municipio_id:
        q = q.filter(EvmSnapshot.municipio_id == municipio_id)
    rows = q.limit(max(1, min(limit, 100))).all()
    return [
        {
            "id": r.id,
            "fecha": r.fecha.isoformat(),
            "gate_id": r.gate_id,
            "municipio_id": r.municipio_id,
            "bac": r.bac,
            "pv": r.pv,
            "ev": r.ev,
            "ac": r.ac,
            "cpi": r.cpi,
            "spi": r.spi,
            "tcpi": r.tcpi,
            "eac_likely": r.eac_likely,
            "vac": r.vac,
            "vac_pct": r.vac_pct,
            "semaforo": r.semaforo,
            "notas": r.notas,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


def log_gate_status_change(
    db: Session,
    *,
    gate_id: str,
    status_anterior: str | None,
    status_nuevo: str,
    nota: str | None = None,
    fecha_cambio: date | None = None,
) -> int:
    row = GateStatusLog(
        gate_id=gate_id,
        status_anterior=status_anterior,
        status_nuevo=status_nuevo,
        fecha_cambio=fecha_cambio or date.today(),
        nota=nota,
    )
    db.add(row)
    db.flush()
    return row.id
