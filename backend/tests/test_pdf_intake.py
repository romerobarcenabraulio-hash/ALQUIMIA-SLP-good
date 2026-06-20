from __future__ import annotations

from pathlib import Path

import pytest

from app.pdf_intake import (
    OcrUnavailableError,
    classify_pdf_path,
    extract_claims,
    is_suspicious_text,
    run_pdf_scraping_checklist,
)


def _fake_pdf(path: Path) -> Path:
    path.write_bytes(b"%PDF-1.4\n% fake fixture for classifier/checklist\n")
    return path


def test_classifies_standards_as_catalog_not_tenant_data():
    result = classify_pdf_path("ESTANDARES INTERNACIONALES/GRI 306_ Waste 2020.pdf")

    assert result.tipo == "norma"
    assert result.dato_clave == "GRI 306"
    assert result.modulo_destino == "catalogo_estandares / M18-M19"
    assert result.provenance.source.endswith("GRI 306_ Waste 2020.pdf")
    assert result.provenance.metodo == "filename_path_rules_v1"


def test_classifies_gaceta_or_dof_as_initiative_catalog():
    result = classify_pdf_path("ADENDOS: LEGAL/pdfs/reglamentos/MTY_spg_gaceta118_2009.pdf")

    assert result.tipo == "iniciativa"
    assert result.modulo_destino == "catalogo_iniciativas / Modo B / M03B"
    assert result.estado == "pendiente_extraer_claims"


def test_detects_cid_or_empty_direct_text_as_suspicious():
    suspicious, replacement_ratio, word_count = is_suspicious_text("(cid:123) (cid:555) \ufffd \ufffd")

    assert suspicious is True
    assert replacement_ratio >= 0
    assert word_count < 30


def test_claim_extraction_finds_legal_obligations():
    claims = extract_claims(
        "Articulo 5. El municipio debera prestar el servicio de limpia y manejo de residuos solidos. "
        "Este texto corto no importa. "
        "La publicacion oficial establece obligaciones de separacion y valorizacion."
    )

    assert claims
    assert "municipio" in claims[0].lower()


def test_checklist_breaks_at_extract_when_direct_text_bad_and_ocr_unavailable(tmp_path, monkeypatch):
    pdf = _fake_pdf(tmp_path / "periodico_oficial_fixture.pdf")

    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct",
        lambda path: type(
            "Direct",
            (),
            {
                "suspicious": True,
                "char_count": 12,
                "word_count": 0,
                "text": "(cid:123)",
                "method": "pdfplumber",
            },
        )(),
    )

    result = run_pdf_scraping_checklist(
        pdf,
        downloaded=True,
        source_kind="iniciativa",
        tenant_exists=True,
        ocr_backend=lambda images: (_ for _ in ()).throw(OcrUnavailableError("sin OCR")),
    )

    assert result.broken_step == 2
    assert result.steps[0].status == "ok"
    assert result.steps[1].name == "extrae"
    assert "OCR" in result.steps[1].evidence


def test_checklist_reaches_alert_when_ocr_recovers_claims_for_existing_tenant(tmp_path, monkeypatch):
    pdf = _fake_pdf(tmp_path / "periodico_oficial_fixture.pdf")

    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct",
        lambda path: type(
            "Direct",
            (),
            {
                "suspicious": True,
                "char_count": 12,
                "word_count": 0,
                "text": "(cid:123)",
                "method": "pdfplumber",
            },
        )(),
    )
    monkeypatch.setattr(
        "app.pdf_intake.rasterize_pdf_to_jpeg",
        lambda path, output_dir, resolution=150, max_pages=3: [Path(output_dir) / "page-1.jpg"],
    )

    result = run_pdf_scraping_checklist(
        pdf,
        downloaded=True,
        source_kind="iniciativa",
        tenant_exists=True,
        ocr_backend=lambda images: (
            "Articulo 10. El municipio debera actualizar su reglamento de residuos. "
            "La publicacion oficial establece una obligacion municipal."
        ),
    )

    assert result.broken_step == 5
    assert [step.status for step in result.steps] == ["ok", "ok", "ok", "ok", "pending"]
    assert "falta crear/emitir alerta persistente" in result.steps[-1].evidence
