"""Consumidor de datos HERMES — tonelaje por fracción."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from modules.lifecycle.paths import repo_root

HERMES_FRACCION_MAP = {
    "organicos": "organicos_compost",
    "papel": "papel_carton",
    "vidrio": "vidrio",
    "metal": "aluminio",
    "inorganicos": "pet",
    "pet": "pet",
    "plastico": "pet",
    "aluminio": "aluminio",
}


def daily_summary_dir() -> Path:
    return repo_root() / "data" / "logistics" / "daily_summary"


def load_latest_hermes_summary() -> dict[str, Any] | None:
    d = daily_summary_dir()
    if not d.is_dir():
        return None
    files = sorted(d.glob("*.json"), reverse=True)
    if not files:
        return None
    return json.loads(files[0].read_text(encoding="utf-8"))


def load_hermes_summary_for_date(fecha: date) -> dict[str, Any] | None:
    path = daily_summary_dir() / f"{fecha.isoformat()}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def tonelaje_from_hermes(summary: dict[str, Any] | None) -> tuple[dict[str, float], str]:
    if summary is None:
        return {}, "hermes_no_disponible"
    raw = summary.get("tonelaje_por_fraccion") or {}
    mapped: dict[str, float] = {}
    for hermes_frac, tons in raw.items():
        bios_frac = HERMES_FRACCION_MAP.get(hermes_frac, hermes_frac)
        mapped[bios_frac] = mapped.get(bios_frac, 0.0) + float(tons or 0)
    fuente = summary.get("fuente", "hermes_daily_summary")
    return mapped, fuente
