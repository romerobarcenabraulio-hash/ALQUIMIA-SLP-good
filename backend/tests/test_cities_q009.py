"""Q-009 — catálogo municipal /api/v1/cities y estados."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_cities_list_contains_expected_fields():
    r = client.get("/api/v1/cities")
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and len(rows) >= 1
    m = rows[0]
    for key in (
        "clave_inegi",
        "nombre",
        "estado",
        "estado_id",
        "poblacion",
        "generacion_rsu_dia",
        "zm_simulator_id",
        "municipio_simulator_id",
        "datos_estimados",
    ):
        assert key in m


def test_cities_filter_queretaro():
    r = client.get("/api/v1/cities", params={"estado_id": "22"})
    assert r.status_code == 200
    rows = r.json()
    assert all(x["estado_id"] == "22" for x in rows)
    assert any(x["municipio_simulator_id"] == "qro" for x in rows)


def test_cities_estados_endpoint():
    r = client.get("/api/v1/cities/estados")
    assert r.status_code == 200
    eds = r.json()
    assert isinstance(eds, list) and len(eds) >= 4
    ids = {e["estado_id"] for e in eds}
    assert "24" in ids and "22" in ids and "19" in ids and "14" in ids
