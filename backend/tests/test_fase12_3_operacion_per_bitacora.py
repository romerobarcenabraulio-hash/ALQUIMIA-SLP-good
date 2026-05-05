from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.operations.per import build_per_operations_plan
from app.operations.per_schemas import (
    LogEventInput,
    OperationDataSource,
    OperationEvidence,
    PerPlanRequest,
    PerRouteInput,
)
from app.operations.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/operations")
    return TestClient(app)


def _source(confidence: float = 0.7) -> OperationDataSource:
    return OperationDataSource(
        source_id="per-test-source",
        name="Plan operativo mensual trazable",
        organization="ALQUIMIA QA",
        source_type="propuesta_operativa_estimada",
        confidence=confidence,
        explanation="Fuente de prueba para PER mensual con datos estimados declarados.",
    )


def _evidence() -> OperationEvidence:
    return OperationEvidence(
        evidence_id="ev-test-1",
        evidence_type="registro_operativo",
        description="Registro de programacion mensual de ruta.",
        captured_at="2026-05-01T08:00:00Z",
        captured_by="coordinacion",
        source="bitacora_operativa",
    )


def _request(**overrides) -> PerPlanRequest:
    data = {
        "city_id": "SLP",
        "periodo_mes": "2026-05",
        "routes": [
            PerRouteInput(
                route_id="ruta-1",
                municipio_id="slp",
                zona_id="Z1",
                colonias=["Centro", "Tangamanga"],
                frecuencia="Lunes, miercoles y viernes",
                frecuencia_por_semana=3,
                camion_unidad="Unidad RSU-01",
                responsable="Coordinacion operativa municipal",
                ventana_temporal="07:00-12:00",
            )
        ],
        "log_events": [
            LogEventInput(
                fecha="2026-05-01",
                event_type="evidencia_ruta",
                evidencia=[_evidence()],
                municipio_id="slp",
                route_or_zone_id="Z1",
                actor_responsable="Coordinacion operativa municipal",
                accion_siguiente="Revisar recorrido al cierre semanal.",
            )
        ],
        "source": _source(),
    }
    data.update(overrides)
    return PerPlanRequest(**data)


def test_ruta_requiere_municipio_zona_frecuencia_y_responsable():
    plan = build_per_operations_plan(
        _request(
            routes=[
                PerRouteInput(
                    route_id="ruta-bloqueada",
                    municipio_id="",
                    zona_id="",
                    colonias=[],
                    frecuencia="",
                    frecuencia_por_semana=0,
                    camion_unidad="",
                    responsable="",
                    ventana_temporal="",
                )
            ],
            log_events=[],
        )
    )

    assert plan.status == "blocked"
    joined = " ".join(plan.blockers).lower()
    assert "municipio" in joined
    assert "zona" in joined
    assert "frecuencia" in joined
    assert "responsable" in joined
    assert plan.routes == []


def test_bitacora_conserva_fecha_evidencia_y_tipo_evento():
    plan = build_per_operations_plan(_request())

    assert plan.status == "ready"
    event = plan.log_events[0]
    assert event.fecha == "2026-05-01"
    assert event.event_type == "evidencia_ruta"
    assert event.evidencia[0].evidence_id == "ev-test-1"
    assert event.municipio_id == "slp"
    assert event.route_or_zone_id == "Z1"
    assert event.actor_responsable
    assert event.accion_siguiente


def test_per_explica_presion_estado_respuesta_en_lenguaje_humano():
    plan = build_per_operations_plan(_request())

    route = plan.routes[0]
    assert route.per.presion.startswith("Presion:")
    assert route.per.estado.startswith("Estado:")
    assert route.per.respuesta.startswith("Respuesta:")
    assert "PER se lee" in route.per.human_explanation


def test_municipio_o_responsable_vacio_devuelve_blocked_no_error_generico():
    response = _client().post(
        "/operations/per-plan",
        json=_request(
            routes=[
                PerRouteInput(
                    route_id="ruta-1",
                    municipio_id="",
                    zona_id="Z1",
                    colonias=["Centro"],
                    frecuencia="Lunes",
                    frecuencia_por_semana=1,
                    camion_unidad="Unidad RSU-01",
                    responsable="",
                    ventana_temporal="07:00-10:00",
                )
            ],
            log_events=[],
        ).model_dump(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["routes"] == []
    assert "responsable" in " ".join(payload["blockers"]).lower()


def test_evento_sin_evidencia_bloquea_con_accion_siguiente():
    plan = build_per_operations_plan(
        _request(
            log_events=[
                LogEventInput(
                    fecha="2026-05-01",
                    event_type="recoleccion",
                    evidencia=[],
                    municipio_id="slp",
                    route_or_zone_id="Z1",
                    actor_responsable="Coordinacion",
                    accion_siguiente="Completar registro.",
                )
            ]
        )
    )

    assert plan.status == "blocked"
    assert "evidencia" in " ".join(plan.blockers).lower()
    assert plan.next_action


def test_evidencia_con_campos_vacios_bloquea_no_ready():
    response = _client().post(
        "/operations/per-plan",
        json=_request(
            log_events=[
                LogEventInput(
                    fecha="2026-05-01",
                    event_type="evidencia_ruta",
                    evidencia=[
                        OperationEvidence(
                            evidence_id="",
                            evidence_type="",
                            description="",
                            captured_at="",
                            captured_by="",
                            source="",
                        )
                    ],
                    municipio_id="slp",
                    route_or_zone_id="Z1",
                    actor_responsable="Coordinacion",
                    accion_siguiente="Completar evidencia.",
                )
            ]
        ).model_dump(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["routes"] == []
    joined = " ".join(payload["blockers"]).lower()
    for field in ("evidence_id", "evidence_type", "description", "captured_at", "captured_by", "source"):
        assert field in joined
    assert payload["next_action"]


def test_endpoint_responde_200_en_caso_feliz():
    response = _client().post("/operations/per-plan", json=_request().model_dump())

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["routes"]
    assert payload["log_events"]
    assert payload["monthly_visits_estimate"] > 0
    assert payload["calculation_annex"]


def test_resultado_incluye_formula_fuente_unidad_y_ayuda():
    plan = build_per_operations_plan(_request())

    assert plan.metric_help_text
    assert plan.per_help_text
    assert plan.calculation_annex
    item = plan.calculation_annex[0]
    assert item.formula == "suma_frecuencias_semanales * 4.345"
    assert item.unit == "visitas/mes"
    assert item.source.source_id == "per-test-source"
    assert item.explanation


def test_no_aparecen_terminos_de_fase_12_4_o_documentos_en_per():
    plan = build_per_operations_plan(_request())

    text = " ".join(
        [
            plan.metric_help_text,
            plan.per_help_text,
            plan.next_action,
            " ".join(route.help_text for route in plan.routes),
            " ".join(route.per.presion + route.per.estado + route.per.respuesta for route in plan.routes),
            " ".join(event.accion_siguiente for event in plan.log_events),
        ]
    ).lower()
    for forbidden in (
        "multa",
        "sancion",
        "infraccion",
        "debido proceso",
        "documento oficial",
        "residuos regulados",
        "peligrosos",
        "especiales",
    ):
        assert forbidden not in text
