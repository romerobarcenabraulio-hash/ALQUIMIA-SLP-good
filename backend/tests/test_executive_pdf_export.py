"""PDF ejecutivo de consultoría — endpoint /export/executive-pdf."""
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.export.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/export")
    return TestClient(app)


def test_executive_pdf_returns_pdf_bytes():
    client = _client()
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "resultados": {"tir": 12.5, "vpn": 1_500_000, "capex_total": 80_000_000},
            "snapshot_datos": {
                "score_datos": 78,
                "advertencias": ["Dato manual en cobertura"],
                "fuentes_usadas": ["INEGI 2020", "Reglamento SLP"],
            },
            "module_label": "Test ejecutivo",
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 2_000
