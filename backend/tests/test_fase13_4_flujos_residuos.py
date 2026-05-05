from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.waste_flows.engine import calculate_waste_flows
from app.waste_flows.router import router
from app.waste_flows.schemas import DiagnosticoCircularidadRequest


def _request(**overrides) -> DiagnosticoCircularidadRequest:
    data = {
        "municipio_id": "slp",
        "generacion_total_ton_dia": 10.0,
        "mix_corrientes": {"organico": 0.5, "papel": 0.3, "otro": 0.2},
        "infraestructura_actual": [],
        "tasa_recuperacion_actual_pct": 25.0,
    }
    data.update(overrides)
    return DiagnosticoCircularidadRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/waste-flows")
    return TestClient(app)


def test_municipio_vacio_produce_blocked():
    result = calculate_waste_flows(_request(municipio_id=""))

    assert result.status == "blocked"


def test_generacion_cero_produce_blocked():
    result = calculate_waste_flows(_request(generacion_total_ton_dia=0))

    assert result.status == "blocked"


def test_sin_recuperacion_produce_warning():
    result = calculate_waste_flows(
        _request(
            mix_corrientes={"otro": 1.0},
            tasa_recuperacion_actual_pct=0.0,
        )
    )

    assert result.status == "warning"
    assert any("sin recuperación activa" in w.lower() for w in result.advertencias)


def test_flujos_calculados_correctamente():
    result = calculate_waste_flows(
        _request(mix_corrientes={"organico": 0.5, "papel": 0.3, "otro": 0.2})
    )

    organico = next(f for f in result.flujos if f.nombre == "organico")
    papel = next(f for f in result.flujos if f.nombre == "papel")
    assert abs(organico.toneladas_dia - 5.0) < 0.0001
    assert abs(papel.toneladas_dia - 3.0) < 0.0001
    assert organico.es_recuperable is True
    assert papel.es_recuperable is True


def test_brecha_tiene_formula_fuente():
    result = calculate_waste_flows(_request())

    assert result.brecha.formula
    assert "SEMARNAT" in result.brecha.fuente_factor


def test_tasa_potencial_mayor_o_igual_actual():
    result = calculate_waste_flows(_request())

    assert result.tasa_circularidad_potencial_pct >= result.tasa_circularidad_actual_pct


def test_endpoint_200_caso_feliz():
    response = _client().post(
        "/waste-flows/diagnosis",
        json=_request().model_dump(mode="json"),
    )

    assert response.status_code == 200
