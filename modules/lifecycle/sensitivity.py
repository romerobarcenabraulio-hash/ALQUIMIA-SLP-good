"""Análisis de sensibilidad — 4 variables críticas BIOS."""
from __future__ import annotations

import json
from datetime import datetime

from modules.lifecycle.financial_model import _build_scenario

SENSITIVITY_SPECS = [
    ("precio_materiales", "precios_scale", [-0.30, 0.0, 0.30]),
    ("participacion_ciudadana", "pct_captura_scale", [-0.20, 0.0, 0.20]),
    ("combustible_logistica", "fuel_opex_scale", [-0.50, 0.0, 0.50]),
    ("wacc", "wacc_delta_pct", [-0.20, 0.0, 0.20]),
]


def _scale_captura(base: list[float], delta_pct: float) -> list[float]:
    return [min(100.0, max(5.0, v * (1 + delta_pct))) for v in base]


def run_sensitivity() -> dict:
    from modules.lifecycle.financial_model import CAPTURA_MODELO_BASED, WACC_DEF

    _, base_vpn, base_tir, *_ = _build_scenario()
    escenarios = []

    for var_name, kind, deltas in SENSITIVITY_SPECS:
        for delta in deltas:
            if kind == "precios_scale":
                _, vpn, tir, *_ = _build_scenario(precios_scale=1 + delta)
            elif kind == "pct_captura_scale":
                _, vpn, tir, *_ = _build_scenario(
                    pct_captura=_scale_captura(CAPTURA_MODELO_BASED, delta)
                )
            elif kind == "fuel_opex_scale":
                _, vpn, tir, *_ = _build_scenario(fuel_opex_scale=1 + delta)
            else:
                wacc_new = WACC_DEF * 100 * (1 + delta)
                _, vpn, tir, *_ = _build_scenario(wacc_pct=wacc_new)

            delta_vpn = ((vpn - base_vpn) / abs(base_vpn) * 100) if base_vpn else 0.0
            escenarios.append(
                {
                    "variable": var_name,
                    "base": round(base_vpn, 2),
                    "delta_pct": round(delta * 100, 1),
                    "vpn_mxn": round(vpn, 2),
                    "tir_pct": round(tir, 2),
                    "delta_vpn_pct": round(delta_vpn, 2),
                }
            )

    return {
        "generado_en": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "variables": [s[0] for s in SENSITIVITY_SPECS],
        "base_vpn_mxn": round(base_vpn, 2),
        "base_tir_pct": round(base_tir, 2),
        "escenarios": escenarios,
    }


def persist_sensitivity(report: dict, path) -> None:
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
