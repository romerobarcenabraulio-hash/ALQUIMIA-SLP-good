"""Puente repo-root → modules/logistics (dominio HERMES)."""
from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from modules.logistics.kpi_calculator.daily_summary import run_daily_summary_pipeline  # noqa: E402
from modules.logistics.plan_generator.generator import generate_daily_plan  # noqa: E402
from modules.logistics.weight_receiver.receiver import (  # noqa: E402
    ingest_weight_events,
    synthetic_weight_events,
)

__all__ = [
    "generate_daily_plan",
    "ingest_weight_events",
    "run_daily_summary_pipeline",
    "synthetic_weight_events",
]
