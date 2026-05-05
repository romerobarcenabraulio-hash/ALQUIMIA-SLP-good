"""Fase 23.0 — contrato jurisdiction_scope NAVIGATOR vs legal_scope (dominio legal)."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.city.catalog_debt import CATALOG_SIMULATION_EPOCH
from app.city.router import router as city_router
from app.city.schemas import MunicipioContext


def test_municipio_context_maps_legal_municipio_to_jurisdiction_municipality():
    m = MunicipioContext(municipio_id="slp", nombre="San Luis Potosi", estado="SLP")
    assert m.legal_scope == "municipio"
    assert m.jurisdiction_scope == "Municipality"


def test_city_context_api_exposes_metropolitan_zone_and_catalog_epoch():
    app = FastAPI()
    app.include_router(city_router, prefix="/city")
    client = TestClient(app)
    res = client.get("/city/SLP/context")
    assert res.status_code == 200
    payload = res.json()
    assert payload["jurisdiction_scope"] == "MetropolitanZone"
    assert payload["catalog_simulation_epoch"] == CATALOG_SIMULATION_EPOCH
    assert payload["geography_scope"] == "city_zm"
    for m in payload["municipios"]:
        assert m["legal_scope"] == "municipio"
        assert m["jurisdiction_scope"] == "Municipality"


def test_legal_hub_row_has_municipality_jurisdiction():
    from app.legal.router import router as legal_router

    app = FastAPI()
    app.include_router(legal_router, prefix="/legal")
    client = TestClient(app)
    res = client.get("/legal/hub")
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) >= 1
    for row in rows:
        assert row["jurisdiction_scope"] == "Municipality"
