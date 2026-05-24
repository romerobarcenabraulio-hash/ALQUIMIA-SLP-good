"""Tests del portafolio ZIP analisis + implementacion."""
from datetime import date

import pytest

from app.export.gantt_hierarchy import build_hierarchy
from app.planning.builder import build_gantt


def test_build_hierarchy_six_phases_fifteen_etapas():
    gantt = build_gantt(
        municipio="slp",
        zm="SLP",
        scenario_id="test",
        n_cas_pequeno=1,
        capex_total=1_500_000,
    )
    hierarchy = build_hierarchy(gantt, date(2026, 6, 1))
    assert len(hierarchy) == 6
    etapas = sum(len(f.etapas) for f in hierarchy)
    assert etapas == 15
    assert hierarchy[0].phase_id == "F01"
    assert hierarchy[0].etapas[0].task_id == "T01"
    assert len(hierarchy[0].etapas[0].actividades) >= 1


def test_clickup_csv_has_header_and_tasks():
    from app.export.clickup_gantt_exporter import generate_clickup_csv

    gantt = build_gantt("slp", "SLP", "test")
    hierarchy = build_hierarchy(gantt, date(2026, 1, 1))
    csv_bytes = generate_clickup_csv(gantt, hierarchy, date(2026, 1, 1))
    text = csv_bytes.decode("utf-8")
    assert "Task Name" in text.splitlines()[0]
    assert "T01" in text or "Diagnóstico" in text
