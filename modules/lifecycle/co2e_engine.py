"""Motor CO2e evitadas por fracción — GRI 305."""
from __future__ import annotations

import json
from datetime import date, datetime

from modules.lifecycle.co2e_fallback import scenario_tonelaje_anual
from modules.lifecycle.hermes_consumer import (
    load_latest_hermes_summary,
    tonelaje_from_hermes,
)
from modules.lifecycle.lca_factors import factor_map, load_lca_factors
from modules.lifecycle.paths import co2e_latest_path
from modules.lifecycle.schemas import Co2eByFraction, Co2eReport


def _annualize_daily(tonelaje_dia: dict[str, float], dias: int = 300) -> dict[str, float]:
    return {k: round(v * dias, 4) for k, v in tonelaje_dia.items()}


def calcular_co2e(
    tonelaje_por_fraccion: dict[str, float],
    *,
    periodo: str,
    fuente_tonelaje: str,
    hermes_disponible: bool,
    notas: list[str] | None = None,
) -> Co2eReport:
    factors = factor_map()
    por_fraccion: list[Co2eByFraction] = []
    total_co2e = 0.0
    total_tons = 0.0

    for frac, tons in sorted(tonelaje_por_fraccion.items()):
        if tons <= 0:
            continue
        factor = factors.get(frac)
        if factor is None:
            continue
        co2e = tons * factor.co2e_evitado_ton
        por_fraccion.append(
            Co2eByFraction(
                fraccion=frac,
                toneladas=round(tons, 4),
                co2e_ton=round(co2e, 4),
                factor_aplicado=factor.co2e_evitado_ton,
                fuente_factor=f"{factor.fuente} ({factor.anio_referencia})",
            )
        )
        total_co2e += co2e
        total_tons += tons

    return Co2eReport(
        periodo=periodo,
        generado_en=datetime.utcnow().isoformat(timespec="seconds") + "Z",
        fuente_tonelaje=fuente_tonelaje,
        tonelaje_total=round(total_tons, 4),
        co2e_total_ton=round(total_co2e, 4),
        por_fraccion=por_fraccion,
        hermes_disponible=hermes_disponible,
        notas=notas or [],
    )


def build_co2e_report(*, use_scenario_fallback: bool = True) -> Co2eReport:
    load_lca_factors()
    summary = load_latest_hermes_summary()
    ton_dia, fuente = tonelaje_from_hermes(summary)
    hermes_ok = summary is not None
    notas: list[str] = []

    ton_total_dia = sum(ton_dia.values())
    if ton_total_dia <= 0:
        notas.append("HERMES sin tonelaje registrado — Fase 0-1 sin báscula conectada.")
        if use_scenario_fallback:
            ton_anual = scenario_tonelaje_anual()
            fuente = "modelo_BASED_escenario_base"
            hermes_ok = False
            notas.append("Fallback: volúmenes anuales del escenario Modelo_BASED (ZM SLP, horizonte año 3).")
            periodo = f"{date.today().year}-escenario"
            return calcular_co2e(
                ton_anual,
                periodo=periodo,
                fuente_tonelaje=fuente,
                hermes_disponible=hermes_ok,
                notas=notas,
            )
        periodo = date.today().strftime("%Y-%m")
        return calcular_co2e(
            {},
            periodo=periodo,
            fuente_tonelaje=fuente,
            hermes_disponible=hermes_ok,
            notas=notas + ["CO2e = 0 hasta que HERMES publique tonelaje."],
        )

    ton_anual = _annualize_daily(ton_dia)
    periodo = summary.get("date", date.today().isoformat()) if summary else date.today().isoformat()
    return calcular_co2e(
        ton_anual,
        periodo=str(periodo),
        fuente_tonelaje=fuente,
        hermes_disponible=hermes_ok,
        notas=notas,
    )


def persist_co2e_report(report: Co2eReport) -> None:
    path = co2e_latest_path()
    path.write_text(
        json.dumps(report.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
