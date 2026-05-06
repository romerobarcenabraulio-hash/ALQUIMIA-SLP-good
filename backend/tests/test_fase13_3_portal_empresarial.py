from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.organizations.assessment import evaluate_organizational_circularity
from app.organizations.router import router
from app.organizations.schemas import (
    OrganizationActivityType,
    OrganizationalCircularityRequest,
)


def _request(**overrides) -> OrganizationalCircularityRequest:
    data = {
        "organization_id": "org-1",
        "tipo_actividad": OrganizationActivityType.hotel,
        "municipio_id": "slp",
        "nombre": "Hotel Prueba",
        "empleados": 50,
        "variables": {"habitaciones": 80, "ocupacion_pct": 70},
    }
    data.update(overrides)
    return OrganizationalCircularityRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/organizations")
    return TestClient(app)


def test_hotel_genera_plan_contenedores_y_acciones():
    result = evaluate_organizational_circularity(_request())

    assert len(result.container_plan) >= 3
    assert len(result.acciones_30_60_90) == 3
    assert result.status == "warning"
    assert any("Centro de Acopio" in w for w in result.warnings)


def test_hospital_activa_advertencia_residuos_no_rsu():
    result = evaluate_organizational_circularity(
        _request(
            tipo_actividad=OrganizationActivityType.hospital,
            variables={"camas": 120, "consultas_dia": 300, "tiene_residuos_regulados": True},
        )
    )

    assert result.residuos_no_rsu_detectados
    assert "proveedor autorizado" in result.advertencia_residuos_no_rsu.lower()
    assert result.proveedor_ambiental_requerido is True
    for stream in result.waste_streams:
        if not stream.es_rsu:
            assert stream.advertencia


def test_municipio_vacio_produce_blocked():
    result = evaluate_organizational_circularity(_request(municipio_id=""))

    assert result.status == "blocked"
    assert any("municipio_id" in b for b in result.blockers)


def test_rsu_y_no_rsu_separados():
    result = evaluate_organizational_circularity(
        _request(
            tipo_actividad=OrganizationActivityType.empresa,
            variables={"turnos": 2, "residuos_mixtos": True},
        )
    )

    assert any(s.es_rsu for s in result.waste_streams)
    assert any(not s.es_rsu for s in result.waste_streams)
    for stream in result.waste_streams:
        if not stream.es_rsu:
            assert stream.requiere_proveedor_autorizado is True


def test_acciones_no_son_genericas():
    hotel = evaluate_organizational_circularity(
        _request(tipo_actividad=OrganizationActivityType.hotel)
    )
    hospital = evaluate_organizational_circularity(
        _request(
            tipo_actividad=OrganizationActivityType.hospital,
            variables={"camas": 90, "consultas_dia": 150},
        )
    )

    assert hotel.acciones_30_60_90[0].accion != hospital.acciones_30_60_90[0].accion


def test_calculo_generacion_tiene_formula_fuente_rango():
    result = evaluate_organizational_circularity(_request())

    assert result.calculo_generacion.formula
    assert result.calculo_generacion.fuente_factor
    assert result.calculo_generacion.unidad
    assert result.calculo_generacion.incertidumbre_rango[0] < result.calculo_generacion.incertidumbre_rango[1]


def test_endpoint_200_ready_caso_feliz():
    response = _client().post(
        "/organizations/assessment",
        json=_request().model_dump(mode="json"),
    )

    assert response.status_code == 200
    assert response.json()["status"] in ("ready", "warning")
