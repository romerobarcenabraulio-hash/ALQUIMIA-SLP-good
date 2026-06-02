from copy import deepcopy

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.automation.bibliography_intelligence import build_evidence_recommendations
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


def _tenant(client: TestClient, nombre: str, municipio_id: str, inegi: str) -> dict:
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
    return created.json()


def _promote_population_source_to_local_document(client: TestClient, tenant: dict) -> dict:
    profile = deepcopy(tenant["municipal_profile"])
    profile["antecedentes"]["demografia"]["poblacion"] = {
        "value": 250000,
        "source": {
            "id": "municipal_report",
            "label": "Reporte municipal validado",
            "kind": "document",
            "extracted_at": "2026-05-30T00:00:00+00:00",
        },
        "method": "documento_municipal_validado",
        "confidence": "verified_official",
        "official": False,
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


def test_bibliography_admin_lists_recommendations_and_coverage():
    client = _client()
    tenant = _promote_population_source_to_local_document(
        client,
        _tenant(client, "Queretaro", "qro-capital", "22014"),
    )
    _tenant(client, "Corregidora", "corregidora", "22006")

    recs = client.get(f"/admin/bibliography/recommendations?tenant_id={tenant['id']}&stage=validation")
    coverage = client.get(f"/admin/bibliography/coverage?tenant_id={tenant['id']}")

    assert recs.status_code == 200
    assert coverage.status_code == 200
    body = recs.json()
    assert body["llm_used"] is False
    assert body["automatic_recalibration"] is False
    assert any(item["tag"] == "local" for item in body["recommendations"])
    assert {item["stage"] for item in coverage.json()["stage_evidence_map"]} == {"validation", "planning", "execution"}


def test_tenant_safe_recommendations_do_not_expose_cross_tenant_private_ids():
    client = _client()
    tenant = _promote_population_source_to_local_document(client, _tenant(client, "Queretaro", "qro-capital", "22014"))
    other = _promote_population_source_to_local_document(client, _tenant(client, "Corregidora", "corregidora", "22006"))

    response = client.get(f"/admin/tenants/{tenant['id']}/evidence-recommendations?stage=validation")

    assert response.status_code == 200
    body = response.json()
    assert body["cross_tenant_private_data_exposed"] is False
    comparable = [item for item in body["recommendations"] if item["record"]["municipality"] == "Municipio comparable anonimizado"]
    assert comparable
    assert all("tenant_id" not in item["record"] for item in comparable)
    assert all(item["record"].get("inegi_clave") != other["inegi_clave"] for item in comparable)


def test_benchmark_does_not_support_municipal_truth():
    tenant = {
        "id": "t1",
        "nombre": "Municipio A",
        "estado_mx": "Queretaro",
        "municipio_id": "a",
        "inegi_clave": "00001",
        "municipal_profile": {
            "antecedentes": {
                "demografia": {
                    "generacion_kg_hab_dia": {
                        "value": 1.02,
                        "source": {"label": "SEMARNAT benchmark", "extracted_at": "2026-05-30T00:00:00+00:00"},
                        "method": "benchmark_publico_por_tipo_municipio",
                        "confidence": "inferred_medium_confidence",
                    }
                }
            }
        },
    }
    recommendations = build_evidence_recommendations(tenant, [tenant], module_id="M01")
    benchmark = next(item for item in recommendations if item.tag == "benchmark")

    assert "No soporta verdad municipal" in benchmark.unsupported_claim
    assert any("Benchmark" in restriction for restriction in benchmark.record.restrictions)
