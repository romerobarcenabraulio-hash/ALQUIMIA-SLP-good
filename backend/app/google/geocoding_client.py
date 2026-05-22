"""Google Geocoding API — key: GEOCODING_API (Render)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.google.config import resolve_geocoding_api_key

logger = logging.getLogger(__name__)
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class GoogleGeocodingError(Exception):
    pass


class GoogleGeocodingNotConfigured(GoogleGeocodingError):
    pass


def _key() -> str:
    k = resolve_geocoding_api_key()
    if not k:
        raise GoogleGeocodingNotConfigured("Configura GEOCODING_API o MAPS_PLATFORM_API en Render")
    return k


async def geocode_address(address: str, *, region: str = "mx") -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(
            GEOCODE_URL,
            params={"address": address, "region": region, "language": "es", "key": _key()},
        )
        r.raise_for_status()
        data = r.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise GoogleGeocodingError(data.get("error_message") or data.get("status"))
    return data.get("results") or []


async def reverse_geocode(lat: float, lon: float) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(
            GEOCODE_URL,
            params={"latlng": f"{lat},{lon}", "language": "es", "key": _key()},
        )
        r.raise_for_status()
        data = r.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise GoogleGeocodingError(data.get("error_message") or data.get("status"))
    return data.get("results") or []


def normalize_geocode_result(row: Dict[str, Any]) -> Dict[str, Any]:
    loc = row.get("geometry", {}).get("location", {})
    return {
        "formatted_address": row.get("formatted_address"),
        "lat": loc.get("lat"),
        "lon": loc.get("lng"),
        "place_id": row.get("place_id"),
        "components": row.get("address_components") or [],
    }
