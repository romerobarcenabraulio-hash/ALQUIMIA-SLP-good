"""Persistencia Data Backbone logístico."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models.logistics import (
    LogisticsDailySummary,
    LogisticsRoutePlan,
    LogisticsWeightEvent,
)


def save_daily_summary(
    db: Session,
    *,
    summary_payload: dict[str, Any],
    published_path: str | None = None,
) -> int:
    fecha = date.fromisoformat(summary_payload["date"])
    row = LogisticsDailySummary(
        fecha=fecha,
        municipio_id=summary_payload["municipio_id"],
        zm_id=summary_payload.get("zm_id"),
        semaforo=summary_payload.get("semaforo", "AMARILLO"),
        costo_logistico_mxn=float(summary_payload.get("costo_logistico") or 0),
        km_totales=float(summary_payload.get("km_totales") or 0),
        emisiones_co2e_kg=float(summary_payload.get("emisiones_co2e") or 0),
        payload_json=summary_payload,
        published_path=published_path,
    )
    db.add(row)
    db.flush()
    return row.id


def get_daily_summary(db: Session, municipio_id: str, fecha: date) -> dict[str, Any] | None:
    row = (
        db.query(LogisticsDailySummary)
        .filter(
            LogisticsDailySummary.municipio_id == municipio_id,
            LogisticsDailySummary.fecha == fecha,
        )
        .order_by(LogisticsDailySummary.created_at.desc())
        .first()
    )
    if not row:
        return None
    return {
        "id": row.id,
        "fecha": row.fecha.isoformat(),
        "municipio_id": row.municipio_id,
        "semaforo": row.semaforo,
        "published_path": row.published_path,
        "payload": row.payload_json,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def save_route_plan(db: Session, plan_dict: dict[str, Any]) -> int:
    row = LogisticsRoutePlan(
        municipio_id=plan_dict["municipio_id"],
        fecha=date.fromisoformat(plan_dict["fecha"]),
        fuente=plan_dict.get("fuente", "heuristic_territorial"),
        km_totales=float(plan_dict.get("km_totales") or 0),
        plan_json=plan_dict,
    )
    db.add(row)
    db.flush()
    return row.id


def save_weight_events(db: Session, events: list[dict[str, Any]]) -> int:
    count = 0
    for ev in events:
        db.add(
            LogisticsWeightEvent(
                municipio_id=ev["municipio_id"],
                fecha=date.fromisoformat(ev["fecha"]),
                fraccion=ev["fraccion"],
                toneladas=float(ev["toneladas"]),
                pureza_pct=ev.get("pureza_pct"),
                source=ev.get("source", "api"),
            )
        )
        count += 1
    db.flush()
    return count
