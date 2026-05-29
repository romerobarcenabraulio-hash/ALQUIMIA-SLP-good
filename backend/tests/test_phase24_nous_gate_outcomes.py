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


def _module_state(completeness: int = 86, validation: int = 78) -> dict:
    return {
        "data_completeness_pct": completeness,
        "validation_pct": validation,
        "key_metrics": {"field_studies_ready_pct": completeness, "evidence_items": 6},
        "recommendations_accepted": ["m01_argumento_financiero"],
        "recommendations_rejected": ["m02_mensaje_ciudadano"],
        "rejected_reasons": ["requiere ajuste de tono institucional"],
    }


def _gate_outcome(
    client: TestClient,
    tenant_id: str,
    *,
    outcome: str = "cerrado_exitoso",
    gate: str = "G1",
    module_state: dict | None = None,
    political_context: dict | None = None,
) -> dict:
    res = client.post(
        f"/admin/tenants/{tenant_id}/nous/gate-outcomes",
        json={
            "gate": gate,
            "outcome": outcome,
            "days_to_close": 42,
            "module_state_at_close": module_state if module_state is not None else _module_state(),
            "political_context": political_context
            if political_context is not None
            else {
                "cabildo_composition": "dividido",
                "opposition_pct": 45,
                "elections_proximity_months": 18,
                "media_coverage_sentiment": "neutral",
            },
            "payer_configuration": "A",
        },
    )
    assert res.status_code == 200
    return res.json()


def test_phase24_gate_outcome_snapshot_includes_required_module_state_and_respects_no_opt_in():
    client = _client()
    tenant = _tenant(client, "gate-no-opt-in")

    outcome = _gate_outcome(client, tenant["id"], module_state={"data_completeness_pct": 70})

    assert outcome["included_in_aggregate"] is False
    assert outcome["aggregate_exclusion_reason"] == "tenant_without_aggregate_opt_in"
    assert outcome["module_state_at_close"]["snapshot_schema"] == "GateOutcomeSnapshot.v1"
    assert outcome["module_state_at_close"]["data_completeness_pct"] == 70
    assert outcome["module_state_at_close"]["snapshot_complete"] is False
    assert "validation_pct" in outcome["module_state_at_close"]["missing_snapshot_fields"]
    assert outcome["audit"]["published_to_clients"] is False

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    assert queue.json()["patterns"] == []


def test_phase24_n_insufficient_does_not_create_gate_pattern_and_n8_creates_internal_layer2_pattern():
    client = _client()
    tenants = [_tenant(client, f"gate-opt-in-{idx}", opt_in=True) for idx in range(8)]

    for tenant in tenants[:7]:
        outcome = _gate_outcome(client, tenant["id"])
        assert outcome["included_in_aggregate"] is True
        assert "emerging_patterns" not in outcome

    queue_before = client.get("/admin/nous/patterns/queue")
    assert queue_before.status_code == 200
    assert queue_before.json()["patterns"] == []

    eighth = _gate_outcome(client, tenants[7]["id"], outcome="cerrado_con_modificaciones")
    assert len(eighth["emerging_patterns"]) == 1
    pattern = eighth["emerging_patterns"][0]

    assert pattern["pattern_layer"] == 2
    assert pattern["pattern_status"] == "draft_observed"
    assert pattern["observations_count"] == 8
    assert pattern["confidence_level"] == "emergente"
    assert pattern["published_to_clients"] is False
    assert pattern["founder_gate_status"] == "pending"
    assert pattern["pattern_description_technical"]["gate"] == "G1"
    assert pattern["pattern_description_technical"]["success_proportion"] == 1.0
    assert pattern["pattern_description_technical"]["statistical_methods"]["wilson_interval_95"] is True
    assert pattern["pattern_description_technical"]["statistical_methods"]["fisher_exact"] == "not_applied_single_cohort"
    assert "wilson_95_ci" in pattern["statistical_significance"]
    assert pattern["pattern_description_technical"]["client_visible"] is False
    assert pattern["pattern_description_technical"]["automatic_gate_change"] is False


def test_phase24_bias_filter_removes_protected_political_and_personal_fields_from_gate_outcomes():
    client = _client()
    tenants = [_tenant(client, f"gate-bias-{idx}", opt_in=True) for idx in range(8)]

    for tenant in tenants:
        outcome = _gate_outcome(
            client,
            tenant["id"],
            political_context={
                "cabildo_composition": "dividido",
                "opposition_pct": 52,
                "partido": "PROHIBIDO",
                "presidente_municipal": "PROHIBIDO",
                "telefono": "PROHIBIDO",
                "media_coverage_sentiment": "neutral",
            },
        )
        assert "partido" not in outcome["political_context"]
        assert "presidente_municipal" not in outcome["political_context"]
        assert "telefono" not in outcome["political_context"]
        assert "excluded_fields" in outcome["political_context"]

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    pattern = queue.json()["patterns"][0]
    serialized = str(pattern)
    assert "PROHIBIDO" not in serialized
    assert pattern["published_to_clients"] is False


def test_phase24_founder_auditor_queue_reviews_gate_patterns_without_publication_or_gate_change():
    client = _client()
    tenants = [_tenant(client, f"gate-review-{idx}", opt_in=True) for idx in range(8)]
    for tenant in tenants:
        _gate_outcome(client, tenant["id"])

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    pattern = queue.json()["patterns"][0]

    postponed = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/review",
        json={"action": "postpone", "notes": "Esperar mas outcomes para reducir ruido."},
    )
    assert postponed.status_code == 200
    assert postponed.json()["pattern_status"] == "pending_auditor_review"
    assert postponed.json()["published_to_clients"] is False

    approved = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/review",
        json={"action": "approve_internal", "notes": "Aprobado solo para revision interna."},
    )
    assert approved.status_code == 200
    assert approved.json()["pattern_status"] == "approved_internal"
    assert approved.json()["founder_gate_status"] == "pending"
    assert approved.json()["published_to_clients"] is False
    assert approved.json()["audit"]["review_history"][-1]["automatic_recalibration"] is False
