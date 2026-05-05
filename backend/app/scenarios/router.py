"""Router Fase 13.8: comparador de escenarios."""
from __future__ import annotations

from fastapi import APIRouter

from app.scenarios.comparator import compare_scenarios
from app.scenarios.schemas import ComparadorRequest, ComparadorResponse

router = APIRouter()


@router.post("/compare", response_model=ComparadorResponse)
def compare_endpoint(req: ComparadorRequest):
    return compare_scenarios(req)
