"""Pipeline daily_summary — publica evento alquimia/events/logistics/daily_summary."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any, Callable

from modules.logistics.kpi_calculator.calculator import build_daily_summary
from modules.logistics.plan_generator.generator import generate_daily_plan
from modules.logistics.schemas import DailySummary
from modules.logistics.weight_receiver.receiver import ingest_weight_events, synthetic_weight_events

RouteComputeFn = Callable[[float, float, float, float], dict]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def daily_summary_dir() -> Path:
    d = repo_root() / "data" / "logistics" / "daily_summary"
    d.mkdir(parents=True, exist_ok=True)
    return d


def publish_daily_summary(summary: DailySummary) -> Path:
    payload = summary.to_event_payload()
    out = daily_summary_dir() / f"{summary.date}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def run_daily_summary_pipeline(
    municipio_id: str,
    *,
    zm_id: str | None = "zm_slp",
    fecha: date | None = None,
    colonias: list[str] | None = None,
    meta_tonelaje_dia: float = 45.0,
    camiones: int = 1,
    tonelaje_sintetico: float = 0.0,
    route_compute: RouteComputeFn | None = None,
) -> dict[str, Any]:
    plan_date = fecha or date.today()

    plan = generate_daily_plan(
        municipio_id,
        colonias=colonias,
        zm_id=zm_id,
        fecha=plan_date,
        route_compute=route_compute,
    )

    raw_events = synthetic_weight_events(municipio_id, fecha=plan_date, ton_total=tonelaje_sintetico)
    events, rejections = ingest_weight_events(raw_events)

    summary = build_daily_summary(
        plan,
        events,
        meta_tonelaje_dia=meta_tonelaje_dia,
        camiones=camiones,
    )

    if rejections:
        summary.incidentes.extend(rejections)

    out_path = publish_daily_summary(summary)

    return {
        "published": True,
        "path": str(out_path),
        "topic": "alquimia/events/logistics/daily_summary",
        "summary": summary.to_event_payload(),
        "plan": plan.to_dict(),
        "weight_events_accepted": len(events),
    }
