"""Integración AURUM + HERMES → inputs EVM KRONOS (Fase 0-1)."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.planning.budget.evm_engine import EVMResult, calculate_evm
from app.planning.budget.persistence import list_evm_snapshots
from app.planning.scheduling.gate_tracker import get_current_gate, load_gate_status
from modules.planning.budget.hermes_consumer import aggregate_hermes_logistics, consume_hermes_feeds
from modules.planning.budget.kronos_publisher import costs_data_dir, load_latest_ac_update

logger = logging.getLogger(__name__)

GATE_PV_FRACTION = {
    "G1": 0.08,
    "G2": 0.18,
    "G3": 0.40,
    "G4": 0.70,
    "G5": 0.95,
}


def load_cost_structure_latest() -> dict[str, Any] | None:
    path = costs_data_dir() / "cost_structure_latest.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _evm_block_from_result(
    result: EVMResult,
    *,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    block = {
        "bac": result.bac,
        "pv": result.pv,
        "ev": result.ev,
        "ac": result.ac,
        "cpi": result.cpi,
        "spi": result.spi,
        "tcpi": result.tcpi,
        "eac": result.eac_likely,
        "vac": result.vac,
        "vac_pct": result.vac_pct,
        "semaforo": result.semaforo,
    }
    if extra:
        block.update(extra)
    return block


def derive_evm_from_aurum_hermes(
    municipio_id: str | None,
    *,
    lookback_days: int = 60,
) -> tuple[dict[str, Any], str, list[str], dict[str, Any]]:
    """
    Construye EVM desde ac_latest (AURUM) + cost_structure + feeds HERMES.

    Fase 0-1: BAC operativo anual = OPEX mensual × 12; AC = logística acumulada AURUM.
    PV = quemado OPEX planeado en ventana HERMES; EV ajustado por desempeño logístico.
    """
    datos_faltantes: list[str] = []
    meta: dict[str, Any] = {}

    mid = municipio_id or "slp"
    ac_event = load_latest_ac_update()
    structure = load_cost_structure_latest()

    if ac_event is None:
        datos_faltantes.append("Sin ac_latest.json — ejecutar POST /api/planning/budget/aurum/run")
        return {}, "sin_aurum", datos_faltantes, meta

    if ac_event.get("municipio_id") != mid:
        datos_faltantes.append(
            f"ac_latest es municipio {ac_event.get('municipio_id')} ≠ {mid}"
        )

    if structure is None:
        datos_faltantes.append("Sin cost_structure_latest.json — ejecutar pipeline AURUM")
        bac_programa = 1_500_000.0
        opex_mensual = 277_316.0
    else:
        bac_programa = float(structure.get("capex_total_mxn", 1_500_000))
        opex_mensual = float(structure.get("opex_mensual_total_mxn", 277_316))

    ac_total = float(ac_event.get("ac_total_mxn", 0))
    if ac_total <= 0:
        datos_faltantes.append("AC total AURUM es cero — revisar feeds HERMES")
        ac_total = max(ac_total, 1.0)

    feeds, hermes_warnings = consume_hermes_feeds(mid, lookback_days=lookback_days)
    datos_faltantes.extend(hermes_warnings)
    hermes_agg = aggregate_hermes_logistics(feeds)

    hermes_dias = int(ac_event.get("hermes_dias_consumidos") or hermes_agg.get("dias") or 1)
    hermes_dias = max(hermes_dias, 1)

    gate_id = get_current_gate() or "G1"
    gate_status = load_gate_status().get(gate_id, {}).get("status", "NO_INICIADO")

    # BAC operativo Fase 0-1 (OPEX anual) + referencia programa
    bac_operativo = opex_mensual * 12
    bac = bac_operativo

    # PV: OPEX diario planeado × días con feed HERMES
    pv = (opex_mensual / 30.0) * hermes_dias

    # EV: factor desempeño — tonelaje vs meta si hay datos; si no, utilización flota
    earned_factor = 0.85
    if feeds:
        latest_path = feeds[0]
        meta_tonelaje = _load_meta_tonelaje_for_feed(latest_path.date)
        ton = float(hermes_agg.get("tonelaje_total", 0))
        if meta_tonelaje and meta_tonelaje > 0:
            earned_factor = min(1.0, max(0.05, ton / (meta_tonelaje * hermes_dias)))
        elif float(hermes_agg.get("costo_logistico_total", 0)) > 0 and ac_total > 0:
            earned_factor = min(1.0, max(0.05, ac_total / pv)) if pv > 0 else 0.85

    if gate_status == "CRUZADO":
        earned_factor = min(1.0, earned_factor + 0.05)
    elif gate_status == "EN_RIESGO":
        earned_factor *= 0.85

    ev = max(pv * earned_factor, 0.0)
    if ev <= 0:
        ev = pv * 0.05
        datos_faltantes.append("EV mínimo 5% PV — sin tonelaje ni avance verificable en HERMES")

    result = calculate_evm(bac=bac, pv=max(pv, 1.0), ev=max(ev, 0.0), ac=ac_total)

    meta = {
        "bac_programa_capex_mxn": bac_programa,
        "bac_operativo_anual_mxn": bac_operativo,
        "opex_mensual_mxn": opex_mensual,
        "hermes_dias": hermes_dias,
        "hermes_agg": {k: str(v) for k, v in hermes_agg.items()},
        "ac_por_categoria": ac_event.get("ac_por_categoria"),
        "aurum_fuente": ac_event.get("fuente"),
        "gate_id": gate_id,
        "gate_status": gate_status,
        "earned_factor": round(earned_factor, 4),
        "feeds_consumidos": len(feeds),
    }

    block = _evm_block_from_result(
        result,
        extra={
            "bac_programa_capex_mxn": bac_programa,
            "evm_scope": "operativo_fase_0_1",
        },
    )
    return block, "aurum_hermes_integrado", datos_faltantes, meta


def _load_meta_tonelaje_for_feed(feed_date: str) -> float | None:
    path = (
        Path(__file__).resolve().parents[4]
        / "data"
        / "logistics"
        / "daily_summary"
        / f"{feed_date}.json"
    )
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        meta = payload.get("meta_tonelaje_dia")
        return float(meta) if meta is not None else None
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def resolve_evm_for_weekly(
    db: Session | None,
    municipio_id: str | None,
) -> tuple[dict[str, Any], str, list[str], dict[str, Any]]:
    """
    Prioridad: snapshot BD → AURUM+HERMES → sintético.
    """
    datos_faltantes: list[str] = []
    meta: dict[str, Any] = {}

    if db is not None:
        snapshots = list_evm_snapshots(db, municipio_id=municipio_id, limit=1)
        if snapshots:
            s = snapshots[0]
            block = {
                "bac": s["bac"],
                "pv": s["pv"],
                "ev": s["ev"],
                "ac": s["ac"],
                "cpi": s["cpi"],
                "spi": s["spi"],
                "tcpi": s["tcpi"],
                "eac": s["eac_likely"],
                "vac": s["vac"],
                "vac_pct": s["vac_pct"],
                "semaforo": s["semaforo"],
                "snapshot_id": s["id"],
            }
            return block, "evm_snapshots", datos_faltantes, meta

    block, fuente, missing, meta = derive_evm_from_aurum_hermes(municipio_id)
    if block:
        return block, fuente, missing, meta

    datos_faltantes.extend(missing)
    datos_faltantes.append("Fallback sintético — ejecutar aurum/run y POST /evm con datos PMO")
    result = calculate_evm(
        bac=1_500_000.0,
        pv=375_000.0,
        ev=350_000.0,
        ac=380_000.0,
    )
    return _evm_block_from_result(result), "sintetico_fase_0_1", datos_faltantes, meta
