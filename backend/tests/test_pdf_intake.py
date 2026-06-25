from __future__ import annotations

import asyncio
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from app.pdf_intake import (
    OcrUnavailableError,
    OcrResult,
    Provenance,
    assess_text_quality,
    build_inventory,
    classify_pdf_path,
    extract_claims,
    extract_pdf_text_with_fallback,
    rasterize_pdf_to_jpeg,
    run_pdf_scraping_checklist,
)


def _fake_pdf(path: Path) -> Path:
    path.write_bytes(b"%PDF-1.4\n% fake fixture for classifier/checklist\n")
    return path


def test_classifies_gri_iso_as_standard_catalog_not_tenant_data():
    gri = classify_pdf_path("ESTANDARES INTERNACIONALES/GRI 306_ Waste 2020.pdf")
    iso = classify_pdf_path("ESTANDARES INTERNACIONALES/norma-iso-14001.pdf")

    assert gri.tipo == "norma"
    assert gri.dato_clave == "GRI 306"
    assert gri.modulo_destino == "catalogo_estandares / M18-M19"
    assert iso.tipo == "norma"
    assert iso.modulo_destino == "catalogo_estandares / M18-M19"
    assert "tenant" not in gri.modulo_destino.lower()


def test_classifies_gaceta_dof_as_initiative_catalog():
    result = classify_pdf_path("ADENDOS: LEGAL/pdfs/reglamentos/MTY_spg_gaceta118_2009.pdf")

    assert result.tipo == "iniciativa"
    assert result.modulo_destino == "catalogo_iniciativas / Modo B / M03B"
    assert result.estado == "pendiente_extraer_claims_y_alerta"


def test_official_signal_wins_over_standard_tokens():
    result = classify_pdf_path("https://dof.gob.mx/nota_detalle.php?codigo=NOM-083-norma.pdf")

    assert result.tipo == "iniciativa"
    assert result.modulo_destino == "catalogo_iniciativas / Modo B / M03B"


def test_municipal_signal_wins_over_standard_tokens():
    result = classify_pdf_path("NORMAS/reglamento_norma_municipal.pdf")

    assert result.tipo == "dato_cliente"
    assert result.modulo_destino == "M03/M03B legal municipal"


def test_diario_without_official_signal_stays_client_data():
    result = classify_pdf_path("reportes/bitacora/diario_de_ruta_municipal.pdf")

    assert result.tipo == "dato_cliente"
    assert result.modulo_destino == "M03/M03B legal municipal"


def test_diario_oficial_signal_is_initiative():
    result = classify_pdf_path("DOF/diario_oficial_residuos.pdf")

    assert result.tipo == "iniciativa"
    assert result.modulo_destino == "catalogo_iniciativas / Modo B / M03B"


def test_detects_cid_empty_or_garbage_text_as_suspicious():
    cid_result = assess_text_quality("(cid:123) (cid:555) \ufffd \ufffd")
    garbage_result = assess_text_quality("BBBBB TTTTT PPPPP 12345 ///// " * 20)

    assert cid_result[0] is True
    assert garbage_result[0] is True


def test_claim_extraction_finds_legal_obligations():
    claims = extract_claims(
        "Articulo 5. El municipio debera prestar el servicio de limpia y manejo de residuos solidos. "
        "La publicacion oficial establece obligaciones de separacion y valorizacion."
    )

    assert claims
    assert "municipio" in claims[0].lower()


def test_pdf_text_fallback_uses_ocr_when_direct_text_is_suspicious(monkeypatch):
    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct_from_bytes",
        lambda pdf_bytes, source, max_pages=10: type(
            "Direct",
            (),
            {
                "text": "(cid:123)",
                "method": "pdftotext",
                "char_count": 9,
                "word_count": 0,
                "replacement_ratio": 0.0,
                "suspicious": True,
            },
        )(),
    )
    monkeypatch.setattr(
        "app.pdf_intake.rasterize_pdf_to_jpeg",
        lambda pdf_bytes, output_dir, source, resolution=150, max_pages=3: [Path(output_dir) / "page-1.jpg"],
    )

    text, direct, ocr = extract_pdf_text_with_fallback(
        b"%PDF-1.4",
        source="https://dof.gob.mx/nota_detalle.pdf",
        ocr_backend=lambda images: "Articulo 10. El municipio debera actualizar su reglamento.",
    )

    assert direct.suspicious is True
    assert ocr is not None
    assert ocr.method == "pdftoppm_jpeg_150_then_ocr"
    assert "municipio" in text.lower()


