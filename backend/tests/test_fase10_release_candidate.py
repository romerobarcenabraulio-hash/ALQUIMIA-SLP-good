"""Fase 10 - hardening y release candidate."""
from __future__ import annotations

import os
import tempfile
import zipfile
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.simulate import ScenarioInput
from app.services.calculator import calcular_scenario


def _make_export_bundle():
    from app.agents.schemas import (
        DocumentStatusLevel,
        ExportBundle,
        ExportedDocument,
        ExportedFile,
        ExportManifest,
    )

    docs = [
        ExportedDocument(
            document_id="01_resumen_ejecutivo_municipal",
            filename="01_Resumen_Ejecutivo_Municipal.md",
            format="md",
            status=DocumentStatusLevel.defendible,
            version="0.1-release",
            source="test",
            warnings=[],
        ),
        ExportedDocument(
            document_id="07_fuentes_trazabilidad",
            filename="07_Fuentes_Trazabilidad.md",
            format="md",
            status=DocumentStatusLevel.bloqueado,
            version="0.1-release",
            source="test",
            warnings=["Sin evidencia suficiente"],
        ),
    ]
    manifest = ExportManifest(
        bundle_id="rc-bundle-001",
        zm="QRO",
        municipios=["qro", "cor"],
        version="0.1-release",
        files=[ExportedFile(filename=d.filename, format=d.format) for d in docs],
        fuentes_usadas=["Simulador ALQUIMIA", "CoverageStatus municipal"],
        kpis_incluidos=["rsu_total_ton_dia", "ingresos_brutos"],
        warnings_activos=["Corregidora con legal no verificado"],
        score_datos=80,
    )
    return ExportBundle(
        bundle_id="rc-bundle-001",
        zm="QRO",
        municipios=["qro", "cor"],
        documents=docs,
        manifest=manifest,
        warnings=["Corregidora con legal no verificado"],
    )


def test_healthcheck_api():
    client = TestClient(app)
    r = client.get("/health")

    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_simular_escenario_basico_qro():
    result = calcular_scenario(ScenarioInput(zm_activa="QRO", municipios_activos=["qro", "cor"]))

    assert result.rsu_total_ton_dia > 0
    assert result.ingresos_brutos >= 0
    assert result.vol_capturable_por_mat_ton_anio


def test_package_manifest_zip_y_warnings_persisten():
    with tempfile.TemporaryDirectory() as tmp:
        with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
            import importlib
            import app.services.package_store as store_mod

            importlib.reload(store_mod)
            bundle = _make_export_bundle()
            record = store_mod.save_package("rc-pkg-001", bundle)
            manifest = store_mod.get_manifest("rc-pkg-001")
            zip_bytes = store_mod.get_zip_bytes("rc-pkg-001")

            assert record.checksum
            assert manifest["warnings_activos"]
            assert zip_bytes is not None
            zip_path = Path(tmp) / "rc-pkg-001" / "package.zip"
            with zipfile.ZipFile(zip_path) as zf:
                names = zf.namelist()
            assert "manifest.json" in names
            assert all(not name.endswith(".txt") for name in names)


def test_render_profesional_zip_manifest_render_report_y_bloqueado():
    with tempfile.TemporaryDirectory() as tmp:
        with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
            import importlib
            import app.services.package_store as store_mod
            import app.export.package_renderer as renderer_mod

            importlib.reload(store_mod)
            importlib.reload(renderer_mod)
            bundle = _make_export_bundle()
            store_mod.save_package("rc-pkg-render", bundle)
            report = renderer_mod.render_package("rc-pkg-render", resultados={"tir": 18, "ingresos_brutos": 1000})
            pro_zip = renderer_mod.get_professional_zip_bytes("rc-pkg-render")
            render_report = renderer_mod.get_render_report("rc-pkg-render")

            assert report.qa_status in ("partial", "failed")
            assert report.n_bloqueados() > 0
            assert pro_zip is not None
            assert render_report is not None
            zip_file = Path(tmp) / "rc-pkg-render" / "professional_package.zip"
            with zipfile.ZipFile(zip_file) as zf:
                names = zf.namelist()
            assert "manifest.json" in names
            assert "render_report.json" in names
            assert any(name.endswith(".docx") for name in names)
            assert any(name.endswith(".xlsx") for name in names)


def test_no_mezcla_legal_municipal_en_release():
    from app.national.coverage import coverage_for_zm

    coverage = coverage_for_zm("QRO")
    qro = next(c for c in coverage if c.municipio_id == "qro")
    cor = next(c for c in coverage if c.municipio_id == "cor")

    assert qro.legal.value == "verificado"
    assert cor.legal.value != "verificado"
    assert cor.agora_bloqueado
