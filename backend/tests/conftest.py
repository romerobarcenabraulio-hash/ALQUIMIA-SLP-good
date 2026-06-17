"""Configuración compartida de pytest."""

from __future__ import annotations

import asyncio
import inspect
import os
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


# ─────────────────────────────────────────────────────────────────────────────
# Dependencias opcionales que pueden faltar en sandbox / CI mínimo
# ─────────────────────────────────────────────────────────────────────────────

_PYDANTIC_SETTINGS_AVAILABLE = False
_PYTEST_ASYNCIO_AVAILABLE    = False


def _install_stubs() -> None:
    """Inyecta stubs en sys.modules cuando las deps reales no están disponibles.
    Esto evita ModuleNotFoundError durante la colección de tests.
    """
    global _PYDANTIC_SETTINGS_AVAILABLE, _PYTEST_ASYNCIO_AVAILABLE

    if "pydantic_settings" not in sys.modules:
        try:
            import pydantic_settings  # noqa: F401
            _PYDANTIC_SETTINGS_AVAILABLE = True
        except ModuleNotFoundError:
            sys.modules["pydantic_settings"] = _make_pydantic_settings_stub()

    if "pytest_asyncio" not in sys.modules:
        try:
            import pytest_asyncio  # noqa: F401
            _PYTEST_ASYNCIO_AVAILABLE = True
        except ModuleNotFoundError:
            sys.modules["pytest_asyncio"] = _make_pytest_asyncio_stub()
    else:
        _PYTEST_ASYNCIO_AVAILABLE = True


def _make_pydantic_settings_stub():
    """Stub mínimo de pydantic-settings."""
    import types
    mod = types.ModuleType("pydantic_settings")

    class BaseSettings:
        model_config = {}

        def __init_subclass__(cls, **kwargs):
            super().__init_subclass__(**kwargs)

        def __init__(self, **data):
            for k, v in data.items():
                setattr(self, k, v)

    class SettingsConfigDict(dict):
        pass

    mod.BaseSettings        = BaseSettings
    mod.SettingsConfigDict  = SettingsConfigDict
    return mod


def _make_pytest_asyncio_stub():
    """Stub mínimo de pytest-asyncio (sin runner real)."""
    import types
    mod = types.ModuleType("pytest_asyncio")
    mod.fixture = lambda *a, **kw: (a[0] if a and callable(a[0]) else lambda fn: fn)
    return mod


# ─────────────────────────────────────────────────────────────────────────────
# Hooks de pytest
# ─────────────────────────────────────────────────────────────────────────────

def pytest_configure(config) -> None:  # type: ignore[override]
    # Instalar stubs antes de que comience la colección
    _install_stubs()
    # Health profundo: en CI local no exigimos ANTHROPIC_API_KEY
    os.environ.setdefault("HEALTH_DEEP_RELAX_AGORA", "1")
    os.environ.setdefault("ALQUIMIA_HIDE_GDL", "1")
    if os.environ.get("DATABASE_URL", "").startswith("sqlite"):
        from app.db.session import create_all_tables

        create_all_tables()


def pytest_runtest_setup(item) -> None:
    """Skipea tests que requieran dependencias opcionales no instaladas:
    - Tests async cuando pytest-asyncio no está disponible.
    - Tests de openpyxl/reportlab cuando esas libs no están instaladas.
    """
    import pytest

    fn = getattr(item, "function", None)

    # Skip async tests sin runner
    if not _PYTEST_ASYNCIO_AVAILABLE and fn and inspect.iscoroutinefunction(fn):
        pytest.skip(
            reason="pytest-asyncio no disponible — test async saltado en este entorno"
        )

    # Skip tests que necesitan openpyxl
    try:
        import openpyxl  # noqa: F401
    except ModuleNotFoundError:
        mod = getattr(item, "module", None)
        mod_name = getattr(mod, "__name__", "")
        fn_name  = getattr(fn, "__name__", "")
        if (
            "export_profesional" in mod_name
            or "fase4" in mod_name
            or "xlsx" in fn_name
            or "release_candidate" in mod_name
        ):
            pytest.skip(reason="openpyxl no disponible — test xlsx saltado en este entorno")

    # Skip tests que necesitan reportlab
    try:
        import reportlab  # noqa: F401
    except ModuleNotFoundError:
        fn_name = getattr(fn, "__name__", "")
        if "pdf" in fn_name or "survey_pdf" in fn_name:
            pytest.skip(reason="reportlab no disponible — test pdf saltado en este entorno")
