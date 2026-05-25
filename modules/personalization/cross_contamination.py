"""
Detector de contaminación cruzada — POLIS VETO.

Detecta datos de municipio A en documentos destinados a municipio B.
Error bloqueante: no puede pasar a entrega documental.
"""
from __future__ import annotations

import re
from pathlib import Path

from modules.personalization.profile_loader import list_municipalities, load_profile, repo_root
from modules.personalization.schemas import Severity, ValidationFinding, ValidationReport

# Perfiles conocidos: tokens exclusivos por municipio piloto
_MUNICIPIO_FINGERPRINTS: dict[str, list[tuple[str, str]]] = {
    "slp": [
        ("concesionario", r"Red\s+Ambiental"),
        ("dependencia", r"Dirección de Ecología y Aseo Público"),
        ("cifra", r"224[\s,]?000\s+viviendas"),
        ("cifra", r"725\.76\s*t/?\s*d[ií]a"),
        ("cifra", r"18\s+centros?\s+de\s+acopio"),
        ("geo", r"San\s+Luis\s+Potosí\s+capital"),
    ],
    "sol": [
        ("reglamento", r"Soledad de Graciano Sánchez"),
        ("programa", r"Soledad limpio"),
    ],
    "mty": [
        ("convenio", r"SIMEPRODE"),
        ("reglamento", r"Reglamento de Limpia Municipal de Monterrey"),
    ],
    "qro": [
        ("infra", r"RSQRO"),
        ("reglamento", r"Reglamento de Aseo Público.*Querétaro"),
    ],
}

# Archivos con contexto municipal explícito por nombre/ruta
_PATH_MUNICIPIO_HINTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"mty|monterrey", re.I), "mty"),
    (re.compile(r"qro|quer[eé]taro", re.I), "qro"),
    (re.compile(r"gdl|guadalajara|zapopan", re.I), "gdl"),
    (re.compile(r"\bsol\b|soledad", re.I), "sol"),
    (re.compile(r"\bslp\b|san.?luis.?potos", re.I), "slp"),
    (re.compile(r"oaxaca", re.I), "oaxaca"),
]

_DEFAULT_SCAN_GLOBS = [
    "ADENDOS: LEGAL/**/*.md",
    "cursor-rules/**/*.md",
    "docs/municipalities/**/*",
    "data/municipalities/**/*.md",
]

_TEXT_EXTENSIONS = {".md", ".txt", ".json", ".ts", ".tsx"}


def _infer_document_municipio(path: Path, base: Path) -> str | None:
    """Infer target municipio from path relative to repo root — never from workspace folder name."""
    try:
        rel = str(path.relative_to(base)).lower()
    except ValueError:
        rel = path.name.lower()

    # Documentos multi-municipio: comparativas permitidas
    if "multi_ciudad" in rel or "reportaje_antecedentes_municipales" in rel:
        return None

    # Modelo base SLP — adendos raíz incluyen tablas comparativas MTY/QRO por diseño
    if rel.startswith("adendos: legal/") and "/multi_ciudad/" not in rel:
        if rel.endswith(".md") and "multi_ciudad" not in rel:
            return "slp_modelo_base"

    for pattern, municipio_id in _PATH_MUNICIPIO_HINTS:
        if pattern.search(rel):
            return municipio_id
    return None


def _load_fingerprints_from_profiles() -> dict[str, list[tuple[str, str]]]:
    result = dict(_MUNICIPIO_FINGERPRINTS)
    for key in list_municipalities():
        try:
            profile = load_profile(key)
        except FileNotFoundError:
            continue
        mid = profile.get("municipio_id", key).lower()
        forbidden = profile.get("contaminacion_prohibida", {}).get(
            "tokens_forbidden_outside_slp", []
        )
        if forbidden and mid == "slp":
            extra = [(f"profile_token_{i}", re.escape(tok)) for i, tok in enumerate(forbidden)]
            result.setdefault(mid, []).extend(extra)
        concesionario = profile.get("concesionario", {}).get("nombre")
        if concesionario and mid not in result:
            result[mid] = [("concesionario", re.escape(concesionario))]
    return result


def _collect_files(root: Path, globs: list[str] | None) -> list[Path]:
    patterns = globs or _DEFAULT_SCAN_GLOBS
    files: set[Path] = set()
    for pattern in patterns:
        for p in root.glob(pattern):
            if p.is_file() and p.suffix.lower() in _TEXT_EXTENSIONS:
                files.add(p)
    return sorted(files)


def detect_cross_contamination(
    *,
    root: Path | None = None,
    globs: list[str] | None = None,
    municipio_scope: str | None = None,
) -> ValidationReport:
    """
    Escanea documentos buscando tokens de municipio A en contexto de municipio B.

    Returns ValidationReport with passed=False if any VETO finding exists.
    """
    base = root or repo_root()
    fingerprints = _load_fingerprints_from_profiles()
    findings: list[ValidationFinding] = []
    files = _collect_files(base, globs)

    for file_path in files:
        doc_municipio = _infer_document_municipio(file_path, base)
        if doc_municipio is None:
            continue
        if municipio_scope and doc_municipio not in (
            municipio_scope.lower(),
            "slp_modelo_base",
        ):
            continue

        try:
            text = file_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        for source_municipio, patterns in fingerprints.items():
            if source_municipio == doc_municipio:
                continue
            # Modelo base SLP: tablas comparativas multi-ciudad son válidas
            if doc_municipio == "slp_modelo_base":
                continue
            for category, pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    line_no = text[: match.start()].count("\n") + 1
                    findings.append(
                        ValidationFinding(
                            severity=Severity.VETO,
                            code="CROSS_CONTAMINATION",
                            message=(
                                f"Token de '{source_municipio}' ({category}) en documento "
                                f"de contexto '{doc_municipio}'"
                            ),
                            file_path=str(file_path.relative_to(base)),
                            line=line_no,
                            expected=f"Sin referencias exclusivas de {source_municipio}",
                            found=match.group(0),
                        )
                    )

    passed = not any(f.severity == Severity.VETO for f in findings)
    return ValidationReport(
        validator="cross_contamination",
        municipio_id=municipio_scope,
        passed=passed,
        findings=findings,
        files_scanned=len(files),
        meta={"fingerprints_loaded": len(fingerprints)},
    )
