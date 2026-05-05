"""Router de implementacion territorial."""
from __future__ import annotations

from fastapi import APIRouter

from app.implementation.schemas import TerritorialImplementationPlan, TerritorialPlanRequest
from app.implementation.territorial import build_territorial_implementation_plan

router = APIRouter()


@router.post("/territorial-plan", response_model=TerritorialImplementationPlan)
async def post_territorial_plan(request: TerritorialPlanRequest) -> TerritorialImplementationPlan:
    return build_territorial_implementation_plan(request)
