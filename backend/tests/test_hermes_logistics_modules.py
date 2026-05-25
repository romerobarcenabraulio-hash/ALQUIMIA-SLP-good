"""Tests módulos HERMES — plan, peso, KPI, daily_summary."""
from datetime import date

import pytest

from modules.logistics.kpi_calculator.calculator import compute_semaforo
from modules.logistics.kpi_calculator.daily_summary import run_daily_summary_pipeline
from modules.logistics.plan_generator.generator import generate_daily_plan
from modules.logistics.weight_receiver.receiver import ingest_weight_events, synthetic_weight_events


def test_generate_daily_plan_slp():
    plan = generate_daily_plan("slp", fecha=date(2026, 5, 22))
    assert plan.municipio_id == "slp"
    assert len(plan.stops) >= 1
    assert plan.km_totales > 0
    assert plan.fuente == "heuristic_territorial"


def test_weight_receiver_rejects_negative():
    from modules.logistics.schemas import WeightEvent

    events = [
        WeightEvent(
            municipio_id="slp",
            fecha=date(2026, 5, 22),
            fraccion="organicos",
            toneladas=-0.5,
        )
    ]
    accepted, rejections = ingest_weight_events(events)
    assert len(accepted) == 0
    assert len(rejections) >= 1


def test_compute_semaforo_verde():
    assert compute_semaforo(
        tonelaje_vs_meta_pct=98.0,
        utilizacion_flota_pct=80.0,
        on_time_arrivals_pct=95.0,
        merma_logistica_pct=2.0,
    ) == "VERDE"


def test_daily_summary_pipeline_publishes(tmp_path, monkeypatch):
    monkeypatch.setattr(
        "modules.logistics.kpi_calculator.daily_summary.daily_summary_dir",
        lambda: tmp_path,
    )
    result = run_daily_summary_pipeline("slp", fecha=date(2026, 5, 22))
    assert result["published"] is True
    assert result["topic"] == "alquimia/events/logistics/daily_summary"
    assert "semaforo" in result["summary"]
    out_file = tmp_path / "2026-05-22.json"
    assert out_file.is_file()


def test_google_config_loads_limits():
    from app.google.config import load_api_limits, load_google_maps_config

    limits = load_api_limits()
    maps_cfg = load_google_maps_config()
    assert "services" in limits
    assert limits["owner"] == "HERMES"
    assert maps_cfg.get("routes", {}).get("routing_preference") == "TRAFFIC_AWARE_OPTIMAL"
