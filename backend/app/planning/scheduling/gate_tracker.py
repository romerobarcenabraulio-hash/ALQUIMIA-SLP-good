"""Shim de compatibilidad — implementación canónica en modules/planning/gates/."""
from __future__ import annotations

from modules.planning.gates import gate_tracker as _impl

GATE_DEFINITIONS = _impl.GATE_DEFINITIONS
GATE_STATUS_PATH = _impl.GATE_STATUS_PATH
GateId = _impl.GateId
GateStatus = _impl.GateStatus


def _sync_path() -> None:
    _impl.GATE_STATUS_PATH = GATE_STATUS_PATH


def load_gate_status() -> dict:
    _sync_path()
    return _impl.load_gate_status()


def save_gate_status(status: dict) -> None:
    _sync_path()
    return _impl.save_gate_status(status)


def check_gate_alerts(today=None):
    _sync_path()
    return _impl.check_gate_alerts(today=today)


def update_gate(*args, **kwargs):
    _sync_path()
    return _impl.update_gate(*args, **kwargs)


def get_current_gate():
    _sync_path()
    return _impl.get_current_gate()
