"""Mapa calor circularidad ZM (Q-025) — rejilla proxy todas las ZM catálogo."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.national.router import router


def test_circularity_heatmap_slp_returns_geojson_grid():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)
    res = client.get("/national/map/zm/SLP/circularity-heatmap")
    assert res.status_code == 200
    body = res.json()
    assert body["zm_id"] == "SLP"
    assert body["feature_count"] == 180
    assert body["version_mgn"] is None
    assert body["geometry_storage_crs"] == "EPSG:4326"
    assert "6369" in body["metric_calculation_crs_note"]
    assert body["geojson"]["type"] == "FeatureCollection"
    assert len(body["geojson"]["features"]) == 180
    f0 = body["geojson"]["features"][0]
    assert f0["geometry"]["type"] == "Polygon"
    props = f0["properties"]
    assert props["zm_id"] == "SLP"
    assert props["jurisdiction_scope"] == "MetropolitanZone"
    assert "circularity_actual_pct" in props
    assert "circularity_projected_pct" in props
    assert "cve_geoestadistica_proxy" in props
    assert props["circularity_projected_pct"] >= props["circularity_actual_pct"]
    assert "SIMULACIÓN" in body["disclaimer"]
    assert "ALQUIMIA-SEED" in body["catalog_simulation_epoch"]


def test_circularity_heatmap_mty_returns_grid():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)
    res = client.get("/national/map/zm/MTY/circularity-heatmap")
    assert res.status_code == 200
    body = res.json()
    assert body["zm_id"] == "MTY"
    assert body["feature_count"] == 576
    assert len(body["geojson"]["features"]) == 576
    assert body["geojson"]["features"][0]["properties"]["zm_id"] == "MTY"


def test_circularity_heatmap_unknown_zm_empty():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)
    res = client.get("/national/map/zm/XXX/circularity-heatmap")
    assert res.status_code == 200
    body = res.json()
    assert body["zm_id"] == "XXX"
    assert body["feature_count"] == 0
    assert body["geojson"]["features"] == []
    assert body["geometry_source"] == "none_unknown_zm"
