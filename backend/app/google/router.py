"""Router /api/v1/google — Places, Geocoding, Routes."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.google.config import google_maps_status
from app.google.geocoding_client import (
    GoogleGeocodingError,
    GoogleGeocodingNotConfigured,
    geocode_address,
    normalize_geocode_result,
    reverse_geocode,
)
from app.google.places_client import (
    GooglePlacesError,
    GooglePlacesNotConfigured,
    place_to_candidate,
    search_places,
)
from app.google.routes_client import (
    GoogleRoutesError,
    GoogleRoutesNotConfigured,
    compute_route,
    parse_route,
)
from app.google.schemas import (
    GeocodeForwardRequest,
    GeocodeResult,
    GeocodeReverseRequest,
    GooglePlaceKind,
    PlaceCandidate,
    PlaceSearchRequest,
    RouteLeg,
    RoutePlanRequest,
    RoutePlanResponse,
    RouteSegmentRequest,
    RouteSegmentResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
async def status():
    return {**google_maps_status(), "provider": "google_maps_platform"}


@router.post("/geocoding/forward", response_model=GeocodeResult)
async def geocoding_forward(req: GeocodeForwardRequest):
    try:
        rows = await geocode_address(req.address, region=req.region)
        if not rows:
            raise HTTPException(404, "Sin resultados de geocoding")
        return GeocodeResult(**normalize_geocode_result(rows[0]))
    except GoogleGeocodingNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except GoogleGeocodingError as exc:
        raise HTTPException(502, str(exc))


@router.post("/geocoding/reverse", response_model=GeocodeResult)
async def geocoding_reverse(req: GeocodeReverseRequest):
    try:
        rows = await reverse_geocode(req.lat, req.lon)
        if not rows:
            raise HTTPException(404, "Sin resultados reverse geocoding")
        return GeocodeResult(**normalize_geocode_result(rows[0]))
    except GoogleGeocodingNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except GoogleGeocodingError as exc:
        raise HTTPException(502, str(exc))


@router.post("/places/search", response_model=list[PlaceCandidate])
async def places_search(req: PlaceSearchRequest):
    try:
        rows = await search_places(
            req.query,
            place_kind=req.place_kind,
            context=req.query,
            lat=req.lat,
            lon=req.lon,
            radius_m=req.radius_m,
        )
        return [PlaceCandidate(**place_to_candidate(r)) for r in rows]
    except GooglePlacesNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except GooglePlacesError as exc:
        raise HTTPException(502, str(exc))


@router.post("/places/centros-acopio", response_model=list[PlaceCandidate])
async def places_centros(ctx: str, lat: float | None = None, lon: float | None = None):
    req = PlaceSearchRequest(query=ctx, place_kind=GooglePlaceKind.centro_acopio, lat=lat, lon=lon)
    return await places_search(req)


@router.post("/places/residencial", response_model=list[PlaceCandidate])
async def places_residencial(ctx: str, lat: float | None = None, lon: float | None = None):
    req = PlaceSearchRequest(query=ctx, place_kind=GooglePlaceKind.residencial, lat=lat, lon=lon)
    return await places_search(req)


@router.post("/routes/segment", response_model=RouteSegmentResponse)
async def routes_segment(req: RouteSegmentRequest):
    try:
        raw = await compute_route(
            req.origin.lat, req.origin.lon,
            req.destination.lat, req.destination.lon,
            travel_mode=req.vehicle_type,
        )
        return RouteSegmentResponse(**parse_route(raw))
    except GoogleRoutesNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except GoogleRoutesError as exc:
        logger.warning("Google Routes: %s", exc)
        raise HTTPException(502, str(exc))


@router.post("/routes/plan", response_model=RoutePlanResponse)
async def routes_plan(req: RoutePlanRequest):
    points = [req.depot, *req.stops]
    if req.return_to_depot and req.stops:
        points.append(req.depot)

    legs: list[RouteLeg] = []
    total_km = 0.0
    total_min = 0.0
    partial = False

    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        try:
            raw = await compute_route(a.lat, a.lon, b.lat, b.lon)
            seg = RouteSegmentResponse(**parse_route(raw))
            legs.append(RouteLeg(
                from_label=a.label or f"P{i}",
                to_label=b.label or f"P{i + 1}",
                segment=seg,
            ))
            total_km += seg.distance_km or 0
            total_min += seg.duration_min or 0
        except (GoogleRoutesNotConfigured, GoogleRoutesError) as exc:
            if isinstance(exc, GoogleRoutesNotConfigured):
                raise HTTPException(503, str(exc))
            partial = True
            logger.warning("Route leg failed: %s", exc)

    if not legs:
        raise HTTPException(502, "No se calcularon tramos")

    return RoutePlanResponse(
        municipio_id=req.municipio_id.lower(),
        zm=req.zm,
        legs=legs,
        total_distance_km=round(total_km, 2),
        total_duration_min=round(total_min, 1),
        source="partial" if partial else "google_routes",
    )
