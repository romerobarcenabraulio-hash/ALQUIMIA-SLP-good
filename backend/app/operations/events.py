"""Store operativo en memoria con calculo de KPIs."""
from __future__ import annotations

from collections import Counter
from typing import Dict, List

from app.operations.schemas import (
    CollectorShift,
    EvidenceAsset,
    IncentiveRecord,
    InspectionRecord,
    OperationsSummary,
    PickupEvent,
    RoutePlan,
    ViolationRecord,
)


routes: Dict[str, RoutePlan] = {}
shifts: Dict[str, CollectorShift] = {}
evidence_assets: Dict[str, EvidenceAsset] = {}
pickups: Dict[str, PickupEvent] = {}
inspections: Dict[str, InspectionRecord] = {}
violations: Dict[str, ViolationRecord] = {}
incentives: Dict[str, IncentiveRecord] = {}


def add_route(route: RoutePlan) -> RoutePlan:
    routes[route.route_id] = route
    return route


def list_routes(municipio_id: str | None = None) -> List[RoutePlan]:
    result = list(routes.values())
    if municipio_id:
        result = [r for r in result if r.municipio_id == municipio_id.lower()]
    return result


def add_shift(shift: CollectorShift) -> CollectorShift:
    shifts[shift.shift_id] = shift
    return shift


def add_evidence(evidence: EvidenceAsset) -> EvidenceAsset:
    evidence_assets[evidence.evidence_id] = evidence
    return evidence


def add_pickup(event: PickupEvent) -> PickupEvent:
    pickups[event.event_id] = event
    return event


def add_inspection(record: InspectionRecord) -> InspectionRecord:
    inspections[record.inspection_id] = record
    return record


def add_violation(record: ViolationRecord) -> ViolationRecord:
    violations[record.violation_id] = record
    return record


def add_incentive(record: IncentiveRecord) -> IncentiveRecord:
    incentives[record.incentive_id] = record
    return record


def summary_for_municipio(municipio_id: str) -> OperationsSummary:
    mid = municipio_id.lower()
    muni_pickups = [p for p in pickups.values() if p.municipio_id == mid]
    muni_inspections = [i for i in inspections.values() if i.municipio_id == mid]
    muni_violations = [v for v in violations.values() if v.municipio_id == mid]
    muni_incentives = [i for i in incentives.values() if i.municipio_id == mid]

    total_kg = sum(p.peso_estimado_kg for p in muni_pickups)
    pureza = sum(p.pureza_pct for p in muni_pickups) / len(muni_pickups) if muni_pickups else 0.0
    contaminacion = (
        sum(p.contaminacion_pct for p in muni_pickups) / len(muni_pickups)
        if muni_pickups else 0.0
    )
    repeated = Counter(v.inspection_id for v in muni_violations)
    warnings: List[str] = []
    if contaminacion > 25:
        warnings.append("Contaminacion alta: priorizar capacitacion e inspeccion focalizada.")
    if not muni_pickups:
        warnings.append("Sin pickups registrados: KPIs operativos no son defendibles.")

    return OperationsSummary(
        municipio_id=mid,
        total_pickups=len(muni_pickups),
        toneladas_recuperadas=round(total_kg / 1000.0, 3),
        pureza_promedio_pct=round(pureza, 2),
        contaminacion_promedio_pct=round(contaminacion, 2),
        inspecciones=len(muni_inspections),
        violaciones_validas=len(muni_violations),
        advertencias_educativas=sum(
            1 for v in muni_violations
            if v.due_process_status.value == "advertencia_no_sancionatoria"
        ),
        incentivos=len(muni_incentives),
        reincidencias={k: v for k, v in repeated.items() if v > 1},
        warnings=warnings,
    )


def reset_for_tests() -> None:
    routes.clear()
    shifts.clear()
    evidence_assets.clear()
    pickups.clear()
    inspections.clear()
    violations.clear()
    incentives.clear()

