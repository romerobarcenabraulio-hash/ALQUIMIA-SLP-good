"""Tests resolución env Google (nombres Render)."""
from app.google.config import (
    google_maps_status,
    resolve_geocoding_api_key,
    resolve_google_places_api_key,
    resolve_maps_platform_api_key,
    resolve_routes_api_key,
)


def test_google_status_without_keys(monkeypatch):
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)
    monkeypatch.delenv("GEOCODING_API", raising=False)
    monkeypatch.delenv("OPTIMIZATION_ROUTE_API", raising=False)
    monkeypatch.delenv("MAPS_PLATFORM_API", raising=False)
    st = google_maps_status()
    assert st["configured"] is False


def test_resolve_render_env_names(monkeypatch):
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "places-key")
    monkeypatch.setenv("GEOCODING_API", "geo-key")
    monkeypatch.setenv("OPTIMIZATION_ROUTE_API", "routes-key")
    monkeypatch.setenv("MAPS_PLATFORM_API", "platform-key")
    assert resolve_google_places_api_key() == "places-key"
    assert resolve_geocoding_api_key() == "geo-key"
    assert resolve_routes_api_key() == "routes-key"
    assert resolve_maps_platform_api_key() == "platform-key"
    assert google_maps_status()["configured"] is True
