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


def _tenant(client: TestClient, municipio_id: str = "qro-nous") -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "Queretaro",
            "estado_mx": "Queretaro",
            "municipio_id": municipio_id,
            "inegi_clave": "22014",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_phase18_analytics_opt_in_defaults_false_and_excludes_observations_from_aggregate():
    client = _client()
    tenant = _tenant(client)

    assert tenant["analytics_aggregate_opt_in"] is False

    correction = client.post(
        f"/admin/tenants/{tenant['id']}/nous/inference-corrections",
        json={
            "module_id": "M01",
            "field_id": "antecedentes.demografia.generacion_kg_hab_dia",
            "inferred_value": 1.0,
            "validation_action": "adjust",
            "corrected_value": 1.3,
            "corrected_by_role": "Director Servicios Publicos",
        },
    )

    assert correction.status_code == 200
    body = correction.json()
    assert body["delta_percentage"] == 30.0
    assert body["included_in_aggregate"] is False
    assert body["aggregate_exclusion_reason"] == "tenant_without_aggregate_opt_in"
    assert body["audit"]["observational_only"] is True
    assert body["audit"]["published_to_clients"] is False


def test_phase18_opt_in_true_includes_new_observations_and_keeps_profile_sanitized():
    client = _client()
    tenant = _tenant(client)

    consent = client.patch(
        f"/admin/tenants/{tenant['id']}/analytics-consent",
        json={
            "aggregated_anonymous_analytics": True,
            "consent_source": "contrato://clausula-analytics",
            "consented_by": "Founder",
        },
    )
    assert consent.status_code == 200
    assert consent.json()["analytics_aggregate_opt_in"] is True

    outcome = client.post(
        f"/admin/tenants/{tenant['id']}/nous/gate-outcomes",
        json={
            "gate": "G1",
            "outcome": "cerrado_exitoso",
            "days_to_close": 42,
            "module_state_at_close": {"M04": {"data_completeness_pct": 80}},
            "political_context": {
                "cabildo_composition": {"opposition_pct": 45},
                "partido": "PROHIBIDO",
                "presidente_municipal": "PROHIBIDO",
                "media_coverage_sentiment": "neutral",
            },
            "payer_configuration": "A",
        },
    )

    assert outcome.status_code == 200
    body = outcome.json()
    assert body["included_in_aggregate"] is True
    assert body["aggregate_exclusion_reason"] is None
    assert "partido" not in body["political_context"]
    assert "presidente_municipal" not in body["political_context"]
    assert body["municipality_profile"]["region"] == "centro"
    assert "protected_variables_excluded" in body["municipality_profile"]


def test_phase18_projection_delta_and_pending_pattern_are_observational_not_published():
    client = _client()
    tenant = _tenant(client)
    client.patch(
        f"/admin/tenants/{tenant['id']}/analytics-consent",
        json={"aggregated_anonymous_analytics": True, "consent_source": "contrato://ok"},
    )

    delta = client.post(
        f"/admin/tenants/{tenant['id']}/nous/projection-deltas",
        json={
            "module_id": "M17",
            "metric_id": "toneladas_valorizadas",
            "projected_value": 100.0,
            "actual_value": 76.0,
            "measurement_period": "2026-05",
            "measurement_quality": "alta",
        },
    )
    assert delta.status_code == 200
    body = delta.json()
    assert body["delta_absolute"] == -24.0
    assert body["delta_percentage"] == -24.0
    assert body["delta_direction"] == "sobreestimacion"
    assert body["included_in_aggregate"] is True

    pattern = client.post(
        "/admin/nous/patterns",
        json={
            "pattern_layer": 3,
            "pattern_description_natural": "Observacion preliminar no publicable.",
            "pattern_description_technical": {"metric": "toneladas_valorizadas"},
            "observations_count": 2,
            "contributing_tenant_profiles": [body["municipality_profile"]],
        },
    )
    assert pattern.status_code == 200
    pattern_body = pattern.json()
    assert pattern_body["published_to_clients"] is False
    assert pattern_body["founder_gate_status"] == "pending"
    assert pattern_body["bias_check_status"] == "not_run"
    assert pattern_body["confidence_level"] == "pending_insufficient_data"

    observations = client.get(f"/admin/tenants/{tenant['id']}/nous/observations")
    assert observations.status_code == 200
    assert observations.json()["published_patterns"] == []
    assert len(observations.json()["projection_deltas"]) == 1
