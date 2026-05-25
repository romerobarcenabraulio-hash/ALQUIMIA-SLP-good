"""Raíz del monorepo — funciona en dev local y en Docker Render (/app)."""
from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    here = Path(__file__).resolve()
    for base in (here.parents[2].parent, here.parents[2], Path("/app")):
        if (base / "modules").is_dir() and (base / "config").is_dir():
            return base
        if (base / "modules" / "logistics").is_dir():
            return base
    return here.parents[2].parent
