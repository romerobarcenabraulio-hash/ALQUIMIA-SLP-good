from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.routers import admin
from app.routers.auth import UserInfo


def _client() -> TestClient:
    admin._tenants_mem.clear()
    admin._tenant_documents_mem.clear()
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


def _create_tenant(client: TestClient, *, inegi: str = "22014") -> dict:
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "Queretaro",
            "estado_mx": "Queretaro",
            "municipio_id": "qro-capital-docs",
            "inegi_clave": inegi,
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_phase12_generates_traceable_human_review_draft_in_a6():
    client = _client()
    tenant = _create_tenant(client)

    generated = client.post(
        f"/admin/tenants/{tenant['id']}/documents/drafts",
        json={"document_type": "expediente_cabildo", "notes": "Prueba AUDITOR"},
    )

    assert generated.status_code == 201
    document = generated.json()
    assert document["status"] == "human_review_required"
    assert document["qa_status"] == "partial"
    assert document["can_export_ok"] is False
    assert "borrador para revision humana obligatoria" in document["content_md"]
    assert "Queretaro" in document["content_md"]
    assert "1049777" in document["content_md"]
    assert document["provenance"]["official_document"] is False
    assert document["claim_ledger"]["official_document"] is False
    assert document["claim_ledger"]["claims"]
    population_claim = next(
        claim
        for claim in document["claim_ledger"]["claims"]
        if claim["field_path"] == "antecedentes.demografia.poblacion"
    )
    assert population_claim["preliminary"] is True
    assert population_claim["provenance"]["source_id"] == "inegi"
    assert population_claim["provenance"]["method"] == "inegi_censo_2020_seed"
    assert population_claim["provenance"]["confidence"] == "inferred_high_confidence"
    assert "dato preliminar pendiente de validacion" in document["content_md"]
    assert any(section["section"] == "provenance_claimledger" for section in document["human_review_sections"])
    assert any(std["source"] == "docs/architecture/standards_map.json" for std in document["standards"])
    assert document["review_history"][0]["action"] == "draft_generated"

    listed = client.get(f"/admin/tenants/{tenant['id']}/documents")
    assert listed.status_code == 200
    a6 = listed.json()["a6_documentacion_generada"]
    assert len(a6) == 1
    assert a6[0]["id"] == document["id"]


def test_phase12_blocks_ok_export_when_critical_gate_evidence_is_missing():
    client = _client()
    tenant = _create_tenant(client)

    generated = client.post(
        f"/admin/tenants/{tenant['id']}/documents/drafts",
        json={"document_type": "acuerdo_cabildo"},
    )
    assert generated.status_code == 201
    document = generated.json()
    assert document["status"] == "blocked_missing_evidence"
    assert document["qa_status"] == "blocked"
    assert document["can_export_ok"] is False
    assert any(blocker["gate_id"] == "G1" for blocker in document["blockers"])
    assert "Falta evidencia critica de G1" in document["content_md"]

    export_check = client.post(f"/admin/tenants/{tenant['id']}/documents/{document['id']}/export-check")
    assert export_check.status_code == 200
    body = export_check.json()
    assert body["qa_status"] == "blocked"
    assert body["can_export_ok"] is False
    assert body["blockers"][0]["code"] == "BLOCKED_MISSING_GATE_EVIDENCE"

    blocked_approval = client.patch(
        f"/admin/tenants/{tenant['id']}/documents/{document['id']}",
        json={"status": "approved_by_human", "review_notes": "No debe aprobar"},
    )
    assert blocked_approval.status_code == 400


def test_phase12_versions_human_edits_and_keeps_review_history():
    client = _client()
    tenant = _create_tenant(client)
    document = client.post(
        f"/admin/tenants/{tenant['id']}/documents/drafts",
        json={"document_type": "oficio_estandar"},
    ).json()

    updated = client.patch(
        f"/admin/tenants/{tenant['id']}/documents/{document['id']}",
        json={
            "content_md": document["content_md"] + "\n\nRevision humana: ajustar destinatario.",
            "status": "in_review",
            "review_notes": "Edicion humana posterior",
        },
    )

    assert updated.status_code == 200
    body = updated.json()
    assert body["status"] == "in_review"
    assert body["version"] == 2
    assert len(body["versions"]) == 2
    assert body["review_history"][-1]["action"] == "human_review_update"
    assert body["review_history"][-1]["official_document"] is False


def test_phase12_all_supported_document_types_are_available():
    expected = {
        "expediente_cabildo",
        "reforma_reglamentaria_3_articulos",
        "acuerdo_cabildo",
        "adenda_concesion",
        "reporte_mensual_esg_gri_306",
        "oficio_estandar",
    }
    assert set(admin.SUPPORTED_DOCUMENTS) == expected
