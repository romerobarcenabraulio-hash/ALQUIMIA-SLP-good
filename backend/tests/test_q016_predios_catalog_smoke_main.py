"""Smoke: montaje de rutas `/predios` en aplicación FastAPI completa."""

from fastapi.testclient import TestClient

from app.main import app


def test_catalogo_via_main_app_mounted() -> None:
    c = TestClient(app)
    r = c.get("/predios/catalogo/sanciones-slp")
    assert r.status_code == 200
    data = r.json()
    assert "valor_uma_referencia_mxn" in data
    assert "escaleras" in data
    assert isinstance(data["escaleras"], list)
