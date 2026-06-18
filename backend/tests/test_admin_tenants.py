from unittest.mock import patch

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


def test_create_tenant_seeds_validation_state_gates_and_capabilities():
    client = _client()
    res = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )

    assert res.status_code == 201
    body = res.json()
    assert body["state"]["current_stage"] == "validation"
    assert body["state"]["transition_mode"] == "manual_only"
    assert [gate["gate_id"] for gate in body["gates"]] == ["G1", "G2", "G3", "G4", "G5"]
    assert body["gates"][0]["status"] == "no_iniciado"
    assert len(body["capabilities"]) > 0
    assert body["audit_log"][0]["action"] == "tenant_created"
    assert body["municipal_profile"]["mode"] == "carga_inicial"


def test_admin_inegi_states_and_municipality_filter_are_available():
    client = _client()

    states = client.get("/admin/inegi/states")
    assert states.status_code == 200
    assert len(states.json()["states"]) == 32
    assert {"estado_id": "24", "estado_nombre": "San Luis Potosí"} in states.json()["states"]

    # Mock fetch_municipios_inegi to avoid flaky live INEGI API calls in CI;
    # the endpoint merges this with list_municipios_mx (seed), which has "24028".
    with patch("app.city.inegi_catalog.fetch_municipios_inegi", return_value=[]):
        municipalities = client.get("/admin/inegi/municipalities?estado_id=24&q=San%20Luis&limit=20")
    assert municipalities.status_code == 200
    body = municipalities.json()
    assert body["territorial_rule"].startswith("municipio y ZM")
    assert any(row["clave_inegi"] == "24028" for row in body["municipalities"])
    assert all("zm" in row and "municipio_id" in row for row in body["municipalities"])


def test_admin_erp_lists_tenants_by_inegi_without_cross_tenant_private_claims():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()

    res = client.get("/admin/erp/municipalities?q=San%20Luis")
    assert res.status_code == 200
    body = res.json()
    assert body["cross_tenant_private_data_exposed"] is False
    assert body["linking_method"].startswith("clave_inegi primero")
    rows = body["rows"]
    assert any(row["tenant_id"] == tenant["id"] for row in rows)
    row = next(row for row in rows if row["tenant_id"] == tenant["id"])
    assert row["clave_inegi"] == "24028"
    assert row["link_status"] == "tenant_sin_usuario"
    assert row["users_count"] == 0


def test_gate_cannot_close_without_evidence_and_does_not_transition_stage():
    client = _client()
    created = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()
    tenant_id = created["id"]

    blocked = client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/close",
        json={"decisor_humano": "Founder"},
    )
    assert blocked.status_code == 400
    assert "sin evidencia" in blocked.json()["detail"]

    with_evidence = client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/evidence",
        json={
            "evidencia_url": "drive://acta-cabildo-g1.pdf",
            "evidencia_label": "Acta Cabildo G1",
            "decisor_humano": "Founder",
        },
    )
    assert with_evidence.status_code == 200
    assert with_evidence.json()["gates"][0]["status"] == "en_revision"

    closed = client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/close",
        json={"decisor_humano": "Founder"},
    )
    assert closed.status_code == 200
    body = closed.json()
    assert body["gates"][0]["status"] == "cerrado"
    assert body["gates"][0]["evidencia_url"] == "drive://acta-cabildo-g1.pdf"
    assert body["state"]["current_stage"] == "validation"
    assert body["audit_log"][-1]["action"] == "gate_closed_manual"
    assert body["audit_log"][-1]["payload"]["automatic_stage_transition"] is False
    assert len(admin._nous_mem["gate_outcomes"]) == 1
    snapshot = admin._nous_mem["gate_outcomes"][0]
    assert snapshot["gate"] == "G1"
    assert snapshot["outcome"] == "cerrado_exitoso"
    assert snapshot["module_state_at_close"]["snapshot_schema"] == "GateOutcomeSnapshot.v1"
    assert snapshot["included_in_aggregate"] is False
    assert snapshot["audit"]["published_to_clients"] is False


