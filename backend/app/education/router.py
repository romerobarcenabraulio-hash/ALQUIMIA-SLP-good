"""Router de educacion ciudadana."""
from __future__ import annotations

from fastapi import APIRouter

from app.education.domestic import calculate_domestic_education
from app.education.schemas import DomesticEducationResult, HouseholdEducationRequest

router = APIRouter()


@router.post("/domestic-calculator", response_model=DomesticEducationResult)
async def post_domestic_calculator(request: HouseholdEducationRequest) -> DomesticEducationResult:
    return calculate_domestic_education(request)
