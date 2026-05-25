"""
Validador de coherencia interna — POLIS.

Verifica que cifras clave (viviendas, centros de acopio, recicladoras, ton/día)
coincidan con el perfil canónico del municipio en todos los documentos escaneados.
"""
from __future__ import annotations

import re
from pathlib import Path

from modules.personalization.profile_loader import canonical_figures, load_profile, repo_root
from modules.personalization.schemas import Severity, ValidationFinding, ValidationReport

_DEFAULT_SCAN_GLOBS = [
    "ADENDOS: LEGAL/**/*.md",
    "cursor-rules/**/*.md",
    "cursor-rules/OLD/**/*.md",
    "data/municipalities/**/*",
]

# Patrones para extraer cifras en texto
_FIGURE_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "viviendas": [
        re.compile(r"(\d{1,3}(?:[\s,]\d{3})+)\s+viviendas", re.I),
        re.compile(r"viviendas[^\d]{0,30}(\d{1,3}(?:[\s,]\d{3})+)", re.I),
    ],
    "centros_acopio": [
        re.compile(r"(\d{1,2})\s+centros?\s+de\s+acopio", re.I),
    ],
    "recicladoras": [
        re.compile(r"(\d{1,2})\s+recicladoras?", re.I),
    ],
    "ton_dia_anio_3": [
        re.compile(r"(\d{3,4}(?:\.\d+)?)\s*t/?\s*d[ií]a", re.I),
        re.compile(r"(\d{3,4}(?:\.\d+)?)\s+ton(?:eladas)?/d[ií]a", re.I),
    ],
}

_TOLERANCE_PCT = 0.02  # 2% tolerancia numérica


def _normalize_int(raw: str) -> int:
    return int(re.sub(r"[\s,]", "", raw))


def _normalize_float(raw: str) -> float:
    return float(raw.replace(",", ""))


def _within_tolerance(found: float, expected: float) -> bool:
    if expected == 0:
        return found == 0
    return abs(found - expected) / expected <= _TOLERANCE_PCT


def _extract_figures(text: str) -> dict[str, list[tuple[float, int]]]:
    """Return {figure_key: [(value, line_number), ...]}."""
    results: dict[str, list[tuple[float, int]]] = {}
    for key, patterns in _FIGURE_PATTERNS.items():
        for pattern in patterns:
            for match in pattern.finditer(text):
                raw = match.group(1)
                line = text[: match.start()].count("\n") + 1
                try:
                    value: float = (
                        _normalize_float(raw) if "." in raw else float(_normalize_int(raw))
                    )
                except ValueError:
                    continue
                results.setdefault(key, []).append((value, line))
    return results


def _is_slp_context(path: Path, base: Path) -> bool:
    try:
        rel = str(path.relative_to(base)).lower()
    except ValueError:
        rel = path.name.lower()
    return any(
        hint in rel
        for hint in (
            "/slp/",
            "contexto_slp",
            "cursor-rules/_base.md",
            "cursor-rules/polis.md",
            "data/municipalities/slp",
        )
    ) or rel.startswith("cursor-rules/") and "slp" in rel


def validate_coherence(
    municipio_key: str = "SLP",
    *,
    root: Path | None = None,
    globs: list[str] | None = None,
) -> ValidationReport:
    """
    Compara cifras extraídas de documentos del proyecto contra perfil canónico.
    """
    base = root or repo_root()
    profile = load_profile(municipio_key)
    expected = canonical_figures(municipio_key)
    municipio_id = profile.get("municipio_id", municipio_key).lower()

    patterns = globs or _DEFAULT_SCAN_GLOBS
    files: list[Path] = []
    for pattern in patterns:
        files.extend(p for p in base.glob(pattern) if p.is_file())

    findings: list[ValidationFinding] = []
    files_checked = 0

    for file_path in sorted(set(files)):
        if not _is_slp_context(file_path, base):
            continue
        try:
            text = file_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        files_checked += 1
        extracted = _extract_figures(text)

        for key, expected_val in expected.items():
            if not expected_val:
                continue
            for found_val, line in extracted.get(key, []):
                if not _within_tolerance(found_val, float(expected_val)):
                    severity = Severity.ERROR if key in ("viviendas", "centros_acopio") else Severity.WARNING
                    findings.append(
                        ValidationFinding(
                            severity=severity,
                            code=f"COHERENCE_{key.upper()}",
                            message=(
                                f"Cifra '{key}' inconsistente con perfil {municipio_id.upper()}"
                            ),
                            file_path=str(file_path.relative_to(base)),
                            line=line,
                            expected=str(expected_val),
                            found=str(found_val),
                        )
                    )

    error_count = sum(1 for f in findings if f.severity in (Severity.VETO, Severity.ERROR))
    passed = error_count == 0

    return ValidationReport(
        validator="coherence",
        municipio_id=municipio_id,
        passed=passed,
        findings=findings,
        files_scanned=files_checked,
        meta={"expected": expected, "profile_path": str(municipio_key)},
    )
