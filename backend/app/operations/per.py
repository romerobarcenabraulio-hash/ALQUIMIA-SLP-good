"""Motor PER y bitacora operativa para Fase 12.3."""
from __future__ import annotations

from app.operations.per_schemas import (
    LogEventInput,
    OperationDataSource,
    OperationalLogEvent,
    OperationalRoute,
    PerCalculationAnnexItem,
    PerExplanation,
    PerOperationsPlan,
    PerPlanRequest,
    PerPlanStatus,
    PerRouteInput,
    RouteOperationalStatus,
)


DEFAULT_SOURCE = OperationDataSource(
    source_id="alquimia-12-3-per-operativo",
    name="Modelo ALQUIMIA PER operativo mensual",
    organization="ALQUIMIA",
    source_type="propuesta_operativa_estimada",
    confidence=0.61,
    explanation=(
        "Construye una lectura mensual de presion, estado y respuesta con datos "
        "operativos declarados por ruta. Los datos estimados se mantienen marcados."
    ),
)


def _clean(value: str | None) -> str:
    return (value or "").strip()


def _route_blockers(route: PerRouteInput, idx: int) -> list[str]:
    prefix = f"Ruta {idx + 1}"
    blockers: list[str] = []
    if not _clean(route.municipio_id):
        blockers.append(f"{prefix}: falta municipio_id.")
    if not _clean(route.zona_id):
        blockers.append(f"{prefix}: falta zona o zona territorial.")
    if not route.colonias:
        blockers.append(f"{prefix}: faltan colonias de cobertura.")
    if not _clean(route.frecuencia):
        blockers.append(f"{prefix}: falta frecuencia.")
    if not _clean(route.camion_unidad):
        blockers.append(f"{prefix}: falta camion o unidad.")
    if not _clean(route.responsable):
        blockers.append(f"{prefix}: falta responsable operativo.")
    if not _clean(route.ventana_temporal):
        blockers.append(f"{prefix}: falta ventana temporal.")
    return blockers


def _event_blockers(event: LogEventInput, idx: int) -> list[str]:
    prefix = f"Evento {idx + 1}"
    blockers: list[str] = []
    if not _clean(event.fecha):
        blockers.append(f"{prefix}: falta fecha.")
    if not event.evidencia:
        blockers.append(f"{prefix}: falta evidencia operativa.")
    for evidence_idx, evidence in enumerate(event.evidencia):
        evidence_prefix = f"{prefix}, evidencia {evidence_idx + 1}"
        if not _clean(evidence.evidence_id):
            blockers.append(f"{evidence_prefix}: falta evidence_id.")
        if not _clean(evidence.evidence_type):
            blockers.append(f"{evidence_prefix}: falta evidence_type.")
        if not _clean(evidence.description):
            blockers.append(f"{evidence_prefix}: falta description.")
        if not _clean(evidence.captured_at):
            blockers.append(f"{evidence_prefix}: falta captured_at.")
        if not _clean(evidence.captured_by):
            blockers.append(f"{evidence_prefix}: falta captured_by.")
        if not _clean(evidence.source):
            blockers.append(f"{evidence_prefix}: falta source.")
    if not _clean(event.municipio_id):
        blockers.append(f"{prefix}: falta municipio.")
    if not _clean(event.route_or_zone_id):
        blockers.append(f"{prefix}: falta ruta o zona relacionada.")
    if not _clean(event.actor_responsable):
        blockers.append(f"{prefix}: falta actor responsable.")
    if not _clean(event.accion_siguiente):
        blockers.append(f"{prefix}: falta accion siguiente.")
    return blockers


def _build_per(route: PerRouteInput) -> PerExplanation:
    colonias_count = len(route.colonias)
    pressure = (
        f"Presion: {colonias_count} colonias requieren cobertura {route.frecuencia} "
        f"en {route.ventana_temporal}."
    )
    state = (
        f"Estado: la unidad {route.camion_unidad} queda {route.estado_operativo.value} "
        f"bajo responsabilidad de {route.responsable}."
    )
    response = (
        "Respuesta: sostener la frecuencia, registrar evidencia por recorrido y revisar "
        "ajustes al cierre del mes."
    )
    return PerExplanation(
        presion=pressure,
        estado=state,
        respuesta=response,
        human_explanation=(
            "PER se lee como una secuencia simple: que presiona la operacion, como esta "
            "respondiendo la ruta y que accion sigue para el proximo corte mensual."
        ),
    )


