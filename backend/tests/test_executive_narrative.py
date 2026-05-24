"""Ghostwriter → PDF ejecutivo (doc 01)."""
import asyncio

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.agents.agora import PlanInput, draft_ejecutivo_for_export
from app.export.router import router


def test_draft_ejecutivo_fallback_has_scqa_sections():
    plan = PlanInput(
        municipio="San Luis Potosí",
        zm="ZM_SLPS",
        scenario_json={
            "horizonte": 3,
            "arbol_decision": {"tienepresupuesto": True, "camino_recomendado": "Esquema A"},
        },
        kpis_json={"tir": 11.5, "vpn": 1_200_000, "capex_total": 75_000_000},
        data_provenance={"score_datos": 72},
    )
    doc = asyncio.run(draft_ejecutivo_for_export(plan, municipios_activos=["28028"]))
    assert doc is not None
    assert len(doc.secciones) >= 7
    titles = " ".join(s.titulo for s in doc.secciones)
    assert "Problema" in titles or "decisión" in titles.lower()
    assert "Retorno" in titles or "Inversión" in titles


def test_executive_pdf_includes_ghostwriter_narrative():
    app = FastAPI()
    app.include_router(router, prefix="/export")
    client = TestClient(app)
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "resultados": {"tir": 12.0, "vpn": 900_000, "capex_total": 50_000_000},
            "contexto_municipal": {
                "municipio_nombre": "San Luis Potosí",
                "arbol_decision": {"tienepresupuesto": True},
            },
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 5_000
