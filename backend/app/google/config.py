"""Resolución de API keys — nombres exactos de Render."""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from app.config import settings
from app.repo_paths import repo_root


def _repo_root() -> Path:
    return repo_root()


@lru_cache(maxsize=1)
def load_api_limits() -> dict:
    path = _repo_root() / "config" / "api_limits.json"
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_google_maps_config() -> dict:
    path = _repo_root() / "config" / "google_maps.json"
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _first_env(*keys: str) -> str:
    for key in keys:
        raw = os.environ.get(key)
        if raw is not None and str(raw).strip():
            return str(raw).strip()
    return ""


def resolve_maps_platform_api_key() -> str:
    """Clave maestra Maps Platform (Render: MAPS_PLATFORM_API)."""
    return (
        _first_env("MAPS_PLATFORM_API", "GOOGLE_MAPS_API_KEY")
        or (settings.MAPS_PLATFORM_API or "").strip()
        or (getattr(settings, "GOOGLE_MAPS_API_KEY", None) or "").strip()
    )


def resolve_google_places_api_key() -> str:
    """Places — Render: GOOGLE_PLACES_API_KEY → fallback MAPS_PLATFORM_API."""
    return (
        _first_env("GOOGLE_PLACES_API_KEY")
        or (settings.GOOGLE_PLACES_API_KEY or "").strip()
        or resolve_maps_platform_api_key()
    )


def resolve_geocoding_api_key() -> str:
    """Geocoding — Render: GEOCODING_API → fallback MAPS_PLATFORM_API."""
    return (
        _first_env("GEOCODING_API", "GOOGLE_GEOCODING_API_KEY")
        or (settings.GEOCODING_API or "").strip()
        or resolve_maps_platform_api_key()
    )


def resolve_routes_api_key() -> str:
    """Routes — Render: OPTIMIZATION_ROUTE_API → fallback MAPS_PLATFORM_API."""
    return (
        _first_env("OPTIMIZATION_ROUTE_API", "GOOGLE_ROUTES_API_KEY")
        or (settings.OPTIMIZATION_ROUTE_API or "").strip()
        or resolve_maps_platform_api_key()
    )


def google_maps_status() -> dict:
    places = bool(resolve_google_places_api_key())
    geocoding = bool(resolve_geocoding_api_key())
    routes = bool(resolve_routes_api_key())
    platform = bool(resolve_maps_platform_api_key())
    return {
        "configured": places or geocoding or routes or platform,
        "places": places,
        "geocoding": geocoding,
        "routes": routes,
        "maps_platform": platform,
        "env_keys": {
            "GOOGLE_PLACES_API_KEY": places,
            "GEOCODING_API": geocoding,
            "OPTIMIZATION_ROUTE_API": routes,
            "MAPS_PLATFORM_API": platform,
        },
    }
