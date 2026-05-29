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


def _tenant(client: TestClient, *, opt_in: bool = True) -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "tenant-nous-cliente",
            "estado_mx": "Queretaro",
            "municipio_id": "tenant-nous-cliente",
            "inegi_clave": "22014",
            "tier_comercial": "operacion_completa",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    tenant = res.json()
    patch = client.patch(
        f"/admin/tenants/{tenant['id']}",
        json={"active_capabilities": ["M01", "M04", "M13", "M14", "M17", "M21"]},
    )
    assert patch.status_code == 200
    tenant = patch.json()
    if opt_in:
        consent = client.patch(
            f"/admin/tenants/{tenant['id']}/analytics-consent",
            json={
                "aggregated_anonymous_analytics": True,
                "consent_source": "contrato://analytics-agregada",
                "consented_by": "Founder",
            },
        )
        assert consent.status_code == 200
        tenant = consent.json()
    return tenant


def _pattern(client: TestClient, *, observations_count: int = 30, natural: str | None = None) -> dict:
    res = client.post(
        "/admin/nous/patterns",
        json={
            "pattern_layer": 3,
            "pattern_description_natural": natural
            or "Sugerimos revisar el supuesto operativo porque se observaron deltas consistentes en municipios comparables.",
            "pattern_description_technical": {
                "module_id": "M17",
                "municipality_profile_comparable": {"population_range": "200k_500k", "region": "centro"},
                "marcos_standards_check": {
                    "status": "requires_human_review",
                    "standards_codes": ["GRI 306-3"],
                    "automatic_publication": False,
                },
            },
            "observations_count": observations_count,
            "contributing_tenant_profiles": [
                {"population_range": "200k_500k", "region": "centro"},
                {"population_range": "200k_500k", "region": "centro"},
                {"population_range": "200k_500k", "region": "centro"},
            ],
            "confidence_level": "robusto",
        },
    )
    assert res.status_code == 200
    return res.json()


def test_phase26_blocks_publication_without_founder_gate_or_with_bias_fail():
    client = _client()
    pattern = _pattern(client)
    internal = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/review",
        json={"action": "approve_internal", "notes": "AUDITOR aprueba para revisar gates."},
    )
    assert internal.status_code == 200

    blocked = client.post(
        f"/admin/nous/patterns/{pattern['id']}/publish",
        json={"target_modules": ["M17"], "approved_by": "Founder"},
    )
    assert blocked.status_code == 400
    assert "founder_gate_not_approved" in blocked.json()["detail"]["blockers"]

    gates = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/publication-gates",
        json={
            "bias_check_status": "failed",
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    )
    assert gates.status_code == 200
    blocked_bias = client.post(
        f"/admin/nous/patterns/{pattern['id']}/publish",
        json={"target_modules": ["M17"], "approved_by": "Founder"},
    )
    assert blocked_bias.status_code == 400
    assert "bias_check_not_passed" in blocked_bias.json()["detail"]["blockers"]


def test_phase26_blocks_low_n_and_authoritative_language():
    client = _client()
    low_n = _pattern(client, observations_count=6)
    client.patch(f"/admin/nous/patterns/{low_n['id']}/review", json={"action": "approve_internal"})
    client.patch(
        f"/admin/nous/patterns/{low_n['id']}/publication-gates",
        json={
            "bias_check_status": "passed",
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    )
    blocked_n = client.post(f"/admin/nous/patterns/{low_n['id']}/publish", json={"target_modules": ["M17"], "approved_by": "Founder"})
    assert blocked_n.status_code == 400
    assert "insufficient_publication_n" in blocked_n.json()["detail"]["blockers"]

    authoritarian = _pattern(client, natural="NOUS predice que debes ajustar el supuesto.")
    client.patch(f"/admin/nous/patterns/{authoritarian['id']}/review", json={"action": "approve_internal"})
    client.patch(
        f"/admin/nous/patterns/{authoritarian['id']}/publication-gates",
        json={
            "bias_check_status": "passed",
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    )
    blocked_language = client.post(f"/admin/nous/patterns/{authoritarian['id']}/publish", json={"target_modules": ["M17"], "approved_by": "Founder"})
    assert blocked_language.status_code == 400
    assert "eidos_authoritative_language" in blocked_language.json()["detail"]["blockers"]


def test_phase26_publishes_only_approved_suggestion_and_records_feedback():
    client = _client()
    tenant = _tenant(client)
    pattern = _pattern(client)
    assert client.patch(f"/admin/nous/patterns/{pattern['id']}/review", json={"action": "approve_internal"}).status_code == 200
    assert client.patch(
        f"/admin/nous/patterns/{pattern['id']}/publication-gates",
        json={
            "bias_check_status": "passed",
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    ).status_code == 200

    published = client.post(
        f"/admin/nous/patterns/{pattern['id']}/publish",
        json={
            "target_modules": ["M17"],
            "approved_by": "Founder",
            "limitation": "Patron agregado anonimo; no sustituye medicion local.",
            "action_suggested": "Considera ajustar el supuesto antes del cierre mensual.",
        },
    )
    assert published.status_code == 200
    assert published.json()["published_to_clients"] is True

    suggestions = client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17")
    assert suggestions.status_code == 200
    body = suggestions.json()
    assert len(body["suggestions"]) == 1
    suggestion = body["suggestions"][0]
    assert suggestion["observations_count"] == 30
    assert suggestion["confidence"] == "robusto"
    assert suggestion["source_traceability"]["tenant_origin_identifiers_exposed"] is False
    assert suggestion["limitation"] == "Patron agregado anonimo; no sustituye medicion local."

    feedback = client.post(
        f"/admin/tenants/{tenant['id']}/nous/suggestions/{suggestion['suggestion_id']}/feedback",
        json={"action": "reject", "role": "Director Servicios Publicos", "rejection_reason": "Dato local medido contradice el patron."},
    )
    assert feedback.status_code == 200
    assert feedback.json()["action"] == "reject"
    assert feedback.json()["observation_only"] is True
    assert feedback.json()["automatic_decision"] is False


def test_phase26_a11_withdraw_removes_client_suggestion():
    client = _client()
    tenant = _tenant(client)
    pattern = _pattern(client)
    client.patch(f"/admin/nous/patterns/{pattern['id']}/review", json={"action": "approve_internal"})
    client.patch(
        f"/admin/nous/patterns/{pattern['id']}/publication-gates",
        json={
            "bias_check_status": "passed",
            "founder_gate_status": "approved",
            "marcos_standards_check_status": "approved",
            "aggregate_opt_in_verified": True,
        },
    )
    client.post(f"/admin/nous/patterns/{pattern['id']}/publish", json={"target_modules": ["M17"], "approved_by": "Founder"})
    assert client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17").json()["suggestions"]

    withdrawn = client.post(
        f"/admin/nous/patterns/{pattern['id']}/withdraw",
        json={"action": "retire", "notes": "AUDITOR retira por nueva evidencia."},
    )
    assert withdrawn.status_code == 200
    assert withdrawn.json()["published_to_clients"] is False
    assert withdrawn.json()["pattern_status"] == "retired"
    assert client.get(f"/admin/tenants/{tenant['id']}/nous/suggestions?module_id=M17").json()["suggestions"] == []
