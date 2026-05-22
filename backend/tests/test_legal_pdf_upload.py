"""Carga de PDF municipal — habilita análisis."""
from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.legal.diagnostic import build_diagnostic
from app.legal.router import router
from app.legal.source_ingest import locate_municipal_legal_source, pdf_ingested_for_analysis


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


def test_sin_pdf_bloquea_analisis_para_municipio_sin_archivo():
    diag = build_diagnostic("mar")
    assert diag is not None
    assert diag.agora_bloqueado is True
    assert diag.can_enable_simulation is False
    assert not pdf_ingested_for_analysis(diag.source_manifest)


def test_upload_pdf_habilita_municipio_y_dispara_diagnostico(tmp_path, monkeypatch):
    import app.legal.pdf_storage as pdf_mod

    monkeypatch.setattr(pdf_mod, "reglamentos_dir", lambda: tmp_path)

    pdf_bytes = b"%PDF-1.4\nreglamento prueba mar\n"
    res = _client().post(
        "/legal/mar/upload-pdf",
        files={"file": ("reglamento_mar.pdf", pdf_bytes, "application/pdf")},
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["municipio_id"] == "mar"
    assert payload["analysis_ready"] is True
    assert payload["manifest"]["ingest_status"] == "descargado"
    assert payload["diagnostic"]["agora_bloqueado"] is False
    assert payload["diagnostic"]["can_enable_simulation"] is True

    manifest = locate_municipal_legal_source("mar")
    assert manifest is not None
    assert manifest.ingest_status == "descargado"
    filename = (manifest.download_url or "").split("/")[-1]
    assert (tmp_path / filename).exists()


def test_upload_rechaza_no_pdf():
    res = _client().post(
        "/legal/csp/upload-pdf",
        files={"file": ("nota.txt", b"hola", "text/plain")},
    )
    assert res.status_code == 400
