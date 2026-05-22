"""Google Places API (Text Search) — key: GOOGLE_PLACES_API_KEY (Render)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.google.config import resolve_google_places_api_key
from app.google.schemas import GooglePlaceKind

logger = logging.getLogger(__name__)
TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"

QUERIES_BY_KIND: Dict[GooglePlaceKind, List[str]] = {
    GooglePlaceKind.centro_acopio: [
        "centro de reciclaje {ctx}",
        "punto verde {ctx}",
        "chatarrería {ctx}",
        "recicladora {ctx}",
    ],
    GooglePlaceKind.residencial: [
        "fraccionamiento {ctx}",
        "colonia {ctx}",
        "unidad habitacional {ctx}",
    ],
    GooglePlaceKind.generico: ["{ctx}"],
}


class GooglePlacesError(Exception):
    pass


class GooglePlacesNotConfigured(GooglePlacesError):
    pass


def _key() -> str:
    k = resolve_google_places_api_key()
    if not k:
        raise GooglePlacesNotConfigured("Configura GOOGLE_PLACES_API_KEY o MAPS_PLATFORM_API en Render")
    return k


async def text_search(query: str, *, lat: Optional[float] = None, lon: Optional[float] = None, radius_m: int = 15000) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {"query": query, "language": "es", "key": _key()}
    if lat is not None and lon is not None:
        params["location"] = f"{lat},{lon}"
        params["radius"] = radius_m
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(TEXT_SEARCH_URL, params=params)
        r.raise_for_status()
        data = r.json()
    status = data.get("status")
    if status not in ("OK", "ZERO_RESULTS"):
        raise GooglePlacesError(data.get("error_message") or status)
    return data.get("results") or []


async def search_places(
    query: str,
    *,
    place_kind: GooglePlaceKind = GooglePlaceKind.generico,
    context: str = "",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_m: int = 15000,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    ctx = context or query
    templates = QUERIES_BY_KIND.get(place_kind, QUERIES_BY_KIND[GooglePlaceKind.generico])
    seen: set[str] = set()
    out: List[Dict[str, Any]] = []

    for tpl in templates:
        q = tpl.format(ctx=ctx) if "{ctx}" in tpl else query
        try:
            rows = await text_search(q, lat=lat, lon=lon, radius_m=radius_m)
        except GooglePlacesError as exc:
            logger.warning("Places search failed %r: %s", q, exc)
            continue
        for row in rows:
            pid = row.get("place_id")
            if not pid or pid in seen:
                continue
            seen.add(pid)
            out.append(row)
            if len(out) >= limit:
                return out
    return out


def place_to_candidate(row: Dict[str, Any]) -> Dict[str, Any]:
    loc = row.get("geometry", {}).get("location", {})
    return {
        "place_id": row.get("place_id", ""),
        "name": row.get("name", ""),
        "formatted_address": row.get("formatted_address"),
        "lat": loc.get("lat"),
        "lon": loc.get("lng"),
        "types": row.get("types") or [],
    }
