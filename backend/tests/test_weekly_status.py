"""Tests reporte semanal KRONOS."""
from pathlib import Path
from unittest.mock import patch

import pytest

from app.planning.weekly_status import (
    build_weekly_status,
    persist_weekly_status,
    _iso_week,
)


def test_build_weekly_status_has_required_fields():
    report = build_weekly_status(municipio_id="slp", db=None)
    assert report["week"] == _iso_week()
    assert report["gate_actual"] in {"G1", "G2", "G3", "G4", "G5"}
    assert "cpi" in report and "spi" in report and "eac" in report
    assert report["semaforo"] in {"VERDE", "AMARILLO", "ROJO"}
    assert report["riesgos_total"] >= 9
    assert isinstance(report["datos_faltantes"], list)
    # Con fixtures AURUM+HERMES en repo debe integrar, no sintético puro
    ac_path = Path(__file__).resolve().parents[2] / "data" / "financial" / "costs" / "ac_latest.json"
    if ac_path.is_file():
        assert report["evm_fuente"] == "aurum_hermes_integrado"
        assert report["evm_detalle"]["ac"] == pytest.approx(1034.7, rel=0.01)
        assert report["evm_integracion"]["feeds_consumidos"] >= 1
    else:
        assert report["evm_fuente"] == "sintetico_fase_0_1"


def test_persist_weekly_status(tmp_path):
    reports = tmp_path / "reports"
    latest = tmp_path / "weekly_status_latest.json"
    with patch("app.planning.weekly_status.REPORTS_DIR", reports), patch(
        "app.planning.weekly_status.LATEST_PATH", latest
    ):
        report = build_weekly_status(municipio_id="slp")
        path = persist_weekly_status(report)
    assert path.exists()
    assert latest.exists()
