from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.scenarios.comparator import compare_scenarios
from app.scenarios.router import router
from app.scenarios.schemas import ComparadorRequest, EscenarioInput


def _scenario(**overrides) -> EscenarioInput:
    data = {
        "nombre": "Base",
        "generacion_ton_dia": 10.0,
        "tasa_circularidad_pct": 8.0,
        "brecha_infraestructura_ton_dia": 2.0,
        "num_centros_acopio": 0,
        "num_macrogeneradores": 2,
        "estado_legal": "sin_gate",
    }
    data.update(overrides)
    return EscenarioInput(**data)


def _request(escenarios: list[EscenarioInput], municipio_id: str = "slp") -> ComparadorRequest:
    return ComparadorRequest(municipio_id=municipio_id, escenarios=escenarios)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/scenarios")
    return TestClient(app)


def test_municipio_vacio_blocked():
    result = compare_scenarios(_request([_scenario(), _scenario(nombre="Alt")], municipio_id=""))
    assert result.status == "blocked"


def test_menos_de_2_escenarios_blocked():
    result = compare_scenarios(_request([_scenario()]))
    assert result.status == "blocked"
    assert "Se requieren al menos 2 escenarios para comparar" in result.blockers


def test_mas_de_5_escenarios_blocked():
    escenarios = [_scenario(nombre=f"E{i}") for i in range(6)]
    result = compare_scenarios(_request(escenarios))
    assert result.status == "blocked"
    assert "Máximo 5 escenarios permitidos" in result.blockers


def test_ganador_es_el_de_mayor_score():
    base = _scenario(nombre="Base", tasa_circularidad_pct=8, brecha_infraestructura_ton_dia=2, estado_legal="sin_gate")
    optimo = _scenario(
        nombre="Óptimo", tasa_circularidad_pct=20, brecha_infraestructura_ton_dia=0, estado_legal="gate_activo", num_centros_acopio=2
    )
    result = compare_scenarios(_request([base, optimo]))
    ganador = next(e for e in result.escenarios if e.es_ganador)
    assert ganador.nombre == "Óptimo"


def test_diferencia_vs_base_calculada():
    base = _scenario(nombre="Base", tasa_circularidad_pct=8, brecha_infraestructura_ton_dia=2, estado_legal="sin_gate")
    alt = _scenario(nombre="Alt", tasa_circularidad_pct=20, brecha_infraestructura_ton_dia=0, estado_legal="gate_activo", num_centros_acopio=1)
    result = compare_scenarios(_request([base, alt]))
    delta = result.escenarios[1].diferencia_vs_base
    assert delta["score"] == result.escenarios[1].score_circularidad - result.escenarios[0].score_circularidad


def test_resumen_comparativo_no_vacio():
    result = compare_scenarios(_request([_scenario(), _scenario(nombre="Alt", tasa_circularidad_pct=15)]))
    assert len(result.resumen_comparativo) > 20


def test_advertencia_si_tasa_cero():
    result = compare_scenarios(_request([_scenario(), _scenario(nombre="SinRec", tasa_circularidad_pct=0)]))
    assert any("SinRec" in warning for warning in result.advertencias)


def test_endpoint_200_caso_feliz():
    payload = _request([_scenario(), _scenario(nombre="Alt", tasa_circularidad_pct=15)]).model_dump(mode="json")
    response = _client().post("/scenarios/compare", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
