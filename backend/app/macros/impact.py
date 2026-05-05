"""Motor de impacto causal para macrogeneradores."""
from __future__ import annotations

import math
from typing import Dict, List

from app.macros.estimator import check_required_variables, estimate_volume
from app.macros.registry import REGISTRY_WARNING
from app.macros.schemas import (
    FuenteTipoMacro,
    MacroGenerator,
    MacroGeneratorPlan,
    MacroImpactSummary,
    MacroStatus,
    MacroTipo,
    RiesgoOperativo,
)
from app.market.placement import compute_market_summary, compute_placement
from app.market.registry import get_buyers


_UNTRUSTED_SOURCE_TYPES = {
    FuenteTipoMacro.manual_usuario,
    FuenteTipoMacro.benchmark_sectorial,
    FuenteTipoMacro.estimado_modelo,
    FuenteTipoMacro.fallback,
}


def _apply_estimation(generator: MacroGenerator, warnings: List[str]) -> MacroGenerator:
    if generator.variables_tipo:
        variables = generator.variables_tipo.datos or {}
        missing = check_required_variables(generator.tipo, variables)
        generator.variables_tipo.variables_faltantes = missing
        if missing and generator.status == MacroStatus.verificado:
            generator.status = MacroStatus.pendiente_verificacion
        if missing:
            warnings.append(
                f"{generator.generator_id}: faltan variables {', '.join(missing)} para estimar volumen."
            )
            return generator

        calc = estimate_volume(generator.tipo, variables)
        generator.calculo_volumen = calc
        generator.es_temporal = calc.es_temporal
        generator.excluir_del_conteo_domiciliario = True
        ton_dia_estimado = (calc.incertidumbre_rango[0] + calc.incertidumbre_rango[1]) / 2.0
        generator.generacion_estimada_ton_dia = round(ton_dia_estimado, 4)

        if calc.es_temporal:
            eventos_mes = float(variables.get("eventos_mes") or variables.get("eventos", 0) or 1)
            generator.dias_operacion_anio = max(1, int(eventos_mes * 12))

        if generator.tipo == MacroTipo.hospital and variables.get("tiene_residuos_regulados"):
            generator.residuos_regulados_detectados = ["biologico_infeccioso"]
            generator.advertencia_residuos_regulados = (
                "ALQUIMIA orienta RSU; residuos biológico-infecciosos requieren proveedor autorizado conforme NOM-087."
            )
        if generator.tipo == MacroTipo.parque_industrial and variables.get("tiene_residuos_regulados"):
            generator.residuos_regulados_detectados = ["residuo_regulado"]
            generator.advertencia_residuos_regulados = (
                "Residuos regulados requieren proveedor autorizado; no tratarlos como RSU ordinario."
            )
        if generator.residuos_regulados_detectados:
            warnings.append(generator.advertencia_residuos_regulados)
    return generator


def _round_materials(volumes: Dict[str, float]) -> Dict[str, float]:
    return {k: round(v, 3) for k, v in sorted(volumes.items()) if abs(v) > 0.0001}


def _seasonality_factor(generator: MacroGenerator) -> float:
    values = generator.estacionalidad_mensual or [1.0] * 12
    if len(values) != 12:
        return 1.0
    return sum(values) / 12.0


def _annual_tons(generator: MacroGenerator) -> float:
    return (
        generator.generacion_estimada_ton_dia
        * generator.dias_operacion_anio
        * _seasonality_factor(generator)
    )


def _recoverable_by_material(generator: MacroGenerator, ton_anio: float) -> Dict[str, float]:
    recovery_factor = (generator.separacion_potencial_pct / 100.0) * (generator.pureza_estimada_pct / 100.0)
    result: Dict[str, float] = {}
    for material, pct in generator.composicion.items():
        result[material.lower()] = result.get(material.lower(), 0.0) + ton_anio * float(pct) * recovery_factor
    return result


def _build_plan(generator: MacroGenerator, ton_anio: float, recoverable_total: float, warnings: List[str]) -> MacroGeneratorPlan:
    ton_dia = ton_anio / generator.dias_operacion_anio if generator.dias_operacion_anio else 0.0
    contenedores = {
        "organico": max(1, math.ceil(ton_dia * generator.composicion.get("organico", 0.0) / 0.8)),
        "reciclables": max(1, math.ceil(ton_dia * 0.6 / 0.7)),
    }

    advertencias: List[str] = []
    riesgo = RiesgoOperativo.medio
    ruta = None
    if generator.tiene_ubicacion():
        ruta = f"Ruta dedicada sugerida para {generator.nombre} ({generator.lat:.4f},{generator.lon:.4f})."
        riesgo = RiesgoOperativo.medio if generator.fuente_tipo in _UNTRUSTED_SOURCE_TYPES else RiesgoOperativo.bajo
    else:
        advertencias.append("Sin lat/lon: no se puede prometer ruta especifica; solo impacto agregado.")
        riesgo = RiesgoOperativo.alto

    if generator.fuente_tipo in _UNTRUSTED_SOURCE_TYPES or generator.status in (
        MacroStatus.estimado,
        MacroStatus.manual,
        MacroStatus.pendiente_verificacion,
    ):
        advertencias.append(
            f"Fuente {generator.fuente_tipo.value} con status {generator.status.value}: requiere verificacion."
        )

    warnings.extend(advertencias)

    costo_logistico = recoverable_total * 450.0
    ingreso_estimado = recoverable_total * 900.0

    return MacroGeneratorPlan(
        generator_id=generator.generator_id,
        acciones=[
            "Levantar convenio operativo con responsable del inmueble.",
            "Separar organicos y reciclables limpios desde origen.",
        ],
        contenedores=contenedores,
        frecuencia_recoleccion="3-6 veces por semana" if ton_dia >= 2.0 else "1-3 veces por semana",
        ventana_horaria="Fuera de horas pico operativas",
        ruta_sugerida=ruta,
        volumen_recuperable_ton_anio=round(recoverable_total, 3),
        costo_logistico_mxn_anio=round(costo_logistico, 2),
        ingreso_estimado_mxn_anio=round(ingreso_estimado, 2),
        riesgo_operativo=riesgo,
        convenio_requerido=True,
        advertencias=advertencias,
    )


