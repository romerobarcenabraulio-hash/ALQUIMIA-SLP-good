from copy import deepcopy

from fastapi import FastAPI
from fastapi.testclient import TestClient

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


def _create_tenant(client: TestClient, *, nombre: str, estado: str, municipio_id: str, inegi: str) -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": nombre,
            "estado_mx": estado,
            "municipio_id": municipio_id,
            "inegi_clave": inegi,
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_phase15_first_login_uat_three_profiles_and_runtime_recalculation():
    client = _client()
    slp = _create_tenant(
        client,
        nombre="San Luis Potosi",
        estado="San Luis Potosi",
        municipio_id="slp-capital",
        inegi="24028",
    )
    capital = _create_tenant(
        client,
        nombre="Queretaro",
        estado="Queretaro",
        municipio_id="qro-capital-uat",
        inegi="22014",
    )
    rural = _create_tenant(
        client,
        nombre="Municipio Rural Nuevo",
        estado="Oaxaca",
        municipio_id="rural-incompleto-uat",
        inegi="99999",
    )

    for tenant in (slp, capital, rural):
        allowed = client.get(f"/admin/tenants/{tenant['id']}/platform-access/validation")
        assert allowed.status_code == 200
        assert allowed.json()["access"] == "allowed"
        assert client.get(f"/admin/tenants/{tenant['id']}/platform-access/planning").status_code == 403
        assert client.get(f"/admin/tenants/{tenant['id']}/platform-access/execution").status_code == 403

        profile_res = client.get(f"/admin/tenants/{tenant['id']}/municipal-profile")
        assert profile_res.status_code == 200
        profile = profile_res.json()["profile"]
        assert profile["automation"]["preliminary_notice"] == "dato preliminar pendiente de validacion"
        assert profile["automation"]["public_private_separation"]["cross_tenant_private_access"] is False
        assert profile["antecedentes"]["_automation"]["tenant_private_store"]["tenant_id"] == tenant["id"]
        assert profile["antecedentes"]["_automation"]["tenant_private_store"]["cross_tenant_private_access"] is False

    slp_profile = client.get(f"/admin/tenants/{slp['id']}/municipal-profile").json()["profile"]
    assert slp_profile["antecedentes"]["demografia"]["poblacion"]["value"] == 911908
    assert slp_profile["antecedentes"]["demografia"]["poblacion"]["source"]["id"] == "inegi"
    assert slp_profile["antecedentes"]["demografia"]["poblacion"]["confidence"] == "inferred_high_confidence"
    assert slp_profile["antecedentes"]["demografia"]["poblacion"]["official"] is False

    capital_profile = client.get(f"/admin/tenants/{capital['id']}/municipal-profile").json()["profile"]
    assert capital_profile["antecedentes"]["demografia"]["poblacion"]["value"] == 1049777
    assert capital_profile["mode"] == "carga_inicial"

    rural_profile = client.get(f"/admin/tenants/{rural['id']}/municipal-profile").json()["profile"]
    assert rural_profile["antecedentes"]["_automation"]["inference"]["status"] == "partial"
    assert rural_profile["antecedentes"]["demografia"]["poblacion"]["human_validation_state"] == "pending_source"
    assert rural_profile["antecedentes"]["demografia"]["poblacion"]["pending_reason"] == "Clave INEGI sin fixture de poblacion"

    patch_profile = deepcopy(capital_profile)
    patch_profile["antecedentes"]["demografia"]["poblacion"] = {
        "value": 1_400_000,
        "source": {"id": "tenant_private_store", "label": "Dato cargado por cliente", "kind": "tenant_private", "extracted_at": "2026-05-28T00:00:00+00:00"},
        "method": "client_first_login_adjustment",
        "confidence": "pending_human_validation",
        "human_validation_state": "pending_human_validation",
        "official": False,
    }
    updated = client.patch(
        f"/admin/tenants/{capital['id']}/municipal-profile",
        json={
            "antecedentes": patch_profile["antecedentes"],
            "mapa_social": patch_profile["mapa_social"],
            "organigrama_servicio": patch_profile["organigrama_servicio"],
            "provenance_status": patch_profile["provenance_status"],
        },
    )
    assert updated.status_code == 200
    runtime = updated.json()["municipal_profile"]["automation"]["runtime"]
    assert "city_baseline" in runtime["recalculated_modules"]
    assert runtime["discrepancies"][0]["field"] == "antecedentes.demografia.poblacion"
    assert runtime["discrepancies"][0]["not_definitive_error"] is True
    assert runtime["recommendations"]
    assert runtime["automatic_gate_changes"] is False
    assert runtime["automatic_stage_transitions"] is False


def test_phase15_client_role_cannot_query_cross_tenant_private_analytics():
    client = _client(role="cliente")
    res = client.post("/admin/analytics/cross-tenant", json={"metric": "generacion_rsu_por_tipo_municipio"})
    assert res.status_code == 403
