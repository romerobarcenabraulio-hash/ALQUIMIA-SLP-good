"""Pipeline mensual BIOS — genera todos los artefactos del dominio."""
from __future__ import annotations

from datetime import date
from typing import Any

from modules.lifecycle.asset_registry import enrich_inventory, load_inventory, replacement_alerts
from modules.lifecycle.co2e_engine import build_co2e_report, persist_co2e_report
from modules.lifecycle.financial_model import calcular_ciclo_financiero, persist_financial
from modules.lifecycle.lca_factors import load_lca_factors
from modules.lifecycle.paths import financial_latest_path, sensitivity_latest_path
from modules.lifecycle.sensitivity import persist_sensitivity, run_sensitivity


def run_bios_pipeline(*, use_scenario_fallback: bool = True) -> dict[str, Any]:
    load_lca_factors()

    co2e = build_co2e_report(use_scenario_fallback=use_scenario_fallback)
    persist_co2e_report(co2e)

    inventory = enrich_inventory(load_inventory())
    alerts = replacement_alerts(inventory)

    financial = calcular_ciclo_financiero()
    persist_financial(financial, financial_latest_path())

    sensitivity = run_sensitivity()
    persist_sensitivity(sensitivity, sensitivity_latest_path())

    report_path: str | None = None
    try:
        from modules.lifecycle.report_templates import persist_bios_report

        report_path = str(persist_bios_report())
    except OSError:
        pass

    tir = financial["tir_pct"]
    wacc = financial["wacc_pct"]
    escalations: list[str] = []
    if tir < wacc:
        escalations.append("TIR < WACC — escalar a SUPREME (regla BIOS)")

    return {
        "agente": "BIOS",
        "fecha": date.today().isoformat(),
        "co2e": co2e.model_dump(mode="json"),
        "inventory_count": len(inventory.assets),
        "replacement_alerts": alerts,
        "financial": financial,
        "sensitivity": sensitivity,
        "escalaciones": escalations,
        "paths": {
            "lca_factors": "data/environmental/lca_factors.json",
            "co2e_latest": "data/environmental/co2e_latest.json",
            "inventory": "data/assets/inventory.json",
            "financial_latest": "data/lifecycle/financial_latest.json",
            "sensitivity_latest": "data/lifecycle/sensitivity_latest.json",
            "informe_md": report_path or "data/environmental/reports/informe_latest.md",
        },
    }
