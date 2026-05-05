"""
Fase 3B — validator.py

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

from app.agents.schemas import (
    DraftDocument,
    DocumentNivel,
    DocumentStatusLevel,
    ScenarioBundle,
    SourceStatus,
    ValidationIssue,
    ValidationReport,
)


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
