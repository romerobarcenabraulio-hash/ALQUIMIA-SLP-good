"""Router Fase 20: evaluación de gobernanza."""
from __future__ import annotations

from fastapi import APIRouter

from app.governance.checker import evaluate_governance
from app.governance.schemas import GovernanceRequest, GovernanceResponse

router = APIRouter()


@router.post("/evaluate", response_model=GovernanceResponse)
def evaluate(req: GovernanceRequest):
    return evaluate_governance(req)
