"""Tests POLIS — personalización municipal, contaminación y coherencia."""
from __future__ import annotations

from pathlib import Path

import pytest

from modules.personalization.coherence_validator import validate_coherence
from modules.personalization.cross_contamination import detect_cross_contamination
from modules.personalization.profile_loader import (
    canonical_figures,
    legal_framework_path,
    load_legal_framework,
    load_profile,
    profile_path,
)
from modules.personalization.template_instantiator import instantiate_template


def test_slp_profile_exists_and_complete():
    profile = load_profile("SLP")
    assert profile["municipio_id"] == "slp"
    assert profile["viviendas_universo"] == 224_000
    assert profile["concesionario"]["nombre"] == "Red Ambiental"
    assert profile["cabildo_apoyo"] in ("alto", "medio", "bajo")
    assert len(profile["recicladoras_locales"]) == 5
    assert profile["reglamento_vigente"]["legal_framework_ref"] == "legal_framework.json"


def test_slp_legal_framework_linked():
    legal = load_legal_framework("SLP")
    assert legal["municipio_id"] == "slp"
    assert legal["profile_ref"] == "profile.json"
    assert len(legal["jerarquia_normativa"]) >= 3
    assert len(legal["adendos_alquimia_vinculados"]) >= 5


def test_canonical_figures_match_baseline():
    cifras = canonical_figures("SLP")
    assert cifras["viviendas"] == 224_000
    assert cifras["centros_acopio"] == 18
    assert cifras["recicladoras"] == 5
    assert cifras["ton_dia_anio_3"] == 725.76


def test_instantiate_informe_ejecutivo():
    content = instantiate_template("informe_ejecutivo.template.md", "SLP")
    assert "224,000" in content
    assert "Red Ambiental" in content
    assert "{{" not in content


def test_cross_contamination_clean_on_adendos():
    report = detect_cross_contamination(
        globs=["ADENDOS: LEGAL/0*.md", "ADENDOS: LEGAL/1*.md"],
    )
    assert report.files_scanned >= 1
    # Adendos SLP no deben tener tokens MTY/QRO en contexto SLP
    veto_in_slp_adendos = [
        f for f in report.findings
        if f.severity.value == "VETO" and f.file_path and f.file_path.startswith("ADENDOS")
    ]
    assert len(veto_in_slp_adendos) == 0


def test_cross_contamination_detects_injected(tmp_path: Path):
    bad = tmp_path / "MTY_mty_informe.md"
    bad.write_text(
        "Informe Monterrey: el concesionario Red Ambiental opera 224,000 viviendas en la capital.",
        encoding="utf-8",
    )
    report = detect_cross_contamination(root=tmp_path, globs=["*.md"])
    assert not report.passed
    assert report.veto_count() >= 1


def test_coherence_validator_runs_on_project():
    report = validate_coherence("SLP", globs=["cursor-rules/_base.md", "data/municipalities/SLP/*.json"])
    assert report.files_scanned >= 1
    assert report.meta["expected"]["viviendas"] == 224_000


def test_profile_and_legal_paths():
    assert profile_path("slp").name == "profile.json"
    assert legal_framework_path("SLP").name == "legal_framework.json"
