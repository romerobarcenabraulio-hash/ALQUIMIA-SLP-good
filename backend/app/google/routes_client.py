"""Google Routes API v2 — key: OPTIMIZATION_ROUTE_API (Render)."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

from app.google.config import resolve_routes_api_key

logger = logging.getLogger(__name__)
ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
FIELD_MASK = "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.travelAdvisory"


class GoogleRoutesError(Exception):
    pass


class GoogleRoutesNotConfigured(GoogleRoutesError):
    pass


def _key() -> str:
    k = resolve_routes_api_key()
    if not k:
        raise GoogleRoutesNotConfigured("Configura OPTIMIZATION_ROUTE_API o MAPS_PLATFORM_API en Render")
    return k


async def compute_route(
    lat_o: float,
    lon_o: float,
    lat_d: float,
    lon_d: float,
    *,
    travel_mode: str = "DRIVE",
) -> Dict[str, Any]:
    body = {
        "origin": {"location": {"latLng": {"latitude": lat_o, "longitude": lon_o}}},
        "destination": {"location": {"latLng": {"latitude": lat_d, "longitude": lon_d}}},
        "travelMode": travel_mode,
        "routingPreference": "TRAFFIC_AWARE_OPTIMAL",
        "computeAlternativeRoutes": False,
        "languageCode": "es-MX",
        "units": "METRIC",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": _key(),
        "X-Goog-FieldMask": FIELD_MASK,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(ROUTES_URL, json=body, headers=headers)
        if r.status_code >= 400:
            raise GoogleRoutesError(r.text[:500])
        data = r.json()

    routes = data.get("routes") or []
    if not routes:
        raise GoogleRoutesError("Routes API no devolvió rutas")
    return routes[0]


def parse_route(route: Dict[str, Any]) -> Dict[str, Any]:
    dist_m = route.get("distanceMeters")
    dur = route.get("duration") or {}
    seconds = int(str(dur.get("seconds", "0")).replace("s", "") or 0) if isinstance(dur, dict) else 0
    if isinstance(dur, str) and dur.endswith("s"):
        seconds = int(dur[:-1] or 0)
    poly = (route.get("polyline") or {}).get("encodedPolyline")
    return {
        "distance_km": round(dist_m / 1000, 2) if dist_m else None,
        "duration_min": round(seconds / 60, 1) if seconds else None,
        "encoded_polyline": poly,
    }
