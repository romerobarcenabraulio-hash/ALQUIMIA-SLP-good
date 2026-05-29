from copy import deepcopy

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.automation.data_moat import MIN_ANALYTICS_N, PrivacyPolicyError, validate_anonymous_output
from app.db.session import get_db
from app.routers import admin
from app.routers.auth import UserInfo


def _client(role: str = "admin") -> TestClient:
    admin._tenants_mem.clear()
    admin._tenant_documents_mem.clear()
    admin._analytics_audit_mem.clear()
    app = FastAPI()
    app.include_router(admin.router, prefix="/admin")

    def _user():
        return UserInfo(id=role, nombre=role, email=f"{role}@alquimia.mx", rol=role, zm="ALL")

    def _no_db():
        yield None

    if role == "admin":
        app.dependency_overrides[admin.require_admin] = _user
    app.dependency_overrides[admin.get_current_user] = _user
    app.dependency_overrides[get_db] = _no_db
    return TestClient(app)


def _create_tenant(client: TestClient, nombre: str, municipio_id: str, inegi: str, poblacion: int, generacion: float) -> dict:
    created = client.post(
        "/admin/tenants",
        json={
            "nombre": nombre,
            "estado_mx": "Queretaro",
            "municipio_id": municipio_id,
            "inegi_clave": inegi,
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert created.status_code == 201
    tenant = created.json()
    profile = deepcopy(tenant["municipal_profile"])
    profile["antecedentes"]["demografia"]["poblacion"] = {
        "value": poblacion,
        "source": {"id": "inegi", "label": "INEGI Censo 2020", "kind": "public", "extracted_at": "2026-05-28T00:00:00+00:00"},
        "method": "test_seed",
        "confidence": "inferred_high_confidence",
        "official": False,
    }
    profile["antecedentes"]["demografia"]["generacion_kg_hab_dia"] = {
        "value": generacion,
        "source": {"id": "semarnat", "label": "SEMARNAT benchmark", "kind": "public", "extracted_at": "2026-05-28T00:00:00+00:00"},
        "method": "test_seed",
        "confidence": "inferred_medium_confidence",
        "official": False,
    }
    profile["antecedentes"].setdefault("_automation", {})["analytics_consent"] = {
        "aggregated_anonymous_analytics": True,
        "source": "contract_opt_in_test_fixture",
        "validated_by": "Founder",
    }
    updated = client.patch(
        f"/admin/tenants/{tenant['id']}/municipal-profile",
        json={
            "antecedentes": profile["antecedentes"],
            "mapa_social": profile["mapa_social"],
            "organigrama_servicio": profile["organigrama_servicio"],
            "provenance_status": profile["provenance_status"],
        },
    )
    assert updated.status_code == 200
    return updated.json()


def test_phase14_blocks_cross_tenant_analytics_when_minimum_n_is_not_met():
    client = _client()
    _create_tenant(client, "San Luis Potosi", "slp-capital", "24028", 911908, 1.02)
    _create_tenant(client, "Queretaro", "qro-capital", "22014", 1049777, 1.03)

    res = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"})

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "blocked"
    assert body["reason"] == "minimum_n_not_met"
    assert body["minimum_n"] == MIN_ANALYTICS_N
    assert body["cohort_n"] == 2
    assert body["consent_required"] is True


def test_phase14_minimum_n_cannot_be_lowered_by_request():
    client = _client()
    for index in range(MIN_ANALYTICS_N - 1):
        _create_tenant(client, f"Municipio {index}", f"municipio-{index}", f"22{index:03d}", 1_100_000 + index, 1.01)

    res = client.post(
        "/admin/analytics/cross-tenant",
        json={"metric": "generacion_rsu_por_tipo_municipio", "minimum_n": 1},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "blocked"
    assert body["requested_minimum_n"] == 1
    assert body["minimum_n"] == MIN_ANALYTICS_N
    assert body["cohort_n"] == MIN_ANALYTICS_N - 1


def test_phase14_tenants_without_opt_in_are_excluded_from_aggregate():
    client = _client()
    for index in range(MIN_ANALYTICS_N):
        _create_tenant(client, f"Opt in {index}", f"opt-in-{index}", f"33{index:03d}", 1_100_000 + index, 1.02)

    no_consent = client.post(
        "/admin/tenants",
        json={
            "nombre": "Sin consentimiento",
            "estado_mx": "Queretaro",
            "municipio_id": "sin-consentimiento",
            "inegi_clave": "99999",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert no_consent.status_code == 201

    res = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"})

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ready"
    assert body["pattern"]["total_tenants_seen"] == MIN_ANALYTICS_N + 1
    assert body["pattern"]["cohort_n"] == MIN_ANALYTICS_N
    assert "sin-consentimiento" not in str(body["pattern"])


def test_phase14_ready_aggregate_has_no_tenant_identifiers_and_logs_audit():
    client = _client()
    _create_tenant(client, "San Luis Potosi", "slp-capital", "24028", 1_100_000, 1.02)
    _create_tenant(client, "Queretaro", "qro-capital", "22014", 1_200_000, 1.03)
    _create_tenant(client, "Monterrey", "monterrey", "19039", 1_300_000, 1.08)
    _create_tenant(client, "Guanajuato", "guanajuato-capital", "11015", 1_400_000, 1.01)
    _create_tenant(client, "Aguascalientes", "aguascalientes-capital", "01001", 1_500_000, 1.00)

    res = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"})

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ready"
    pattern_text = str(body["pattern"])
    assert "slp-capital" not in pattern_text
    assert "qro-capital" not in pattern_text
    assert "monterrey" not in pattern_text.lower()
    assert "San Luis Potosi" not in pattern_text
    assert "Queretaro" not in pattern_text
    assert body["stores"]["tenant_private_store"]["cross_tenant_private_access"] is False
    assert body["stores"]["public_knowledge_base"]["scope"] == "public"
    assert body["stores"]["aggregated_anonymous_analytics"]["minimum_n"] == MIN_ANALYTICS_N
    assert body["stores"]["aggregated_anonymous_analytics"]["consent_required"] is True
    assert body["pattern"]["cohort_n"] == MIN_ANALYTICS_N
    assert body["pattern"]["groups"][0]["n"] == MIN_ANALYTICS_N
    assert body["pattern"]["consent_policy"] == "contract_opt_in_required"
    assert body["pattern"]["insight_visibility"] == "internal_only"
    assert body["pattern"]["shareable_after_founder_approval"] is False
    assert body["pattern"]["nous_status"] == "observational_only"
    assert body["pattern"]["nous_publication_eligible"] is False
    assert body["pattern"]["bias_check_status"] == "not_run"
    assert body["pattern"]["founder_gate_status"] == "not_started"
    assert "no es patrón NOUS publicable" in body["pattern"]["recommendation_phrase"]

    audit = client.get("/admin/analytics/cross-tenant/audit")
    assert audit.status_code == 200
    assert audit.json()["audit_log"][0]["pattern_generated"] is True
    assert audit.json()["audit_log"][0]["cohort_n"] == MIN_ANALYTICS_N


def test_phase14_client_role_cannot_query_admin_cross_tenant_analytics():
    client = _client(role="cliente")
    res = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"})
    assert res.status_code == 403


def test_phase14_policy_checker_rejects_identifier_leaks():
    tenants = [{"id": "tenant-1", "municipio_id": "slp-capital", "nombre": "San Luis Potosi", "municipal_profile": {}}]
    leaking_pattern = {
        "cohort_n": MIN_ANALYTICS_N,
        "minimum_n": MIN_ANALYTICS_N,
        "metric": "generacion_rsu_por_tipo_municipio",
        "groups": [{"municipio_id": "slp-capital", "n": MIN_ANALYTICS_N, "avg": 1.02}],
    }

    try:
        validate_anonymous_output(leaking_pattern, tenants, 3)
    except PrivacyPolicyError as exc:
        assert "identifier_leak_detected" in str(exc)
    else:
        raise AssertionError("privacy checker allowed a tenant identifier leak")


def test_phase14_anonymous_observation_cannot_be_shared_without_nous_bias_and_founder_gate():
    client = _client()
    _create_tenant(client, "San Luis Potosi", "slp-capital", "24028", 1_100_000, 1.02)
    _create_tenant(client, "Queretaro", "qro-capital", "22014", 1_200_000, 1.03)
    _create_tenant(client, "Monterrey", "monterrey", "19039", 1_300_000, 1.08)
    _create_tenant(client, "Guanajuato", "guanajuato-capital", "11015", 1_400_000, 1.01)
    _create_tenant(client, "Aguascalientes", "aguascalientes-capital", "01001", 1_500_000, 1.00)
    pattern = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"}).json()["pattern"]

    shared = client.post(
        "/admin/analytics/cross-tenant/share",
        json={"pattern": pattern, "approved_by": "Founder", "notes": "Insight anonimo revisado"},
    )

    assert shared.status_code == 400
    assert shared.json()["detail"] == "nous_founder_bias_gate_required"
