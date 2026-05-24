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


def test_executive_pdf_returns_pdf_bytes():
    client = _client()
    res = client.post(
        "/export/executive-pdf",
        json={
            "zm": "ZM_SLPS",
            "municipio_id": "28028",
            "municipio_nombre": "San Luis Potosí",
            "document_id": "01_resumen_ejecutivo_municipal",
            "resultados": {"tir": 12.5, "vpn": 1_500_000, "capex_total": 80_000_000},
            "snapshot_datos": {
                "score_datos": 78,
                "advertencias": ["Dato manual en cobertura"],
                "fuentes_usadas": ["INEGI 2020", "Reglamento SLP"],
            },
        },
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 3_000


def test_index_pdf_returns_pdf_bytes():
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
