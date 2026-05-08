"""Health profundo y cabecera X-Request-ID."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def test_health_deep_ok_structure():
    client = TestClient(app)
    r = client.get("/health/deep")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["environment"]
    assert "version" in data
    assert isinstance(data["uptime_seconds"], int)
    assert data["checks"]["city_repository"] == "ok"
    assert data["checks"]["agora_pipeline"] == "ok"
    zm = data["checks"]["legal_paquete_zms"]
    for k in ("SLP", "MTY", "QRO", "GDL"):
        assert zm.get(k) in ("ok", "skip")


def test_request_id_header_echoed():
    client = TestClient(app)
    rid = "test-req-id-0001"
    r = client.get("/city/options", headers={"X-Request-ID": rid})
    assert r.status_code == 200
    assert r.headers.get("X-Request-ID") == rid


def test_access_log_line_is_json(caplog):
    import logging

    caplog.set_level(logging.INFO, logger="alquimia.access")
    client = TestClient(app)
    client.get("/city/options", headers={"X-Request-ID": "log-json-1", "User-Agent": "pytest"})
    lines = [r.message for r in caplog.records if r.name == "alquimia.access"]
    assert lines, "se esperaba al menos una línea de access log"
    payload = json.loads(lines[-1])
    assert payload["request_id"] == "log-json-1"
    assert payload["path"] == "/city/options"
    assert "user_agent_hash" in payload
