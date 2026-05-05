"""Endpoints Fase 9: operacion en campo."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from app.operations.compliance import transition_violation, validate_violation
from app.operations.events import (
    add_evidence,
    add_incentive,
    add_inspection,
    add_pickup,
    add_route,
    add_shift,
    add_violation,
    list_routes,
    summary_for_municipio,
)
from app.operations.per import build_per_operations_plan
from app.operations.per_schemas import PerOperationsPlan, PerPlanRequest
from app.operations.legal_gate import evaluate_legal_gated_action
from app.operations.legal_gate_schemas import LegalGatedActionRequest, LegalGatedActionResponse
from app.operations.schemas import (
    CollectorShift,
    DueProcessStatus,
    EvidenceAsset,
    IncentiveRecord,
    InspectionRecord,
    OperationsSummary,
    PickupEvent,
    RoutePlan,
    ViolationRecord,
)


router = APIRouter()


@router.post("/routes", response_model=RoutePlan)
def create_route(route: RoutePlan):
    route.municipio_id = route.municipio_id.lower()
    return add_route(route)


@router.get("/routes", response_model=list[RoutePlan])
def get_routes(municipio_id: Optional[str] = Query(None)):
    return list_routes(municipio_id=municipio_id)


@router.post("/shifts", response_model=CollectorShift)
def create_shift(shift: CollectorShift):
    return add_shift(shift)


@router.post("/evidence", response_model=EvidenceAsset)
def create_evidence(evidence: EvidenceAsset):
    return add_evidence(evidence)


@router.post("/pickups", response_model=PickupEvent)
def create_pickup(event: PickupEvent):
    event.municipio_id = event.municipio_id.lower()
    return add_pickup(event)


@router.post("/inspections", response_model=InspectionRecord)
def create_inspection(record: InspectionRecord):
    record.municipio_id = record.municipio_id.lower()
    return add_inspection(record)


@router.post("/violations", response_model=ViolationRecord)
def create_violation(record: ViolationRecord):
    record.municipio_id = record.municipio_id.lower()
    valid = validate_violation(record)
    return add_violation(valid)


@router.patch("/violations/{violation_id}/transition", response_model=ViolationRecord)
def transition(violation_id: str, next_status: DueProcessStatus):
    return transition_violation(violation_id, next_status)


@router.post("/incentives", response_model=IncentiveRecord)
def create_incentive(record: IncentiveRecord):
    record.municipio_id = record.municipio_id.lower()
    return add_incentive(record)


@router.get("/summary/{municipio_id}", response_model=OperationsSummary)
def get_summary(municipio_id: str):
    return summary_for_municipio(municipio_id)


@router.post("/per-plan", response_model=PerOperationsPlan)
def create_per_plan(request: PerPlanRequest):
    return build_per_operations_plan(request)


@router.post("/legal-gated-action", response_model=LegalGatedActionResponse)
def create_legal_gated_action(request: LegalGatedActionRequest):
    return evaluate_legal_gated_action(request)
