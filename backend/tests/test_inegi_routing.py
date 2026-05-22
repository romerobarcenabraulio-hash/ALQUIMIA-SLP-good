"""Tests adaptador INEGI SAKBÉ (mock HTTP)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routing.inegi_client import parse_route_result


client = TestClient(app)


def test_routing_status_without_token(monkeypatch):
    monkeypatch.delenv("INEGI_RUTEO_TOKEN", raising=False)
    monkeypatch.setattr("app.config.settings.INEGI_RUTEO_TOKEN", None)
    r = client.get("/api/v1/routing/status")
    assert r.status_code == 200
    assert r.json()["configured"] is False


def test_segment_503_without_token(monkeypatch):
    monkeypatch.delenv("INEGI_RUTEO_TOKEN", raising=False)
    monkeypatch.setattr("app.config.settings.INEGI_RUTEO_TOKEN", None)
    r = client.post(
        "/api/v1/routing/segment",
        json={
            "origin": {"lat": 22.15, "lon": -100.98},
            "destination": {"lat": 22.19, "lon": -100.93},
        },
    )
    assert r.status_code == 503


def test_parse_route_result():
    out = parse_route_result({
        "long_km": "12.4",
        "tiempo_min": "18",
        "peaje": "f",
        "costo_caseta": "0",
        "geojson": {"type": "LineString", "coordinates": []},
        "advertencia": None,
    })
    assert out["distance_km"] == 12.4
    assert out["toll_flag"] is False


@pytest.mark.asyncio
async def test_ruta_entre_coordenadas_mock(monkeypatch):
    from app.routing import inegi_client as mod

    monkeypatch.setattr(mod, "resolve_inegi_ruteo_token", lambda: "x" * 36)

    async def fake_line(lat, lon, **kw):
        return mod.SakbeLineSnap(id_routing_net=1, source=10, target=11, nombre="Test Rd")

    async def fake_route(o, d, **kw):
        return {
            "long_km": 5.2,
            "tiempo_min": 9,
            "peaje": "f",
            "geojson": {"type": "LineString", "coordinates": [[-101, 22], [-100.9, 22.1]]},
        }

    monkeypatch.setattr(mod, "buscar_linea_cercana", fake_line)
    monkeypatch.setattr(mod, "calcular_ruta_linea_a_linea", fake_route)

    raw = await mod.ruta_entre_coordenadas(22.15, -100.98, 22.19, -100.93)
    parsed = parse_route_result(raw)
    assert parsed["distance_km"] == 5.2
