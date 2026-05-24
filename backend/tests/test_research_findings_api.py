"""GET /research/findings — Investigador para PDF."""
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.research.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_research_findings_returns_json():
    client = _client()
    res = client.get(
        "/research/findings",
        params={
            "municipio_id": "28028",
            "zm_id": "ZM_SLPS",
            "municipio_nombre": "San Luis Potosí",
            "estado": "San Luis Potosí",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["municipio"] == "San Luis Potosí"
    assert "noticias_locales" in data
    assert "reglamentos" in data
