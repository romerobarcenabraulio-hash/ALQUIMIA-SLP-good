"""Rutas de datos del dominio BIOS."""
from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def environmental_dir() -> Path:
    d = repo_root() / "data" / "environmental"
    d.mkdir(parents=True, exist_ok=True)
    return d


def assets_dir() -> Path:
    d = repo_root() / "data" / "assets"
    d.mkdir(parents=True, exist_ok=True)
    return d


def lifecycle_dir() -> Path:
    d = repo_root() / "data" / "lifecycle"
    d.mkdir(parents=True, exist_ok=True)
    return d


def lca_factors_path() -> Path:
    return environmental_dir() / "lca_factors.json"


def co2e_latest_path() -> Path:
    return environmental_dir() / "co2e_latest.json"


def inventory_path() -> Path:
    return assets_dir() / "inventory.json"


def financial_latest_path() -> Path:
    return lifecycle_dir() / "financial_latest.json"


def sensitivity_latest_path() -> Path:
    return lifecycle_dir() / "sensitivity_latest.json"
