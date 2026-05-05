"""Fase 9 - operacion en campo y debido proceso."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.agents.agora import PlanInput
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.legal.repository import get_repo
from app.national.coverage import legal_source_for_municipio
from app.operations.events import reset_for_tests, summary_for_municipio
from app.operations.router import router
from app.operations.schemas import DueProcessStatus


def _client():
    reset_for_tests()
    app = FastAPI()
    app.include_router(router, prefix="/operations")
    return TestClient(app)


def _evidence(client, evidence_id="ev-1"):
    body = {
        "evidence_id": evidence_id,
        "tipo": "foto",
        "path_or_url": f"/evidence/{evidence_id}.jpg",
        "checksum": "abc123",
        "timestamp": "2026-04-30T10:00:00",
        "captured_by": "inspector-1",
        "chain_of_custody": ["inspector-1"],
    }
    r = client.post("/operations/evidence", json=body)
    assert r.status_code == 200
    return body


def _inspection(client, municipio_id="qro", evidence_id="ev-1"):
    body = {
        "inspection_id": f"ins-{municipio_id}",
        "municipio_id": municipio_id,
        "generador_id": "gen-1",
        "inspector": "inspector-1",
        "fecha": "2026-04-30",
        "hallazgos": ["contaminacion visible"],
        "pureza_pct": 62,
        "evidencia_ids": [evidence_id],
        "legal_source_id": legal_source_for_municipio(municipio_id).legal_source_id if legal_source_for_municipio(municipio_id) else None,
        "status": "completado",
    }
    r = client.post("/operations/inspections", json=body)
    assert r.status_code == 200
    return body


def test_pickup_event_altera_pureza_y_captura():
    client = _client()
    client.post("/operations/pickups", json={
        "event_id": "p1",
        "shift_id": "s1",
        "municipio_id": "qro",
        "ubicacion": "colonia centro",
        "generador_id": "g1",
        "material": "organico",
        "peso_estimado_kg": 1000,
        "pureza_pct": 80,
        "contaminacion_pct": 20,
        "evidencia_ids": [],
        "timestamp": "2026-04-30T08:00:00",
        "source": "captura_campo",
    })
    client.post("/operations/pickups", json={
        "event_id": "p2",
        "shift_id": "s1",
        "municipio_id": "qro",
        "ubicacion": "colonia centro",
        "generador_id": "g2",
        "material": "plastico",
        "peso_estimado_kg": 500,
        "pureza_pct": 60,
        "contaminacion_pct": 40,
        "evidencia_ids": [],
        "timestamp": "2026-04-30T09:00:00",
        "source": "captura_campo",
    })

    summary = summary_for_municipio("qro")
    assert summary.total_pickups == 2
    assert summary.toneladas_recuperadas == 1.5
    assert summary.pureza_promedio_pct == 70
    assert summary.contaminacion_promedio_pct == 30
    assert summary.warnings


def test_inspeccion_con_evidencia_se_registra():
    client = _client()
    _evidence(client)
    inspection = _inspection(client)

    assert inspection["inspection_id"] == "ins-qro"
    assert summary_for_municipio("qro").inspecciones == 1


def test_multa_sin_legalsource_verificado_se_bloquea():
    client = _client()
    get_repo().set_verificado("cor", False)
    _evidence(client)
    _inspection(client, municipio_id="cor")
    source = legal_source_for_municipio("cor")

    r = client.post("/operations/violations", json={
        "violation_id": "v-cor",
        "inspection_id": "ins-cor",
        "municipio_id": "cor",
        "legal_source_id": source.legal_source_id,
        "article_id": "Art. 11",
        "tipo_infraccion": "separacion_incorrecta",
        "etapa": "sancion_propuesta",
        "evidencia_ids": ["ev-1"],
        "monto_mxn": 1000,
        "derecho_aclaracion": True,
        "due_process_status": "sancion_propuesta",
        "status": "programado",
    })

    assert r.status_code == 422
    assert "Sin LegalSource municipal verificado" in r.text


def test_multa_sin_articulo_se_bloquea():
    client = _client()
    get_repo().set_verificado("qro", True)
    _evidence(client)
    _inspection(client)
    source = legal_source_for_municipio("qro")

    r = client.post("/operations/violations", json={
        "violation_id": "v-no-art",
        "inspection_id": "ins-qro",
        "municipio_id": "qro",
        "legal_source_id": source.legal_source_id,
        "article_id": "Art. 999",
        "tipo_infraccion": "separacion_incorrecta",
        "etapa": "sancion_propuesta",
        "evidencia_ids": ["ev-1"],
        "monto_mxn": 1000,
        "derecho_aclaracion": True,
        "due_process_status": "sancion_propuesta",
        "status": "programado",
    })
    assert r.status_code == 422


def test_multa_sin_evidencia_se_bloquea():
    client = _client()
    get_repo().set_verificado("qro", True)
    _evidence(client)
    _inspection(client)
    source = legal_source_for_municipio("qro")

    r = client.post("/operations/violations", json={
        "violation_id": "v-no-ev",
        "inspection_id": "ins-qro",
        "municipio_id": "qro",
        "legal_source_id": source.legal_source_id,
        "article_id": "Art. 11",
        "tipo_infraccion": "separacion_incorrecta",
        "etapa": "sancion_propuesta",
        "evidencia_ids": [],
        "monto_mxn": 1000,
        "derecho_aclaracion": True,
        "due_process_status": "sancion_propuesta",
        "status": "programado",
    })
    assert r.status_code == 422


def test_advertencia_no_sancionatoria_puede_existir_sin_multa():
    client = _client()
    source = legal_source_for_municipio("cor")
    r = client.post("/operations/violations", json={
        "violation_id": "adv-cor",
        "inspection_id": "sin-inspeccion",
        "municipio_id": "cor",
        "legal_source_id": source.legal_source_id,
        "article_id": "N/A",
        "tipo_infraccion": "educativa",
        "etapa": "advertencia_no_sancionatoria",
        "evidencia_ids": [],
        "monto_mxn": 500,
        "derecho_aclaracion": False,
        "due_process_status": "advertencia_no_sancionatoria",
        "status": "programado",
    })

    assert r.status_code == 200
    assert r.json()["monto_mxn"] == 0
    assert summary_for_municipio("cor").advertencias_educativas == 1


def test_derecho_de_aclaracion_queda_registrado():
    client = _client()
    get_repo().set_verificado("qro", True)
    _evidence(client)
    _inspection(client)
    source = legal_source_for_municipio("qro")
    r = client.post("/operations/violations", json={
        "violation_id": "v-ok",
        "inspection_id": "ins-qro",
        "municipio_id": "qro",
        "legal_source_id": source.legal_source_id,
        "article_id": "Art. 11",
        "tipo_infraccion": "separacion_incorrecta",
        "etapa": "notificacion",
        "evidencia_ids": ["ev-1"],
        "monto_mxn": 1000,
        "derecho_aclaracion": True,
        "due_process_status": "notificacion",
        "status": "programado",
    })

    assert r.status_code == 200
    assert r.json()["derecho_aclaracion"] is True


def test_sancion_no_puede_saltar_debido_proceso():
    client = _client()
    get_repo().set_verificado("qro", True)
    _evidence(client)
    _inspection(client)
    source = legal_source_for_municipio("qro")
    client.post("/operations/violations", json={
        "violation_id": "v-step",
        "inspection_id": "ins-qro",
        "municipio_id": "qro",
        "legal_source_id": source.legal_source_id,
        "article_id": "Art. 11",
        "tipo_infraccion": "separacion_incorrecta",
        "etapa": "notificacion",
        "evidencia_ids": ["ev-1"],
        "monto_mxn": 1000,
        "derecho_aclaracion": True,
        "due_process_status": "notificacion",
        "status": "programado",
    })
    jumped = client.patch("/operations/violations/v-step/transition", params={"next_status": "sancion_firme"})
    assert jumped.status_code == 422
    ok = client.patch("/operations/violations/v-step/transition", params={"next_status": "en_aclaracion"})
    assert ok.status_code == 200
    assert ok.json()["due_process_status"] == "en_aclaracion"


def test_agora_recibe_bitacora_operativa():
    summary = {"municipio_id": "qro", "total_pickups": 1, "warnings": ["Contaminacion alta"]}
    plan_input = PlanInput(
        municipio="qro",
        zm="QRO",
        scenario_json={"zm": "QRO"},
        kpis_json={},
        operations_summary=summary,
    )
    bundle = build_bundle_from_plan_input(plan_input, municipios_activos=["qro"])
    bundle.inputs_usuario["operations_summary"] = plan_input.operations_summary
    assert bundle.inputs_usuario["operations_summary"]["total_pickups"] == 1


def test_slp_qro_mty_no_comparten_fundamento_legal():
    slp = legal_source_for_municipio("slp")
    qro = legal_source_for_municipio("qro")
    mty = legal_source_for_municipio("mty")

    assert slp.legal_source_id != qro.legal_source_id
    assert qro.legal_source_id != mty.legal_source_id
    assert slp.municipio_id == "slp"
    assert qro.municipio_id == "qro"
    assert mty.municipio_id == "mty"
