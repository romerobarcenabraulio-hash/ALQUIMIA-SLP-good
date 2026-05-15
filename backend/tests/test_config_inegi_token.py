"""Orden de lectura de tokens INEGI desde entorno (sin tocar secretos reales)."""

from __future__ import annotations

import pytest


@pytest.fixture
def clear_inegi_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in ("INEGI_API_TOKEN", "INEGI_DENUE_TOKEN", "DENUE_API_TOKEN"):
        monkeypatch.delenv(key, raising=False)


def test_resolve_inegi_api_token_prefers_general_name(clear_inegi_env: None, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import resolve_inegi_api_token

    monkeypatch.setenv("DENUE_API_TOKEN", "legacy-denue")
    monkeypatch.setenv("INEGI_DENUE_TOKEN", "denue-only")
    monkeypatch.setenv("INEGI_API_TOKEN", "preferred")
    assert resolve_inegi_api_token() == "preferred"


def test_resolve_inegi_api_token_fallback_chain(clear_inegi_env: None, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import resolve_inegi_api_token

    monkeypatch.setenv("DENUE_API_TOKEN", "legacy")
    monkeypatch.delenv("INEGI_API_TOKEN", raising=False)
    monkeypatch.delenv("INEGI_DENUE_TOKEN", raising=False)
    assert resolve_inegi_api_token() == "legacy"

    monkeypatch.setenv("INEGI_DENUE_TOKEN", "denue")
    assert resolve_inegi_api_token() == "denue"
