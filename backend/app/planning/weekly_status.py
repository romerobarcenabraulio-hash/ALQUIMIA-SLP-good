"""Reporte semanal KRONOS — weekly_status (CPI/SPI, gates, riesgos, precios)."""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.planning.budget.evm_integration import resolve_evm_for_weekly
from app.planning.financial_model.material_prices import check_all_precios, get_precio_ancla
from app.planning.risk.alert_engine import get_all_active_alerts
from app.planning.risk.risk_register import get_risks_by_status, load_risk_register
from app.planning.scheduling.gate_tracker import check_gate_alerts, get_current_gate, load_gate_status

logger = logging.getLogger(__name__)

_DATA_ROOT = Path(__file__).resolve().parents[4] / "data" / "planning"
REPORTS_DIR = _DATA_ROOT / "reports"
LATEST_PATH = _DATA_ROOT / "weekly_status_latest.json"


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


def build_weekly_status(
    *,
    municipio_id: str | None = None,
    db: Session | None = None,
    precios_mercado: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Construye reporte semanal al formato kronos.md."""
    gate_actual = get_current_gate() or "G5"
    gate_estado, dias_proximo_gate = _gate_estado_y_dias(gate_actual)
    evm_block, evm_fuente, datos_faltantes, evm_meta = resolve_evm_for_weekly(db, municipio_id)

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
        "evm_integracion": evm_meta,
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
