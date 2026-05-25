"""
Alert Engine — Consolida todas las alertas activas de KRONOS.

Agrega: alertas de gates, riesgos en ROJO, riesgos sin owner, riesgos sin revisión.
"""
from __future__ import annotations

import logging
from typing import List

logger = logging.getLogger(__name__)


def get_all_active_alerts() -> List[dict]:
    """
    Recopila y consolida todas las alertas activas del sistema KRONOS.

    Returns:
        Lista de dicts: {tipo, severidad, mensaje, referencia}
        severidad: "CRITICO" | "ROJO" | "NARANJA" | "AMARILLO"
    """
    from app.planning.scheduling.gate_tracker import check_gate_alerts
    from app.planning.risk.risk_register import (
        get_risks_by_status,
        get_risks_without_owner,
        get_stale_risks,
    )

    alerts: List[dict] = []

    try:
        gate_alerts = check_gate_alerts()
        for alert in gate_alerts:
            alerts.append({
                "tipo": "gate",
                "severidad": alert["nivel_alerta"],
                "mensaje": alert["accion_requerida"],
                "referencia": alert["gate_id"],
                "descripcion": alert.get("descripcion", ""),
            })
    except Exception as exc:
        logger.error(f"alert_engine gate_check_failed: {exc}")

    try:
        sin_owner = set(get_risks_without_owner())
        rojos = get_risks_by_status("ROJO")
        for r in rojos:
            rid = r["id"]
            msg = f"Riesgo {rid} (score {r['score']}) en ROJO: {r['descripcion']}"
            if rid in sin_owner:
                msg += " — SIN OWNER ASIGNADO"
            alerts.append({
                "tipo": "riesgo_rojo",
                "severidad": "ROJO",
                "mensaje": msg,
                "referencia": rid,
            })
    except Exception as exc:
        logger.error(f"alert_engine risk_rojo_failed: {exc}")

    try:
        stale = get_stale_risks(days_threshold=14)
        for rid in stale:
            alerts.append({
                "tipo": "riesgo_stale",
                "severidad": "AMARILLO",
                "mensaje": f"Riesgo {rid} con score >= 6 sin revisión en más de 14 días.",
                "referencia": rid,
            })
    except Exception as exc:
        logger.error(f"alert_engine stale_risk_failed: {exc}")

    try:
        from app.planning.financial_model.material_prices import check_all_precios, get_precio_ancla

        precios = {}
        for material in ("PET", "papel_carton", "vidrio", "aluminio"):
            precio, _ = get_precio_ancla(material)
            precios[material] = precio
        for r in check_all_precios(precios):
            if r["alerta"]:
                alerts.append({
                    "tipo": "precio_material",
                    "severidad": "ROJO" if abs(r["desviacion_pct"]) > 20 else "AMARILLO",
                    "mensaje": r["mensaje"],
                    "referencia": r["material"],
                    "desviacion_pct": r["desviacion_pct"],
                })
    except Exception as exc:
        logger.error(f"alert_engine material_prices_failed: {exc}")

    return alerts
