"""Construcción inicial del expediente municipal razonado.

Este módulo no reemplaza agentes LLM. Crea el contrato mínimo y trazable que
los agentes deben usar antes de redactar documentos.
"""
from __future__ import annotations

from typing import Any

from app.agents.schemas import (
    ClaimClassification,
    CriticalObjection,
    CriticalObjectionReport,
    DossierStatus,
    ESGPublicValueAssessment,
    MunicipalReasoningClaim,
    MunicipalReasoningDossier,
    OperationalLogisticsDossier,
    OperationalWave,
    ScenarioBundle,
    SourceEpistemologyReport,
)


def _text(value: Any, default: str = "pendiente") -> str:
    if value is None:
        return default
    value = str(value).strip()
    return value or default


def _legal_for(bundle: ScenarioBundle, municipio_id: str) -> dict[str, Any]:
    return (
        bundle.legal_municipal.get(municipio_id)
        or bundle.legal_municipal.get(municipio_id.lower())
        or {}
    )


def _classification_from_provenance(provenance: dict[str, Any] | None) -> ClaimClassification:
    if not provenance:
        return ClaimClassification.pendiente_fuente
    kind = _text(provenance.get("tipo"), "desconocido").lower()
    if kind in {"certificado", "oficial", "verificado"}:
        return ClaimClassification.fuente_verificada
    if kind in {"supuesto", "manual"}:
        return ClaimClassification.supuesto_editable
    if kind in {"calculado", "estimado", "fallback"}:
        return ClaimClassification.estimacion_modelo
    return ClaimClassification.pendiente_fuente


def _status_from_bundle(bundle: ScenarioBundle, blocked_claims: list[str]) -> DossierStatus:
    if not bundle.municipios_activos:
        return DossierStatus.blocked
    if bundle.bloqueos or blocked_claims:
        return DossierStatus.needs_verification
    if not bundle.legal_municipal:
        return DossierStatus.needs_verification
    return DossierStatus.ready


def _build_source_reports(bundle: ScenarioBundle) -> list[SourceEpistemologyReport]:
    reports: list[SourceEpistemologyReport] = []
    kpi_sources = []
    kpi_estimates = []
    pending = []

    for kpi in bundle.kpis_con_provenance:
        kpi_id = _text(kpi.get("kpi_id"), "kpi")
        provenance = kpi.get("provenance") or {}
        source = _text(provenance.get("fuente_nombre") or provenance.get("fuente"), "sin fuente")
        classification = _classification_from_provenance(provenance)
        if classification == ClaimClassification.fuente_verificada:
            kpi_sources.append(f"{kpi_id}: {source}")
        elif classification == ClaimClassification.estimacion_modelo:
            kpi_estimates.append(f"{kpi_id}: {source}")
        else:
            pending.append(f"{kpi_id}: fuente/provenance insuficiente")

    for municipio_id in bundle.municipios_activos:
        legal = _legal_for(bundle, municipio_id)
        verified_sources = list(kpi_sources)
        pending_sources = list(pending)
        contradictions: list[str] = []

        if legal:
            source = _text(legal.get("fuente"), "fuente legal sin nombre")
            if bool(legal.get("verificado")) and not bool(legal.get("agora_bloqueado")):
                verified_sources.append(f"reglamento municipal: {source}")
            else:
                pending_sources.append(f"reglamento municipal de {municipio_id}: pendiente de validación")
        else:
            pending_sources.append(f"reglamento municipal de {municipio_id}: no cargado")

        for warning in bundle.warnings:
            if municipio_id in warning or len(bundle.municipios_activos) == 1:
                contradictions.append(warning)

        reports.append(SourceEpistemologyReport(
            municipio_id=municipio_id,
            verified_sources=verified_sources,
            model_estimates=kpi_estimates,
            editable_assumptions=[
                "horizonte de implementación",
                "trayectoria de captura",
                "precios/costos del escenario cuando no exista cotización local validada",
            ],
            pending_sources=pending_sources,
            contradictions=contradictions,
            next_verification_action=(
                "Cargar o validar reglamento municipal, matriz de fuentes y evidencia operativa antes de convertir el análisis en documento defendible."
            ),
        ))
    return reports


