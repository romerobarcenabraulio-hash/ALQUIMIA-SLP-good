"""API Fase 13.1: infraestructura y centros de acopio."""
from __future__ import annotations

from fastapi import APIRouter

from app.infrastructure.plan import build_infrastructure_plan
from app.infrastructure.schemas import (
    InfrastructurePlanRequest,
    InfrastructurePlanResponse,
)

router = APIRouter()


@router.post("/plan", response_model=InfrastructurePlanResponse)
def create_infrastructure_plan(request: InfrastructurePlanRequest):
    return build_infrastructure_plan(request)
