"""Q-003: /health público y CORS para staging Vercel declarado en main."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


def test_health_reflects_staging_origin_in_cors():
    r = client.get(
        "/health",
        headers={"Origin": "https://alquimia-slp.vercel.app"},
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "https://alquimia-slp.vercel.app"