def _build_claims(bundle: ScenarioBundle) -> list[MunicipalReasoningClaim]:
    claims: list[MunicipalReasoningClaim] = []
    for municipio_id in bundle.municipios_activos:
        for kpi in bundle.kpis_con_provenance:
            provenance = kpi.get("provenance") or {}
            classification = _classification_from_provenance(provenance)
            kpi_id = _text(kpi.get("kpi_id"), "kpi")
            value = _text(kpi.get("valor"), "sin valor")
            source = _text(provenance.get("fuente_nombre") or provenance.get("fuente"), "sin fuente")
            confidence = float(provenance.get("confianza", 0.5) or 0.5)
            claims.append(MunicipalReasoningClaim(
                municipio_id=municipio_id,
                claim=f"{kpi_id}: {value}",
                classification=classification,
                source=source,
                confidence=max(0.0, min(1.0, confidence)),
                decision_use="Puede alimentar el expediente sólo con lenguaje calibrado por su clasificación.",
                limitation="No convierte el resultado del simulador en dato oficial ni presupuesto aprobado.",
            ))

        legal = _legal_for(bundle, municipio_id)
        claims.append(MunicipalReasoningClaim(
            municipio_id=municipio_id,
            claim=f"Contexto legal municipal: {_text(legal.get('reglamento'), 'sin reglamento cargado')}",
            classification=(
                ClaimClassification.fuente_verificada
                if legal and bool(legal.get("verificado")) and not bool(legal.get("agora_bloqueado"))
                else ClaimClassification.pendiente_fuente
            ),
            source=_text(legal.get("fuente"), "manifest/fuente legal pendiente"),
            confidence=0.75 if legal else 0.2,
            decision_use="Define si se puede hablar de propuesta normativa por municipio.",
            limitation="La existencia de fuente localizada no equivale a validación jurídica competente.",
        ))
    return claims


def _build_logistics(bundle: ScenarioBundle) -> OperationalLogisticsDossier:
    ops = bundle.inputs_usuario.get("operations_summary") or {}
    implementation = bundle.inputs_usuario.get("implementation_plan") or {}
    has_ops = bool(ops or implementation)
    waves: list[OperationalWave] = []

    for index, municipio_id in enumerate(bundle.municipios_activos, start=1):
        waves.append(OperationalWave(
            wave_id=f"wave-{index}",
            municipio_id=municipio_id,
            justification=(
                "Ola propuesta por municipio activo para mantener responsabilidad municipal separada."
                if has_ops else
                "Ola conceptual: falta LogisticsBlueprint o plan territorial validado para justificar rutas reales."
            ),
            routes_or_zones=[
                _text(ops.get("route_id") or ops.get("ruta") or ops.get("zona"), "zona_por_definir")
            ],
            capacity_requirement=_text(
                ops.get("capacity") or ops.get("capacidad") or ops.get("capacidad_ton_dia"),
                "capacidad pendiente de evidencia",
            ),
            responsible_role=_text(
                ops.get("responsable") or ops.get("operator") or ops.get("responsible"),
                "responsable operativo municipal por definir",
            ),
            timing=f"horizonte {bundle.horizonte_anios} año(s), fase por justificar",
            assumptions=[
                "La secuencia de olas no es cronograma oficial.",
                "Las colonias/rutas requieren validación operativa local.",
            ],
            blockers=[] if has_ops else ["Sin LogisticsBlueprint o evidencia operativa suficiente."],
        ))

    blocked = any(w.blockers for w in waves)
    return OperationalLogisticsDossier(
        status=DossierStatus.needs_verification if blocked else DossierStatus.ready,
        waves=waves,
        route_logic=(
            "La ruta se justifica por municipio, capacidad y evidencia operativa disponible."
            if has_ops else
            "No hay evidencia suficiente para prometer número de rutas; sólo puede proponerse ruta conceptual."
        ),
        capacity_logic=(
            "Capacidad tomada del resumen operativo declarado."
            if has_ops else
            "Capacidad pendiente; no se debe cerrar plan operativo como ready."
        ),
        evidence_required=[
            "rutas o zonas por municipio",
            "camiones/unidades y frecuencia",
            "capacidad t/día",
            "responsable operativo",
            "bitácora o evidencia de operación",
        ],
        next_action="Cargar LogisticsBlueprint o plan territorial con rutas, capacidad y responsable municipal.",
    )


