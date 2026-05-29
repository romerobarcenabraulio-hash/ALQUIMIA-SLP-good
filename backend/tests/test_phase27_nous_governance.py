from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.routers import admin
from app.routers.auth import UserInfo


def _client() -> TestClient:
    admin._tenants_mem.clear()
    admin._tenant_documents_mem.clear()
    admin._analytics_audit_mem.clear()
    for items in admin._nous_mem.values():
        items.clear()

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


def _tenant(client: TestClient) -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "tenant-governance",
            "estado_mx": "Queretaro",
            "municipio_id": "tenant-governance",
            "inegi_clave": "22014",
            "tier_comercial": "operacion_completa",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    tenant = res.json()
    assert client.patch(f"/admin/tenants/{tenant['id']}", json={"active_capabilities": ["M17"]}).status_code == 200
    consent = client.patch(
        f"/admin/tenants/{tenant['id']}/analytics-consent",
        json={"aggregated_anonymous_analytics": True, "consent_source": "contrato://analytics", "consented_by": "Founder"},
    )
    assert consent.status_code == 200
    return consent.json()


def _pattern(client: TestClient, *, bias: str = "passed") -> dict:
    created = client.post(
        "/admin/nous/patterns",
        json={
            "pattern_layer": 3,
            "pattern_description_natural": "Sugerimos revisar el supuesto operativo con evidencia agregada anonima.",
            "pattern_description_technical": {
                "module_id": "M17",
                "municipality_profile_comparable": {"population_range": "200k_500k", "region": "centro"},
                "marcos_standards_check": {"status": "approved", "standards_codes": ["GRI 306-3"], "automatic_publication": False},
            },
            "observations_count": 30,
            "contributing_tenant_profiles": [{"population_range": "200k_500k", "region": "centro"}],
            "confidence_level": "robusto",
        },
    )
    assert created.status_code == 200
    pattern = created.json()
    assert client.patch(f"/admin/nous/patterns/{pattern['id']}/review", json={"action": "approve_internal"}).status_code == 200
    gates = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/publication-gates",
        json={
            "bias_check_status": bias,
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    )
    assert gates.status_code == 200
    return gates.json()


def _publish(client: TestClient, pattern_id: str) -> dict:
    res = client.post(f"/admin/nous/patterns/{pattern_id}/publish", json={"target_modules": ["M17"], "approved_by": "Founder"})
    assert res.status_code == 200
    return res.json()


def test_phase27_self_report_includes_client_feedback():
    client = _client()
    tenant = _tenant(client)
    pattern = _publish(client, _pattern(client)["id"])
    suggestion = client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17").json()["suggestions"][0]

    feedback = client.post(
        f"/admin/tenants/{tenant['id']}/nous/suggestions/{suggestion['suggestion_id']}/feedback",
        json={"action": "reject", "role": "Tesorero", "rejection_reason": "La medicion local fue distinta."},
    )
    assert feedback.status_code == 200

    report = client.get("/admin/nous/self-report")
    assert report.status_code == 200
    body = report.json()
    assert body["patterns_detected"] == 1
    assert body["patterns_approved"] == 1
    assert body["suggestions_rejected"] == 1
    assert body["main_rejection_reasons"]["La medicion local fue distinta."] == 1
    assert body["supreme_recommendation"] == "continuar_operacion_controlada"
    assert body["kosmos_policy_validation"]["capability_registry_auto_update"] is False
    assert body["bios_archive"]["silent_deletion_allowed"] is False
    assert body["automatic_publication"] is False
    assert body["black_box_model"] is False
    assert pattern["published_to_clients"] is True


def test_phase27_quarterly_audit_retires_bias_fail_and_marks_low_performance():
    client = _client()
    bias_pattern = _pattern(client, bias="failed")
    healthy_pattern = _publish(client, _pattern(client)["id"])

    retired = client.post(
        f"/admin/nous/patterns/{healthy_pattern['id']}/governance",
        json={"action": "mark_under_review", "reason": "performance peor que baseline", "decided_by": "AUDITOR"},
    )
    assert retired.status_code == 200
    assert retired.json()["pattern_status"] == "under_review"
    assert retired.json()["published_to_clients"] is False

    audit = client.post("/admin/nous/governance/quarterly-audit")
    assert audit.status_code == 200
    actions = audit.json()["actions"]
    assert any(item["id"] == bias_pattern["id"] and item["pattern_status"] == "retired_bias" for item in actions)
    assert audit.json()["self_report"]["patterns_retired"] >= 1
    assert audit.json()["self_report"]["supreme_recommendation"] == "pausar_y_revisar_sesgo"


def test_phase27_founder_pause_stops_client_publication():
    client = _client()
    tenant = _tenant(client)
    pattern = _publish(client, _pattern(client)["id"])
    assert client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17").json()["suggestions"]

    paused = client.post(
        "/admin/nous/governance/pause",
        json={"reason": "Founder pausa NOUS por revision trimestral.", "decided_by": "Founder"},
    )
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused_by_founder"
    assert client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17").json()["suggestions"] == []
    republish = client.post(f"/admin/nous/patterns/{pattern['id']}/publish", json={"target_modules": ["M17"], "approved_by": "Founder"})
    assert republish.status_code == 400
    assert "nous_paused_by_founder" in republish.json()["detail"]["blockers"]
