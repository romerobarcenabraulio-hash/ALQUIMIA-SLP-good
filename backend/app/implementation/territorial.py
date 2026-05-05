"""Motor de ruta territorial 3/5/7 para Fase 12.2."""
from __future__ import annotations

import math

from app.implementation.schemas import (
    ImplementationSource,
    PilotColony,
    TerritorialCalculationAnnexItem,
    TerritorialImplementationPlan,
    TerritorialPlanRequest,
    TerritorialPlanStatus,
    TerritorialZone,
    ZoneStatus,
)


DEFAULT_SOURCE = ImplementationSource(
    source_id="alquimia-12-2-territorial-seed",
    name="Modelo ALQUIMIA de implementacion territorial",
    organization="ALQUIMIA",
    source_type="propuesta_tecnica_no_oficial",
    confidence=0.58,
    explanation=(
        "Distribuye municipios y colonias piloto propuestas para construir un calendario "
        "inicial. Las colonias no son fuente oficial y deben validarse localmente."
    ),
)

PROPOSED_COLONIES: dict[str, list[str]] = {
    "slp": ["Centro", "Tangamanga", "Industrial Aviacion"],
    "sol": ["Centro Soledad", "San Felipe", "Hogares Ferrocarrileros"],
    "csp": ["Cabecera municipal", "La Zapatilla", "Portezuelo"],
    "vip": ["Cabecera Villa de Pozos", "Jassos", "Las Mercedes"],
    "qro": ["Centro Historico", "Juriquilla", "Epigmenio Gonzalez"],
    "cor": ["El Pueblito", "Candiles", "Tejeda"],
    "mar": ["La Canada", "Zibata", "El Colorado"],
    "hui": ["Cabecera Huimilpan", "El Vegil", "Los Cues"],
    "mty": ["Centro Monterrey", "Cumbres", "Tecnologico"],
    "spg": ["Casco Urbano", "Valle Oriente", "San Angel"],
    "snl": ["Centro San Nicolas", "Anahuac", "Las Puentes"],
    "gua": ["Centro Guadalupe", "Linda Vista", "Contry"],
    "apo": ["Centro Apodaca", "Huinala", "Pueblo Nuevo"],
    "sca": ["Centro Santa Catarina", "La Fama", "Cumbres Santa Catarina"],
    "gar": ["Centro Garcia", "Mitras Poniente", "Valle de Lincoln"],
    "esc": ["Centro Escobedo", "Alianza Real", "Las Encinas"],
    "jua": ["Centro Juarez", "Monte Kristal", "Hacienda San Jose"],
}

PHASES = ["Piloto territorial", "Arranque", "Expansion", "Consolidacion", "Cobertura final"]


