"""Configuración compartida de pytest."""

from __future__ import annotations

import os


def pytest_configure() -> None:
    # Health profundo: en CI local no exigimos ANTHROPIC_API_KEY
    os.environ.setdefault("HEALTH_DEEP_RELAX_AGORA", "1")
    os.environ.setdefault("ALQUIMIA_HIDE_GDL", "1")
