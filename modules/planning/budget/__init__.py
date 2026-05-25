"""AURUM · gestión granular de costos CAPEX/OPEX/no-calidad."""

from modules.planning.budget.pipeline import run_aurum_pipeline

__all__ = [
    "run_aurum_pipeline",
    "cost_structure",
    "efficiency",
    "hermes_consumer",
    "kronos_publisher",
    "report_templates",
    "schemas",
]
