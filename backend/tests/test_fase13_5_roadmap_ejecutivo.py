from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.roadmap.builder import build_roadmap
from app.roadmap.router import router
from app.roadmap.schemas import RoadmapMunicipalRequest


def _request(**overrides) -> RoadmapMunicipalRequest:
    data = {
        "municipio_id": "slp",
        "generacion_ton_dia": 10.0,
        "tasa_circularidad_actual_pct": 8.0,
        "brecha_infraestructura_ton_dia": 3.0,
        "tiene_macrogeneradores": True,
        "tiene_residuos_regulados": True,
        "corrientes_criticas": ["organico", "plastico"],
        "estado_legal": "gate_activo",
    }
    data.update(overrides)
    return RoadmapMunicipalRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/roadmap")
    return TestClient(app)


def test_municipio_vacio_blocked():
    result = build_roadmap(_request(municipio_id=""))
    assert result.status == "blocked"


def test_generacion_cero_blocked():
    result = build_roadmap(_request(generacion_ton_dia=0))
    assert result.status == "blocked"


def test_minimo_6_acciones_generadas():
    result = build_roadmap(_request())
    assert len(result.acciones) >= 6


def test_brecha_infraestructura_genera_accion_critica_30dias():
    result = build_roadmap(_request(brecha_infraestructura_ton_dia=5.0))
    assert any(a.horizonte.value == "30_dias" and a.prioridad.value == "critica" for a in result.acciones)


def test_residuos_regulados_genera_accion_critica():
    result = build_roadmap(_request(tiene_residuos_regulados=True))
    assert any(
        a.horizonte.value == "30_dias"
        and a.prioridad.value == "critica"
        and ("proveedor" in a.titulo.lower() or "semarnat" in a.titulo.lower())
        for a in result.acciones
    )


def test_kpi_meta_tiene_al_menos_2_entradas():
    result = build_roadmap(_request())
    assert len(result.kpi_meta_90_dias) >= 2


def test_resumen_ejecutivo_no_vacio():
    result = build_roadmap(_request())
    assert isinstance(result.resumen_ejecutivo, str)
    assert len(result.resumen_ejecutivo) > 20


def test_endpoint_200_caso_feliz():
    response = _client().post("/roadmap/generate", json=_request().model_dump(mode="json"))
    assert response.status_code == 200
    assert response.json()["status"] in ("ready", "warning")
