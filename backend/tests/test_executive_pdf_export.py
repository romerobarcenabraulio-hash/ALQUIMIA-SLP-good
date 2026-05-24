"""Blueprints y PDF consultoría por documento."""
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.export.document_blueprints import BLUEPRINTS, get_blueprint, list_package_blueprints
from app.export.router import router


def test_all_canonical_blueprints_exist():
    assert len(list_package_blueprints()) == 12
    assert get_blueprint("01_resumen_ejecutivo_municipal") is not None
    assert get_blueprint("03_diagnostico_reforma_slp") is not None
    assert get_blueprint("12_expediente_inspeccion") is not None
    assert get_blueprint("99_unknown") is None


def test_blueprint_has_cover_toc_sections():
    bp = BLUEPRINTS["02_modelo_tecnico_financiero"]
    assert bp.codigo == "02"
    assert len(bp.indice) >= 5
    assert bp.frame.value == "action"
    assert all(e.action_title for e in bp.indice)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/export")
    return TestClient(app)


def test_executive_pdf_with_research_findings():
    client = _client()
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "document_id": "01_resumen_ejecutivo_municipal",
            "resultados": {"tir": 12.5, "vpn": 1_500_000},
            "contexto_municipal": {
                "municipio_nombre": "San Luis Potosí",
                "research_findings": {
                    "noticias_locales": [
                        {"titulo": "Programa de reciclaje", "domain": "eluniversal.com.mx", "snippet": "cabildo"},
                    ],
                    "reglamentos": [
                        {"titulo": "Programa municipal de separación 2025", "domain": "gob.mx", "snippet": "vigente"},
                    ],
                    "queries_con_resultado": 2,
                },
            },
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 4_000


def test_executive_pdf_with_municipal_context():
    client = _client()
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "document_id": "01_resumen_ejecutivo_municipal",
            "resultados": {"tir": 12.5, "vpn": 1_500_000},
            "contexto_municipal": {
                "municipio_nombre": "San Luis Potosí",
                "estado_nombre": "San Luis Potosí",
                "arbol_decision": {
                    "tienepresupuesto": True,
                    "camino_recomendado": "Esquema A — operación municipal directa.",
                },
                "noticias_locales": [{"titulo": "Programa de reciclaje", "domain": "eluniversal.com.mx"}],
            },
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 4_000


def test_municipal_context_narrative_blocks():
    from app.export.municipal_context import narrative_blocks

    blocks = narrative_blocks({
        "municipio_nombre": "Querétaro",
        "estado_nombre": "Querétaro",
        "arbol_decision": {"tienepresupuesto": False, "existeConcesionario": False},
        "legal": {"reglamento_nombre": "Reglamento RSU", "score_legal": 45, "brecha_critica": 2},
    })
    titles = [b[0] for b in blocks]
    assert any("Querétaro" in t for t in titles)
    assert "Árbol de decisión institucional" in titles
    assert "Reglamento y brechas normativas" in titles


def test_executive_pdf_returns_pdf_bytes():
    client = _client()
    res = client.post(
        "/export/index-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "snapshot_datos": {"score_datos": 80},
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"


def test_document_pdf_skeleton():
    client = _client()
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "document_id": "05_manual_operativo_90_dias",
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"


def test_expediente_pdf_returns_pdf_bytes():
    client = _client()
    res = client.post(
        "/export/expediente-pdf",
        json={
            "zm": "ZM_SLPS",
            "predio": {
                "predio_id": "p1",
                "municipio_id": "slp",
                "direccion_texto": "Calle Ejemplo 123",
                "lat": 22.15,
                "lon": -100.98,
            },
            "inspeccion": {
                "fecha_inspeccion": "2026-05-22",
                "tipo_infraccion": "basura_clandestina",
                "descripcion_hallazgo": "Residuos acumulados en banqueta",
                "tiene_permiso_ca": False,
                "inspector_nombre": "Juan Pérez",
                "inspector_cargo": "Inspector",
            },
            "expediente": {
                "expediente_id": "exp-test-001",
                "municipio_id": "slp",
                "fecha_generacion": "2026-05-22T12:00:00Z",
                "nivel_sancion": "multa_menor",
                "articulo_reglamento": "Art. 37 bis",
                "valor_uma_mxn": 113.14,
                "monto_min_mxn": 565.7,
                "monto_max_mxn": 1131.4,
                "uma_aplicado": 7.5,
                "genera_clausura": False,
                "disclaimer": "Borrador orientativo.",
            },
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 3_000
