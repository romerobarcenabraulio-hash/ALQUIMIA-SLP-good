"""Calculador KPI logístico y semáforo HERMES."""
from __future__ import annotations

from modules.logistics.schemas import DailyRoutePlan, DailySummary, Semaforo, WeightEvent
from modules.logistics.weight_receiver.receiver import aggregate_pureza, aggregate_tonelaje


def _metric_semaforo(value: float, verde_min: float, amarillo_min: float, higher_is_better: bool = True) -> Semaforo:
    if higher_is_better:
        if value >= verde_min:
            return "VERDE"
        if value >= amarillo_min:
            return "AMARILLO"
        return "ROJO"
    if value <= verde_min:
        return "VERDE"
    if value <= amarillo_min:
        return "AMARILLO"
    return "ROJO"


def compute_semaforo(
    *,
    tonelaje_vs_meta_pct: float,
    utilizacion_flota_pct: float,
    on_time_arrivals_pct: float,
    merma_logistica_pct: float,
) -> Semaforo:
    scores = [
        _metric_semaforo(tonelaje_vs_meta_pct, 95.0, 80.0, higher_is_better=True),
        _metric_semaforo(utilizacion_flota_pct, 75.0, 60.0, higher_is_better=True),
        _metric_semaforo(on_time_arrivals_pct, 90.0, 80.0, higher_is_better=True),
        _metric_semaforo(merma_logistica_pct, 3.0, 6.0, higher_is_better=False),
    ]
    if scores.count("ROJO") >= 2:
        return "ROJO"
    if "ROJO" in scores or scores.count("AMARILLO") >= 2:
        return "AMARILLO"
    return "VERDE"


def estimate_costo_logistico_mxn(km_totales: float, camiones: int = 1) -> float:
    """OPEX diario estimado: combustible + operación (Fase 0-1)."""
    costo_km = 8.5  # MXN/km camión recolector
    costo_fijo_camion = 850.0
    return round(km_totales * costo_km + camiones * costo_fijo_camion, 2)


def estimate_emisiones_co2e_kg(km_totales: float, camiones: int = 1) -> float:
    """~0.89 kg CO2e/km diesel recolector (factor conservador)."""
    return round(km_totales * camiones * 0.89, 2)


def build_daily_summary(
    plan: DailyRoutePlan,
    weight_events: list[WeightEvent],
    *,
    meta_tonelaje_dia: float = 45.0,
    camiones: int = 1,
    on_time_arrivals_pct: float = 92.0,
    merma_logistica_pct: float = 2.5,
) -> DailySummary:
    tonelaje = aggregate_tonelaje(weight_events)
    pureza = aggregate_pureza(weight_events)
    ton_total = sum(tonelaje.values())
    ton_vs_meta = (ton_total / meta_tonelaje_dia * 100) if meta_tonelaje_dia > 0 else 0.0
    utilizacion = min(100.0, max(0.0, (plan.duracion_min_totales / (camiones * 480)) * 100))

    incidentes = list(plan.advertencias)
    if ton_total <= 0:
        incidentes.append("Sin tonelaje registrado — Fase 0-1 sin báscula conectada.")
    if not plan.google_available:
        incidentes.append("Plan con heurística territorial; Google Routes no disponible.")

    semaforo = compute_semaforo(
        tonelaje_vs_meta_pct=ton_vs_meta if ton_total > 0 else 100.0,
        utilizacion_flota_pct=utilizacion,
        on_time_arrivals_pct=on_time_arrivals_pct,
        merma_logistica_pct=merma_logistica_pct,
    )

    return DailySummary(
        date=plan.fecha.isoformat(),
        municipio_id=plan.municipio_id,
        zm_id=plan.zm_id,
        tonelaje_por_fraccion=tonelaje,
        costo_logistico_mxn=estimate_costo_logistico_mxn(plan.km_totales, camiones),
        km_totales=plan.km_totales,
        emisiones_co2e_kg=estimate_emisiones_co2e_kg(plan.km_totales, camiones),
        pureza_promedio=pureza,
        semaforo=semaforo,
        incidentes=incidentes,
        meta_tonelaje_dia=meta_tonelaje_dia,
        utilizacion_flota_pct=round(utilizacion, 1),
        on_time_arrivals_pct=on_time_arrivals_pct,
        merma_logistica_pct=merma_logistica_pct,
    )
