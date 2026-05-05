"""
Fase 5 — Algoritmo de colocación greedy con degradación honesta.

Regla de causalidad (Doctrina §4):
  volumen capturable
    → compradores ordenados por confianza/status/distancia
    → asignación hasta agotar capacidad
    → faltante si no hay suficiente capacidad
    → descuento por riesgo según tipo de faltante y fuente
    → ingreso_ajustado = ingreso_potencial × (1 − descuento)
    → PlacementPlan con advertencias explícitas

Descuentos acumulativos (se suman, cap en 95 %):
  - todos compradores son benchmark:            +20 %
  - algún comprador es manual_usuario:          +30 %
  - faltante entre 1 % y 50 %:                 proporcional al faltante (max +25 %)
  - faltante > 50 %:                            +35 %
  - sin comprador (0 % colocado):              ingreso_ajustado = 0 directamente

Riesgo resultante:
  - sin comprador → critico
  - faltante > 50 % → alto
  - faltante 1–50 % o todos benchmark → medio
  - 100 % colocado + algún verificado/directorio → bajo
  - 100 % colocado + todos benchmark → medio
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.market.schemas import (
    BuyerStatus,
    EstadoColocacion,
    FuenteTipoMarket,
    MaterialBuyer,
    MarketSummary,
    PlacementAllocation,
    PlacementPlan,
    RiesgoMercado,
)
from app.market.registry import REGISTRY_WARNING


# ─── Ordenamiento de compradores ─────────────────────────────────────────────

_STATUS_PRIORITY: Dict[BuyerStatus, int] = {
    BuyerStatus.verificado:             0,
    BuyerStatus.pendiente_verificacion: 1,
    BuyerStatus.estimado:               2,
    BuyerStatus.manual:                 3,
    BuyerStatus.inactivo:               99,
}


def _sort_key(b: MaterialBuyer):
    """Ordenar: mejor status primero, luego mayor confianza, luego menor distancia."""
    return (
        _STATUS_PRIORITY.get(b.status, 10),
        -b.confianza,
        b.distancia_km if b.distancia_km is not None else 9999.0,
    )


# ─── Cálculo de riesgo y descuento ───────────────────────────────────────────

def _calcular_descuento_y_riesgo(
    pct_colocado: float,
    todos_benchmark: bool,
    tiene_manual: bool,
    advertencias: List[str],
) -> tuple[float, RiesgoMercado]:
    """
    Retorna (descuento_pct 0–100, RiesgoMercado).
    El descuento es acumulativo; se aplica sobre ingreso_potencial.
    """
    if pct_colocado == 0:
        advertencias.append("Sin compradores disponibles: ingreso ajustado = $0.")
        return 100.0, RiesgoMercado.critico

    descuento = 0.0

    if todos_benchmark:
        descuento += 20.0
        advertencias.append(
            "Todos los compradores son de tipo benchmark o estimado: descuento 20 %."
        )

    if tiene_manual:
        descuento += 30.0
        advertencias.append(
            "Hay compradores de tipo manual_usuario no verificados: descuento adicional 30 %."
        )

    faltante_pct = 100.0 - pct_colocado
    if faltante_pct > 50.0:
        descuento += 35.0
        advertencias.append(
            f"Faltante superior al 50 % ({faltante_pct:.1f} %): descuento adicional 35 %."
        )
        riesgo = RiesgoMercado.alto
    elif faltante_pct > 0.0:
        desc_prop = faltante_pct / 100.0 * 25.0   # proporcional, máx 25 %
        descuento += desc_prop
        advertencias.append(
            f"Faltante parcial ({faltante_pct:.1f} %): descuento proporcional {desc_prop:.1f} %."
        )
        riesgo = RiesgoMercado.medio
    else:
        # 100 % colocado
        if todos_benchmark:
            riesgo = RiesgoMercado.medio
        else:
            riesgo = RiesgoMercado.bajo

    descuento = min(descuento, 95.0)
    return descuento, riesgo


def _estado_colocacion(
    pct_colocado: float,
    todos_benchmark: bool,
) -> EstadoColocacion:
    if pct_colocado == 0:
        return EstadoColocacion.sin_mercado
    if todos_benchmark:
        return EstadoColocacion.requiere_verificacion
    if pct_colocado >= 100.0:
        return EstadoColocacion.colocado
    return EstadoColocacion.parcial


# ─── Función principal ────────────────────────────────────────────────────────

def compute_placement(
    material: str,
    vol_ton_anio: float,
    zm: str,
    municipios: List[str],
    buyers: List[MaterialBuyer],
) -> PlacementPlan:
    """
    Calcula el plan de colocación para un material dado el volumen disponible
    y la lista de compradores elegibles.

    El algoritmo es greedy: asigna en orden de prioridad hasta agotar volumen
    o compradores. No optimiza precios (MVP — trazabilidad primero).

    Args:
        material:       clave de material ("pet", "papel", ...)
        vol_ton_anio:   volumen capturable anual en toneladas
        zm:             clave de ZM
        municipios:     lista de municipios activos
        buyers:         compradores elegibles (ya filtrados por material)

    Returns:
        PlacementPlan con causalidad completa
    """
    advertencias: List[str] = [REGISTRY_WARNING]
    provenance: Dict[str, Any] = {
        "material":          material,
        "zm":                zm,
        "vol_input_ton":     vol_ton_anio,
        "n_buyers_evaluados": len(buyers),
        "algoritmo":         "greedy_fase5_mvp",
    }

    if vol_ton_anio <= 0:
        return PlacementPlan(
            zm=zm,
            municipios=municipios,
            material=material,
            volumen_ton_anio=vol_ton_anio,
            colocado_ton_anio=0.0,
            faltante_ton_anio=0.0,
            pct_colocado=0.0,
            precio_promedio_mxn_kg=0.0,
            ingreso_potencial_mxn=0.0,
            ingreso_ajustado_mxn=0.0,
            descuento_aplicado_pct=0.0,
            riesgo_mercado=RiesgoMercado.critico,
            estado_colocacion=EstadoColocacion.sin_mercado,
            compradores_considerados=0,
            advertencias=["Volumen capturable = 0. No hay material que colocar."],
            provenance=provenance,
        )

    # ── Ordenar compradores ───────────────────────────────────────────────────
    buyers_activos = [b for b in buyers if b.status != BuyerStatus.inactivo]
    buyers_activos.sort(key=_sort_key)

    # ── Asignación greedy ─────────────────────────────────────────────────────
    vol_restante        = vol_ton_anio
    allocations: List[PlacementAllocation] = []
    vol_precio_sum      = 0.0  # para precio ponderado
    todos_benchmark     = True
    tiene_manual        = False

    for buyer in buyers_activos:
        if vol_restante <= 0:
            break

        asignar = min(buyer.capacidad_disponible_ton_anio, vol_restante)
        if asignar <= 0:
            continue

        precio = buyer.precio_medio_mxn_kg()
        ingreso_alloc = asignar * precio * 1000.0   # ton → kg → MXN

        alloc = PlacementAllocation(
            buyer_id=buyer.buyer_id,
            nombre_comprador=buyer.nombre,
            material=material,
            volumen_asignado_ton_anio=asignar,
            precio_mxn_kg=precio,
            ingreso_estimado_mxn=ingreso_alloc,
            calidad_requerida=buyer.calidad_requerida,
            fuente_tipo=buyer.fuente_tipo,
            confianza=buyer.confianza,
            riesgo=RiesgoMercado.medio,   # se recalcula con contexto global abajo
        )
        allocations.append(alloc)
        vol_restante   -= asignar
        vol_precio_sum += asignar * precio

        # Rastrear tipos de fuente
        if buyer.fuente_tipo not in (
            FuenteTipoMarket.benchmark,
            FuenteTipoMarket.fallback,
            FuenteTipoMarket.manual_usuario,
        ):
            todos_benchmark = False
        if buyer.fuente_tipo == FuenteTipoMarket.manual_usuario:
            tiene_manual = True

    # ── Métricas de colocación ────────────────────────────────────────────────
    colocado_ton    = vol_ton_anio - vol_restante
    faltante_ton    = vol_restante
    pct_colocado    = (colocado_ton / vol_ton_anio * 100.0) if vol_ton_anio > 0 else 0.0

    if colocado_ton > 0:
        precio_promedio = vol_precio_sum / colocado_ton
    else:
        # Sin colocación: usar el promedio de buyers disponibles como referencia
        if buyers_activos:
            precio_promedio = sum(b.precio_medio_mxn_kg() for b in buyers_activos) / len(buyers_activos)
        else:
            precio_promedio = 0.0

    ingreso_potencial = vol_ton_anio * precio_promedio * 1000.0

    # ── Descuento y riesgo ────────────────────────────────────────────────────
    if not allocations:
        todos_benchmark = True   # sin compradores = máximo riesgo

    descuento_pct, riesgo = _calcular_descuento_y_riesgo(
        pct_colocado=pct_colocado,
        todos_benchmark=todos_benchmark,
        tiene_manual=tiene_manual,
        advertencias=advertencias,
    )

    if descuento_pct >= 100.0:
        ingreso_ajustado = 0.0
    else:
        ingreso_ajustado = ingreso_potencial * (1.0 - descuento_pct / 100.0)

    # Actualizar riesgo individual de cada allocation al riesgo global
    for alloc in allocations:
        alloc.riesgo = riesgo

    estado = _estado_colocacion(pct_colocado, todos_benchmark)

    provenance["colocado_ton"]    = colocado_ton
    provenance["faltante_ton"]    = faltante_ton
    provenance["descuento_pct"]   = descuento_pct
    provenance["todos_benchmark"] = todos_benchmark

    return PlacementPlan(
        zm=zm,
        municipios=municipios,
        material=material,
        volumen_ton_anio=vol_ton_anio,
        colocado_ton_anio=colocado_ton,
        faltante_ton_anio=faltante_ton,
        pct_colocado=pct_colocado,
        precio_promedio_mxn_kg=precio_promedio,
        ingreso_potencial_mxn=ingreso_potencial,
        ingreso_ajustado_mxn=ingreso_ajustado,
        descuento_aplicado_pct=descuento_pct,
        riesgo_mercado=riesgo,
        estado_colocacion=estado,
        allocations=allocations,
        compradores_considerados=len(buyers_activos),
        advertencias=advertencias,
        provenance=provenance,
    )


# ─── Resumen global ───────────────────────────────────────────────────────────

def compute_market_summary(
    zm: str,
    planes: Dict[str, PlacementPlan],
) -> MarketSummary:
    """
    Agrega los PlacementPlan de todos los materiales en un MarketSummary.
    Los totales son la suma directa de los planes — no se re-estima nada.
    """
    total_vol        = sum(p.volumen_ton_anio    for p in planes.values())
    total_colocado   = sum(p.colocado_ton_anio   for p in planes.values())
    total_faltante   = sum(p.faltante_ton_anio   for p in planes.values())
    total_potencial  = sum(p.ingreso_potencial_mxn for p in planes.values())
    total_ajustado   = sum(p.ingreso_ajustado_mxn  for p in planes.values())
    descuento_total  = total_potencial - total_ajustado
    pct_global       = (total_colocado / total_vol * 100.0) if total_vol > 0 else 0.0

    warnings: List[str] = [REGISTRY_WARNING]
    materiales_criticos = [
        mat for mat, p in planes.items()
        if p.riesgo_mercado == RiesgoMercado.critico
    ]
    if materiales_criticos:
        warnings.append(
            f"Materiales sin colocación (riesgo crítico): {', '.join(materiales_criticos)}."
        )

    return MarketSummary(
        zm=zm,
        total_volumen_ton_anio=total_vol,
        total_colocado_ton_anio=total_colocado,
        total_faltante_ton_anio=total_faltante,
        pct_colocado_global=pct_global,
        ingresos_potenciales_mxn=total_potencial,
        ingresos_ajustados_mxn=total_ajustado,
        descuento_por_riesgo_mxn=descuento_total,
        planes_por_material=planes,
        warnings=warnings,
    )
