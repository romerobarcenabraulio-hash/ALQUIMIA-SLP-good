"""Publisher AC actualizado → KRONOS (alquimia/events/planning/ac_update)."""
from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

from modules.planning.budget.schemas import AcUpdatePayload, CostStructure, EfficiencyIndicators, _d


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def costs_data_dir() -> Path:
    d = repo_root() / "data" / "financial" / "costs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def ac_updates_dir() -> Path:
    d = costs_data_dir() / "ac_updates"
    d.mkdir(parents=True, exist_ok=True)
    return d


def build_ac_update(
    structure: CostStructure,
    *,
    costo_logistico_acumulado: Decimal,
    hermes_dias: int,
    indicadores: EfficiencyIndicators,
    ac_capex_incurrido: Decimal | None = None,
    fuente: str = "aurum_pipeline",
) -> AcUpdatePayload:
    """
    AC desglosado por categoría para alimentar EVM de KRONOS.

    En Fase 0-1 el AC operativo proviene principalmente de OPEX logístico acumulado
    más costos de no-calidad; CAPEX se reporta como baseline de referencia.
    """
    capex_incurrido = ac_capex_incurrido or Decimal("0")
    opex_acumulado = structure.opex_mensual_total  # referencia mensual quincenal
    no_calidad = structure.no_calidad.total

    ac_por_categoria = {
        "capex_incurrido": capex_incurrido,
        "opex_referencia_mes": opex_acumulado,
        "logistica_hermes_acumulado": costo_logistico_acumulado,
        "no_calidad": no_calidad,
    }
    ac_total = capex_incurrido + costo_logistico_acumulado + no_calidad

    return AcUpdatePayload(
        fecha=structure.fecha.isoformat(),
        municipio_id=structure.municipio_id,
        ac_total_mxn=ac_total,
        ac_por_categoria=ac_por_categoria,
        fuente=fuente,
        hermes_dias_consumidos=hermes_dias,
        supuesto_base=structure.supuesto_base,
        indicadores=indicadores,
    )


def publish_ac_update(payload: AcUpdatePayload) -> Path:
    """Persiste evento AC en data/financial/costs/ para consumo KRONOS."""
    out_dir = ac_updates_dir()
    event = payload.to_event_payload()

    dated_path = out_dir / f"ac_{payload.fecha}.json"
    latest_path = costs_data_dir() / "ac_latest.json"

    body = json.dumps(event, ensure_ascii=False, indent=2)
    dated_path.write_text(body, encoding="utf-8")
    latest_path.write_text(body, encoding="utf-8")

    return dated_path


def load_latest_ac_update() -> dict | None:
    latest = costs_data_dir() / "ac_latest.json"
    if not latest.is_file():
        return None
    return json.loads(latest.read_text(encoding="utf-8"))
