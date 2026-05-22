"""Tests para Gate Tracker."""
from datetime import date
from pathlib import Path
from unittest.mock import patch

from app.planning.scheduling import gate_tracker


def test_load_creates_initial_file(tmp_path):
    gate_path = tmp_path / "gate_status.json"
    with patch.object(gate_tracker, "GATE_STATUS_PATH", gate_path):
        status = gate_tracker.load_gate_status()
    assert set(status.keys()) == {"G1", "G2", "G3", "G4", "G5"}
    assert all(s["status"] == "NO_INICIADO" for s in status.values())


def test_get_current_gate_returns_g1_initially(tmp_path):
    gate_path = tmp_path / "gate_status.json"
    with patch.object(gate_tracker, "GATE_STATUS_PATH", gate_path):
        current = gate_tracker.get_current_gate()
    assert current == "G1"


def test_no_alerts_without_fecha_objetivo(tmp_path):
    gate_path = tmp_path / "gate_status.json"
    with patch.object(gate_tracker, "GATE_STATUS_PATH", gate_path):
        gate_tracker.load_gate_status()
        alerts = gate_tracker.check_gate_alerts(today=date(2026, 5, 22))
    assert alerts == []


def test_alerta_amarillo_a_25_dias(tmp_path):
    gate_path = tmp_path / "gate_status.json"
    with patch.object(gate_tracker, "GATE_STATUS_PATH", gate_path):
        gate_tracker.load_gate_status()
        gate_tracker.update_gate(
            gate_id="G1",
            status="EN_PROCESO",
            fecha_objetivo=date(2026, 6, 16),
        )
        alerts = gate_tracker.check_gate_alerts(today=date(2026, 5, 22))
    assert len(alerts) == 1
    assert alerts[0]["nivel_alerta"] == "AMARILLO"


def test_alerta_critico_gate_vencido(tmp_path):
    gate_path = tmp_path / "gate_status.json"
    with patch.object(gate_tracker, "GATE_STATUS_PATH", gate_path):
        gate_tracker.load_gate_status()
        gate_tracker.update_gate(
            gate_id="G1",
            status="EN_RIESGO",
            fecha_objetivo=date(2026, 5, 1),
        )
        alerts = gate_tracker.check_gate_alerts(today=date(2026, 5, 22))
    assert len(alerts) == 1
    assert alerts[0]["nivel_alerta"] == "CRITICO"
