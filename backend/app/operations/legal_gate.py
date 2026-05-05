"""Motor 12.4: advertencias educativas y sanciones con gate legal municipal."""
from __future__ import annotations

from app.legal.diagnostic import build_diagnostic
from app.legal.schemas import LegalSourceValidationStatus
from app.operations.legal_gate_schemas import (
    DueProcessGate,
    EducationalWarning,
    GatedInspectionRecord,
    LegalGatedActionRequest,
    LegalGatedActionResponse,
    LegalGatedActionStatus,
    LegalGatedActionType,
    LegalGatedScope,
    ProposedSanction,
    WasteScope,
)


def _clean(value: str | None) -> str:
    return (value or "").strip()


def _legal_validation_for(request: LegalGatedActionRequest) -> LegalSourceValidationStatus:
    if request.legal_validation_status is not None:
        return request.legal_validation_status
    municipio_id = _clean(request.municipio_id).lower()
    if not municipio_id:
        return LegalSourceValidationStatus.no_disponible
    diagnostic = build_diagnostic(municipio_id)
    if diagnostic is None:
        return LegalSourceValidationStatus.no_disponible
    return diagnostic.legal_validation_status


def _has_executable_sanction_base(request: LegalGatedActionRequest) -> bool:
    municipio_id = _clean(request.municipio_id).lower()
    diagnostic = build_diagnostic(municipio_id) if municipio_id else None
    if diagnostic is None:
        return False
    return diagnostic.tiene_sancion_ejecutable


def _base_blockers(request: LegalGatedActionRequest) -> list[str]:
    blockers: list[str] = []
    if request.geography_scope != LegalGatedScope.municipio:
        blockers.append("Una ZM no desbloquea acciones legales municipales; seleccionar municipio.")
    if not _clean(request.municipio_id):
        blockers.append("Falta municipio_id para evaluar gate municipal.")
    if request.waste_scope != WasteScope.rsu_municipal:
        blockers.append("12.4 solo evalua RSU municipal; residuos regulados requieren modulo especializado.")
    return blockers


def _sanction_blockers(
    request: LegalGatedActionRequest,
    validation_status: LegalSourceValidationStatus,
) -> list[str]:
    blockers = _base_blockers(request)
    municipio_id = _clean(request.municipio_id).lower()
    if validation_status != LegalSourceValidationStatus.validado_externamente:
        blockers.append("Sancion propuesta bloqueada: falta base legal municipal validada externamente.")
    if _clean(request.legal_source_municipio_id).lower() != municipio_id:
        blockers.append("La fuente legal debe corresponder al mismo municipio.")
    if not _clean(request.legal_basis_article_id):
        blockers.append("Falta articulo municipal aplicable para propuesta.")
    if not request.evidence_ids:
        blockers.append("Falta evidencia operativa para propuesta.")
    if not _has_executable_sanction_base(request):
        blockers.append("El diagnostico municipal no confirma base sancionatoria ejecutable.")
    return blockers


def _gate(
    request: LegalGatedActionRequest,
    validation_status: LegalSourceValidationStatus,
    blockers: list[str],
) -> DueProcessGate:
    can_education = request.waste_scope == WasteScope.rsu_municipal and bool(_clean(request.municipio_id))
    can_inspection = can_education and request.geography_scope == LegalGatedScope.municipio
    can_propose = not blockers and request.action_type in (
        LegalGatedActionType.proposed_sanction,
        LegalGatedActionType.due_process,
    )
    return DueProcessGate(
        municipio_id=_clean(request.municipio_id).lower(),
        legal_validation_status=validation_status,
        legal_source_municipio_id=(
            _clean(request.legal_source_municipio_id).lower()
            if _clean(request.legal_source_municipio_id)
            else None
        ),
        can_issue_educational_warning=can_education,
        can_register_inspection=can_inspection,
        can_propose_sanction=can_propose,
        can_create_definitive_document=False,
        blockers=blockers,
        next_action=(
            "Resolver bloqueos municipales antes de proponer una sancion."
            if blockers
            else "Continuar solo como propuesta sujeta a revision competente."
        ),
    )


def evaluate_legal_gated_action(request: LegalGatedActionRequest) -> LegalGatedActionResponse:
    validation_status = _legal_validation_for(request)
    blockers = _base_blockers(request)
    warnings: list[str] = []
    educational_warning: EducationalWarning | None = None
    inspection: GatedInspectionRecord | None = None
    proposed_sanction: ProposedSanction | None = None

    if request.action_type == LegalGatedActionType.educational_warning and not blockers:
        educational_warning = EducationalWarning(
            warning_id=f"edu-{_clean(request.municipio_id).lower()}",
            municipio_id=_clean(request.municipio_id).lower(),
            message="Advertencia educativa: separar RSU municipal mejora la recuperacion y reduce contaminacion.",
            next_action="Reforzar comunicacion ciudadana y registrar aprendizaje operativo.",
        )
    elif request.action_type == LegalGatedActionType.inspection and not blockers:
        if not request.evidence_ids:
            warnings.append("Inspeccion registrada como propuesta operativa sin evidencia completa.")
        inspection = GatedInspectionRecord(
            inspection_id=f"insp-{_clean(request.municipio_id).lower()}",
            municipio_id=_clean(request.municipio_id).lower(),
            route_or_zone_id=_clean(request.route_or_zone_id) or "zona_por_definir",
            evidence_ids=request.evidence_ids,
            next_action="Completar evidencia y revisar hallazgos antes de cualquier propuesta posterior.",
        )
    elif request.action_type in (LegalGatedActionType.proposed_sanction, LegalGatedActionType.due_process):
        blockers = _sanction_blockers(request, validation_status)
        if not blockers:
            proposed_sanction = ProposedSanction(
                proposed_sanction_id=f"prop-{_clean(request.municipio_id).lower()}",
                municipio_id=_clean(request.municipio_id).lower(),
                legal_basis_article_id=_clean(request.legal_basis_article_id),
                evidence_ids=request.evidence_ids,
                next_action="Abrir revision competente y conservar derecho de audiencia antes de cualquier firmeza.",
            )
    elif request.action_type == LegalGatedActionType.definitive_document:
        blockers.append(
            "Documento definitivo bloqueado: ALQUIMIA no emite documentos oficiales ni dictamen juridico."
        )
        if request.competent_validation_explicit:
            warnings.append("Existe validacion externa declarada, pero la plataforma no convierte la salida en oficial.")

    status = LegalGatedActionStatus.blocked if blockers else (
        LegalGatedActionStatus.warning if warnings else LegalGatedActionStatus.ready
    )
    gate = _gate(request, validation_status, blockers)
    next_action = (
        "Atender bloqueos antes de avanzar."
        if blockers
        else (
            "Usar la salida como orientacion educativa u operativa, no como documento oficial."
            if warnings
            else "Continuar con registro operativo manteniendo fuente y alcance municipal."
        )
    )

    return LegalGatedActionResponse(
        status=status,
        action_type=request.action_type,
        municipio_id=_clean(request.municipio_id).lower() or None,
        geography_scope=request.geography_scope,
        waste_scope=request.waste_scope,
        educational_warning=educational_warning,
        inspection=inspection,
        proposed_sanction=proposed_sanction,
        due_process_gate=gate,
        language_help_text=(
            "Advertencia educativa, inspeccion, propuesta, debido proceso y documento oficial "
            "son estados distintos; ALQUIMIA solo produce orientacion y propuestas hasta validacion competente."
        ),
        warnings=warnings,
        blockers=blockers,
        next_action=next_action,
    )
