from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.infrastructure.plan import build_infrastructure_plan
from app.infrastructure.schemas import InfrastructurePlanRequest
from app.infrastructure.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/infrastructure")
    return TestClient(app)


def _request(**overrides) -> InfrastructurePlanRequest:
    data = {
        "municipio_id": "slp",
        "zona_ids": ["zona_1"],
        "rsu_capturable_ton_dia": 5.0,
        "horizonte_años": 3,
        "mix_centros": {"P": 1},
    }
    data.update(overrides)
    return InfrastructurePlanRequest(**data)


def test_centro_sin_municipio_produce_blocked():
    result = build_infrastructure_plan(_request(municipio_id=""))

    assert result.status == "blocked"
    assert any("municipio" in b.lower() for b in result.blockers)


def test_mix_vacio_produce_blocked():
    result = build_infrastructure_plan(_request(mix_centros={}))

    assert result.status == "blocked"
    assert result.centros == []
    assert result.capacidad_instalada_ton_dia == 0
    assert result.brecha_ton_dia == result.rsu_capturable_ton_dia


def test_capacidad_vs_flujo_capturable():
    result = build_infrastructure_plan(
        _request(mix_centros={"P": 2, "M": 1}, rsu_capturable_ton_dia=5.0)
    )

    assert result.calculo_brecha.formula == "capturable - capacidad_instalada"
    assert result.brecha_ton_dia == result.rsu_capturable_ton_dia - result.capacidad_instalada_ton_dia
    assert result.calculo_brecha.unidad == "ton/día"
    assert result.capacidad_instalada_ton_dia == 25.0


def test_sobredimensionado_produce_warning():
    result = build_infrastructure_plan(
        _request(mix_centros={"P": 2, "M": 1}, rsu_capturable_ton_dia=10.0)
    )

    assert result.status == "warning"
    assert any("sobredimensionado" in w.lower() for w in result.warnings)


def test_ubicacion_sin_validacion_es_propuesta():
    result = build_infrastructure_plan(_request(mix_centros={"P": 1, "M": 1}))

    assert all(c.estado == "propuesto" for c in result.centros)
    assert all(c.municipio_id for c in result.centros)
    assert all(c.zona_id for c in result.centros)


def test_calculo_brecha_tiene_formula_fuente_unidad():
    result = build_infrastructure_plan(_request(mix_centros={"P": 1}))

    assert result.calculo_brecha.formula
    assert result.calculo_brecha.fuente_capturable
    assert result.calculo_brecha.fuente_capacidad
    assert result.calculo_brecha.unidad
    assert result.calculo_brecha.explicacion


def test_endpoint_200_ready_caso_feliz():
    response = _client().post("/infrastructure/plan", json=_request().model_dump(mode="json"))

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in ("ready", "warning")
    assert isinstance(payload["capacidad_instalada_ton_dia"], (int, float))


def test_endpoint_200_blocked_sin_municipio():
    response = _client().post(
        "/infrastructure/plan",
        json=_request(municipio_id="").model_dump(mode="json"),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["centros"] == []
