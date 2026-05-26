"""API HERMES — plan, peso, daily_summary, depot, rutas residenciales."""
from __future__ import annotations

import asyncio
import json
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.centros_acopio import geo_db
from app.db.session import get_db
from app.google.config import google_maps_status, load_api_limits, load_google_maps_config
from app.google.quota_guard import quota_summary
from app.google.routes_client import GoogleRoutesNotConfigured, compute_route, parse_route
from app.logistics.bridge import (
    generate_daily_plan,
    ingest_weight_events,
    run_daily_summary_pipeline,
    synthetic_weight_events,
)
from app.logistics.depot_resolver import resolve_depot, resolve_depot_for_municipio
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


class ResidentialRouteUpsert(BaseModel):
    route_id: str
    zm: str
    clave_inegi: str | None = None
    municipio_id: str
    traced: bool = False
    source: str = "draft"
    depot: dict[str, Any] | None = None
    stops: list[dict[str, Any]] = []
    legs: list[dict[str, Any]] = []
    km_totales: float | None = None
    total_km: float | None = None
    total_min_turno: float | None = None
    opex_mes_mxn: float | None = None
    frecuencia_semana: int | None = None
    zona_label: str | None = None


class InfraGraphRequest(BaseModel):
    zm: str
    clave_inegi: str | None = None
    municipio: str = ""
    estado: str = ""
    mix: dict[str, int] | None = None


def _sync_route_compute(lat_o: float, lon_o: float, lat_d: float, lon_d: float, db: Session | None = None) -> dict:
    from app.google.quota_guard import check_quota, record_usage

    quota = check_quota(db, "google_routes")
    if not quota["allowed"]:
        raise GoogleRoutesNotConfigured("Cuota Google Routes agotada — fallback haversine")

    async def _run() -> dict:
        route = await compute_route(lat_o, lon_o, lat_d, lon_d)
        return parse_route(route)

    result = asyncio.run(_run())
    record_usage(db, "google_routes")
    return result


@router.get("/health")
def logistics_health(db: Session = Depends(get_db)) -> dict[str, Any]:
    limits = load_api_limits()
    maps_cfg = load_google_maps_config()
    geo_stats = {}
    traced_routes = 0
    if db is not None:
        geo_stats = geo_db.coverage_stats(db)
        traced_routes = geo_db.count_traced_routes(db)
    return {
        "agent": "HERMES",
        "status": "ok",
        "fase": "0-1",
        "google": google_maps_status(),
        "config": {
            "api_limits_loaded": bool(limits),
            "google_maps_config_loaded": bool(maps_cfg),
        },
        "geo": {
            **geo_stats,
            "rutas_traced_persistidas": traced_routes,
        },
        "quota": quota_summary(db),
    }


@router.get("/config")
def logistics_config() -> dict[str, Any]:
    return {
        "api_limits": load_api_limits(),
        "google_maps": load_google_maps_config(),
    }


@router.get("/depot")
def get_depot(
    clave_inegi: str | None = Query(None),
    municipio_id: str | None = Query(None),
    zm: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if clave_inegi:
        return resolve_depot(clave_inegi, zm=zm, db=db)
    if municipio_id:
        return resolve_depot_for_municipio(municipio_id, zm=zm, db=db)
    raise HTTPException(400, "Indique clave_inegi o municipio_id")


@router.post("/residential-routes")
def upsert_residential_route(body: ResidentialRouteUpsert, db: Session = Depends(get_db)) -> dict[str, Any]:
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    plan = body.model_dump()
    row_id = geo_db.save_residential_route(db, plan)
    db.commit()
    return {"id": row_id, "route_id": body.route_id, "zm": body.zm.upper(), "saved": True}


@router.get("/residential-routes")
def list_residential_routes(
    zm: str | None = Query(None),
    clave_inegi: str | None = Query(None),
    traced_only: bool = Query(False),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if db is None:
        return {"routes": [], "source": "none"}
    routes = geo_db.list_residential_routes(db, zm=zm, clave_inegi=clave_inegi, traced_only=traced_only)
    return {"routes": routes, "total": len(routes)}


@router.get("/infra-graph")
def get_infra_graph(
    zm: str = Query(...),
    clave_inegi: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    from app.centros_acopio.infra_graph import export_infra_graph

    return export_infra_graph(db, zm=zm, clave_inegi=clave_inegi)


@router.post("/infra-graph/propose")
def propose_infra_nodes(body: InfraGraphRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    if not body.mix or not body.clave_inegi:
        raise HTTPException(400, "mix y clave_inegi requeridos")
    from app.centros_acopio.infra_graph import mix_cas_to_geo_nodes

    nodes = mix_cas_to_geo_nodes(
        db,
        clave_inegi=body.clave_inegi,
        zm=body.zm,
        municipio=body.municipio,
        estado=body.estado,
        mix=body.mix,
    )
    db.commit()
    return {"proposed": len(nodes), "nodes": nodes}


@router.post("/plan/generate")
def api_generate_plan(body: PlanGenerateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    route_fn = None
    if body.use_google_routes:
        if not google_maps_status()["routes"]:
            raise HTTPException(503, "Google Routes no configurado — OPTIMIZATION_ROUTE_API")
        route_fn = lambda lo, la, ld, ln: _sync_route_compute(lo, la, ld, ln, db)

    plan = generate_daily_plan(
        body.municipio_id,
        colonias=body.colonias,
        zm_id=body.zm_id,
        route_compute=route_fn,
    )
    plan_id = save_route_plan(db, plan.to_dict()) if db else None
    if db:
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
    saved = save_weight_events(db, [e.to_dict() for e in accepted]) if db else 0
    if db:
        db.commit()
    return {"accepted": saved, "rejections": rejections}


@router.post("/daily-summary/run")
def api_run_daily_summary(body: DailySummaryRunRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    route_fn = None
    if body.use_google_routes:
        try:
            if google_maps_status()["routes"]:
                route_fn = lambda lo, la, ld, ln: _sync_route_compute(lo, la, ld, ln, db)
        except GoogleRoutesNotConfigured:
            pass

    traced_km = geo_db.latest_traced_km_for_municipio(db, body.municipio_id) if db else None

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

    if traced_km and traced_km > 0:
        result["summary"]["km_totales"] = traced_km
        result["summary"]["fuente_km"] = "ui_traced_route"
        if result.get("plan"):
            result["plan"]["km_totales"] = traced_km

    if body.persist_db and db:
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
    row = get_daily_summary(db, municipio_id, fecha) if db else None
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
