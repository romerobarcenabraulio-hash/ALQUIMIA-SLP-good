"""Reporte semanal KRONOS — weekly_status (CPI/SPI, gates, riesgos, precios)."""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.planning.budget.evm_engine import calculate_evm
from app.planning.budget.persistence import list_evm_snapshots
from app.planning.financial_model.material_prices import check_all_precios, get_precio_ancla
from app.planning.risk.alert_engine import get_all_active_alerts
from app.planning.risk.risk_register import get_risks_by_status, load_risk_register
from app.planning.scheduling.gate_tracker import check_gate_alerts, get_current_gate, load_gate_status

logger = logging.getLogger(__name__)

_DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "planning"
REPORTS_DIR = _DATA_ROOT / "reports"
LATEST_PATH = _DATA_ROOT / "weekly_status_latest.json"

# Baseline sintético Fase 0–1 cuando no hay snapshots PMO en BD
_SYNTHETIC_EVM = {
    "bac": 1_500_000.0,
    "pv": 375_000.0,
    "ev": 350_000.0,
    "ac": 380_000.0,
    "notas": "Baseline sintético Fase 0–1 — reemplazar con POST /api/planning/budget/evm",
}


def _iso_week(d: date | None = None) -> str:
    d = d or date.today()
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


def _gate_estado_y_dias(gate_id: str | None) -> tuple[str, int | None]:
    if not gate_id:
        return "CRUZADO", None
    status = load_gate_status().get(gate_id, {})
    gate_estado = status.get("status", "NO_INICIADO")
    dias: int | None = None
    fecha_str = status.get("fecha_objetivo")
    if fecha_str:
        try:
            dias = (date.fromisoformat(str(fecha_str)) - date.today()).days
        except ValueError:
            pass
    return gate_estado, dias


def _resolve_evm(
    db: Session | None,
    municipio_id: str | None,
) -> tuple[dict[str, Any], str, list[str]]:
    datos_faltantes: list[str] = []

    if db is not None:
        snapshots = list_evm_snapshots(db, municipio_id=municipio_id, limit=1)
        if snapshots:
            s = snapshots[0]
            return {
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
            }, "evm_snapshots", datos_faltantes

    datos_faltantes.append(
        "Sin snapshot EVM en PostgreSQL — ingresar PV/EV/AC vía POST /api/planning/budget/evm"
    )
    datos_faltantes.append(
        "AC real de operación logística (HERMES daily_summary) aún no cableado a EVM"
    )
    result = calculate_evm(
        bac=_SYNTHETIC_EVM["bac"],
        pv=_SYNTHETIC_EVM["pv"],
        ev=_SYNTHETIC_EVM["ev"],
        ac=_SYNTHETIC_EVM["ac"],
    )
    return {
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
    }, "sintetico_fase_0_1", datos_faltantes


def build_weekly_status(
    *,
    municipio_id: str | None = None,
    db: Session | None = None,
    precios_mercado: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Construye reporte semanal al formato kronos.md."""
    gate_actual = get_current_gate() or "G5"
    gate_estado, dias_proximo_gate = _gate_estado_y_dias(gate_actual)
    evm_block, evm_fuente, datos_faltantes = _resolve_evm(db, municipio_id)

    if precios_mercado is None:
        precios_mercado = {}
        for material in ("PET", "papel_carton", "vidrio", "aluminio"):
            precio, _ = get_precio_ancla(material, db)
            precios_mercado[material] = precio

    precios_check = check_all_precios(precios_mercado, db)
    precios_alertas = [r for r in precios_check if r["alerta"]]

    riesgos_rojos = [r["id"] for r in get_risks_by_status("ROJO")]
    register = load_risk_register()

    report: dict[str, Any] = {
        "week": _iso_week(),
        "generated_at": date.today().isoformat(),
        "municipio_id": municipio_id,
        "gate_actual": gate_actual,
        "gate_estado": gate_estado,
        "dias_proximo_gate": dias_proximo_gate,
        "cpi": evm_block["cpi"],
        "spi": evm_block["spi"],
        "eac": evm_block["eac"],
        "tcpi": evm_block.get("tcpi"),
        "vac": evm_block.get("vac"),
        "semaforo": evm_block["semaforo"],
        "evm_fuente": evm_fuente,
        "evm_detalle": evm_block,
        "riesgos_rojos": riesgos_rojos,
        "riesgos_total": len(register),
        "gate_alertas": check_gate_alerts(),
        "precios_alertas": precios_alertas,
        "precios_check": precios_check,
        "alertas_consolidadas": get_all_active_alerts(),
        "datos_faltantes": datos_faltantes,
    }
    return report


def persist_weekly_status(report: dict[str, Any]) -> Path:
    """Guarda reporte en data/planning/reports/ y weekly_status_latest.json."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    LATEST_PATH.parent.mkdir(parents=True, exist_ok=True)

    week = report.get("week", _iso_week())
    report_path = REPORTS_DIR / f"weekly_{week}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)

    with open(LATEST_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)

    logger.info("weekly_status_persisted path=%s", report_path)
    return report_path


def load_latest_weekly_status() -> dict[str, Any] | None:
    if not LATEST_PATH.exists():
        return None
    with open(LATEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
