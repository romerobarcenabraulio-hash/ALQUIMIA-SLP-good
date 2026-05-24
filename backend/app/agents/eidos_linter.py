"""
EIDOS linter — revisión determinística de terminología y registro.

Solo emite warnings (no bloquea documentos) para no degradar el flujo existente.
"""
from __future__ import annotations

import re

from app.agents.eidos_glossary import (
    FUENTES_DOC_ID,
    JURIDICO_DOC_PREFIX,
    PROHIBITED_PHRASES,
)
from app.agents.schemas import DraftDocument, ValidationIssue


def _collect_text(draft: DraftDocument) -> str:
    parts: list[str] = []
    for sec in draft.secciones:
        parts.append(sec.titulo or "")
        parts.append(sec.contenido or "")
    return "\n".join(parts).lower()


def lint_draft_document(draft: DraftDocument) -> list[ValidationIssue]:
    """Devuelve observaciones EIDOS de severidad warning únicamente."""
    issues: list[ValidationIssue] = []
    text = _collect_text(draft)
    if not text.strip():
        return issues

    doc_id = draft.document_id

    for prohibited, suggestion in PROHIBITED_PHRASES:
        if prohibited.strip() in text:
            issues.append(
                ValidationIssue(
                    severity="warning",
                    document_id=doc_id,
                    message=(
                        f"EIDOS: evitar «{prohibited.strip()}» — "
                        f"preferir «{suggestion.strip()}»"
                    ),
                    code="EIDOS_TERMINO_NO_CANONICO",
                )
            )

    is_juridico = doc_id.startswith(JURIDICO_DOC_PREFIX)
    is_fuentes = doc_id == FUENTES_DOC_ID

    if is_juridico and "trazabilidad" in text and "cadena de custodia" not in text:
        issues.append(
            ValidationIssue(
                severity="warning",
                document_id=doc_id,
                message=(
                    "EIDOS: en documento jurídico use «cadena de custodia» "
                    "para aspectos normativos; «trazabilidad» es capacidad técnica."
                ),
                code="EIDOS_CUSTODIA_VS_TRAZABILIDAD",
            )
        )

    if is_fuentes and re.search(r"\bcadena de custodia\b", text):
        issues.append(
            ValidationIssue(
                severity="warning",
                document_id=doc_id,
                message=(
                    "EIDOS: en anexo de fuentes/trazabilidad técnica, "
                    "«trazabilidad» es el término preferido salvo cita legal literal."
                ),
                code="EIDOS_TRAZABILIDAD_DOC_TECNICO",
            )
        )

    if re.search(r"\bnpv\b|\birr\b", text):
        issues.append(
            ValidationIssue(
                severity="warning",
                document_id=doc_id,
                message="EIDOS: use VPN y TIR en documentos en español (no NPV/IRR).",
                code="EIDOS_FINANCIERO_ESPANOL",
            )
        )

    return issues