def test_forced_official_ocr_preserves_usable_direct_text_when_ocr_missing(monkeypatch):
    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct_from_bytes",
        lambda pdf_bytes, source, max_pages=10: type(
            "Direct",
            (),
            {
                "text": "Texto oficial legible con articulos y obligaciones suficientes.",
                "method": "pdfplumber",
                "char_count": 250,
                "word_count": 35,
                "replacement_ratio": 0.0,
                "suspicious": False,
            },
        )(),
    )
    monkeypatch.setattr(
        "app.pdf_intake.extract_with_raster_ocr_from_bytes",
        lambda *args, **kwargs: (_ for _ in ()).throw(OcrUnavailableError("sin tesseract")),
    )

    text, direct, ocr = extract_pdf_text_with_fallback(
        b"%PDF-1.4",
        source="https://dof.gob.mx/nota_detalle.pdf",
        force_ocr_for_official=True,
    )

    assert ocr is None
    assert direct.suspicious is False
    assert "Texto oficial legible" in text


def test_pdf_text_fallback_keeps_partial_direct_text_when_ocr_is_empty(monkeypatch):
    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct_from_bytes",
        lambda pdf_bytes, source, max_pages=10: type(
            "Direct",
            (),
            {
                "text": "Articulo 9. Texto parcial util del PDF con obligaciones municipales.",
                "method": "pdftotext",
                "char_count": 90,
                "word_count": 10,
                "replacement_ratio": 0.0,
                "suspicious": True,
            },
        )(),
    )
    monkeypatch.setattr(
        "app.pdf_intake.extract_with_raster_ocr_from_bytes",
        lambda pdf_bytes, source, ocr_backend: OcrResult(
            text="",
            method="pdftoppm_jpeg_150_then_ocr",
            image_count=1,
            claims=[],
            provenance=Provenance(source, "2026-06-25T00:00:00+00:00", "test"),
        ),
    )

    text, direct, ocr = extract_pdf_text_with_fallback(b"%PDF-1.4", source="fixture.pdf")

    assert direct.suspicious is True
    assert ocr is not None
    assert "Texto parcial util" in text


def test_raster_ocr_rejects_empty_page_list(monkeypatch):
    monkeypatch.setattr("app.pdf_intake.rasterize_pdf_to_jpeg", lambda *args, **kwargs: [])

    try:
        from app.pdf_intake import extract_with_raster_ocr_from_bytes

        extract_with_raster_ocr_from_bytes(
            b"%PDF-1.4",
            source="fixture.pdf",
            ocr_backend=lambda images: "",
        )
    except OcrUnavailableError as exc:
        assert "no se generaron imagenes" in str(exc)
    else:
        raise AssertionError("empty raster output should fail before OCR")


def test_rasterize_returns_only_current_run_pages(tmp_path, monkeypatch):
    stale = tmp_path / "page-stale-1.jpg"
    stale.write_text("stale")

    monkeypatch.setattr("app.pdf_intake._pdftoppm_path", lambda: "/usr/bin/pdftoppm")

    def fake_run(cmd, check, capture_output, text, timeout):
        prefix = Path(cmd[-1])
        (tmp_path / f"{prefix.name}-1.jpg").write_text("current")

    monkeypatch.setattr("app.pdf_intake.subprocess.run", fake_run)

    images = rasterize_pdf_to_jpeg(b"%PDF-1.4", tmp_path, source="fixture.pdf")

    assert images == [next(path for path in tmp_path.glob("page-*-1.jpg") if path != stale)]
    assert stale not in images


