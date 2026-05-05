from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.governance.checker import evaluate_governance
from app.governance.router import router
from app.governance.schemas import GovernanceRequest


def _request(**overrides) -> GovernanceRequest:
    data = {
        "municipio_id": "slp",
        "total_tests_passing": 646,
        "tsc_clean": True,
        "has_rate_limiting": True,
        "has_security_headers": True,
        "has_health_endpoint": True,
        "has_access_control": True,
        "cobertura_modulos": 9,
    }
    data.update(overrides)
    return GovernanceRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/governance")
    return TestClient(app)


def test_municipio_vacio_bloqueado():
    result = evaluate_governance(_request(municipio_id=""))
    assert result.status == "bloqueado"


def test_score_maximo_todos_flags_activos():
    result = evaluate_governance(_request(total_tests_passing=650, cobertura_modulos=10))
    assert result.score_gobernanza == 100
    assert result.status == "aprobado"


def test_score_parcial_produce_observaciones():
    result = evaluate_governance(
        _request(
            total_tests_passing=650,
            tsc_clean=False,
            has_security_headers=False,
            cobertura_modulos=10,
        )
    )
    assert result.status == "observaciones"


def test_riesgos_mitigados_cuando_flags_activos():
    result = evaluate_governance(_request(has_access_control=True, has_rate_limiting=True))
    riesgo_doble = next(r for r in result.riesgos if r.id == "doble_conteo_rsu")
    riesgo_legal = next(r for r in result.riesgos if r.id == "legal_gate_sin_base")
    assert riesgo_doble.estado == "mitigado"
    assert riesgo_legal.estado == "mitigado"


def test_dod_tiene_6_items():
    result = evaluate_governance(_request())
    assert len(result.dod) >= 6


def test_resumen_contiene_score():
    result = evaluate_governance(_request())
    assert "Score de gobernanza" in result.resumen


def test_endpoint_200_caso_feliz():
    response = _client().post("/governance/evaluate", json=_request().model_dump(mode="json"))
    assert response.status_code == 200
    assert response.json()["status"] in ("aprobado", "observaciones", "bloqueado")
