from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dashboard.aggregator import build_dashboard
from app.dashboard.router import router
from app.dashboard.schemas import DashboardRequest


def _request(**overrides) -> DashboardRequest:
    data = {
        "municipio_id": "slp",
        "generacion_ton_dia": 10.0,
        "tasa_circularidad_actual_pct": 8.0,
        "brecha_infraestructura_ton_dia": 2.0,
        "num_macrogeneradores": 4,
        "num_centros_acopio": 1,
        "estado_legal": "sin_gate",
        "corrientes_criticas": ["organico"],
    }
    data.update(overrides)
    return DashboardRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/dashboard")
    return TestClient(app)


def test_municipio_vacio_blocked():
    result = build_dashboard(_request(municipio_id=""))
    assert result.status == "blocked"


def test_generacion_cero_blocked():
    result = build_dashboard(_request(generacion_ton_dia=0))
    assert result.status == "blocked"


def test_minimo_5_kpis_generados():
    result = build_dashboard(_request())
    assert len(result.kpis) >= 5


def test_score_circularidad_rango_0_100():
    result = build_dashboard(_request())
    assert 0 <= result.resumen.score_circularidad <= 100


def test_score_con_todo_optimo():
    result = build_dashboard(
        _request(
            tasa_circularidad_actual_pct=20,
            brecha_infraestructura_ton_dia=0,
            estado_legal="gate_activo",
            num_centros_acopio=3,
        )
    )
    assert result.resumen.score_circularidad >= 90


def test_alerta_brecha_critica():
    result = build_dashboard(_request(brecha_infraestructura_ton_dia=8.0))
    brecha = next(k for k in result.kpis if k.clave == "brecha_infraestructura")
    assert brecha.alerta is not None


def test_kpi_tiene_formula_fuente():
    result = build_dashboard(_request())
    for kpi in result.kpis:
        assert kpi.formula
        assert kpi.fuente


def test_endpoint_200_caso_feliz():
    response = _client().post("/dashboard/summary", json=_request().model_dump(mode="json"))
    assert response.status_code == 200
    assert response.json()["status"] in ("ready", "warning")
