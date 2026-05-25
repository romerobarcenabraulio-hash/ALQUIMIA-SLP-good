"""Indicadores de eficiencia AURUM — decimal.Decimal, semáforos."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from modules.planning.budget.schemas import (
    CostStructure,
    EfficiencyIndicators,
    NonQualityCosts,
    Semaforo,
    _d,
)

# Umbral costo/ton — referencia operación ZM SLP Año 3
UMBRAL_COSTO_TON_MXN = _d("850")
ALERTA_NO_CALIDAD_PCT = _d("0.05")
ALERTA_ROJA_NO_CALIDAD_PCT = _d("0.08")

Q2 = Decimal("0.01")


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(Q2, rounding=ROUND_HALF_UP)


def semaforo_costo_ton(costo_por_tonelada: Decimal, umbral: Decimal = UMBRAL_COSTO_TON_MXN) -> Semaforo:
    if costo_por_tonelada <= umbral:
        return "VERDE"
    if costo_por_tonelada <= umbral * _d("1.20"):
        return "AMARILLO"
    return "ROJO"


def calculate_efficiency_indicators(
    *,
    costo_logistico_total: Decimal,
    tonelaje_total: Decimal,
    opex_mes: Decimal,
    viviendas_activas: int,
    capex_total: Decimal,
    ebitda_anual: Decimal,
    no_calidad: NonQualityCosts,
    ingreso_bruto: Decimal,
    umbral_costo_ton: Decimal = UMBRAL_COSTO_TON_MXN,
) -> EfficiencyIndicators:
    if tonelaje_total > 0:
        costo_por_tonelada = _quantize(costo_logistico_total / tonelaje_total)
    else:
        costo_por_tonelada = Decimal("0")

    if viviendas_activas > 0:
        costo_por_vivienda = _quantize(opex_mes / _d(viviendas_activas))
    else:
        costo_por_vivienda = Decimal("0")

    if ebitda_anual > 0:
        payback = _quantize(capex_total / ebitda_anual)
    else:
        payback = Decimal("999.99")

    if ingreso_bruto > 0:
        costo_no_calidad_pct = _quantize(no_calidad.total / ingreso_bruto)
    else:
        costo_no_calidad_pct = Decimal("0")

    return EfficiencyIndicators(
        costo_por_tonelada=costo_por_tonelada,
        costo_por_vivienda=costo_por_vivienda,
        payback_simple_anios=payback,
        costo_no_calidad_pct=costo_no_calidad_pct,
        semaforo_costo_ton=semaforo_costo_ton(costo_por_tonelada, umbral_costo_ton),
        alerta_roja_no_calidad=costo_no_calidad_pct > ALERTA_ROJA_NO_CALIDAD_PCT,
    )


def indicators_from_structure(
    structure: CostStructure,
    *,
    costo_logistico_acumulado: Decimal,
    tonelaje_acumulado: Decimal,
    viviendas_activas: int = 224_000,
    ebitda_anual: Decimal = _d("85000000"),
    ingreso_bruto_anual: Decimal = _d("361000000"),
) -> EfficiencyIndicators:
    return calculate_efficiency_indicators(
        costo_logistico_total=costo_logistico_acumulado,
        tonelaje_total=tonelaje_acumulado,
        opex_mes=structure.opex_mensual_total,
        viviendas_activas=viviendas_activas,
        capex_total=structure.capex_total,
        ebitda_anual=ebitda_anual,
        no_calidad=structure.no_calidad,
        ingreso_bruto=ingreso_bruto_anual,
    )