def test_checklist_breaks_at_extract_when_ocr_is_unavailable(tmp_path, monkeypatch):
    pdf = _fake_pdf(tmp_path / "periodico_oficial_fixture.pdf")
    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct_from_path",
        lambda path: type(
            "Direct",
            (),
            {
                "suspicious": True,
                "char_count": 12,
                "word_count": 0,
                "text": "(cid:123)",
                "method": "pdftotext",
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
        "app.pdf_intake.extract_text_direct_from_path",
        lambda path: type(
            "Direct",
            (),
            {
                "suspicious": True,
                "char_count": 12,
                "word_count": 0,
                "text": "(cid:123)",
                "method": "pdftotext",
            },
        )(),
    )
    monkeypatch.setattr(
        "app.pdf_intake.rasterize_pdf_to_jpeg",
        lambda pdf_bytes, output_dir, source, resolution=150, max_pages=3: [Path(output_dir) / "page-1.jpg"],
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


def test_inventory_rows_include_source_fecha_method(tmp_path, monkeypatch):
    pdf = _fake_pdf(tmp_path / "GRI 306_ Waste 2020.pdf")
    monkeypatch.setattr(
        "app.pdf_intake.extract_text_direct_from_path",
        lambda path: type(
            "Direct",
            (),
            {
                "suspicious": False,
                "char_count": 250,
                "word_count": 40,
                "text": "GRI 306 residuos " * 40,
                "method": "pdfplumber",
            },
        )(),
    )

    rows = build_inventory([pdf])

    assert rows[0].tipo == "norma"
    assert rows[0].texto_extraible == "si"
    assert rows[0].provenance.source.endswith("GRI 306_ Waste 2020.pdf")
    assert rows[0].provenance.fecha
    assert "pdfplumber" in rows[0].provenance.metodo


def test_inventory_records_failed_pdf_and_continues(tmp_path, monkeypatch):
    first = _fake_pdf(tmp_path / "bad_reglamento.pdf")
    second = _fake_pdf(tmp_path / "GRI 306_ Waste 2020.pdf")

    def fake_extract(path):
        if Path(path).name == "bad_reglamento.pdf":
            raise ValueError("malformed PDF")
        return type(
            "Direct",
            (),
            {
                "suspicious": False,
                "char_count": 250,
                "word_count": 40,
                "text": "GRI 306 residuos " * 40,
                "method": "pdfplumber",
            },
        )()

    monkeypatch.setattr("app.pdf_intake.extract_text_direct_from_path", fake_extract)

    rows = build_inventory([first, second])

    assert len(rows) == 2
    assert rows[0].texto_extraible == "no"
    assert "ValueError" in rows[0].provenance.metodo
    assert rows[1].tipo == "norma"


def test_dof_scraper_populates_content_from_linked_pdf(monkeypatch):
    from app.web_scraper import scrapers

    async def fake_get_html(url, timeout=20):
        if "busqueda" in url:
            return '<a href="/nota_detalle.php?codigo=123">Norma de residuos municipales</a>'
        return '<html><body><a href="/docs/nota.pdf">PDF</a></body></html>'

    async def fake_pdf_text(url):
        return "Articulo 1. El municipio debera gestionar residuos solidos urbanos."

    monkeypatch.setattr(scrapers, "_get_html", fake_get_html)
    monkeypatch.setattr(scrapers, "extract_text_from_pdf_url", fake_pdf_text)

    docs = asyncio.run(scrapers.DOFScraper().search_documents(["residuos"], days_back=1))

    assert len(docs) == 1
    assert "municipio debera" in docs[0].contenido_text


def test_pdf_url_detection_accepts_pdf_in_query_parameters():
    from app.web_scraper import scrapers

    assert scrapers._looks_like_pdf_url("https://example.test/download?file=nota.pdf&id=123") is True


def test_official_pdf_url_detection_does_not_force_client_diario_files():
    from app.web_scraper import scrapers

    assert scrapers._is_official_pdf_url("https://cliente.test/reportes/diario_operacion.pdf") is False
    assert scrapers._is_official_pdf_url("https://www.dof.gob.mx/nota_detalle.php?codigo=123") is True
    assert scrapers._is_official_pdf_url("https://estado.test/periodico_oficial_residuos.pdf") is True


def test_dof_scraper_urlencodes_keyword_query(monkeypatch):
    from app.web_scraper import scrapers

    captured_urls: list[str] = []

    async def fake_get_html(url, timeout=20):
        captured_urls.append(url)
        return ""

    monkeypatch.setattr(scrapers, "_get_html", fake_get_html)

    docs = asyncio.run(
        scrapers.DOFScraper().search_documents(["residuos&fFinal=01/01/2000"], days_back=1)
    )

    query = parse_qs(urlparse(captured_urls[0]).query)
    assert docs == []
    assert query["texto"] == ["residuos&fFinal=01/01/2000"]


def test_dof_scraper_preserves_metadata_when_content_extraction_times_out(monkeypatch):
    from app.web_scraper import scrapers

    async def fake_get_html(url, timeout=20):
        return '<a href="/nota_detalle.php?codigo=123">Norma de residuos municipales</a>'

    async def timeout_extract(url):
        raise asyncio.TimeoutError

    monkeypatch.setattr(scrapers, "_get_html", fake_get_html)
    monkeypatch.setattr(scrapers, "extract_content_from_document_url", timeout_extract)

    docs = asyncio.run(scrapers.DOFScraper().search_documents(["residuos"], days_back=1))

    assert len(docs) == 1
    assert docs[0].titulo == "Norma de residuos municipales"
    assert docs[0].contenido_text == ""


def test_scheduler_marks_extracted_text_only_when_content_is_present():
    from app.web_scraper.scheduler import _has_extracted_text

    assert _has_extracted_text(" Articulo 1. ") is True
    assert _has_extracted_text("   ") is False
    assert _has_extracted_text(None) is False
