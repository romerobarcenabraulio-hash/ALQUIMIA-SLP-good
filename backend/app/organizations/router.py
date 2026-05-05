"""Endpoints Fase 13.3: portal empresarial e institucional."""
from __future__ import annotations

from fastapi import APIRouter

from app.organizations.assessment import evaluate_organizational_circularity
from app.organizations.schemas import (
    OrganizationalCircularityRequest,
    OrganizationalCircularityResponse,
)

router = APIRouter()


@router.post("/assessment", response_model=OrganizationalCircularityResponse)
def create_organizational_assessment(request: OrganizationalCircularityRequest):
    return evaluate_organizational_circularity(request)
