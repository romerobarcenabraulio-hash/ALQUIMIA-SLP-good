import base64
import hashlib

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.legal.router import router
from app.legal.source_ingest import ingest_municipal_legal_source, locate_municipal_legal_source
from app.legal.schemas import LegalSourceIngestRequest


@pytest.fixture(autouse=True)
def reset_repo():
    import app.legal.repository as mod
    mod._repo = None
    yield
    mod._repo = None


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/legal")
    return TestClient(app)


def test_zm_no_puede_producir_fuente_legal_municipal_unica():
    res = _client().get("/legal/zm/SLP/source-manifest")

    assert res.status_code == 400
    detail = res.json()["detail"]
    assert detail["ok"] is False
    assert "ZM no puede" in detail["error"] or "ZM" in detail["error"]
    assert "municipio" in detail["next_action"]


def test_fuente_localizada_no_se_marca_vigente_ni_validada():
    """Municipio con URL pero sin PDF en catálogo → localizado, no descargado."""
    manifest = locate_municipal_legal_source("snl")

    assert manifest is not None
    assert manifest.municipio_id == "snl"
    assert manifest.zm == "MTY"
    assert manifest.official_url
    assert manifest.ingest_status == "localizado"
    assert manifest.validation_status == "pendiente_validacion_juridica"
    assert manifest.officiality == "fuente_localizada_no_validada"
    assert manifest.can_enable_sanctions is False
    assert manifest.can_generate_official_document is False
    assert manifest.checksum_sha256 is None
    assert manifest.blockers


@pytest.mark.parametrize(
    ("municipio_id", "expected_status"),
    [
        ("gdl", "descargado"),
        ("zap", "descargado"),
        ("spg", "descargado"),
        ("snl", "localizado"),
    ],
)
def test_fuentes_csa_estado_ingesta(municipio_id, expected_status):
    manifest = locate_municipal_legal_source(municipio_id)

    assert manifest is not None
    assert manifest.municipio_id == municipio_id
    if expected_status == "localizado":
        assert manifest.official_url
        assert manifest.officiality == "fuente_localizada_no_validada"
        assert manifest.can_enable_simulation is False
    else:
        assert manifest.officiality == "documento_descargado_no_validado"
        assert manifest.can_enable_simulation is True
    assert manifest.ingest_status == expected_status
    assert manifest.validation_status == "pendiente_validacion_juridica"
    assert manifest.can_enable_education is True
    assert manifest.can_enable_sanctions is False
    assert manifest.can_generate_official_document is False
    assert manifest.next_action


def test_fuente_descargada_guarda_checksum_de_bytes_no_solo_metadata():
    payload = b"%PDF-1.4 reglamento municipal de prueba"
    content_b64 = base64.b64encode(payload).decode("ascii")

    manifest = ingest_municipal_legal_source(
        "slp",
        LegalSourceIngestRequest(
            official_url="https://sanluis.gob.mx/reglamento-limpia.pdf",
            download_url="https://sanluis.gob.mx/reglamento-limpia.pdf",
            status_http=200,
            content_type="application/pdf",
            content_base64=content_b64,
        ),
    )

    assert manifest is not None
    assert manifest.ingest_status == "descargado"
    assert manifest.validation_status == "pendiente_validacion_juridica"
    assert manifest.officiality == "documento_descargado_no_validado"
    assert manifest.checksum_sha256 == hashlib.sha256(payload).hexdigest()
    assert manifest.bytes_size == len(payload)
    assert manifest.can_enable_sanctions is False
    assert "validación jurídica" in " ".join(manifest.warnings)


def test_descarga_fallida_conserva_estado_explicito_y_accion_siguiente():
    manifest = ingest_municipal_legal_source(
        "slp",
        LegalSourceIngestRequest(
            official_url="https://sanluis.gob.mx/no-encontrado.pdf",
            download_url="https://sanluis.gob.mx/no-encontrado.pdf",
            status_http=404,
            content_type="text/html",
        ),
    )

    assert manifest is not None
    assert manifest.ingest_status == "no_disponible"
    assert manifest.validation_status == "no_disponible"
    assert manifest.status_http == 404
    assert manifest.checksum_sha256 is None
    assert manifest.next_action
    assert manifest.blockers


def test_municipio_sin_pdf_bloquea_sanciones_y_simulacion():
    manifest = locate_municipal_legal_source("csp")

    assert manifest is not None
    assert manifest.ingest_status == "no_disponible"
    assert manifest.can_enable_education is True
    assert manifest.can_enable_simulation is False
    assert manifest.can_enable_sanctions is False
    assert manifest.can_generate_official_document is False
    assert "Sanciones" in " ".join(manifest.blockers) or "PDF" in " ".join(manifest.blockers)


def test_endpoint_municipal_source_manifest_es_observable():
    res = _client().get("/legal/slp/source-manifest")

    assert res.status_code == 200
    payload = res.json()
    assert payload["municipio_id"] == "slp"
    assert payload["zm"] == "SLP"
    assert payload["validation_status"] == "pendiente_validacion_juridica"
    assert payload["can_enable_sanctions"] is False
    assert payload["next_action"]


def test_endpoint_post_rechaza_base64_invalido_con_error_explicito():
    res = _client().post(
        "/legal/slp/source-manifest",
        json={
            "official_url": "https://sanluis.gob.mx/reglamento.pdf",
            "content_base64": "no-es-base64@@@",
        },
    )

    assert res.status_code == 400
    assert "content_base64" in res.json()["detail"]