def _quarter(month_index: int) -> str:
    year = ((month_index - 1) // 12) + 1
    month_in_year = ((month_index - 1) % 12) + 1
    quarter = ((month_in_year - 1) // 3) + 1
    return f"Anio {year} T{quarter}"


def _zone_count(horizon_years: int, municipios: list[str]) -> int:
    if horizon_years <= 3:
        return min(3, max(1, len(municipios)))
    if horizon_years <= 5:
        return min(5, max(3, len(municipios)))
    return min(5, max(4, len(municipios)))


def _target_for_zone(current: float, target: float, zone_number: int, zone_count: int) -> float:
    step = (target - current) / max(zone_count, 1)
    return round(max(current, current + step * zone_number), 2)


def _capacity_for_mix(available_capacity: float) -> float:
    return round(available_capacity, 2)


def build_territorial_implementation_plan(request: TerritorialPlanRequest) -> TerritorialImplementationPlan:
    source = request.source or DEFAULT_SOURCE
    warnings: list[str] = []
    blockers: list[str] = []

    if request.horizon_years not in (3, 5, 7):
        blockers.append("12.2 solo permite planes ciudadanos de 3, 5 o 7 anios.")

    if not request.municipios:
        blockers.append("Falta seleccionar al menos un municipio para construir zonas territoriales.")

    if request.rsu_total_ton_day <= 0:
        blockers.append("Falta RSU total ton/dia para calcular metas territoriales.")

    if source.confidence <= 0:
        blockers.append("Falta fuente con confianza mayor a cero para calendarizar.")

    if request.target_capture_pct <= request.current_capture_pct:
        warnings.append("La meta no mejora la baseline actual; revisar objetivo antes de calendarizar.")

    final_required_capacity = request.rsu_total_ton_day * request.target_capture_pct / 100
    available_capacity = _capacity_for_mix(request.available_capacity_ton_day)
    if available_capacity < final_required_capacity:
        warnings.append(
            "La capacidad disponible es menor a la captura diaria requerida por la meta final."
        )
    if request.horizon_years == 3 and request.target_capture_pct > 80:
        warnings.append("Meta acelerada: mas de 80% en 3 anios requiere validar capacidad social, territorial e infraestructura.")
    if request.target_capture_pct > 95:
        warnings.append("Meta superior a 95% debe tratarse como aspiracional hasta contar con evidencia operativa.")

    status = TerritorialPlanStatus.blocked if blockers else (
        TerritorialPlanStatus.warning if warnings else TerritorialPlanStatus.ready
    )

    zone_count = _zone_count(request.horizon_years, request.municipios)
    total_months = request.horizon_years * 12
    zone_months = max(1, math.ceil(total_months / zone_count))
    zones: list[TerritorialZone] = []

    if status != TerritorialPlanStatus.blocked:
        for idx in range(zone_count):
            municipio_id = request.municipios[idx % len(request.municipios)].lower()
            start = request.start_month + idx * zone_months
            end = min(request.start_month + total_months - 1, start + zone_months - 1)
            zone_target = _target_for_zone(
                request.current_capture_pct,
                request.target_capture_pct,
                idx + 1,
                zone_count,
            )
            capture = round(request.rsu_total_ton_day * zone_target / 100, 2)
            zone_status = ZoneStatus.condicionada if capture > available_capacity else ZoneStatus.propuesta
            zones.append(
                TerritorialZone(
                    zone_id=f"{request.city_id.upper()}-Z{idx + 1}",
                    zone_number=idx + 1,
                    municipio_id=municipio_id,
                    colonias=[
                        PilotColony(
                            name=name,
                            municipio_id=municipio_id,
                            reason="Colonia propuesta para iniciar aprendizaje territorial; requiere validacion municipal.",
                        )
                        for name in PROPOSED_COLONIES.get(municipio_id, ["Colonia piloto por validar"])[:3]
                    ],
                    start_month=start,
                    end_month=end,
                    start_quarter=_quarter(start),
                    phase_label=PHASES[min(idx, len(PHASES) - 1)],
                    target_capture_pct=zone_target,
                    estimated_capture_ton_day=capture,
                    status=zone_status,
                    territorial_reason=(
                        "Secuencia propuesta para probar separacion, contenedores y comunicacion "
                        "antes de ampliar cobertura municipal."
                    ),
                    help_text=(
                        "Cada zona indica donde empezar, cuando hacerlo y que meta parcial observar; "
                        "las colonias son propuestas, no listado oficial."
                    ),
                )
            )

    annex = [
        TerritorialCalculationAnnexItem(
            calculation_name="Captura diaria requerida por meta final",
            formula="rsu_total_ton_dia * meta_captura_pct / 100",
            inputs={
                "rsu_total_ton_dia": request.rsu_total_ton_day,
                "meta_captura_pct": request.target_capture_pct,
            },
            result=round(final_required_capacity, 2),
            unit="ton/dia",
            source=source,
            explanation="Calcula la capacidad diaria necesaria para sostener la meta final de captura RSU municipal.",
        ),
        TerritorialCalculationAnnexItem(
            calculation_name="Duracion promedio por zona",
            formula="horizonte_anios * 12 / numero_zonas",
            inputs={
                "horizonte_anios": request.horizon_years,
                "numero_zonas": zone_count,
            },
            result=round(total_months / max(zone_count, 1), 2),
            unit="meses/zona",
            source=source,
            explanation="Distribuye el horizonte en oleadas territoriales para que el calendario sea operativo.",
        ),
        TerritorialCalculationAnnexItem(
            calculation_name="Brecha de capacidad final",
            formula="capacidad_disponible_ton_dia - captura_requerida_ton_dia",
            inputs={
                "capacidad_disponible_ton_dia": available_capacity,
                "captura_requerida_ton_dia": round(final_required_capacity, 2),
            },
            result=round(available_capacity - final_required_capacity, 2),
            unit="ton/dia",
            source=source,
            explanation="Identifica si la meta territorial cabe en la capacidad declarada o requiere ajuste.",
        ),
    ]

    return TerritorialImplementationPlan(
        status=status,
        city_id=request.city_id.upper(),
        horizon_years=request.horizon_years,
        start_month=request.start_month,
        target_capture_pct=request.target_capture_pct,
        zones=zones,
        timeline_help_text=(
            "El timeline muestra oleadas territoriales por municipio y trimestre. Sirve para decidir "
            "donde iniciar, que aprender y cuando ampliar; no es un calendario oficial."
        ),
        decision_help_text=(
            "La decision habilitada es ajustar horizonte, meta o capacidad antes de pasar a operacion."
        ),
        calculation_annex=annex,
        source=source,
        warnings=warnings,
        blockers=blockers,
        legal_scope_note="Ciudad/ZM organiza el calendario territorial; la autoridad legal permanece por municipio.",
        next_action=(
            "Corrige los datos bloqueantes antes de calendarizar."
            if blockers
            else "Revisar warnings de capacidad y validar colonias piloto con equipo municipal."
        ),
    )
