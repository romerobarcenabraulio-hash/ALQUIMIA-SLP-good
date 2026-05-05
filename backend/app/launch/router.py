"""Router Fase 21: checklist de lanzamiento reproducible."""
from __future__ import annotations

from fastapi import APIRouter

from app.launch.checklist import build_launch_checklist
from app.launch.schemas import LaunchChecklistResponse

router = APIRouter()


@router.get("/checklist", response_model=LaunchChecklistResponse)
def get_launch_checklist():
    return build_launch_checklist()