def compute_macro_impact(
    zm: str,
    municipios: List[str],
    generators: List[MacroGenerator],
    recalculate_market: bool = True,
) -> MacroImpactSummary:
    zm_key = (zm or "").upper()
    municipios_key = [m.lower() for m in municipios]
    warnings: List[str] = [REGISTRY_WARNING]
    volumes: Dict[str, float] = {}
    plans: List[MacroGeneratorPlan] = []
    total_ton_anio = 0.0
    used_generators: List[str] = []
    used_generator_models: List[MacroGenerator] = []
    skipped_generators: List[str] = []

    for generator in generators:
        if generator.zm.upper() != zm_key:
            skipped_generators.append(generator.generator_id)
            continue
        if not generator.activo_para_calculo():
            skipped_generators.append(generator.generator_id)
            continue
        if not generator.municipio:
            warnings.append(
                f"{generator.generator_id} no tiene municipio: no entra al calculo municipal."
            )
            skipped_generators.append(generator.generator_id)
            continue
        if municipios_key and generator.municipio.lower() not in municipios_key:
            skipped_generators.append(generator.generator_id)
            continue

        generator = _apply_estimation(generator, warnings)

        ton_anio = _annual_tons(generator)
        recoverable = _recoverable_by_material(generator, ton_anio)
        recoverable_total = sum(recoverable.values())
        for material, value in recoverable.items():
            volumes[material] = volumes.get(material, 0.0) + value
        total_ton_anio += ton_anio
        used_generators.append(generator.generator_id)
        used_generator_models.append(generator)
        plans.append(_build_plan(generator, ton_anio, recoverable_total, warnings))

    rounded_volumes = _round_materials(volumes)
    total_ton_dia = total_ton_anio / 365.0 if total_ton_anio else 0.0
    total_recoverable = sum(rounded_volumes.values())
    costo_incremental = total_recoverable * 450.0
    co2e_incremental = total_recoverable * 0.42

    impacto_market = None
    ingreso_incremental = total_recoverable * 900.0
    if recalculate_market and rounded_volumes:
        market_planes = {}
        for material, volume in rounded_volumes.items():
            buyers = get_buyers(material=material, zm=zm_key)
            market_planes[material] = compute_placement(
                material=material,
                vol_ton_anio=volume,
                zm=zm_key,
                municipios=municipios_key,
                buyers=buyers,
            )
        market_summary = compute_market_summary(zm_key, market_planes)
        ingreso_incremental = market_summary.ingresos_ajustados_mxn
        impacto_market = market_summary.model_dump()
        warnings.extend(market_summary.warnings)

    camion_cap_ton_dia = 6.0
    viajes_dia = total_ton_dia / camion_cap_ton_dia if total_ton_dia else 0.0
    impacto_camiones = {
        "ton_dia_incremental": round(total_ton_dia, 3),
        "capacidad_camion_ton_dia": camion_cap_ton_dia,
        "viajes_dia_equivalentes": round(viajes_dia, 3),
        "camiones_adicionales_sugeridos": math.ceil(viajes_dia) if viajes_dia > 0 else 0,
    }
    impacto_cas = {
        "volumen_recuperable_ton_anio": round(total_recoverable, 3),
        "ca_adicional_si_capacidad_menor_ton_anio": round(total_recoverable, 3),
        "recomendacion": "Revisar capacidad de CA antes de prometer captura incremental.",
    }

    return MacroImpactSummary(
        zm=zm_key,
        municipios=municipios_key,
        generators_count=len(used_generators),
        total_ton_dia=round(total_ton_dia, 3),
        total_ton_anio=round(total_ton_anio, 3),
        volumen_por_material=rounded_volumes,
        impacto_camiones=impacto_camiones,
        impacto_cas=impacto_cas,
        impacto_market=impacto_market,
        ingreso_incremental_mxn=round(ingreso_incremental, 2),
        costo_incremental_mxn=round(costo_incremental, 2),
        co2e_incremental_ton=round(co2e_incremental, 3),
        warnings=list(dict.fromkeys(warnings)),
        provenance={
            "algoritmo": "macro_impact_fase6_mvp",
            "formula_ton_anio": "ton_dia * dias_operacion_anio * promedio_estacionalidad",
            "formula_recuperable": "ton_material * separacion_potencial_pct * pureza_estimada_pct",
            "generators_usados": used_generators,
            "generators_omitidos": skipped_generators,
            "market_recalculado": bool(impacto_market),
        },
        plans=plans,
        generators=used_generator_models,
    )

