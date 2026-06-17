"""Tests ALQ-15 — PDF ejecutivo municipal con procedencia."""
from __future__ import annotations

import pytest

from app.national.schemas import CoverageStage, CoverageStatus, MunicipioProfile, SourceStatus


@pytest.fixture()
def profile_slp() -> MunicipioProfile:
    return MunicipioProfile(
        municipio_id="slp_slp",
        clave_inegi="24028",
        nombre="San Luis Potosí",
        estado="San Luis Potosí",
        zm_id="SLP",
        poblacion=1_040_443,
        viviendas=290_000,
        rsu_ton_dia=910.0,
        gen_per_capita=0.875,
        presupuesto_mxn=480_000_000.0,
        dependencia_responsable="SESLP",
        concesion_status=SourceStatus.verificado,
        coverage_status=CoverageStage.legal_verificado,
        data_provenance={
            "poblacion": "https://www.inegi.org.mx/programas/ccpv/2020/",
            "rsu_ton_dia": {"url": "https://www.semarnat.gob.mx/DBGIR2020"},
            "presupuesto": "Cuenta Pública SLP 2023",
        },
    )


@pytest.fixture()
def coverage_slp() -> CoverageStatus:
    return CoverageStatus(
        municipio_id="slp_slp",
        demografia=SourceStatus.verificado,
        rsu=SourceStatus.estimado,
        legal=SourceStatus.verificado,
        contrato=SourceStatus.localizado,
        presupuesto=SourceStatus.verificado,
        operacion=SourceStatus.estimado,
        documentos=SourceStatus.no_disponible,
        bloqueos=[],
        siguiente_accion="Verificar operacion y completar documentos",
        coverage_status=CoverageStage.legal_verificado,
        agora_bloqueado=False,
    )


class TestBuildPdfEjecutivoMunicipal:
    def test_returns_bytes_without_reportlab_error(self, profile_slp, coverage_slp):
        from app.national.pdf_ejecutivo import build_pdf_ejecutivo_municipal

        pdf_bytes, err = build_pdf_ejecutivo_municipal(profile_slp, coverage_slp)
        # reportlab puede no estar instalado en CI — aceptamos ese error gracefully
        if err and "reportlab" in err:
            pytest.skip(f"reportlab no disponible: {err}")
        assert err is None, f"Error inesperado: {err}"
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 1000, "PDF demasiado pequeño"
        # PDF magic bytes
        assert pdf_bytes[:4] == b"%PDF", "El output no es un PDF válido"

    def test_returns_error_string_when_reportlab_missing(self, profile_slp, monkeypatch):
        """Simula reportlab no instalado — debe devolver (None, mensaje)."""
        import builtins
        real_import = builtins.__import__

        def fake_import(name, *args, **kwargs):
            if name.startswith("reportlab"):
                raise ImportError("reportlab simulado ausente")
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, "__import__", fake_import)

        from app.national import pdf_ejecutivo
        import importlib
        importlib.reload(pdf_ejecutivo)

        pdf_bytes, err = pdf_ejecutivo.build_pdf_ejecutivo_municipal(profile_slp, None)
        assert pdf_bytes is None
        assert err is not None
        assert "reportlab" in err

    def test_without_coverage_still_produces_pdf(self, profile_slp):
        from app.national.pdf_ejecutivo import build_pdf_ejecutivo_municipal

        pdf_bytes, err = build_pdf_ejecutivo_municipal(profile_slp, coverage=None)
        if err and "reportlab" in err:
            pytest.skip(f"reportlab no disponible: {err}")
        assert err is None
        assert pdf_bytes is not None
        assert pdf_bytes[:4] == b"%PDF"

    def test_provenance_resolved_for_string_url(self):
        from app.national.pdf_ejecutivo import _resolve_provenance_href

        assert _resolve_provenance_href("https://inegi.org.mx") == "https://inegi.org.mx"

    def test_provenance_resolved_for_dict_url(self):
        from app.national.pdf_ejecutivo import _resolve_provenance_href

        assert _resolve_provenance_href({"url": "https://semarnat.gob.mx"}) == "https://semarnat.gob.mx"

    def test_provenance_none_for_unknown(self):
        from app.national.pdf_ejecutivo import _resolve_provenance_href

        assert _resolve_provenance_href(None) is None
        assert _resolve_provenance_href(42) is None
        assert _resolve_provenance_href({}) is None
