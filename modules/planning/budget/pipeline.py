"""Pipeline AURUM — consume HERMES, calcula AC, publica a KRONOS, genera reportes."""
from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

from modules.planning.budget.cost_structure import build_cost_structure
from modules.planning.budget.efficiency import indicators_from_structure
from modules.planning.budget.hermes_consumer import aggregate_hermes_logistics, consume_hermes_feeds
from modules.planning.budget.kronos_publisher import build_ac_update, costs_data_dir, publish_ac_update
from modules.planning.budget.report_templates import (
    ensure_report_templates,
    persist_audience_reports,
    render_inversionista_report,
    render_pmo_report,
)
from modules.planning.budget.schemas import _d


def persist_cost_structure_snapshot(structure_dict: dict[str, Any]) -> Path:
    out_dir = costs_data_dir() / "snapshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    fecha = structure_dict.get("fecha", date.today().isoformat())
    path = out_dir / f"cost_structure_{fecha}.json"
    path.write_text(json.dumps(structure_dict, ensure_ascii=False, indent=2), encoding="utf-8")
    latest = costs_data_dir() / "cost_structure_latest.json"
    latest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    return path


def run_aurum_pipeline(
    municipio_id: str = "slp",
    *,
    fecha: date | None = None,
    lookback_days: int = 14,
    viviendas_activas: int = 224_000,
    ebitda_anual_mxn: str = "85000000",
    ingreso_bruto_anual_mxn: str = "361000000",
    no_calidad_overrides: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Ejecuta ciclo AURUM completo:
    1. Consume feeds HERMES
    2. Construye estructura CAPEX/OPEX/no-calidad (Decimal)
    3. Calcula indicadores de eficiencia
    4. Publica AC → KRONOS
    5. Genera reportes PMO e inversionista
    """
    plan_date = fecha or date.today()
    feeds, warnings = consume_hermes_feeds(municipio_id, lookback_days=lookback_days, fecha_hasta=plan_date)
    hermes_agg = aggregate_hermes_logistics(feeds)

    nc_inputs: dict[str, Decimal] = {}
    if feeds:
        merma_pct = hermes_agg["merma_promedio_pct"] / _d("100")
        ton_dia = hermes_agg["tonelaje_total"] / max(hermes_agg["dias"], _d("1"))
        nc_inputs["peso_origen_ton"] = ton_dia
        nc_inputs["peso_recicladora_ton"] = ton_dia * (_d("1") - merma_pct)
    if no_calidad_overrides:
        for key, val in no_calidad_overrides.items():
            nc_inputs[key] = _d(val)

    structure = build_cost_structure(
        municipio_id,
        fecha=plan_date,
        no_calidad_inputs=nc_inputs or None,
    )
    structure_path = persist_cost_structure_snapshot(structure.to_dict())

    indicadores = indicators_from_structure(
        structure,
        costo_logistico_acumulado=hermes_agg["costo_logistico_total"],
        tonelaje_acumulado=hermes_agg["tonelaje_total"],
        viviendas_activas=viviendas_activas,
        ebitda_anual=_d(ebitda_anual_mxn),
        ingreso_bruto_anual=_d(ingreso_bruto_anual_mxn),
    )

    ac_update = build_ac_update(
        structure,
        costo_logistico_acumulado=hermes_agg["costo_logistico_total"],
        hermes_dias=int(hermes_agg["dias"]),
        indicadores=indicadores,
    )
    ac_path = publish_ac_update(ac_update)

    template_paths = ensure_report_templates()
    pmo_report = render_pmo_report(structure, ac_update, warnings=warnings)
    investor_report = render_inversionista_report(structure, ac_update)
    report_paths = persist_audience_reports(pmo_report, investor_report)

    return {
        "ok": True,
        "municipio_id": municipio_id,
        "fecha": plan_date.isoformat(),
        "hermes_feeds_consumed": len(feeds),
        "warnings": warnings,
        "cost_structure_path": str(structure_path),
        "ac_update_path": str(ac_path),
        "ac_topic": "alquimia/events/planning/ac_update",
        "report_paths": report_paths,
        "template_paths": {k: str(v) for k, v in template_paths.items()},
        "indicadores": indicadores.to_dict(),
        "ac_total_mxn": str(ac_update.ac_total_mxn),
    }
