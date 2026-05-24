"""
Fase 3B + Wave 3 — validator.py

El Validador ataca el paquete antes de que lo ataque alguien externo.

Estados resultantes:
  borrador    → generado por template; nunca defendible
  revision    → tiene warnings (sin ApprovalMatrix, confianza baja, etc.)
  defendible  → pasa validación completa
  bloqueado   → errores críticos (sin audiencia, sin ClaimLedger, etc.)

Reglas de bloqueo (severity=error → bloqueado):
  - Sin audiencia declarada
  - Sin decisión que habilita
  - Sin secciones (documento vacío)
  - Sin ClaimLedger
  - Documento jurídico municipal sin diagnóstico legal en bundle
  - Dato estimado redactado con lenguaje oficial

Reglas de degradación (severity=warning → revision o borrador):
  - is_fallback (template) → borrador, no revision
  - Sin ApprovalMatrix → revision
  - Score de confianza < 0.5 → revision
  - CAPEX sin CompliancePack → revision
  - Claims sin evidencia → revision
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import List

from app.agents.schemas import (
    DraftDocument,
    DocumentNivel,
    DocumentStatusLevel,
    ScenarioBundle,
    SourceStatus,
    ValidationIssue,
    ValidationReport,
)

logger = logging.getLogger(__name__)


def validate_document(
    draft: DraftDocument,
    bundle: ScenarioBundle,
) -> tuple[ValidationReport, DocumentStatusLevel]:
    """
    Valida un DraftDocument y retorna (ValidationReport, DocumentStatusLevel).
    """
    issues: list[ValidationIssue] = []
    doc_id = draft.document_id

    # ── Errores que bloquean ──────────────────────────────────────────────────

    if not draft.spec.audiencia:
        issues.append(ValidationIssue(
            severity="error", document_id=doc_id,
            message=(
                "Sin audiencia declarada — el documento no puede generarse "
                "sin saber a quién va dirigido"
            ),
            code="SIN_AUDIENCIA",
        ))

    if not draft.spec.decision_que_habilita:
        issues.append(ValidationIssue(
            severity="error", document_id=doc_id,
            message=(
                "Sin decisión que habilita — cada documento debe "
                "habilitar una decisión concreta"
            ),
            code="SIN_DECISION",
        ))

    if not draft.secciones:
        issues.append(ValidationIssue(
            severity="error", document_id=doc_id,
            message="Sin secciones — el documento no tiene contenido estructurado",
            code="SIN_SECCIONES",
        ))

    if draft.claim_ledger is None:
        issues.append(ValidationIssue(
            severity="error", document_id=doc_id,
            message=(
                "Sin ClaimLedger — las afirmaciones materiales no tienen trazabilidad. "
                "Un documento sin ClaimLedger no puede presentarse como institucional."
            ),
            code="SIN_CLAIM_LEDGER",
        ))

    # Documento jurídico municipal sin diagnóstico legal en bundle
    if draft.spec.nivel == DocumentNivel.municipal:
        prefix = "03_diagnostico_reforma_"
        if doc_id.startswith(prefix):
            municipio_id = doc_id[len(prefix):]
            if not bundle.tiene_legal_para_municipio(municipio_id):
                issues.append(ValidationIssue(
                    severity="error", document_id=doc_id,
                    message=(
                        f"Municipio '{municipio_id}' sin diagnóstico jurídico verificado "
                        "en el bundle — no se puede redactar reforma sin base legal"
                    ),
                    code="SIN_MATRIZ_LEGAL",
                ))

    # KPI estimado con lenguaje oficial → bloquea esa afirmación
    if draft.claim_ledger:
        for claim in draft.claim_ledger.entries:
            if claim.source_status in (SourceStatus.estimado, SourceStatus.fallback,
                                       SourceStatus.no_disponible):
                # Si el lenguaje permitido es inadecuadamente oficial
                lang_lower = claim.allowed_language.lower()
                official_phrases = ("según inegi", "según banxico", "oficial", "certificado")
                if any(ph in lang_lower for ph in official_phrases):
                    issues.append(ValidationIssue(
                        severity="error",
                        document_id=doc_id,
                        claim_id=claim.claim_id,
                        message=(
                            f"Dato estimado con lenguaje oficial: "
                            f"'{claim.claim_text[:60]}' — "
                            f"lenguaje '{claim.allowed_language}' no corresponde "
                            f"a source_status={claim.source_status.value}"
                        ),
                        code="DATO_ESTIMADO_COMO_OFICIAL",
                    ))

    # ── Warnings que degradan a revision ─────────────────────────────────────

    if draft.is_fallback:
        issues.append(ValidationIssue(
            severity="warning", document_id=doc_id,
            message=(
                "Documento generado por template (no por LLM verificado) — "
                "borrador, nunca defendible"
            ),
            code="TEMPLATE_FALLBACK",
        ))

    if draft.approval is None:
        issues.append(ValidationIssue(
            severity="warning", document_id=doc_id,
            message=(
                "Sin ApprovalMatrix — ningún documento puede llamarse final "
                "sin control de versiones y aprobador institucional"
            ),
            code="SIN_APPROVAL_MATRIX",
        ))

    if bundle.confidence_score < 0.5:
        issues.append(ValidationIssue(
            severity="warning", document_id=doc_id,
            message=(
                f"Score de confianza de datos bajo "
                f"({bundle.confidence_score:.0%}) — "
                "el documento requiere revisión antes de presentarse"
            ),
            code="CONFIANZA_DATOS_BAJA",
        ))

    # CAPEX sin CompliancePack
    capex = bundle.resultados.get("capex_total") or 0
    if capex > 0 and draft.compliance is None:
        issues.append(ValidationIssue(
            severity="warning", document_id=doc_id,
            message=(
                f"CAPEX detectado ({capex:,.0f} MXN) sin CompliancePack — "
                "la ruta de adquisiciones no está declarada"
            ),
            code="CAPEX_SIN_COMPLIANCE",
        ))

    # EIDOS — terminología y registro (solo warnings, no bloquea)
    try:
        from app.agents.eidos_linter import lint_draft_document
        issues.extend(lint_draft_document(draft))
    except Exception as exc:
        logger.debug("EIDOS linter omitido: %s", exc)

    # Claims sin evidencia
    if draft.claim_ledger:
        sin_evidencia = draft.claim_ledger.claims_sin_evidencia()
        if sin_evidencia:
            issues.append(ValidationIssue(
                severity="warning", document_id=doc_id,
                message=(
                    f"{len(sin_evidencia)} afirmación(es) material(es) "
                    "sin evidencia en ClaimLedger"
                ),
                code="CLAIMS_SIN_EVIDENCIA",
            ))

    # ── Determinar status ─────────────────────────────────────────────────────

    errores    = [i for i in issues if i.severity == "error"]
    tiene_warn = any(i.severity == "warning" for i in issues)

    if errores:
        status = DocumentStatusLevel.bloqueado
    elif draft.is_fallback:
        # Template → borrador, NUNCA defendible
        status = DocumentStatusLevel.borrador
    elif tiene_warn:
        status = DocumentStatusLevel.revision
    else:
        status = DocumentStatusLevel.defendible

    report = ValidationReport(
        bundle_id=bundle.scenario_id,
        issues=issues,
        passed=len(errores) == 0,
    )

    return report, status


def validate_bundle(
    draft_bundle,
    bundle: ScenarioBundle,
) -> ValidationReport:
    """
    Valida todos los documentos del bundle y retorna un reporte consolidado.
    También actualiza el status y validation_report de cada DraftDocument in-place.
    """
    all_issues: list[ValidationIssue] = []

    try:
        from app.agents.numeric_guard import check_kpi_ranges
        all_issues.extend(check_kpi_ranges(bundle))
    except Exception as exc:
        logger.debug("numeric_guard skip: %s", exc)

    for doc in draft_bundle.documentos:
        report, status = validate_document(doc, bundle)
        doc.validation_report = report
        doc.status = status
        if status == DocumentStatusLevel.bloqueado:
            doc.blocked_reason = "; ".join(
                i.message for i in report.errores()[:2]
            )
        all_issues.extend(report.issues)

    errores = [i for i in all_issues if i.severity == "error"]
    return ValidationReport(
        bundle_id=bundle.scenario_id,
        issues=all_issues,
        passed=len(errores) == 0,
    )


# ─── Wave 3: Loop de revisión ─────────────────────────────────────────────────

class FeedbackItem:
    """Un item de feedback estructurado del Validador para re-escritura."""
    def __init__(self, severity: str, section_id: str, message: str, suggested_fix: str):
        self.severity    = severity      # "error" | "warning"
        self.section_id  = section_id
        self.message     = message
        self.suggested_fix = suggested_fix

    def to_dict(self) -> dict:
        return {
            "severity": self.severity,
            "section_id": self.section_id,
            "message": self.message,
            "suggested_fix": self.suggested_fix,
        }


def build_revision_feedback(
    doc: DraftDocument,
    bundle: ScenarioBundle,
) -> List[FeedbackItem]:
    """
    Genera feedback estructurado para que un agente re-escriba secciones bloqueadas.
    Retorna lista vacía si el documento ya es defendible.
    Solo se llama en el loop de revisión (max 2 iteraciones).
    """
    report, status = validate_document(doc, bundle)
    feedback: List[FeedbackItem] = []

    if status == DocumentStatusLevel.defendible:
        return feedback

    for issue in report.issues:
        section_id = issue.section_id or "general"
        if issue.code == "SIN_AUDIENCIA":
            feedback.append(FeedbackItem(
                severity="error", section_id=section_id,
                message=issue.message,
                suggested_fix="Declara explícitamente la audiencia al inicio del documento: 'Este documento está dirigido a [cargo/instancia]'.",
            ))
        elif issue.code == "SIN_DECISION":
            feedback.append(FeedbackItem(
                severity="error", section_id=section_id,
                message=issue.message,
                suggested_fix="El documento debe habilitar una decisión concreta. Agrega: 'La decisión que este documento habilita es: [decisión]'.",
            ))
        elif issue.code == "SIN_SECCIONES":
            feedback.append(FeedbackItem(
                severity="error", section_id=section_id,
                message=issue.message,
                suggested_fix="El documento está vacío. Genera al menos las secciones obligatorias del DocumentSpec.",
            ))
        elif issue.code == "DATO_ESTIMADO_LENGUAJE_OFICIAL":
            feedback.append(FeedbackItem(
                severity="error", section_id=section_id,
                message=issue.message,
                suggested_fix="Reemplaza 'dictamen/certificado/sanción firme' por 'se estima / el modelo proyecta / pendiente de verificación oficial'.",
            ))
        elif issue.code == "CLAIMS_SIN_EVIDENCIA":
            feedback.append(FeedbackItem(
                severity="warning", section_id=section_id,
                message=issue.message,
                suggested_fix="Para cada afirmación numérica o de política, agrega la fuente: '(Fuente: [organismo], [fecha])' o etiqueta como supuesto_editable.",
            ))
        elif issue.code == "CAPEX_SIN_COMPLIANCE":
            feedback.append(FeedbackItem(
                severity="warning", section_id=section_id,
                message=issue.message,
                suggested_fix="Agrega una sección 'Marco de Adquisiciones' que declare la ruta de licitación y fuente de financiamiento.",
            ))
        else:
            feedback.append(FeedbackItem(
                severity=issue.severity, section_id=section_id,
                message=issue.message,
                suggested_fix="Revisar y corregir según el issue reportado.",
            ))

    logger.info(
        f"Validator feedback: doc={doc.document_id} status={status.value} "
        f"items={len(feedback)}"
    )
    return feedback


def format_feedback_for_llm(feedback: List[FeedbackItem]) -> str:
    """Formatea el feedback como bloque de texto para el prompt de re-escritura."""
    if not feedback:
        return "El documento ya es defendible. No se requieren cambios."

    lines = ["## Feedback del Validador — correcciones requeridas\n"]
    for i, fb in enumerate(feedback, 1):
        lines.append(f"### Issue {i} [{fb.severity.upper()}] — Sección: {fb.section_id}")
        lines.append(f"**Problema:** {fb.message}")
        lines.append(f"**Corrección sugerida:** {fb.suggested_fix}")
        lines.append("")

    lines.append("---")
    lines.append("Reescribe únicamente las secciones afectadas. No alteres secciones que ya son correctas.")
    lines.append("Límite: mantén el tono institucional y las fuentes existentes.")
    return "\n".join(lines)


# ─── Wave 3: Unicidad espacio-tiempo ─────────────────────────────────────────

def build_document_dna(
    municipio_id: str,
    scenario_id: str,
    document_id: str,
    zm: str,
) -> str:
    """
    Hash SHA-256 corto (12 hex) que identifica unívocamente un documento.
    Incorpora municipio, scenario_id, document_id, ZM y timestamp UTC.
    Ningún documento puede reutilizar este hash — es el 'DNA espacio-tiempo'.
    """
    ts = datetime.now(timezone.utc).isoformat()
    payload = json.dumps({
        "municipio_id": municipio_id,
        "scenario_id": scenario_id,
        "document_id": document_id,
        "zm": zm,
        "ts": ts,
    }, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()[:12]


def stamp_document_footer(
    document: DraftDocument,
    municipio_id: str,
    scenario_id: str,
    zm: str,
) -> str:
    """
    Genera el pie de documento / watermark para PDF.
    Formato: ALQUIMIA · {municipio} · {zm} · {fecha_utc} · DNA:{hash}
    """
    dna = build_document_dna(municipio_id, scenario_id, document.document_id, zm)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return (
        f"ÁGORA GOV — ALQUIMIA  |  {municipio_id.upper()}  |  ZM {zm}  |  "
        f"{ts}  |  DNA:{dna}  |  Escenario: {scenario_id[:8]}"
    )
