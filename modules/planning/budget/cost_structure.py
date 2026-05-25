"""Estructura CAPEX/OPEX/no-calidad con decimal.Decimal."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from modules.planning.budget.schemas import CostLine, CostStructure, NonQualityCosts, _d

# Baselines AURUM — cursor-rules/aurum.md + Modelo_BASED.xlsx (Fase 0-1)
RECICLADORA_UNIT_MXN = _d("16200000")
RECICLADORAS_COUNT = 5
CA_PEQUENO_MXN = _d("930044")
CA_MEDIANO_MXN = _d("3256972")
CA_GRANDE_MXN = _d("8467384")

# Distribución referencia 18 CAs: 8P + 7M + 3G (ajustable por escenario)
DEFAULT_CA_MIX = {"P": 8, "M": 7, "G": 3}

# OPEX mensual por categoría (referencia CA mediano × mix simplificado)
OPEX_NOMINA_MES = _d("234225")
OPEX_COMBUSTIBLE_MES = _d("13550")  # transporte + gas LP
OPEX_MANTENIMIENTO_MES = _d("5274")
OPEX_ENERGIA_MES = _d("15767")
OPEX_APIS_MES = _d("8500")

# No-calidad — tarifas ancla
PRECIO_MATERIAL_PROM_MXN_TON = _d("2500")
PRECIO_ANCLA_RECHAZO_MXN_TON = _d("1800")
COSTO_HORA_VEHICULO_MXN = _d("185")
COSTO_TON_RELLENO_MXN = _d("420")


def build_capex_lines(
    *,
    n_recicladoras: int = RECICLADORAS_COUNT,
    ca_mix: dict[str, int] | None = None,
) -> tuple[CostLine, ...]:
    mix = ca_mix or DEFAULT_CA_MIX
    lines: list[CostLine] = []

    for i in range(1, n_recicladoras + 1):
        lines.append(
            CostLine(
                concepto=f"recicladora_{i:02d}",
                categoria="CAPEX",
                monto_mxn=RECICLADORA_UNIT_MXN,
                componente="recicladoras",
                fuente="aurum_baseline_16.2M_por_unidad",
                notas="Curva S por recicladora individual",
            )
        )

    tier_map = {"P": (CA_PEQUENO_MXN, "pequeno"), "M": (CA_MEDIANO_MXN, "mediano"), "G": (CA_GRANDE_MXN, "grande")}
    for tier, (monto, label) in tier_map.items():
        count = mix.get(tier, 0)
        for i in range(1, count + 1):
            lines.append(
                CostLine(
                    concepto=f"centro_acopio_{label}_{i:02d}",
                    categoria="CAPEX",
                    monto_mxn=monto,
                    componente="centros_acopio",
                    fuente="aurum_baseline_tier",
                    notas=f"CA {label.upper()} — rango $7.5-30M según UV",
                )
            )

    lines.append(
        CostLine(
            concepto="sistema_digital",
            categoria="CAPEX",
            monto_mxn=_d("4500000"),
            componente="digital",
            fuente="supuesto_editable",
            notas="Plataforma, sensores, integración — por definir en contrato",
        )
    )
    lines.append(
        CostLine(
            concepto="flota_recolectores",
            categoria="CAPEX",
            monto_mxn=_d("12500000"),
            unidad="flota",
            componente="flota",
            fuente="supuesto_editable",
            notas="Flota heterogénea — desglose por vehículo en fase operativa",
        )
    )
    return tuple(lines)


def build_opex_lines() -> tuple[CostLine, ...]:
    return (
        CostLine(
            concepto="logistica_combustible",
            categoria="OPEX",
            monto_mxn=OPEX_COMBUSTIBLE_MES,
            periodicidad="mensual",
            fuente="feed_hermes",
            notas="Combustible + transporte — actualizado diario vía HERMES",
        ),
        CostLine(
            concepto="nomina_directa",
            categoria="OPEX",
            monto_mxn=OPEX_NOMINA_MES,
            periodicidad="quincenal",
            fuente="sistema_rrhh",
        ),
        CostLine(
            concepto="mantenimiento",
            categoria="OPEX",
            monto_mxn=OPEX_MANTENIMIENTO_MES,
            periodicidad="por_evento",
            fuente="ordenes_trabajo",
        ),
        CostLine(
            concepto="energia_servicios",
            categoria="OPEX",
            monto_mxn=OPEX_ENERGIA_MES,
            periodicidad="mensual",
            fuente="facturas_cfe",
        ),
        CostLine(
            concepto="apis_servicios_digitales",
            categoria="OPEX",
            monto_mxn=OPEX_APIS_MES,
            periodicidad="mensual",
            fuente="facturas",
        ),
    )


def compute_non_quality_costs(
    *,
    peso_origen_ton: Decimal,
    peso_recicladora_ton: Decimal,
    ton_rechazadas: Decimal,
    horas_inactivas: Decimal,
    ton_no_valorizadas: Decimal,
) -> NonQualityCosts:
    delta_peso = max(peso_origen_ton - peso_recicladora_ton, Decimal("0"))
    return NonQualityCosts(
        merma_logistica=delta_peso * PRECIO_MATERIAL_PROM_MXN_TON,
        rechazo_contaminacion=ton_rechazadas * PRECIO_ANCLA_RECHAZO_MXN_TON,
        tiempo_muerto_flota=horas_inactivas * COSTO_HORA_VEHICULO_MXN,
        costo_relleno_evitable=ton_no_valorizadas * COSTO_TON_RELLENO_MXN,
    )


def build_cost_structure(
    municipio_id: str,
    *,
    fecha: date | None = None,
    ca_mix: dict[str, int] | None = None,
    n_recicladoras: int = RECICLADORAS_COUNT,
    no_calidad_inputs: dict[str, Decimal] | None = None,
    supuesto_base: str = "Modelo_BASED.xlsx · Fase 0-1 · ZM SLP",
) -> CostStructure:
    nc = no_calidad_inputs or {}
    no_calidad = compute_non_quality_costs(
        peso_origen_ton=nc.get("peso_origen_ton", Decimal("0")),
        peso_recicladora_ton=nc.get("peso_recicladora_ton", Decimal("0")),
        ton_rechazadas=nc.get("ton_rechazadas", Decimal("0")),
        horas_inactivas=nc.get("horas_inactivas", Decimal("0")),
        ton_no_valorizadas=nc.get("ton_no_valorizadas", Decimal("0")),
    )
    return CostStructure(
        capex_lines=build_capex_lines(n_recicladoras=n_recicladoras, ca_mix=ca_mix),
        opex_lines=build_opex_lines(),
        no_calidad=no_calidad,
        municipio_id=municipio_id,
        fecha=fecha or date.today(),
        supuesto_base=supuesto_base,
    )
