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


def test_inegi_source_audit_without_denue_token_is_domain_blocked(monkeypatch):
    monkeypatch.delenv("INEGI_DENUE_TOKEN", raising=False)
    monkeypatch.delenv("DENUE_API_TOKEN", raising=False)
    monkeypatch.delenv("INEGI_API_TOKEN", raising=False)
    monkeypatch.setattr("app.city.api_v1.resolve_inegi_api_token", lambda: "")

    r = client.get("/api/v1/cities/24028/inegi-source")
    assert r.status_code == 200
    payload = r.json()
    assert payload["clave_inegi"] == "24028"
    assert payload["census_source"].startswith("INEGI Censo")
    assert payload["denue_status"] == "blocked_missing_token"
    assert payload["live_query_performed"] is False
    assert payload["blockers"]
    assert "INEGI_API_TOKEN" in payload["next_action"]
    assert "api_denue" in payload["denue_api_url"]


def test_inegi_source_audit_with_token_is_configured_not_live(monkeypatch):
    monkeypatch.setattr("app.city.api_v1.resolve_inegi_api_token", lambda: "token-de-prueba")

    r = client.get("/api/v1/cities/24028/inegi-source")
    assert r.status_code == 200
    payload = r.json()
    assert payload["denue_status"] == "configured"
    assert payload["live_query_performed"] is False
    assert payload["blockers"] == []
    assert "consulta explícita" in payload["next_action"]