def test_state_endpoint_returns_gates_capabilities_and_audit_log():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "Demo Municipio",
            "estado_mx": "Queretaro",
            "municipio_id": "demo-qro",
            "inegi_clave": "22014",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()

    res = client.get(f"/admin/tenants/{tenant['id']}/state")
    assert res.status_code == 200
    body = res.json()
    assert body["tenant_id"] == tenant["id"]
    assert body["state"]["current_stage"] == "validation"
    assert len(body["gates"]) == 5
    assert len(body["capabilities"]) > 0
    assert body["audit_log"][0]["action"] == "tenant_created"


def test_stage_access_guard_blocks_future_platforms_for_validation_tenant():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "Demo Municipio",
            "estado_mx": "Queretaro",
            "municipio_id": "demo-qro",
            "inegi_clave": "22014",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()

    validation = client.get(f"/admin/tenants/{tenant['id']}/platform-access/validation")
    assert validation.status_code == 200
    assert validation.json()["access"] == "allowed"

    planning = client.get(f"/admin/tenants/{tenant['id']}/platform-access/planning")
    assert planning.status_code == 403

    execution = client.get(f"/admin/tenants/{tenant['id']}/platform-access/execution")
    assert execution.status_code == 403


def test_validation_to_planning_requires_closed_g1_and_manual_confirmation():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()
    tenant_id = tenant["id"]

    blocked_by_gate = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={
            "target_stage": "planning",
            "manual_confirmation": True,
            "confirmed_by": "Founder",
        },
    )
    assert blocked_by_gate.status_code == 400
    assert "G1 no esta cerrado" in blocked_by_gate.json()["detail"]

    client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/evidence",
        json={
            "evidencia_url": "drive://acta-cabildo-g1.pdf",
            "evidencia_label": "Acta Cabildo G1",
            "decisor_humano": "Founder",
        },
    )
    client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/close",
        json={"decisor_humano": "Founder"},
    )

    blocked_by_confirmation = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={
            "target_stage": "planning",
            "manual_confirmation": False,
            "confirmed_by": "Founder",
        },
    )
    assert blocked_by_confirmation.status_code == 400
    assert "confirmacion manual" in blocked_by_confirmation.json()["detail"]

    transitioned = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={
            "target_stage": "planning",
            "manual_confirmation": True,
            "confirmed_by": "Founder",
        },
    )
    assert transitioned.status_code == 200
    body = transitioned.json()
    assert body["state"]["current_stage"] == "planning"
    assert body["audit_log"][-1]["action"] == "tenant_stage_transition_manual"
    assert body["audit_log"][-1]["payload"]["from_stage"] == "validation"
    assert body["audit_log"][-1]["payload"]["to_stage"] == "planning"
    assert body["audit_log"][-1]["payload"]["automatic_stage_transition"] is False


def test_municipal_profile_requires_15_actors_for_operation_mode():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()
    tenant_id = tenant["id"]
    payload = {
        "antecedentes": {
            "presidente_municipal": {"estado": "pendiente_verificacion"},
            "cabildo": {"regidores": [], "sindicos": [], "comisiones_permanentes": []},
            "estructura_administrativa": {"estado": "pendiente_verificacion"},
            "reglamento_de_limpia": {"estado": "pendiente_verificacion"},
            "concesion_actual": {"estado": "pendiente_verificacion"},
            "programas_previos": {"estado": "pendiente_verificacion"},
            "prensa_24_meses": {"estado": "pendiente_verificacion"},
            "proximo_proceso_electoral": {"estado": "pendiente_verificacion"},
        },
        "mapa_social": {
            "actores": [
                {
                    "actor_id": f"a{i}",
                    "nombre": f"Actor institucional {i}",
                    "tipo_actor": "institucional",
                    "influencia": "media",
                    "postura": "por_verificar",
                    "evidencia_fuente": "Pendiente verificacion",
                    "fecha_actualizacion": "2026-05-28",
                }
                for i in range(15)
            ],
            "municipio_scope": "slp-capital-test",
            "zm_scope_copied": False,
        },
        "organigrama_servicio": {
            "direcciones_relevantes": [{"nombre": "Servicios Municipales", "estado": "pendiente_verificacion"}],
            "roles_operativos": [{"rol": "Supervision rutas", "responsabilidad": "Verificar rutas"}],
            "turnos": [{"nombre": "Matutino", "horario": "06:00-14:00"}],
            "horarios": [{"actividad": "Recoleccion", "horario": "Pendiente carga de datos del municipio"}],
            "responsabilidades": ["recoleccion"],
            "relacion_con_rsu": "servicio",
        },
        "provenance_status": "pendiente_verificacion",
    }

    saved = client.patch(f"/admin/tenants/{tenant_id}/municipal-profile", json=payload)
    assert saved.status_code == 200
    body = saved.json()
    assert body["municipal_profile"]["mode"] == "operacion"
    assert body["audit_log"][-1]["action"] == "tenant_municipal_profile_updated"

    fetched = client.get(f"/admin/tenants/{tenant_id}/municipal-profile")
    assert fetched.status_code == 200
    profile = fetched.json()["profile"]
    assert profile["mode"] == "operacion"
    assert len(profile["mapa_social"]["actores"]) == 15


