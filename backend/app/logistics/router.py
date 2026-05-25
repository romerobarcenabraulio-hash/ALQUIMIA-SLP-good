"""API HERMES — plan, peso, daily_summary."""
from __future__ import annotations

import asyncio
import json
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.google.config import google_maps_status, load_api_limits, load_google_maps_config
from app.google.routes_client import GoogleRoutesNotConfigured, compute_route, parse_route
from app.logistics.bridge import (
    generate_daily_plan,
    ingest_weight_events,
    run_daily_summary_pipeline,
    synthetic_weight_events,
)
from app.logistics.persistence import (
    get_daily_summary,
    save_daily_summary,
    save_route_plan,
    save_weight_events,
)

router = APIRouter()


class PlanGenerateRequest(BaseModel):
    municipio_id: str = Field(..., min_length=2, max_length=64)
    zm_id: str | None = None
    colonias: list[str] | None = None
    use_google_routes: bool = False


class WeightIngestRequest(BaseModel):
    municipio_id: str
    fecha: date | None = None
    events: list[dict[str, Any]]


class DailySummaryRunRequest(BaseModel):
    municipio_id: str = "slp"
    zm_id: str | None = "zm_slp"
    fecha: date | None = None
    colonias: list[str] | None = None
    meta_tonelaje_dia: float = 45.0
    camiones: int = 1
    tonelaje_sintetico: float = 0.0
    use_google_routes: bool = False
    persist_db: bool = True


def _sync_route_compute(lat_o: float, lon_o: float, lat_d: float, lon_d: float) -> dict:
    async def _run() -> dict:
        route = await compute_route(lat_o, lon_o, lat_d, lon_d)
        return parse_route(route)

    return asyncio.run(_run())


@router.get("/health")
def logistics_health() -> dict[str, Any]:
    limits = load_api_limits()
    maps_cfg = load_google_maps_config()
    return {
        "agent": "HERMES",
        "status": "ok",
        "fase": "0-1",
        "google": google_maps_status(),
        "config": {
            "api_limits_loaded": bool(limits),
            "google_maps_config_loaded": bool(maps_cfg),
        },
    }


@router.get("/config")
def logistics_config() -> dict[str, Any]:
    return {
        "api_limits": load_api_limits(),
        "google_maps": load_google_maps_config(),
    }


@router.post("/plan/generate")
def api_generate_plan(body: PlanGenerateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    route_fn = None
    if body.use_google_routes:
        if not google_maps_status()["routes"]:
            raise HTTPException(503, "Google Routes no configurado — OPTIMIZATION_ROUTE_API")
        route_fn = _sync_route_compute

    plan = generate_daily_plan(
        body.municipio_id,
        colonias=body.colonias,
        zm_id=body.zm_id,
        route_compute=route_fn,
    )
    plan_id = save_route_plan(db, plan.to_dict())
    db.commit()
    return {"plan_id": plan_id, "plan": plan.to_dict()}


@router.post("/weight/ingest")
def api_weight_ingest(body: WeightIngestRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    from modules.logistics.schemas import WeightEvent

    plan_date = body.fecha or date.today()
    events = [
        WeightEvent(
            municipio_id=body.municipio_id,
            fecha=plan_date,
            fraccion=str(ev.get("fraccion", "")),
            toneladas=float(ev.get("toneladas", 0)),
            pureza_pct=ev.get("pureza_pct"),
            source=str(ev.get("source", "api")),
        )
        for ev in body.events
    ]
    accepted, rejections = ingest_weight_events(events)
    saved = save_weight_events(db, [e.to_dict() for e in accepted])
    db.commit()
    return {"accepted": saved, "rejections": rejections}


@router.post("/daily-summary/run")
def api_run_daily_summary(body: DailySummaryRunRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    route_fn = None
    if body.use_google_routes:
        try:
            if google_maps_status()["routes"]:
                route_fn = _sync_route_compute
        except GoogleRoutesNotConfigured:
            pass

    result = run_daily_summary_pipeline(
        body.municipio_id,
        zm_id=body.zm_id,
        fecha=body.fecha,
        colonias=body.colonias,
        meta_tonelaje_dia=body.meta_tonelaje_dia,
        camiones=body.camiones,
        tonelaje_sintetico=body.tonelaje_sintetico,
        route_compute=route_fn,
    )

    if body.persist_db:
        summary_id = save_daily_summary(
            db,
            summary_payload=result["summary"],
            published_path=result.get("path"),
        )
        save_route_plan(db, result["plan"])
        db.commit()
        result["db_id"] = summary_id

    return result


@router.get("/daily-summary/{fecha}")
def api_get_daily_summary(
    fecha: date,
    municipio_id: str = "slp",
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = get_daily_summary(db, municipio_id, fecha)
    if row:
        return row

    file_path = (
        Path(__file__).resolve().parents[3]
        / "data"
        / "logistics"
        / "daily_summary"
        / f"{fecha.isoformat()}.json"
    )
    if file_path.is_file():
        return {"source": "file", "payload": json.loads(file_path.read_text(encoding="utf-8"))}

    raise HTTPException(404, f"Sin daily_summary para {municipio_id} @ {fecha}")
