"""Jobs orquestados — HERMES → AURUM → KRONOS + geo nacional."""
from __future__ import annotations

import os
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.logistics.bridge import run_daily_summary_pipeline
from app.logistics.persistence import save_daily_summary, save_route_plan
from app.national.catalog import list_zm_municipios
from app.planning.weekly_status import build_weekly_status, persist_weekly_status
from modules.planning.budget.pipeline import run_aurum_pipeline


def _zm_ids_from_env() -> list[str]:
    raw = os.getenv("HERMES_ZM_IDS", "SLP,QRO,MTY")
    return [z.strip().upper() for z in raw.split(",") if z.strip()]


def job_logistics_daily_summary(
    *,
    municipio_id: str = "slp",
    zm_id: str | None = "zm_slp",
    fecha: date | None = None,
    persist_db: bool = True,
    db: Session | None = None,
    use_google_routes: bool = False,
    municipio_ids: list[str] | None = None,
    zm_ids: list[str] | None = None,
) -> dict[str, Any]:
    """19:00 MX — pipeline HERMES por municipio o multi-ZM."""
    if municipio_ids or zm_ids:
        targets: list[tuple[str, str | None]] = []
        if zm_ids:
            for z in zm_ids:
                zm_key = z.upper().replace("ZM_", "")
                for mid in list_zm_municipios(zm_key):
                    targets.append((mid, f"zm_{mid}" if not z.startswith("zm_") else z.lower()))
        if municipio_ids:
            for mid in municipio_ids:
                targets.append((mid, zm_id))
        seen: set[str] = set()
        results = []
        for mid, zid in targets:
            if mid in seen:
                continue
            seen.add(mid)
            results.append(
                job_logistics_daily_summary(
                    municipio_id=mid,
                    zm_id=zid,
                    fecha=fecha,
                    persist_db=persist_db,
                    db=db,
                    use_google_routes=use_google_routes,
                )
            )
        return {"ok": True, "multi": True, "count": len(results), "results": results}

    plan_date = fecha or date.today()
    route_fn = None
    if use_google_routes and db is not None:
        from app.google.config import google_maps_status
        from app.google.quota_guard import check_quota, record_usage
        from app.google.routes_client import compute_route, parse_route
        import asyncio

        if google_maps_status()["routes"] and check_quota(db, "google_routes")["allowed"]:
            def route_fn(lat_o, lon_o, lat_d, lon_d):
                async def _run():
                    r = await compute_route(lat_o, lon_o, lat_d, lon_d)
                    return parse_route(r)
                result = asyncio.run(_run())
                record_usage(db, "google_routes")
                return result

    from app.centros_acopio import geo_db

    traced_km = geo_db.latest_traced_km_for_municipio(db, municipio_id) if db else None

    hermes = run_daily_summary_pipeline(
        municipio_id,
        zm_id=zm_id,
        fecha=plan_date,
        route_compute=route_fn,
    )

    if traced_km and traced_km > 0:
        hermes["summary"]["km_totales"] = traced_km
        hermes["summary"]["fuente_km"] = "ui_traced_route"

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
            "fuente_km": hermes["summary"].get("fuente_km"),
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


def job_geo_denue_nacional_sync(
    *,
    db: Session | None = None,
    batch_size: int | None = None,
    force: bool = False,
) -> dict[str, Any]:
    """04:00 MX — sync batch DENUE nacional."""
    if db is None:
        return {"ok": False, "error": "DB no disponible"}
    from app.centros_acopio.geo_worker import sync_batch

    if force and batch_size is None:
        from app.centros_acopio.geo_worker import bootstrap_queue
        bootstrap_queue(db)
    result = sync_batch(db, batch_size=batch_size)
    return {"ok": True, **result}


def job_weekly_status(
    *,
    municipio_id: str | None = "slp",
    db: Session | None = None,
) -> dict[str, Any]:
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
