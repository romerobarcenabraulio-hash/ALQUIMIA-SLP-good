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


def _tenant(client: TestClient, municipio_id: str, *, opt_in: bool = False) -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": municipio_id,
            "estado_mx": "Queretaro",
            "municipio_id": municipio_id,
            "inegi_clave": "22014",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    tenant = res.json()
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


def _correction(
    client: TestClient,
    tenant_id: str,
    *,
    action: str = "adjust",
    field_id: str = "antecedentes.demografia.generacion_kg_hab_dia",
    inferred: float | str = 1.0,
    corrected: float | str | None = 1.3,
) -> dict:
    res = client.post(
        f"/admin/tenants/{tenant_id}/nous/inference-corrections",
        json={
            "module_id": "M01",
            "field_id": field_id,
            "inferred_value": inferred,
            "validation_action": action,
            "corrected_value": corrected,
            "corrected_by_role": "Director Servicios Publicos",
        },
    )
    assert res.status_code == 200
    return res.json()


def test_phase23_observers_register_all_validation_actions_and_respect_opt_in():
    client = _client()
    tenant = _tenant(client, "qro-sin-opt-in")

    confirm = _correction(client, tenant["id"], action="confirm", inferred=1.0, corrected=1.0)
    adjust = _correction(client, tenant["id"], action="adjust", inferred=1.0, corrected=1.3)
    replace = _correction(client, tenant["id"], action="replace", inferred=100.0, corrected=76.0)
    not_applicable = _correction(client, tenant["id"], action="not_applicable", inferred="no_aplica", corrected=None)

    assert confirm["delta_percentage"] == 0.0
    assert adjust["delta_percentage"] == 30.0
    assert replace["delta_percentage"] == -24.0
    assert not_applicable["delta_percentage"] is None
    for correction in [confirm, adjust, replace, not_applicable]:
        assert correction["included_in_aggregate"] is False
        assert correction["aggregate_exclusion_reason"] == "tenant_without_aggregate_opt_in"

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    assert queue.json()["patterns"] == []


def test_phase23_three_similar_opt_in_corrections_create_internal_emerging_pattern_only():
    client = _client()
    tenants = [_tenant(client, f"qro-opt-in-{idx}", opt_in=True) for idx in range(3)]

    _correction(client, tenants[0]["id"], inferred=1.0, corrected=1.3)
    _correction(client, tenants[1]["id"], inferred=1.0, corrected=1.25)
    third = _correction(client, tenants[2]["id"], inferred=1.0, corrected=1.35)

    assert third["included_in_aggregate"] is True
    assert len(third["emerging_patterns"]) == 1
    pattern = third["emerging_patterns"][0]
    assert pattern["pattern_layer"] == 1
    assert pattern["pattern_status"] == "draft_observed"
    assert pattern["observations_count"] == 3
    assert pattern["confidence_level"] == "emergente_interno"
    assert pattern["published_to_clients"] is False
    assert pattern["founder_gate_status"] == "pending"
    assert pattern["bias_check_status"] == "not_run"
    assert "Se observaron 3 correcciones similares" in pattern["pattern_description_natural"]
    assert pattern["pattern_description_technical"]["average_delta_percentage"] == 30.0
    assert pattern["pattern_description_technical"]["municipality_profile_comparable"]["region"] == "centro"
    assert pattern["pattern_description_technical"]["client_visible"] is False
    assert pattern["pattern_description_technical"]["automatic_prior_recalibration"] is False

    observations = client.get(f"/admin/tenants/{tenants[2]['id']}/nous/observations")
    assert observations.status_code == 200
    assert observations.json()["published_patterns"] == []
    assert observations.json()["client_visible_patterns"] == []
    assert observations.json()["automatic_prior_recalibration"] is False


def test_phase23_internal_review_queue_allows_founder_auditor_actions_without_publication():
    client = _client()
    tenants = [_tenant(client, f"review-opt-in-{idx}", opt_in=True) for idx in range(3)]
    for tenant in tenants:
        _correction(client, tenant["id"], inferred=100.0, corrected=130.0)

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    patterns = queue.json()["patterns"]
    assert len(patterns) == 1
    assert queue.json()["client_publication"] is False

    approved = client.patch(
        f"/admin/nous/patterns/{patterns[0]['id']}/review",
        json={"action": "approve_internal", "notes": "AUDITOR revisado; mantener interno."},
    )
    assert approved.status_code == 200
    assert approved.json()["pattern_status"] == "approved_internal"
    assert approved.json()["published_to_clients"] is False
    assert approved.json()["audit"]["review_history"][-1]["client_publication"] is False
    assert approved.json()["audit"]["review_history"][-1]["automatic_recalibration"] is False

    rejected = client.patch(
        f"/admin/nous/patterns/{patterns[0]['id']}/review",
        json={"action": "reject", "notes": "Sesgo o muestra no defendible."},
    )
    assert rejected.status_code == 200
    assert rejected.json()["pattern_status"] == "rejected"
    assert rejected.json()["founder_gate_status"] == "blocked_rejected"
    assert rejected.json()["published_to_clients"] is False


def test_phase23_protected_or_personal_fields_do_not_create_patterns():
    client = _client()
    tenants = [_tenant(client, f"protected-opt-in-{idx}", opt_in=True) for idx in range(3)]

    for tenant in tenants:
        correction = _correction(
            client,
            tenant["id"],
            field_id="antecedentes.presidente_municipal",
            inferred="Nombre inferido prohibido",
            corrected="Nombre corregido prohibido",
        )
        assert correction["included_in_aggregate"] is True
        assert "emerging_patterns" not in correction

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    assert queue.json()["patterns"] == []
