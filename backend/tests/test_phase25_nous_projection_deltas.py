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


def _delta(
    client: TestClient,
    tenant_id: str,
    *,
    period: str = "2026-01",
    projected: float = 100.0,
    actual: float = 112.0,
    module_id: str = "M17",
    metric_id: str = "toneladas_valorizadas",
) -> dict:
    res = client.post(
        f"/admin/tenants/{tenant_id}/nous/projection-deltas",
        json={
            "module_id": module_id,
            "metric_id": metric_id,
            "projected_value": projected,
            "actual_value": actual,
            "measurement_period": period,
            "measurement_quality": "alta",
        },
    )
    assert res.status_code == 200
    return res.json()


def test_phase25_projection_delta_respects_opt_in_and_does_not_feed_aggregate_without_consent():
    client = _client()
    tenant = _tenant(client, "delta-no-opt-in")

    delta = _delta(client, tenant["id"])

    assert delta["delta_absolute"] == 12.0
    assert delta["delta_percentage"] == 12.0
    assert delta["delta_direction"] == "subestimacion"
    assert delta["included_in_aggregate"] is False
    assert delta["aggregate_exclusion_reason"] == "tenant_without_aggregate_opt_in"
    assert "emerging_patterns" not in delta
    assert client.get("/admin/nous/patterns/queue").json()["patterns"] == []


def test_phase25_insufficient_months_or_tenants_blocks_layer3_recalibration_pattern():
    client = _client()
    tenants = [_tenant(client, f"delta-insufficient-{idx}", opt_in=True) for idx in range(3)]

    for idx, tenant in enumerate(tenants):
        _delta(client, tenant["id"], period=f"2026-0{idx + 1}", actual=112.0)

    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    assert queue.json()["patterns"] == []


def test_phase25_sufficient_test_data_creates_internal_layer3_recalibration_proposal_not_applied():
    client = _client()
    tenants = [_tenant(client, f"delta-opt-in-{idx}", opt_in=True) for idx in range(3)]
    periods = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]

    last = None
    for tenant in tenants:
        for period in periods:
            last = _delta(client, tenant["id"], period=period, projected=100.0, actual=112.0)

    assert last is not None
    queue = client.get("/admin/nous/patterns/queue")
    assert queue.status_code == 200
    assert len(queue.json()["patterns"]) == 1
    pattern = queue.json()["patterns"][0]
    technical = pattern["pattern_description_technical"]

    assert pattern["pattern_layer"] == 3
    assert pattern["pattern_status"] == "draft_observed"
    assert pattern["confidence_level"] == "recalibracion_emergente_interna"
    assert pattern["published_to_clients"] is False
    assert "months=6; tenants=3" in pattern["statistical_significance"]
    assert technical["recalibration_proposal"]["formula"].startswith("posterior =")
    assert technical["recalibration_proposal"]["prior"] == 0.0
    assert technical["recalibration_proposal"]["likelihood_mean"] == 12.0
    assert technical["recalibration_proposal"]["posterior"] != 0.0
    assert technical["recalibration_proposal"]["applied"] is False
    assert technical["automatic_apply"] is False
    assert technical["retroactive_to_validated_inferences"] is False
    assert technical["marcos_standards_check_required"] is True
    assert technical["marcos_standards_check"]["status"] == "requires_human_review"
    assert technical["marcos_standards_check"]["module_id"] == "M17"
    assert technical["marcos_standards_check"]["standards_count"] > 0
    assert technical["marcos_standards_check"]["automatic_publication"] is False
    assert technical["client_visible"] is False

    observations = client.get(f"/admin/tenants/{tenants[0]['id']}/nous/observations")
    assert observations.status_code == 200
    assert observations.json()["published_patterns"] == []
    assert observations.json()["automatic_prior_recalibration"] is False


def test_phase25_a11_panel_exposes_five_internal_tabs_and_review_can_retire_pattern():
    client = _client()
    tenants = [_tenant(client, f"a11-delta-{idx}", opt_in=True) for idx in range(3)]
    for tenant in tenants:
        for period in ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]:
            _delta(client, tenant["id"], period=period, actual=112.0)

    a11 = client.get("/admin/nous/a11")
    assert a11.status_code == 200
    body = a11.json()
    assert body["panel_id"] == "A11"
    assert body["client_publication_enabled"] is True
    assert body["automatic_recalibration_enabled"] is False
    assert set(body["tabs"]) == {"A11.1", "A11.2", "A11.3", "A11.4", "A11.5"}
    pattern = body["tabs"]["A11.1"]["patterns"][0]

    retired = client.patch(
        f"/admin/nous/patterns/{pattern['id']}/review",
        json={"action": "retire", "notes": "AUDITOR retira por muestra no defendible."},
    )
    assert retired.status_code == 200
    assert retired.json()["pattern_status"] == "retired"
    assert retired.json()["published_to_clients"] is False
    assert retired.json()["retired_reason"] == "AUDITOR retira por muestra no defendible."
