"""
Textos legales expositivos por municipio — auditoría P0/P1 CLC (20 municipios).

Snapshot JSON: ``backend/data/municipal_legal_disclaimers_2026-05-07.json``.
Si no existe el archivo, los mapas quedan vacíos y se usan fallbacks.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.legal.reform_strategy import ReformStrategyOutput
from app.legal.repository import MUNICIPIO_NOMBRES

_DATA = Path(__file__).resolve().parent.parent.parent / "data" / "municipal_legal_disclaimers_2026-05-07.json"
if _DATA.is_file():
    _raw = json.loads(_DATA.read_text(encoding="utf-8"))
    CLC_LEGAL_DISCLAIMER: dict[str, str] = {k: v["legal_disclaimer"] for k, v in _raw.items()}
    CLC_NEXT_ACTION: dict[str, str] = {k: v["next_action"] for k, v in _raw.items()}
else:
    CLC_LEGAL_DISCLAIMER = {}
    CLC_NEXT_ACTION = {}


def _trunc(s: str, n: int) -> str:
    s = s.strip()
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def build_legal_disclaimer(
    *,
    municipio_id: str,
    reglamento_nombre: str,
    brecha_critica: int,
    max_len: int = 220,
) -> str:
    mid = municipio_id.lower()
    bc = min(8, max(0, brecha_critica))
    override = (CLC_LEGAL_DISCLAIMER.get(mid) or "").strip()
    if override:
        synced = re.sub(
            r"brecha\s+crítica\s+\d+/8",
            f"Brecha crítica {bc}/8",
            override,
            flags=re.IGNORECASE,
        )
        synced = re.sub(
            r"brecha\s+crít\.\s+\d+/8",
            f"Brecha crít. {bc}/8",
            synced,
            flags=re.IGNORECASE,
        )
        return _trunc(synced, max_len)
    muni = MUNICIPIO_NOMBRES.get(mid, municipio_id.upper())
    reg_nom = (reglamento_nombre or "").strip() or "Sin reglamento RSU propio"
    reg_nom = _trunc(reg_nom, 120)
    base = (
        f"{muni} · {reg_nom} · brecha {bc} de 8 — diagnóstico ALQUIMIA, "
        f"no dictamen oficial."
    )
    if len(base) <= max_len:
        return base
    short_reg = _trunc(reg_nom, 56)
    base = (
        f"{muni} · {short_reg} · brecha {bc}/8 — ALQUIMIA, no dictamen oficial."
    )
    return base[:max_len]


def build_next_action(
    *,
    municipio_id: str,
    has_validated_source: bool,
    strategy: ReformStrategyOutput,
) -> str:
    mid = municipio_id.lower()
    override = (CLC_NEXT_ACTION.get(mid) or "").strip()
    if override:
        return override

    muni = MUNICIPIO_NOMBRES.get(mid, mid.upper())
    auth_note = (
        f"Constatar límites de actuación y tabulador con la instancia competente del ayuntamiento "
        f"antes de expedir sanciones en {muni} (plazo orientativo: 15 días hábiles)."
    )
    if has_validated_source:
        return auth_note

    des = strategy.descripcion.strip()
    if len(des) > 120:
        des = des[:119] + "…"
    return f"Iniciar {strategy.estrategia.value}: {des}"
