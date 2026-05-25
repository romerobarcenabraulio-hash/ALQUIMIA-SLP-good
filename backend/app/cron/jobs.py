"""Jobs orquestados — HERMES → AURUM → KRONOS."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.logistics.bridge import run_daily_summary_pipeline
from app.logistics.persistence import save_daily_summary, save_route_plan
from app.planning.weekly_status import build_weekly_status, persist_weekly_status
from modules.planning.budget.pipeline import run_aurum_pipeline


def job_logistics_daily_summary(
    *,
    municipio_id: str = "slp",
    zm_id: str | None = "zm_slp",
    fecha: date | None = None,
    persist_db: bool = True,
    db: Session | None = None,
    use_google_routes: bool = False,
) -> dict[str, Any]:
    """
    19:00 MX — pipeline HERMES:
    1. daily_summary → data/logistics/daily_summary/
    2. AURUM consume HERMES → ac_update → KRONOS
    """
    plan_date = fecha or date.today()

    hermes = run_daily_summary_pipeline(
        municipio_id,
        zm_id=zm_id,
        fecha=plan_date,
        route_compute=None,
    )

    db_id: int | None = None
    if persist_db and db is not None:
        db_id = save_daily_summary(
            db,
            summary_payload=hermes["summary"],
            published_path=hermes.get("path"),
        )
        save_route_plan(db, hermes["plan"])
        db.commit()

    aurum = run_aurum_pipeline(
        municipio_id,
        fecha=plan_date,
        lookback_days=30,
    )

    return {
        "ok": True,
        "fecha": plan_date.isoformat(),
        "municipio_id": municipio_id,
        "hermes": {
            "published_path": hermes.get("path"),
            "semaforo": hermes["summary"].get("semaforo"),
            "km_totales": hermes["summary"].get("km_totales"),
            "db_id": db_id,
        },
        "aurum": {
            "ac_update_path": aurum.get("ac_update_path"),
            "ac_total_mxn": aurum.get("ac_total_mxn"),
            "hermes_feeds_consumed": aurum.get("hermes_feeds_consumed"),
            "warnings": aurum.get("warnings"),
        },
        "topics": [
            "alquimia/events/logistics/daily_summary",
            "alquimia/events/planning/ac_update",
        ],
    }


def job_weekly_status(
    *,
    municipio_id: str | None = "slp",
    db: Session | None = None,
) -> dict[str, Any]:
    """Lunes 08:00 MX — reporte semanal KRONOS."""
    report = build_weekly_status(municipio_id=municipio_id, db=db)
    path = persist_weekly_status(report)
    return {
        "ok": True,
        "path": str(path),
        "week": report.get("week"),
        "semaforo": report.get("semaforo"),
        "evm_fuente": report.get("evm_fuente"),
        "topic": "alquimia/events/planning/weekly_status",
    }
