#!/usr/bin/env python3
"""
EIDOS — checker terminológico para Markdown del repositorio.

Escanea copy publicado y reglas operativas activas (excluye OLD/ y glosario meta).
Uso: python scripts/eidos_check_docs.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PROHIBITED: tuple[tuple[str, str], ...] = (
    ("simulador rsu", "plataforma ALQUIMIA"),
    ("alquimia slp", "ALQUIMIA"),
    (" npv", " VPN"),
    (" irr", " TIR"),
    ("tracking", "seguimiento"),
    ("pipeline", "flujo de proceso"),
    ("performance", "desempeño"),
    ("stakeholder", "actor o parte interesada"),
    ("software alquimia", "plataforma ALQUIMIA"),
    ("app alquimia", "plataforma ALQUIMIA"),
    ("herramienta alquimia", "plataforma ALQUIMIA"),
    ("centro de reciclaje", "centro de acopio"),
    ("punto de captación", "centro de acopio"),
    ("nodo de transferencia", "centro de acopio"),
)

# Archivos que documentan las reglas (contienen variantes prohibidas como ejemplo)
SKIP_FILES = {
    "docs/style/glosario_canonico.md",
    "cursor-rules/eidos.md",
    "cursor-rules/bios.md",
}

# Reglas activas revisadas (excluye cursor-rules/OLD/ y archivos históricos)
CURSOR_RULES_ACTIVE = (
    "supreme.md",
    "kronos.md",
    "hermes.md",
    "aurum.md",
    "polis.md",
    "navigator.md",
    "EJECUTOR.md",
    "AUDITOR.md",
    "PD&SA.md",
    "prompt_maestro_ejecucion.md",
)

SKIP_DIR_NAMES = frozenset({"OLD", "ARCHIVOS VIEJOS", "node_modules"})

FRONTEND_COPY_DIRS = (
    ROOT / "frontend" / "src" / "data",
    ROOT / "frontend" / "src" / "components" / "simulator",
)


def iter_target_files() -> list[Path]:
    files: list[Path] = []
    guia = ROOT / "docs" / "style" / "guia_estilo.md"
    if guia.exists():
        files.append(guia)
    for name in CURSOR_RULES_ACTIVE:
        path = ROOT / "cursor-rules" / name
        if path.exists():
            files.append(path)
    for base in FRONTEND_COPY_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix not in {".md", ".tsx", ".ts"}:
                continue
            if SKIP_DIR_NAMES.intersection(path.parts):
                continue
            files.append(path)
    return sorted(set(files))


def contains_prohibited(text: str, phrase: str) -> bool:
    lower = text.lower()
    p = phrase.strip()
    if p == "tracking":
        return bool(re.search(r"(?<![-\w])tracking(?![-\w\[])", lower))
    if p == "performance":
        scrubbed = lower.replace("--only-categories=performance", "")
        return bool(re.search(r"(?<![-/])\bperformance\b", scrubbed))
    if p == "pipeline":
        return bool(re.search(r"\bpipeline\b", lower))
    if p == "irr":
        return bool(re.search(r"\birr\b", lower))
    if p == "npv":
        return bool(re.search(r"\bnpv\b", lower))
    return p in lower


def check_text(text: str) -> list[str]:
    scrubbed_lines = [
        ln for ln in text.splitlines()
        if "--only-categories=performance" not in ln
    ]
    body = "\n".join(scrubbed_lines)
    issues: list[str] = []
    for prohibited, suggestion in PROHIBITED:
        if contains_prohibited(body, prohibited):
            issues.append(f"  «{prohibited.strip()}» → preferir «{suggestion.strip()}»")
    lower = body.lower()
    if re.search(r"\bnpv\b", lower):
        issues.append("  «NPV» → preferir «VPN»")
    if re.search(r"\birr\b", lower):
        issues.append("  «IRR» → preferir «TIR»")
    return issues


def main() -> int:
    violations: list[tuple[Path, list[str]]] = []
    targets = iter_target_files()
    for path in targets:
        rel = str(path.relative_to(ROOT))
        if rel in SKIP_FILES:
            continue
        found = check_text(path.read_text(encoding="utf-8"))
        if found:
            violations.append((path, found))

    if not violations:
        print(f"EIDOS OK — {len(targets)} archivos revisados.")
        return 0

    print("EIDOS — variantes no canónicas detectadas:\n")
    for path, items in violations:
        print(path.relative_to(ROOT))
        for item in items:
            print(item)
        print()
    return 1


if __name__ == "__main__":
    sys.exit(main())
