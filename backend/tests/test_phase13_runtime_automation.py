from copy import deepcopy

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.automation.runtime import recommendation_for_module
from app.routers import admin
from app.routers.auth import UserInfo


def _client() -> TestClient:
    admin._tenants_mem.clear()
    admin._tenant_documents_mem.clear()
    app = FastAPI()
    app.include_router(admin.router, prefix="/admin")

    def _admin_user():
        return UserInfo(id="founder", nombre="Founder", email="founder@alquimia.mx", rol="admin", zm="ALL")

    def _no_db():
        yield None

    app.dependency_overrides[admin.require_admin] = _admin_user
    app.dependency_overrides[admin.get_current_user] = _admin_user
    app.dependency_overrides[get_db] = _no_db
    return TestClient(app)


def _create_tenant(client: TestClient) -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "Queretaro",
            "estado_mx": "Queretaro",
            "municipio_id": "qro-runtime",
            "inegi_clave": "22014",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_phase13_data_change_recalculates_dependency_and_marks_discrepancy():
    client = _client()
    tenant = _create_tenant(client)
    tenant_id = tenant["id"]
    profile = deepcopy(tenant["municipal_profile"])
    profile["antecedentes"]["presidente_municipal"] = {
        "valor": "Pendiente validacion humana",
        "fuente": {"label": "Carga cliente", "status": "pendiente_verificacion"},
    }
    profile["antecedentes"]["demografia"]["poblacion"] = 1_400_000

    res = client.patch(
        f"/admin/tenants/{tenant_id}/municipal-profile",
        json={
            "antecedentes": profile["antecedentes"],
            "mapa_social": profile["mapa_social"],
            "organigrama_servicio": profile["organigrama_servicio"],
            "provenance_status": profile["provenance_status"],
        },
    )

    assert res.status_code == 200
    body = res.json()
    runtime = body["municipal_profile"]["automation"]["runtime"]
    assert runtime["events"][0]["event_type"] == "dato_actualizado_por_cliente"
    assert runtime["recalculation_log"]
    assert runtime["recalculation_log"][0]["field_path"] == "antecedentes.presidente_municipal"
    assert "antecedentes_municipales" in runtime["recalculation_log"][0]["targets"]
    assert "city_baseline" in runtime["recalculation_log"][0]["targets"]
    assert runtime["recalculation_log"][0]["dependency_mode"] == "produces_data_for"
    discrepancy = runtime["discrepancies"][0]
    assert discrepancy["field"] == "antecedentes.demografia.poblacion"
    assert discrepancy["delta_pct"] > 20
    assert discrepancy["inferred_source"]["source_id"] == "inegi"
    assert discrepancy["not_definitive_error"] is True
    assert body["state"]["current_stage"] == "validation"
    assert all(gate["status"] != "cerrado" for gate in body["gates"])


def test_phase13_runtime_event_generates_traceable_recommendations_without_external_dispatch():
    client = _client()
    tenant = _create_tenant(client)
    res = client.post(
        f"/admin/tenants/{tenant['id']}/runtime-events",
        json={"event_type": "gate_proximo", "payload": {"gate_id": "G1", "days_until_gate": 10}},
    )

    assert res.status_code == 200
    runtime = res.json()["municipal_profile"]["automation"]["runtime"]
    recommendations = runtime["recommendations"]
    registry_ids = {module["module_id"] for module in admin._load_capability_registry()["modules"]}
    assert len(recommendations) >= 3
    for rec in recommendations[:3]:
        assert rec["module_id"] in registry_ids
        assert rec["recommendation"]
        assert rec["justification"]
        assert rec["source"]["official"] is False
        assert rec["source"]["field_path"]
        assert rec["source"]["source_status"] in {
            "pending_human_validation",
            "pending_source",
            "pendiente_verificacion",
        }
        assert rec["source"]["evidence_basis"] in {
            "public_source",
            "tenant_private_store",
            "calculation",
            "pending_source",
        }
        assert (
            rec["source"].get("provenance")
            or rec["source"].get("calculation")
            or rec["source"]["source_status"] == "pending_source"
        )
        assert rec["confidence"]
        assert rec["trade_offs"]
        assert rec["human_action_options"] == ["aceptar", "rechazar", "ajustar"]
        assert rec["status"] == "pending_human_decision"
    assert runtime["external_dispatches"] == []
    assert runtime["automatic_gate_changes"] is False
    assert runtime["automatic_stage_transitions"] is False


def test_phase13_recommendations_use_calculation_and_reject_orphan_module():
    client = _client()
    tenant = _create_tenant(client)
    profile = tenant["municipal_profile"]
    registry = admin._load_capability_registry()

    rec = recommendation_for_module(
        "city_baseline",
        cause="dato_actualizado_por_cliente",
        event_id="evt-test",
        profile=profile,
        registry=registry,
    )

    assert rec is not None
    assert rec["module_id"] == "city_baseline"
    assert rec["source"]["evidence_basis"] == "calculation"
    assert rec["source"]["calculation"]["formula"] == "poblacion * generacion_kg_hab_dia / 1000 = toneladas_dia"
    assert rec["source"]["calculation"]["outputs"]["tons_day"] > 0
    assert rec["source"]["official"] is False
    assert "t/dia" in rec["recommendation"]

    orphan = recommendation_for_module(
        "modulo_inexistente",
        cause="dato_actualizado_por_cliente",
        event_id="evt-test",
        profile=profile,
        registry=registry,
    )
    assert orphan is None


def test_phase13_human_can_accept_reject_adjust_recommendations_and_resolve_discrepancy():
    client = _client()
    tenant = _create_tenant(client)
    profile = deepcopy(tenant["municipal_profile"])
    profile["antecedentes"]["presidente_municipal"] = {"valor": "Pendiente validacion humana"}
    profile["antecedentes"]["demografia"]["poblacion"] = 1_400_000
    patched = client.patch(
        f"/admin/tenants/{tenant['id']}/municipal-profile",
        json={
            "antecedentes": profile["antecedentes"],
            "mapa_social": profile["mapa_social"],
            "organigrama_servicio": profile["organigrama_servicio"],
            "provenance_status": profile["provenance_status"],
        },
    ).json()
    runtime = patched["municipal_profile"]["automation"]["runtime"]
    rec_id = runtime["recommendations"][0]["recommendation_id"]
    discrepancy_id = runtime["discrepancies"][0]["discrepancy_id"]

    accepted = client.post(
        f"/admin/tenants/{tenant['id']}/runtime/recommendations/{rec_id}/decision",
        json={"action": "ajustar", "notes": "Founder ajusta alcance", "adjusted_recommendation": "Usar escenario conservador hasta validacion."},
    )
    assert accepted.status_code == 200
    recs = accepted.json()["municipal_profile"]["automation"]["runtime"]["recommendations"]
    decided = next(rec for rec in recs if rec["recommendation_id"] == rec_id)
    assert decided["status"] == "human_ajustar"
    assert decided["adjusted_recommendation"] == "Usar escenario conservador hasta validacion."

    resolved = client.post(
        f"/admin/tenants/{tenant['id']}/runtime/discrepancies/{discrepancy_id}/decision",
        json={"action": "marcar_revision_pendiente", "notes": "Esperar fuente municipal"},
    )
    assert resolved.status_code == 200
    discrepancies = resolved.json()["municipal_profile"]["automation"]["runtime"]["discrepancies"]
    assert next(d for d in discrepancies if d["discrepancy_id"] == discrepancy_id)["status"] == "marcar_revision_pendiente"
