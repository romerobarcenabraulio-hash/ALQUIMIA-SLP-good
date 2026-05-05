from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.city.repository import baseline_for, get_city_context, journey_for, list_city_options
from app.city.schemas import CircularityBaseline, CityContext, CityOption, DecisionModule, PortalEntry
from app.data.registry import DataRegistry

router = APIRouter()


@router.get("/options", response_model=list[CityOption])
async def get_city_options() -> list[CityOption]:
    return list_city_options()


@router.get("/{city_id}/context", response_model=CityContext)
async def get_context(city_id: str) -> CityContext:
    context = get_city_context(city_id)
    if not context:
        raise HTTPException(status_code=404, detail=f"Ciudad/ZM '{city_id}' no disponible")
    return context


@router.get("/{city_id}/baseline", response_model=CircularityBaseline)
async def get_baseline(city_id: str) -> CircularityBaseline:
    snapshot = await DataRegistry.instance().snapshot(city_id.upper())
    baseline = baseline_for(city_id, snapshot)
    if not baseline:
        raise HTTPException(status_code=404, detail=f"Baseline no disponible para ciudad/ZM '{city_id}'")
    return baseline


@router.get("/journey/steps", response_model=list[DecisionModule])
async def get_journey_steps(entry: PortalEntry = Query(...)) -> list[DecisionModule]:
    return journey_for(entry)