def test_planning_to_execution_requires_closed_g2():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "San Luis Potosi",
            "estado_mx": "San Luis Potosi",
            "municipio_id": "slp-capital-test",
            "inegi_clave": "24028",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()
    tenant_id = tenant["id"]

    client.post(
        f"/admin/tenants/{tenant_id}/gates/G1/evidence",
        json={
            "evidencia_url": "drive://acta-cabildo-g1.pdf",
            "evidencia_label": "Acta Cabildo G1",
            "decisor_humano": "Founder",
        },
    )
    client.post(f"/admin/tenants/{tenant_id}/gates/G1/close", json={"decisor_humano": "Founder"})
    client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "planning", "manual_confirmation": True, "confirmed_by": "Founder"},
    )

    blocked = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "execution", "manual_confirmation": True, "confirmed_by": "Founder"},
    )
    assert blocked.status_code == 400
    assert "G2 no esta cerrado" in blocked.json()["detail"]


def test_execution_to_expansion_requires_g3_and_additional_capability():
    client = _client()
    tenant = client.post(
        "/admin/tenants",
        json={
            "nombre": "Municipio Expansion",
            "estado_mx": "Nuevo Leon",
            "municipio_id": "demo-nl",
            "inegi_clave": "19039",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    ).json()
    tenant_id = tenant["id"]

    for gate_id in ("G1", "G2"):
        client.post(
            f"/admin/tenants/{tenant_id}/gates/{gate_id}/evidence",
            json={
                "evidencia_url": f"drive://{gate_id.lower()}.pdf",
                "evidencia_label": f"Evidencia {gate_id}",
                "decisor_humano": "Founder",
            },
        )
        client.post(f"/admin/tenants/{tenant_id}/gates/{gate_id}/close", json={"decisor_humano": "Founder"})

    client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "planning", "manual_confirmation": True, "confirmed_by": "Founder"},
    )
    client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "execution", "manual_confirmation": True, "confirmed_by": "Founder"},
    )

    blocked_by_g3 = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "expansion", "manual_confirmation": True, "confirmed_by": "Founder"},
    )
    assert blocked_by_g3.status_code == 400
    assert "G3 no esta cerrado" in blocked_by_g3.json()["detail"]

    client.post(
        f"/admin/tenants/{tenant_id}/gates/G3/evidence",
        json={
            "evidencia_url": "drive://g3.pdf",
            "evidencia_label": "Evidencia G3",
            "decisor_humano": "Founder",
        },
    )
    client.post(f"/admin/tenants/{tenant_id}/gates/G3/close", json={"decisor_humano": "Founder"})

    blocked_by_capability = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "expansion", "manual_confirmation": True, "confirmed_by": "Founder"},
    )
    assert blocked_by_capability.status_code == 400
    assert "capabilities adicionales" in blocked_by_capability.json()["detail"]

    client.patch(
        f"/admin/tenants/{tenant_id}",
        json={"active_capabilities": ["city_baseline", "whatsapp_alerts"]},
    )
    expanded = client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={"target_stage": "expansion", "manual_confirmation": True, "confirmed_by": "Founder"},
    )
    assert expanded.status_code == 200
    body = expanded.json()
    assert body["state"]["current_stage"] == "expansion"
    assert body["audit_log"][-1]["payload"]["required_gate"] == "G3"
