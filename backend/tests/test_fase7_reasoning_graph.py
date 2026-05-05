"""Fase 7 - pruebas del ReasoningGraph causal."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.agents.agora import PlanInput
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.reasoning.graph_builder import build_reasoning_graph
from app.reasoning.router import router
from app.reasoning.schemas import ReasoningGraphRequest
from app.services.calculator import calcular_scenario
from app.schemas.simulate import ScenarioInput


def _request(gen_percapita=0.9, ingresos=1_000_000):
    resultados = {
        "rsu_total_ton_dia": 100.0 * gen_percapita,
        "co2e_evitadas_anual": 1200.0,
        "ocupacion_cas": 75.0,
        "camiones_requeridos": {"organico": 2, "plastico": 1},
        "ingresos_brutos": ingresos,
    }
    return ReasoningGraphRequest(
        scenario_id="SCN-TEST",
        zm="SLP",
        municipios=["slp"],
        scenario={"zm_activa": "SLP", "municipios_activos": ["slp"], "horizonte": 3},
        resultados=resultados,
        data_provenance={
            "kpis": [
                {
                    "kpi_id": "gen_percapita_kg_dia",
                    "kpi_label": "Generacion per capita",
                    "valor": gen_percapita,
                    "unidad": "kg/hab/dia",
                    "provenance": {
                        "tipo": "oficial",
                        "fuente_nombre": "Fuente test",
                        "confianza": 0.9,
                    },
                }
            ],
            "advertencias": [],
            "score_datos": 90,
        },
        market_summary={
            "pct_colocado_global": 50.0,
            "total_faltante_ton_anio": 500.0,
            "warnings": ["Faltante de comprador degrada ingreso."],
        },
        macro_impact_summary={
            "generators_count": 1,
            "warnings": ["Macrogenerador benchmark requiere verificacion."],
            "provenance": {"algoritmo": "macro_impact_fase6_mvp"},
        },
        legal_summary={"agora_bloqueado": True},
        warnings=["Dato estimado en escenario."],
    )


def test_kpis_principales_tienen_nodo_y_edge():
    graph = build_reasoning_graph(_request())
    node_ids = graph.node_ids()

    for node_id in ("kpi:rsu_total_ton_dia", "kpi:co2e_evitadas_anual", "kpi:ocupacion_cas", "kpi:camiones_requeridos", "kpi:ingresos_brutos"):
        assert node_id in node_ids
        assert any(e.from_node == node_id or e.to_node == node_id for e in graph.edges)


def test_cambiar_generacion_percapita_cambia_nodo_rsu():
    low = build_reasoning_graph(_request(gen_percapita=0.8))
    high = build_reasoning_graph(_request(gen_percapita=1.1))

    low_rsu = next(n for n in low.nodes if n.node_id == "kpi:rsu_total_ton_dia")
    high_rsu = next(n for n in high.nodes if n.node_id == "kpi:rsu_total_ton_dia")
    assert high_rsu.value > low_rsu.value


def test_market_degrada_ingreso_con_explicacion():
    graph = build_reasoning_graph(_request(ingresos=2_000_000))

    assert "risk:market_colocacion" in graph.node_ids()
    assert any(e.relation.value == "decreases" and e.to_node == "kpi:ingresos_brutos" for e in graph.edges)


def test_warning_estimado_genera_nodo_warning():
    graph = build_reasoning_graph(_request())

    warnings = [n for n in graph.nodes if n.type.value == "warning"]
    assert warnings
    assert any("estimado" in str(n.value).lower() for n in warnings)


def test_fuente_data_provenance_conecta_a_kpi():
    graph = build_reasoning_graph(_request())

    assert "source:gen_percapita_kg_dia" in graph.node_ids()
    assert any(
        e.from_node == "source:gen_percapita_kg_dia" and e.to_node == "kpi:gen_percapita_kg_dia"
        for e in graph.edges
    )


def test_documento_juridico_bloqueado_genera_edge_blocks():
    graph = build_reasoning_graph(_request())

    assert any(e.relation.value == "blocks" for e in graph.edges)
    assert "document:paquete_juridico" in graph.node_ids()


def test_agora_payload_incluye_reasoning_graph():
    graph = build_reasoning_graph(_request())
    plan_input = PlanInput(
        municipio="SLP",
        zm="SLP",
        scenario_json={"zm": "SLP"},
        kpis_json={},
        reasoning_graph=graph.model_dump(mode="json"),
    )
    bundle = build_bundle_from_plan_input(plan_input, municipios_activos=["slp"])
    bundle.inputs_usuario["reasoning_graph"] = plan_input.reasoning_graph

    assert "reasoning_graph" in bundle.inputs_usuario
    assert len(bundle.inputs_usuario["reasoning_graph"]["nodes"]) > 0


def test_nodo_critico_tiene_source_o_confidence():
    graph = build_reasoning_graph(_request())

    for node in graph.nodes:
        if node.type.value in ("source", "kpi", "risk", "decision"):
            assert node.confidence is not None
            assert node.source_type is not None


def test_explicacion_no_es_generica_y_tiene_node_ids():
    app = FastAPI()
    app.include_router(router, prefix="/reasoning")
    client = TestClient(app)
    graph = build_reasoning_graph(_request())

    r = client.post("/reasoning/explain", json={"graph": graph.model_dump(mode="json"), "pregunta": "Por que baja ingreso por comprador?"})
    assert r.status_code == 200
    data = r.json()
    assert data["graph_node_ids"]
    assert "risk:market_colocacion" in data["graph_node_ids"]
    assert data["evidencia"]


def test_endpoint_graph_y_get_por_scenario_id():
    app = FastAPI()
    app.include_router(router, prefix="/reasoning")
    client = TestClient(app)

    r = client.post("/reasoning/graph", json=_request().model_dump(mode="json"))
    assert r.status_code == 200
    scenario_id = r.json()["scenario_id"]

    stored = client.get(f"/reasoning/graph/{scenario_id}")
    assert stored.status_code == 200
    assert stored.json()["scenario_id"] == scenario_id


def test_no_se_rompe_calculadora():
    scenario = ScenarioInput(zm_activa="SLP")
    result = calcular_scenario(scenario)

    assert result.rsu_total_ton_dia > 0
