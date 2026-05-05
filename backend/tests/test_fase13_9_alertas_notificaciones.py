from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.alerts.engine import generate_alerts
from app.alerts.router import router
from app.alerts.schemas import AlertasRequest


def _request(**overrides) -> AlertasRequest:
    data = {
        "municipio_id": "slp",
        "tasa_circularidad_pct": 16.0,
        "brecha_infraestructura_ton_dia": 0.0,
        "score_circularidad": 75.0,
        "tiene_residuos_regulados": False,
        "estado_legal": "sin_gate",
        "num_macrogeneradores_sin_padron": 0,
    }
    data.update(overrides)
    return AlertasRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/alerts")
    return TestClient(app)


def test_municipio_vacio_blocked():
    result = generate_alerts(_request(municipio_id=""))
    assert result.status == "blocked"


def test_brecha_critica_genera_alerta_critica():
    result = generate_alerts(_request(brecha_infraestructura_ton_dia=8))
    alerta = next(a for a in result.alertas if a.tipo == "brecha_infraestructura")
    assert alerta.nivel == "critica"


def test_tasa_cero_genera_dos_alertas_criticas():
    result = generate_alerts(_request(tasa_circularidad_pct=0))
    tipos_criticos = {a.tipo for a in result.alertas if a.nivel == "critica"}
    assert "tasa_circularidad_baja" in tipos_criticos
    assert "sin_recuperacion" in tipos_criticos


def test_residuos_regulados_genera_alerta_critica():
    result = generate_alerts(_request(tiene_residuos_regulados=True))
    alerta = next(a for a in result.alertas if a.tipo == "residuos_regulados")
    assert alerta.nivel == "critica"


def test_sin_alertas_produce_alerta_info():
    result = generate_alerts(_request())
    assert len(result.alertas) == 1
    assert result.alertas[0].nivel == "info"


def test_total_criticas_correcto():
    result = generate_alerts(
        _request(
            tasa_circularidad_pct=0,
            brecha_infraestructura_ton_dia=8,
            tiene_residuos_regulados=True,
            score_circularidad=20,
        )
    )
    criticas = sum(1 for a in result.alertas if a.nivel == "critica")
    assert result.total_criticas == criticas


def test_resumen_no_vacio():
    result = generate_alerts(_request(score_circularidad=20))
    assert len(result.resumen) > 10


def test_endpoint_200_caso_feliz():
    response = _client().post("/alerts/evaluate", json=_request(score_circularidad=35).model_dump(mode="json"))
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
