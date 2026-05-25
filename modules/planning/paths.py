"""Rutas de datos del dominio KRONOS (planning)."""
from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def gate_status_path() -> Path:
    return repo_root() / "backend" / "data" / "state" / "gate_status.json"
