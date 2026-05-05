from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.alerts.router import router as alerts_router
from app.dashboard.router import router as dashboard_router
from app.scenarios.router import router as scenarios_router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(alerts_router, prefix="/alerts")
    app.include_router(dashboard_router, prefix="/dashboard")
    app.include_router(scenarios_router, prefix="/scenarios")
    return TestClient(app)


def test_tasa_fuera_de_rango_422():
    response = _client().post(
        "/alerts/evaluate",
        json={
            "municipio_id": "slp",
            "tasa_circularidad_pct": 150,
            "brecha_infraestructura_ton_dia": 2.0,
            "score_circularidad": 50.0,
        },
    )
    assert response.status_code == 422


def test_score_fuera_de_rango_422():
    response = _client().post(
        "/alerts/evaluate",
        json={
            "municipio_id": "slp",
            "tasa_circularidad_pct": 50,
            "brecha_infraestructura_ton_dia": 2.0,
            "score_circularidad": 200,
        },
    )
    assert response.status_code == 422


def test_brecha_negativa_422():
    response = _client().post(
        "/dashboard/summary",
        json={
            "municipio_id": "slp",
            "generacion_ton_dia": 100,
            "tasa_circularidad_actual_pct": 12,
            "brecha_infraestructura_ton_dia": -1,
        },
    )
    assert response.status_code == 422


def test_generacion_cero_o_negativa_422():
    # En Fase 14 se endurece con Field(gt=0), por lo que negativos son 422.
    response = _client().post(
        "/dashboard/summary",
        json={
            "municipio_id": "slp",
            "generacion_ton_dia": -5,
            "tasa_circularidad_actual_pct": 12,
        },
    )
    assert response.status_code == 422


def test_menos_de_2_escenarios_blocked():
    response = _client().post(
        "/scenarios/compare",
        json={
            "municipio_id": "slp",
            "escenarios": [
                {
                    "nombre": "Solo",
                    "generacion_ton_dia": 100,
                    "tasa_circularidad_pct": 10,
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "blocked"