def _build_route(route: PerRouteInput, idx: int) -> OperationalRoute:
    return OperationalRoute(
        route_id=_clean(route.route_id) or f"per-route-{idx + 1}",
        municipio_id=_clean(route.municipio_id).lower(),
        zona_id=_clean(route.zona_id),
        colonias=route.colonias,
        frecuencia=_clean(route.frecuencia),
        frecuencia_por_semana=route.frecuencia_por_semana,
        camion_unidad=_clean(route.camion_unidad),
        responsable=_clean(route.responsable),
        ventana_temporal=_clean(route.ventana_temporal),
        estado_operativo=route.estado_operativo,
        per=_build_per(route),
        help_text=(
            "Esta ruta permite decidir cobertura mensual por municipio y zona; "
            "no sustituye la bitacora de campo ni la validacion del operador."
        ),
    )


def _build_event(event: LogEventInput, idx: int) -> OperationalLogEvent:
    return OperationalLogEvent(
        event_id=f"per-log-{idx + 1}",
        fecha=event.fecha,
        event_type=event.event_type,
        evidencia=event.evidencia,
        municipio_id=_clean(event.municipio_id).lower(),
        route_or_zone_id=_clean(event.route_or_zone_id),
        actor_responsable=_clean(event.actor_responsable),
        accion_siguiente=_clean(event.accion_siguiente),
    )


def build_per_operations_plan(request: PerPlanRequest) -> PerOperationsPlan:
    source = request.source or DEFAULT_SOURCE
    blockers: list[str] = []
    warnings: list[str] = []

    if not request.routes:
        blockers.append("Falta al menos una ruta operativa para construir PER mensual.")
    if source.confidence <= 0:
        blockers.append("Falta fuente operativa con confianza mayor a cero.")

    for idx, route in enumerate(request.routes):
        blockers.extend(_route_blockers(route, idx))
        if route.frecuencia_por_semana == 0:
            warnings.append(f"Ruta {idx + 1}: frecuencia semanal en cero; revisar cobertura.")

    for idx, event in enumerate(request.log_events):
        blockers.extend(_event_blockers(event, idx))

    status = PerPlanStatus.blocked if blockers else (
        PerPlanStatus.warning if warnings else PerPlanStatus.ready
    )

    routes = [] if status == PerPlanStatus.blocked else [
        _build_route(route, idx)
        for idx, route in enumerate(request.routes)
    ]
    log_events = [] if status == PerPlanStatus.blocked else [
        _build_event(event, idx)
        for idx, event in enumerate(request.log_events)
    ]

    weekly_visits = sum(route.frecuencia_por_semana for route in request.routes)
    monthly_visits = round(weekly_visits * 4.345, 2) if status != PerPlanStatus.blocked else 0
    annex = [
        PerCalculationAnnexItem(
            calculation_name="Visitas operativas mensuales estimadas",
            formula="suma_frecuencias_semanales * 4.345",
            inputs={
                "suma_frecuencias_semanales": weekly_visits,
                "semanas_promedio_mes": 4.345,
            },
            result=monthly_visits,
            unit="visitas/mes",
            source=source,
            explanation=(
                "Convierte frecuencias semanales por ruta en una carga mensual estimada "
                "para revisar capacidad de seguimiento."
            ),
        )
    ]

    return PerOperationsPlan(
        status=status,
        city_id=request.city_id.upper(),
        periodo_mes=request.periodo_mes,
        routes=routes,
        log_events=log_events,
        monthly_visits_estimate=monthly_visits,
        metric_help_text=(
            "Las visitas mensuales son una estimacion de carga operativa: ayudan a revisar "
            "si responsables y unidades alcanzan para el mes."
        ),
        per_help_text=(
            "PER significa presion, estado y respuesta: explica por que una ruta requiere "
            "atencion, como se encuentra y que accion operativa sigue."
        ),
        calculation_annex=annex,
        source=source,
        warnings=warnings,
        blockers=blockers,
        next_action=(
            "Completar municipio, zona, frecuencia, unidad, responsable y evidencia antes de operar el plan PER."
            if blockers
            else "Revisar rutas, bitacora y carga mensual estimada con responsables operativos."
        ),
    )