def _build_objections(
    bundle: ScenarioBundle,
    reports: list[SourceEpistemologyReport],
    logistics: OperationalLogisticsDossier,
) -> CriticalObjectionReport:
    objections: list[CriticalObjection] = []
    for report in reports:
        if report.pending_sources:
            objections.append(CriticalObjection(
                municipio_id=report.municipio_id,
                objection="Hay fuentes pendientes que impiden cerrar el expediente como defendible.",
                severity="important",
                affected_claim=", ".join(report.pending_sources[:3]),
                corrective_action=report.next_verification_action,
            ))
        if report.contradictions:
            objections.append(CriticalObjection(
                municipio_id=report.municipio_id,
                objection="Existen contradicciones o warnings activos en el contexto del municipio.",
                severity="critical",
                affected_claim=", ".join(report.contradictions[:3]),
                corrective_action="Resolver contradicción antes de redactar conclusión ejecutiva.",
            ))
    if logistics.status != DossierStatus.ready:
        for municipio_id in bundle.municipios_activos:
            objections.append(CriticalObjection(
                municipio_id=municipio_id,
                objection="La ruta logística no cuenta con evidencia suficiente para justificar olas, rutas o capacidad.",
                severity="important",
                affected_claim="ruta_logistica_justificada",
                corrective_action=logistics.next_action,
            ))
    return CriticalObjectionReport(objections=objections)


def build_municipal_reasoning_dossier(bundle: ScenarioBundle) -> MunicipalReasoningDossier:
    """Construye el expediente razonado base a partir del ScenarioBundle."""
    source_reports = _build_source_reports(bundle)
    claims = _build_claims(bundle)
    logistics = _build_logistics(bundle)
    objections = _build_objections(bundle, source_reports, logistics)
    blocked_claims = [
        claim.claim
        for claim in claims
        if claim.classification in {
            ClaimClassification.pendiente_fuente,
            ClaimClassification.contradiccion_detectada,
        }
    ]

    status = _status_from_bundle(bundle, blocked_claims)
    if objections.critical_count() > 0:
        status = DossierStatus.blocked
    elif logistics.status != DossierStatus.ready and status == DossierStatus.ready:
        status = DossierStatus.needs_verification

    maturity: dict[str, str] = {}
    for municipio_id in bundle.municipios_activos:
        legal = _legal_for(bundle, municipio_id)
        if legal and bool(legal.get("verificado")) and not bool(legal.get("agora_bloqueado")):
            maturity[municipio_id] = "base legal localizada; falta conectar operación, evidencia y capacidad"
        elif legal:
            maturity[municipio_id] = "contexto legal localizado pero pendiente de validación"
        else:
            maturity[municipio_id] = "sin contexto legal municipal suficiente"

    return MunicipalReasoningDossier(
        status=status,
        zm=bundle.zm,
        municipios=bundle.municipios_activos,
        thesis=(
            "El expediente debe explicar el problema municipal de RSU con evidencia, supuestos y límites antes de generar documentos."
        ),
        municipal_maturity=maturity,
        source_epistemology=source_reports,
        claims=claims,
        critical_objections=objections,
        logistics=logistics,
        esg_public_value=ESGPublicValueAssessment(
            environmental=["RSU municipal, captura, disposición evitada y emisiones modeladas con fuente o supuesto."],
            social=["Salud pública, recolectores de base, ciudadanía y equidad territorial se tratan como impactos, no adornos."],
            governance=["Reglamento, cabildo, fuente, bitácora, evidencia y validación competente separan análisis de acto oficial."],
            standards_alignment=[
                "ESG como ambiental, social y gobernanza municipal.",
                "Matriz de trazabilidad: afirmación -> fuente -> fórmula/supuesto -> estado -> acción correctiva.",
            ],
            limitations=[
                "No es dictamen, documento oficial, presupuesto aprobado ni sanción firme.",
                "No sustituye validación jurídica, financiera u operativa competente.",
            ],
        ),
        blocked_claims=blocked_claims,
        enabled_decisions=[
            "Definir qué datos faltan para pasar de simulación a propuesta municipal defendible.",
            "Priorizar validación legal, matriz de fuentes y LogisticsBlueprint antes de exportar paquete final.",
        ],
        next_actions=[
            "Cargar/validar reglamento municipal.",
            "Completar matriz de fuentes y anexos de cálculo.",
            "Cargar LogisticsBlueprint con rutas, capacidad, responsables y evidencia.",
        ],
    )
