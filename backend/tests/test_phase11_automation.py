from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.automation.inference import KosmosInferenceError, inferred_value, validate_inferred_datum
from app.routers import admin
from app.routers.auth import UserInfo


def _client() -> TestClient:
    admin._tenants_mem.clear()
    app = FastAPI()
    app.include_router(admin.router, prefix="/admin")

    def _admin_user():
        return UserInfo(
            id="founder",
            nombre="Founder",
            email="founder@alquimia.mx",
            rol="admin",
            zm="ALL",
        )

    def _no_db():
        yield None

    app.dependency_overrides[admin.require_admin] = _admin_user
    app.dependency_overrides[admin.get_current_user] = _admin_user
    app.dependency_overrides[get_db] = _no_db
    return TestClient(app)


def _create_tenant(client: TestClient, *, municipio_id: str = "qro-capital", inegi_clave: str = "22014") -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "Queretaro",
            "estado_mx": "Queretaro",
            "municipio_id": municipio_id,
            "inegi_clave": inegi_clave,
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_create_tenant_triggers_initial_inference_with_traceability():
    client = _client()
    tenant = _create_tenant(client)

    profile = tenant["municipal_profile"]
    poblacion = profile["antecedentes"]["demografia"]["poblacion"]
    assert profile["provenance_status"] == "preliminar_pendiente_validacion"
    assert poblacion["value"] == 1049777
    assert poblacion["source"]["id"] == "inegi"
    assert poblacion["source"]["kind"] == "public"
    assert poblacion["source"]["extracted_at"]
    assert poblacion["method"] == "inegi_censo_2020_seed"
    assert poblacion["confidence"] == "inferred_high_confidence"
    assert poblacion["module_id"] == "city_baseline"
    assert poblacion["field_path"] == "antecedentes.demografia.poblacion"
    assert poblacion["kosmos_status"] == "accepted"
    assert poblacion["human_validation_state"] == "pending_human_validation"
    assert poblacion["display_status"] == "dato preliminar pendiente de validacion"
    assert poblacion["official"] is False
    assert tenant["audit_log"][-1]["action"] == "hermes_initial_inference_completed"
    assert tenant["audit_log"][-1]["payload"]["official_documents_auto_sent"] is False
    assert tenant["audit_log"][-1]["payload"]["status"] == "completed_with_pending_fields"


def test_pipeline_saves_partial_pending_results_for_unknown_source():
    client = _client()
    tenant = _create_tenant(client, municipio_id="demo-rural", inegi_clave="99999")
    profile = tenant["municipal_profile"]

    poblacion = profile["antecedentes"]["demografia"]["poblacion"]
    assert profile["antecedentes"]["_automation"]["inference"]["status"] == "partial"
    assert poblacion["human_validation_state"] == "pending_source"
    assert poblacion["kosmos_status"] == "accepted_pending_source"
    assert poblacion["pending_reason"] == "Clave INEGI sin fixture de poblacion"
    assert profile["mode"] == "carga_inicial"


def test_runtime_update_recalculates_dependencies_and_marks_20_percent_discrepancy():
    client = _client()
    tenant = _create_tenant(client)
    tenant_id = tenant["id"]
    payload = {
        "antecedentes": tenant["municipal_profile"]["antecedentes"],
        "mapa_social": tenant["municipal_profile"]["mapa_social"],
        "organigrama_servicio": tenant["municipal_profile"]["organigrama_servicio"],
        "provenance_status": "preliminar_pendiente_validacion",
    }
    payload["antecedentes"]["demografia"]["poblacion"]["value"] = 1400000

    res = client.patch(f"/admin/tenants/{tenant_id}/municipal-profile", json=payload)
    assert res.status_code == 200
    body = res.json()
    runtime = body["municipal_profile"]["antecedentes"]["_automation"]["runtime"]
    assert "city_baseline" in runtime["recalculated_modules"]
    assert runtime["discrepancies"][0]["field"] == "antecedentes.demografia.poblacion"
    assert runtime["discrepancies"][0]["delta_pct"] > 20
    assert runtime["discrepancies"][0]["status"] == "requiere_revision_humana"
    assert body["audit_log"][-1]["payload"]["automatic_stage_transition"] is False


def test_public_private_store_separation_and_no_cross_tenant_private_access():
    client = _client()
    qro = _create_tenant(client, municipio_id="qro-capital", inegi_clave="22014")
    mty = _create_tenant(client, municipio_id="monterrey", inegi_clave="19039")

    qro_summary = client.get(f"/admin/tenants/{qro['id']}/automation-summary").json()["automation"]
    mty_summary = client.get(f"/admin/tenants/{mty['id']}/automation-summary").json()["automation"]

    assert qro_summary["public_private_separation"]["public_store"] == "public_knowledge_base"
    assert qro_summary["public_private_separation"]["tenant_private_store"] == "tenant_private_store"
    assert qro_summary["public_private_separation"]["cross_tenant_private_access"] is False
    assert mty_summary["public_private_separation"]["cross_tenant_private_access"] is False
    qro_private = qro["municipal_profile"]["antecedentes"]["_automation"]["tenant_private_store"]["tenant_id"]
    mty_private = mty["municipal_profile"]["antecedentes"]["_automation"]["tenant_private_store"]["tenant_id"]
    assert qro_private != mty_private


def test_kosmos_rejects_inference_without_registered_module_destination():
    bad_registry = {"modules": [{"module_id": "otro_modulo"}]}
    datum = inferred_value(
        value=100,
        source_id="inegi",
        source_label="INEGI",
        method="test",
        confidence="inferred_high_confidence",
    )
    try:
        validate_inferred_datum(
            datum=datum,
            field_path="antecedentes.demografia.poblacion",
            registry=bad_registry,
        )
    except KosmosInferenceError as exc:
        assert "module destino no existe" in str(exc)
    else:
        raise AssertionError("KOSMOS debio rechazar modulo destino inexistente")


def test_kosmos_rejects_out_of_range_or_official_inference():
    registry = {"modules": [{"module_id": "city_baseline"}]}
    out_of_range = inferred_value(
        value=80_000_000,
        source_id="inegi",
        source_label="INEGI",
        method="test",
        confidence="inferred_high_confidence",
    )
    try:
        validate_inferred_datum(
            datum=out_of_range,
            field_path="antecedentes.demografia.poblacion",
            registry=registry,
        )
    except KosmosInferenceError as exc:
        assert "fuera de rango" in str(exc)
    else:
        raise AssertionError("KOSMOS debio rechazar poblacion fuera de rango")

    official = inferred_value(
        value=100,
        source_id="inegi",
        source_label="INEGI",
        method="test",
        confidence="inferred_high_confidence",
    )
    official["official"] = True
    try:
        validate_inferred_datum(
            datum=official,
            field_path="antecedentes.demografia.poblacion",
            registry=registry,
        )
    except KosmosInferenceError as exc:
        assert "oficial" in str(exc)
    else:
        raise AssertionError("KOSMOS debio rechazar inferencia oficial")
