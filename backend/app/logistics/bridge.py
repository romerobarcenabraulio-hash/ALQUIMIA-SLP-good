"""Puente repo-root → modules/logistics (dominio HERMES)."""
from __future__ import annotations

from modules.logistics.kpi_calculator.daily_summary import run_daily_summary_pipeline
from modules.logistics.plan_generator.generator import generate_daily_plan
from modules.logistics.weight_receiver.receiver import (
    ingest_weight_events,
    synthetic_weight_events,
)

__all__ = [
    "generate_daily_plan",
    "ingest_weight_events",
    "run_daily_summary_pipeline",
    "synthetic_weight_events",
]
