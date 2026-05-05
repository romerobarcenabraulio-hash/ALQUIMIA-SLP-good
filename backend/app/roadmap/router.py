"""Router Fase 13.5: hoja de ruta ejecutiva municipal."""
from __future__ import annotations

from fastapi import APIRouter

from app.roadmap.builder import build_roadmap
from app.roadmap.schemas import RoadmapMunicipalRequest, RoadmapMunicipalResponse

router = APIRouter()


@router.post("/generate", response_model=RoadmapMunicipalResponse)
def generate_roadmap(req: RoadmapMunicipalRequest):
    return build_roadmap(req)
