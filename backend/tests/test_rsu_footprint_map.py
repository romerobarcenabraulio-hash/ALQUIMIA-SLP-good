"""Mapa RSU / huella aproximada — catálogo piloto."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.national.router import router


def test_rsu_footprint_map_returns_seeded_municipios():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)
    res = client.get("/national/map/rsu-footprint")
    assert res.status_code == 200
    body = res.json()
    assert body["feature_count"] == 17
    assert len(body["features"]) == 17
    assert "methodology_summary" in body
    assert "ALQUIMIA-SEED" in body["catalog_simulation_epoch"]
    slp = next(f for f in body["features"] if f["municipio_id"] == "slp")
    assert slp["poblacion"] > 0
    assert slp["rsu_ton_dia"] > 0
    assert slp["co2e_disposal_ton_dia"] > 0
    assert slp["gen_per_capita_kg_dia"] > 0
    assert -118 < slp["lng"] < -95
    assert 18 < slp["lat"] < 30


def test_municipio_profile_includes_geo_after_seed():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)
    p = client.get("/national/municipios/qro/profile").json()
    assert p["poblacion"] is not None
    assert p["rsu_ton_dia"] is not None
    assert p["lat"] is not None
    assert p["lng"] is not None
    assert p["co2e_disposal_ton_dia"] is not None
