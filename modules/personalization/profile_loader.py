"""Carga de perfiles y marcos legales municipales."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_MUNICIPALITIES_DIR = _REPO_ROOT / "data" / "municipalities"


def repo_root() -> Path:
    return _REPO_ROOT


def municipalities_dir() -> Path:
    return _MUNICIPALITIES_DIR


def profile_path(municipio_key: str) -> Path:
    """Resolve profile.json — accepts 'SLP', 'slp', etc."""
    key = municipio_key.upper()
    return _MUNICIPALITIES_DIR / key / "profile.json"


def legal_framework_path(municipio_key: str) -> Path:
    key = municipio_key.upper()
    return _MUNICIPALITIES_DIR / key / "legal_framework.json"


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=16)
def load_profile(municipio_key: str) -> dict[str, Any]:
    path = profile_path(municipio_key)
    if not path.is_file():
        raise FileNotFoundError(f"Perfil municipal no encontrado: {path}")
    return load_json(path)


@lru_cache(maxsize=16)
def load_legal_framework(municipio_key: str) -> dict[str, Any]:
    path = legal_framework_path(municipio_key)
    if not path.is_file():
        raise FileNotFoundError(f"Marco legal no encontrado: {path}")
    return load_json(path)


def list_municipalities() -> list[str]:
    if not _MUNICIPALITIES_DIR.is_dir():
        return []
    return sorted(
        p.name
        for p in _MUNICIPALITIES_DIR.iterdir()
        if p.is_dir() and (p / "profile.json").is_file()
    )


def canonical_figures(municipio_key: str) -> dict[str, float | int]:
    profile = load_profile(municipio_key)
    cifras = profile.get("cifras_canonicas_coherencia", {})
    return {
        "viviendas": cifras.get("viviendas", profile.get("viviendas_universo", 0)),
        "centros_acopio": cifras.get(
            "centros_acopio",
            profile.get("infraestructura_objetivo", {}).get("centros_acopio", 0),
        ),
        "recicladoras": cifras.get(
            "recicladoras",
            profile.get("infraestructura_objetivo", {}).get("recicladoras_por_giro", 0),
        ),
        "ton_dia_anio_3": cifras.get(
            "ton_dia_anio_3",
            profile.get("infraestructura_objetivo", {}).get("tonelaje_objetivo_anio_3_t_dia", 0),
        ),
    }
