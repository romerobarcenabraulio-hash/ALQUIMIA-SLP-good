from __future__ import annotations

import json
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import List
import logging

from app.routers.auth import get_current_user, UserInfo, hash_password, DEMO_USERS
from app.db.session import get_db
from app.admin.tenant_state import (
    TenantStateError,
    assert_can_access_stage,
    validate_manual_transition,
)
from app.automation.inference import (
    TenantSeed,
    apply_runtime_automation,
    automation_summary,
    run_initial_inference,
)
from app.automation.documents import (
    SUPPORTED_DOCUMENTS,
    export_gate,
    generate_document_draft,
    update_document_draft,
)
from app.automation.runtime import (
    RuntimeEventType,
    apply_runtime_event,
    decide_discrepancy,
    decide_recommendation,
)
from app.automation.data_moat import (
    ALLOWED_METRICS,
    MIN_ANALYTICS_N,
    PrivacyPolicyError,
    aggregate_cross_tenant_pattern,
    approve_internal_insight,
)
from app.automation.nous_observational import (
    GateOutcome,
    MeasurementQuality,
    PatternReviewAction,
    ValidationAction,
    create_pending_pattern,
    detect_layer1_emerging_patterns,
    detect_layer2_gate_outcome_patterns,
    detect_layer3_projection_delta_patterns,
    record_gate_outcome,
    record_inference_correction,
    record_projection_delta,
    review_internal_pattern,
)
from app.automation.bibliography_intelligence import (
    Stage,
    STAGE_MODULES,
    build_bibliography_records,
    build_evidence_recommendations,
    build_stage_evidence_map,
)

router = APIRouter()
logger = logging.getLogger(__name__)

TenantStage = Literal["validation", "planning", "execution", "expansion"]
TierComercial = Literal["diagnostico", "implementacion", "operacion_completa"]
GateStatus = Literal["no_iniciado", "en_revision", "cerrado", "fallido"]

GATE_IDS = ("G1", "G2", "G3", "G4", "G5")
TIER_ORDER = {
    "diagnostico": 1,
    "implementacion": 2,
    "operacion_completa": 3,
}
NOUS_CLIENT_MODULES = {"M01", "M04", "M13", "M14", "M17", "M21"}
NOUS_EMERGING_MARKERS = {"emergente", "emerging", "interna", "internal", "pending", "insufficient"}
NOUS_MIN_PUBLICATION_OBSERVATIONS = {1: 5, 2: 15, 3: 18}
EIDOS_FORBIDDEN_PUBLICATION_PHRASES = (
    "debes",
    "debe ",
    "tienes que",
    "nous predice",
    "modelo predice",
    "la ia decidio",
    "la ia decidió",
    "obligatorio",
)
NOUS_GOVERNANCE_PATTERN_STATES = {
    "active",
    "under_review",
    "retired_bias",
    "retired_low_performance",
    "retired_stale",
    "paused_by_founder",
    "superseded",
}


def require_admin(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admins")
    return user


class CreateUserRequest(BaseModel):
    nombre:   str
    email:    str
    password: str
    rol:      str = "analista"
    zm:       str = "SLP"

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("email inválido")
        return value


class TenantCreateRequest(BaseModel):
    nombre: str
    estado_mx: str
    municipio_id: str
    inegi_clave: str
    tier_comercial: TierComercial = "diagnostico"
    current_stage: TenantStage = "validation"


class TenantUpdateRequest(BaseModel):
    nombre: str | None = None
    estado_mx: str | None = None
    municipio_id: str | None = None
    inegi_clave: str | None = None
    tier_comercial: TierComercial | None = None
    active_capabilities: list[str] | None = None


class GateEvidenceRequest(BaseModel):
    evidencia_url: str
    evidencia_label: str
    decisor_humano: str
    notas: str | None = None


class GateCloseRequest(BaseModel):
    evidencia_url: str | None = None
    evidencia_label: str | None = None
    decisor_humano: str
    notas: str | None = None


class TenantTransitionRequest(BaseModel):
    target_stage: TenantStage
    manual_confirmation: bool
    confirmed_by: str
    notas: str | None = None


class TenantMunicipalProfileRequest(BaseModel):
    antecedentes: dict[str, Any]
    mapa_social: dict[str, Any]
    organigrama_servicio: dict[str, Any]
    provenance_status: str = "pendiente_verificacion"


class TenantDocumentDraftRequest(BaseModel):
    document_type: str
    notes: str | None = None

    @field_validator("document_type")
    @classmethod
    def _supported_document_type(cls, value: str) -> str:
        if value not in SUPPORTED_DOCUMENTS:
            raise ValueError("document_type no soportado")
        return value


class TenantDocumentUpdateRequest(BaseModel):
    content_md: str | None = None
    status: str | None = None
    review_notes: str | None = None


class TenantRuntimeEventRequest(BaseModel):
    event_type: RuntimeEventType
    payload: dict[str, Any] = {}


class RecommendationDecisionRequest(BaseModel):
    action: Literal["aceptar", "rechazar", "ajustar"]
    notes: str | None = None
    adjusted_recommendation: str | None = None


class DiscrepancyDecisionRequest(BaseModel):
    action: Literal["aceptar_dato_cliente", "conservar_inferido", "marcar_revision_pendiente"]
    notes: str | None = None


class CrossTenantAnalyticsRequest(BaseModel):
    metric: str = "generacion_rsu_por_tipo_municipio"
    minimum_n: int = MIN_ANALYTICS_N

    @field_validator("metric")
    @classmethod
    def _metric_allowed(cls, value: str) -> str:
        if value not in ALLOWED_METRICS:
            raise ValueError("metric no permitido para analytics anonimos")
        return value


class ShareInsightRequest(BaseModel):
    pattern: dict[str, Any]
    approved_by: str
    notes: str | None = None


class TenantAnalyticsConsentRequest(BaseModel):
    aggregated_anonymous_analytics: bool = False
    consent_source: str | None = None
    consented_by: str | None = None


class NousInferenceCorrectionRequest(BaseModel):
    module_id: str
    field_id: str
    inferred_value: Any
    validation_action: ValidationAction
    corrected_value: Any = None
    corrected_by_role: str


class NousGateOutcomeRequest(BaseModel):
    gate: str
    outcome: GateOutcome
    days_to_close: int
    module_state_at_close: dict[str, Any] = {}
    political_context: dict[str, Any] = {}
    payer_configuration: str | None = None


class NousProjectionDeltaRequest(BaseModel):
    module_id: str
    metric_id: str
    projected_value: float
    actual_value: float
    measurement_period: str
    measurement_quality: MeasurementQuality


class NousPendingPatternRequest(BaseModel):
    pattern_layer: int
    pattern_description_natural: str
    pattern_description_technical: dict[str, Any] = {}
    observations_count: int = 0
    contributing_tenant_profiles: list[dict[str, Any]] = []
    confidence_level: str | None = None


class NousPatternReviewRequest(BaseModel):
    action: PatternReviewAction
    notes: str | None = None


class NousPatternPublicationGatesRequest(BaseModel):
    bias_check_status: Literal["passed", "failed", "not_run"] | None = None
    founder_gate_status: Literal["approved", "pending", "blocked_rejected", "blocked_retired"] | None = None
    marcos_standards_check_status: Literal["approved", "requires_human_review", "blocked_missing_standard"] | None = None
    confidence_level: str | None = None
    aggregate_opt_in_verified: bool | None = None
    notes: str | None = None


class NousPatternPublishRequest(BaseModel):
    target_modules: list[str]
    conclusion: str | None = None
    action_suggested: str | None = None
    limitation: str | None = None
    approved_by: str


class NousSuggestionFeedbackRequest(BaseModel):
    action: Literal["accept", "adjust", "reject"]
    role: str
    rejection_reason: str | None = None
    adjustment_note: str | None = None


class NousGovernanceActionRequest(BaseModel):
    action: Literal[
        "activate",
        "mark_under_review",
        "retire_bias",
        "retire_low_performance",
        "retire_stale",
        "pause_by_founder",
        "supersede",
    ]
    reason: str
    decided_by: str


class NousPauseRequest(BaseModel):
    reason: str
    decided_by: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _load_capability_registry() -> dict[str, Any]:
    path = _repo_root() / "docs" / "architecture" / "capability_registry.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning("capability_registry_load_failed: %s", exc)
        return {"version": "unavailable", "modules": []}


def _load_standards_map() -> dict[str, Any]:
    path = _repo_root() / "docs" / "architecture" / "standards_map.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning("standards_map_load_failed: %s", exc)
        return {"version": "unavailable", "modules": []}


def _default_capabilities(tier: str, stage: str) -> list[str]:
    tier_rank = TIER_ORDER[tier]
    modules = _load_capability_registry().get("modules", [])
    result: list[str] = []
    for module in modules:
        if not module.get("default_active", False):
            continue
        min_tier = module.get("min_tier", "diagnostico")
        if TIER_ORDER.get(min_tier, 99) > tier_rank:
            continue
        if stage not in module.get("platforms", []):
            continue
        result.append(module["module_id"])
    return result


def _default_gates() -> list[dict[str, Any]]:
    return [
        {
            "gate_id": gate_id,
            "status": "no_iniciado",
            "evidencia_url": None,
            "evidencia_label": None,
            "decisor_humano": None,
            "closed_at": None,
            "notas": None,
            "updated_at": _now_iso(),
        }
        for gate_id in GATE_IDS
    ]


def _audit(action: str, actor: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "actor": actor,
        "action": action,
        "payload": payload,
        "created_at": _now_iso(),
    }


def _profile_mode(profile: dict[str, Any]) -> str:
    antecedentes = profile.get("antecedentes") or {}
    mapa_social = profile.get("mapa_social") or {}
    organigrama = profile.get("organigrama_servicio") or {}
    actors = mapa_social.get("actores") if isinstance(mapa_social, dict) else []
    roles = organigrama.get("roles_operativos") if isinstance(organigrama, dict) else []
    turnos = organigrama.get("turnos") if isinstance(organigrama, dict) else []
    horarios = organigrama.get("horarios") if isinstance(organigrama, dict) else []
    required_antecedentes = [
        "presidente_municipal",
        "cabildo",
        "estructura_administrativa",
        "reglamento_de_limpia",
        "concesion_actual",
        "programas_previos",
        "prensa_24_meses",
        "proximo_proceso_electoral",
    ]
    has_required = all(antecedentes.get(key) is not None for key in required_antecedentes)
    if has_required and len(actors or []) >= 15 and roles and turnos and horarios:
        return "operacion"
    return "carga_inicial"


def _empty_profile() -> dict[str, Any]:
    return {
        "mode": "carga_inicial",
        "antecedentes": {},
        "mapa_social": {"actores": []},
        "organigrama_servicio": {"direcciones_relevantes": [], "roles_operativos": [], "turnos": [], "horarios": []},
        "provenance_status": "pendiente_verificacion",
        "updated_by": "system",
        "updated_at": None,
    }


def _initial_inference_profile(tenant_id: str, data: TenantCreateRequest) -> dict[str, Any]:
    return run_initial_inference(
        TenantSeed(
            tenant_id=tenant_id,
            nombre=data.nombre,
            estado_mx=data.estado_mx,
            municipio_id=data.municipio_id,
            inegi_clave=data.inegi_clave,
        ),
        _load_capability_registry(),
    )


_tenants_mem: dict[str, dict[str, Any]] = {}
_tenant_documents_mem: dict[str, list[dict[str, Any]]] = {}
_analytics_audit_mem: list[dict[str, Any]] = []
_nous_mem: dict[str, list[dict[str, Any]]] = {
    "inference_corrections": [],
    "gate_outcomes": [],
    "projection_deltas": [],
    "nous_patterns": [],
    "suggestion_feedback": [],
    "governance_events": [],
    "self_reports": [],
}


def _serialize_mem(tenant: dict[str, Any]) -> dict[str, Any]:
    serialized = deepcopy(tenant)
    profile = serialized.get("municipal_profile")
    if isinstance(profile, dict):
        profile["automation"] = automation_summary(profile)
    return serialized


def _mem_create_tenant(data: TenantCreateRequest, actor: str) -> dict[str, Any]:
    tenant_id = str(uuid.uuid4())
    now = _now_iso()
    capabilities = _default_capabilities(data.tier_comercial, data.current_stage)
    municipal_profile = _initial_inference_profile(tenant_id, data)
    tenant = {
        "id": tenant_id,
        "nombre": data.nombre,
        "estado_mx": data.estado_mx,
        "municipio_id": data.municipio_id,
        "inegi_clave": data.inegi_clave,
        "tier_comercial": data.tier_comercial,
        "activo": True,
        "analytics_aggregate_opt_in": False,
        "analytics_aggregate_opt_in_at": None,
        "analytics_aggregate_opt_in_by": None,
        "analytics_aggregate_opt_in_source": None,
        "created_at": now,
        "updated_at": now,
        "state": {
            "tenant_id": tenant_id,
            "current_stage": data.current_stage,
            "fecha_ingreso": now,
            "fecha_cambio_stage": now,
            "transition_mode": "manual_only",
            "notas": None,
        },
        "gates": _default_gates(),
        "capabilities": [{"module_id": module_id, "active": True, "source": "tier_default"} for module_id in capabilities],
        "audit_log": [
            _audit(
                "tenant_created",
                actor,
                {
                    "current_stage": data.current_stage,
                    "tier_comercial": data.tier_comercial,
                    "capabilities_count": len(capabilities),
                    "automatic_stage_transition": False,
                },
            )
        ],
        "municipal_profile": municipal_profile,
    }
    tenant["audit_log"].append(
        _audit(
            "hermes_initial_inference_completed",
            "HERMES",
            {
                "status": municipal_profile["antecedentes"]["_automation"]["inference"]["status"],
                "provenance_status": municipal_profile["provenance_status"],
                "official_documents_auto_sent": False,
                "automatic_stage_transition": False,
            },
        )
    )
    _tenants_mem[tenant_id] = tenant
    return _serialize_mem(tenant)


def _mem_get_tenant(tenant_id: str) -> dict[str, Any]:
    tenant = _tenants_mem.get(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    return tenant


def _mem_update_tenant(tenant_id: str, data: TenantUpdateRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    patch = data.model_dump(exclude_unset=True)
    active_capabilities = patch.pop("active_capabilities", None)
    for key, value in patch.items():
        tenant[key] = value
    if active_capabilities is not None:
        tenant["capabilities"] = [
            {"module_id": module_id, "active": True, "source": "manual_admin"}
            for module_id in active_capabilities
        ]
    tenant["updated_at"] = _now_iso()
    tenant["audit_log"].append(_audit("tenant_updated", actor, {"fields": sorted(data.model_dump(exclude_unset=True).keys())}))
    return _serialize_mem(tenant)


def _mem_upsert_municipal_profile(tenant_id: str, data: TenantMunicipalProfileRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    payload = data.model_dump()
    payload = apply_runtime_automation(
        existing_profile=tenant.get("municipal_profile"),
        updated_payload=payload,
        registry=_load_capability_registry(),
        gates=tenant.get("gates"),
    )
    mode = _profile_mode(payload)
    profile = {
        **payload,
        "mode": mode,
        "updated_by": actor,
        "updated_at": _now_iso(),
    }
    tenant["municipal_profile"] = profile
    tenant["audit_log"].append(
        _audit(
            "tenant_municipal_profile_updated",
            actor,
            {
                "mode": mode,
                "actors_count": len((payload.get("mapa_social") or {}).get("actores") or []),
                "recalculated_modules": ((payload.get("antecedentes") or {}).get("_automation") or {}).get("runtime", {}).get("recalculated_modules", []),
                "discrepancies": ((payload.get("antecedentes") or {}).get("_automation") or {}).get("runtime", {}).get("discrepancies", []),
                "automatic_stage_transition": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _gate_or_404(tenant: dict[str, Any], gate_id: str) -> dict[str, Any]:
    gate_id = gate_id.upper()
    for gate in tenant["gates"]:
        if gate["gate_id"] == gate_id:
            return gate
    raise HTTPException(status_code=404, detail="Gate no encontrado")


def _gate_outcome_snapshot_payload(tenant: dict[str, Any]) -> dict[str, Any]:
    """Capture a conservative gate snapshot without inventing module values."""
    profile = tenant.get("municipal_profile") or {}
    automation = (profile.get("automation") or (profile.get("antecedentes") or {}).get("_automation") or {})
    runtime = automation.get("runtime") or {}
    recommendations = runtime.get("recommendations") or []
    accepted = [item.get("id") for item in recommendations if item.get("decision") == "aceptar"]
    rejected = [item.get("id") for item in recommendations if item.get("decision") == "rechazar"]
    rejected_reasons = [
        item.get("decision_notes")
        for item in recommendations
        if item.get("decision") == "rechazar" and item.get("decision_notes")
    ]
    return {
        "data_completeness_pct": runtime.get("data_completeness_pct"),
        "validation_pct": runtime.get("validation_pct"),
        "key_metrics": runtime.get("key_metrics") or {},
        "recommendations_accepted": accepted,
        "recommendations_rejected": rejected,
        "rejected_reasons": rejected_reasons,
    }


def _mem_register_evidence(tenant_id: str, gate_id: str, data: GateEvidenceRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    gate = _gate_or_404(tenant, gate_id)
    gate.update(
        evidencia_url=data.evidencia_url,
        evidencia_label=data.evidencia_label,
        decisor_humano=data.decisor_humano,
        notas=data.notas,
        status="en_revision" if gate["status"] == "no_iniciado" else gate["status"],
        updated_at=_now_iso(),
    )
    tenant["audit_log"].append(_audit("gate_evidence_registered", actor, {"gate_id": gate["gate_id"], "evidencia_url": data.evidencia_url}))
    return _serialize_mem(tenant)


def _mem_close_gate(tenant_id: str, gate_id: str, data: GateCloseRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    gate = _gate_or_404(tenant, gate_id)
    evidencia_url = data.evidencia_url or gate.get("evidencia_url")
    evidencia_label = data.evidencia_label or gate.get("evidencia_label")
    if not evidencia_url or not evidencia_label:
        raise HTTPException(status_code=400, detail="No se puede cerrar un gate sin evidencia")
    now = _now_iso()
    previous_status = gate["status"]
    gate.update(
        status="cerrado",
        evidencia_url=evidencia_url,
        evidencia_label=evidencia_label,
        decisor_humano=data.decisor_humano,
        notas=data.notas or gate.get("notas"),
        closed_at=now,
        updated_at=now,
    )
    _mem_register_nous_gate_outcome(
        tenant_id,
        NousGateOutcomeRequest(
            gate=gate["gate_id"],
            outcome="cerrado_exitoso",
            days_to_close=0,
            module_state_at_close=_gate_outcome_snapshot_payload(_serialize_mem(tenant)),
            political_context={},
            payer_configuration=None,
        ),
        actor,
    )
    tenant["audit_log"].append(
        _audit(
            "gate_closed_manual",
            actor,
            {
                "gate_id": gate["gate_id"],
                "status_anterior": previous_status,
                "status_nuevo": "cerrado",
                "evidencia_url": evidencia_url,
                "automatic_stage_transition": False,
                "stage_after_close": tenant["state"]["current_stage"],
            },
        )
    )
    return _serialize_mem(tenant)


def _mem_transition_tenant(tenant_id: str, data: TenantTransitionRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    current_stage = tenant["state"]["current_stage"]
    try:
        decision = validate_manual_transition(
            current_stage=current_stage,
            target_stage=data.target_stage,
            gates=tenant["gates"],
            capabilities=tenant["capabilities"],
            manual_confirmation=data.manual_confirmation,
        )
    except TenantStateError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    now = _now_iso()
    tenant["state"]["current_stage"] = data.target_stage
    tenant["state"]["fecha_cambio_stage"] = now
    tenant["state"]["notas"] = data.notas
    tenant["audit_log"].append(
        _audit(
            "tenant_stage_transition_manual",
            actor,
            {
                "from_stage": decision.from_stage,
                "to_stage": decision.to_stage,
                "required_gate": decision.required_gate,
                "confirmed_by": data.confirmed_by,
                "manual_confirmation": True,
                "automatic_stage_transition": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _mem_list_documents(tenant_id: str) -> list[dict[str, Any]]:
    _mem_get_tenant(tenant_id)
    return deepcopy(_tenant_documents_mem.get(tenant_id, []))


def _mem_get_document(tenant_id: str, document_id: str) -> dict[str, Any]:
    for document in _tenant_documents_mem.get(tenant_id, []):
        if document["id"] == document_id:
            return document
    raise HTTPException(status_code=404, detail="Documento no encontrado")


def _mem_generate_document(tenant_id: str, data: TenantDocumentDraftRequest, actor: str) -> dict[str, Any]:
    tenant = _serialize_mem(_mem_get_tenant(tenant_id))
    document = generate_document_draft(
        tenant=tenant,
        document_type=data.document_type,
        requested_by=actor,
        notes=data.notes,
    )
    _tenant_documents_mem.setdefault(tenant_id, []).append(document)
    _tenants_mem[tenant_id]["audit_log"].append(
        _audit(
            "tenant_document_draft_generated",
            actor,
            {
                "document_id": document["id"],
                "document_type": document["document_type"],
                "status": document["status"],
                "qa_status": document["qa_status"],
                "official_document": False,
            },
        )
    )
    return deepcopy(document)


def _mem_update_document(tenant_id: str, document_id: str, data: TenantDocumentUpdateRequest, actor: str) -> dict[str, Any]:
    documents = _tenant_documents_mem.get(tenant_id, [])
    for index, document in enumerate(documents):
        if document["id"] == document_id:
            try:
                updated = update_document_draft(
                    document=document,
                    actor=actor,
                    content_md=data.content_md,
                    status=data.status,
                    review_notes=data.review_notes,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            documents[index] = updated
            _tenants_mem[tenant_id]["audit_log"].append(
                _audit(
                    "tenant_document_draft_reviewed",
                    actor,
                    {
                        "document_id": document_id,
                        "status": updated["status"],
                        "qa_status": updated["qa_status"],
                        "official_document": False,
                    },
                )
            )
            return deepcopy(updated)
    raise HTTPException(status_code=404, detail="Documento no encontrado")


def _mem_apply_runtime_event(tenant_id: str, data: TenantRuntimeEventRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    profile = tenant.get("municipal_profile") or _empty_profile()
    updated = apply_runtime_event(
        existing_profile=profile,
        updated_payload=profile,
        registry=_load_capability_registry(),
        gates=tenant.get("gates"),
        event_type=data.event_type,
        event_payload=data.payload,
    )
    tenant["municipal_profile"] = {**profile, **updated, "updated_by": actor, "updated_at": _now_iso()}
    tenant["audit_log"].append(
        _audit(
            "runtime_event_processed",
            actor,
            {
                "event_type": data.event_type,
                "automatic_gate_change": False,
                "automatic_stage_transition": False,
                "external_dispatch": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _mem_decide_recommendation(tenant_id: str, recommendation_id: str, data: RecommendationDecisionRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    try:
        profile = decide_recommendation(
            tenant.get("municipal_profile") or _empty_profile(),
            recommendation_id,
            data.action,
            actor,
            data.notes,
            data.adjusted_recommendation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    tenant["municipal_profile"] = {**profile, "updated_by": actor, "updated_at": _now_iso()}
    tenant["audit_log"].append(
        _audit(
            "runtime_recommendation_decided",
            actor,
            {"recommendation_id": recommendation_id, "action": data.action, "automatic_gate_change": False},
        )
    )
    return _serialize_mem(tenant)


def _mem_decide_discrepancy(tenant_id: str, discrepancy_id: str, data: DiscrepancyDecisionRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    try:
        profile = decide_discrepancy(
            tenant.get("municipal_profile") or _empty_profile(),
            discrepancy_id,
            data.action,
            actor,
            data.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    tenant["municipal_profile"] = {**profile, "updated_by": actor, "updated_at": _now_iso()}
    tenant["audit_log"].append(
        _audit(
            "runtime_discrepancy_decided",
            actor,
            {"discrepancy_id": discrepancy_id, "action": data.action, "automatic_gate_change": False},
        )
    )
    return _serialize_mem(tenant)


def _mem_cross_tenant_analytics(data: CrossTenantAnalyticsRequest, actor: str) -> dict[str, Any]:
    try:
        result = aggregate_cross_tenant_pattern(
            tenants=[_serialize_mem(tenant) for tenant in _tenants_mem.values()],
            metric=data.metric,
            requested_by=actor,
            minimum_n=data.minimum_n,
        )
    except PrivacyPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _analytics_audit_mem.append(result["audit"])
    return result


def _mem_share_cross_tenant_insight(data: ShareInsightRequest, actor: str) -> dict[str, Any]:
    try:
        shared = approve_internal_insight(
            data.pattern,
            data.approved_by or actor,
            [_serialize_mem(tenant) for tenant in _tenants_mem.values()],
        )
    except PrivacyPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    audit = {
        "id": str(uuid.uuid4()),
        "action": "anonymous_insight_approved_for_sharing",
        "pattern_id": shared.get("pattern_id"),
        "shared_as_insight": True,
        "approved_by": data.approved_by or actor,
        "actor": actor,
        "notes": data.notes,
        "created_at": _now_iso(),
    }
    _analytics_audit_mem.append(audit)
    return {"status": "approved_for_anonymous_sharing", "insight": shared, "audit": audit}


def _mem_set_analytics_consent(tenant_id: str, data: TenantAnalyticsConsentRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    enabled = data.aggregated_anonymous_analytics is True
    now = _now_iso() if enabled else None
    tenant["analytics_aggregate_opt_in"] = enabled
    tenant["analytics_aggregate_opt_in_at"] = now
    tenant["analytics_aggregate_opt_in_by"] = data.consented_by or actor if enabled else None
    tenant["analytics_aggregate_opt_in_source"] = data.consent_source if enabled else None
    profile = tenant.setdefault("municipal_profile", _empty_profile())
    antecedentes = profile.setdefault("antecedentes", {})
    automation = antecedentes.setdefault("_automation", {})
    automation["analytics_consent"] = {
        "aggregated_anonymous_analytics": enabled,
        "source": data.consent_source,
        "validated_by": data.consented_by or actor if enabled else None,
        "updated_at": _now_iso(),
    }
    tenant["audit_log"].append(
        _audit(
            "tenant_analytics_consent_updated",
            actor,
            {
                "aggregated_anonymous_analytics": enabled,
                "consent_source": data.consent_source,
                "observational_only": True,
                "automatic_publication": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _mem_register_nous_inference_correction(tenant_id: str, data: NousInferenceCorrectionRequest, actor: str) -> dict[str, Any]:
    tenant = _serialize_mem(_mem_get_tenant(tenant_id))
    correction = record_inference_correction(
        tenant=tenant,
        module_id=data.module_id,
        field_id=data.field_id,
        inferred_value=data.inferred_value,
        validation_action=data.validation_action,
        corrected_value=data.corrected_value,
        corrected_by_role=data.corrected_by_role,
        actor=actor,
    )
    _nous_mem["inference_corrections"].append(correction)
    emerging_patterns = detect_layer1_emerging_patterns(
        _nous_mem["inference_corrections"],
        _nous_mem["nous_patterns"],
        actor=actor,
    )
    _nous_mem["nous_patterns"].extend(emerging_patterns)
    _tenants_mem[tenant_id]["audit_log"].append(
        _audit(
            "nous_inference_correction_registered",
            actor,
            {
                "observation_id": correction["id"],
                "module_id": data.module_id,
                "field_id": data.field_id,
                "included_in_aggregate": correction["included_in_aggregate"],
                "aggregate_exclusion_reason": correction["aggregate_exclusion_reason"],
                "layer1_patterns_detected": [pattern["id"] for pattern in emerging_patterns],
                "observational_only": True,
            },
        )
    )
    if emerging_patterns:
        correction["emerging_patterns"] = emerging_patterns
    return correction


def _mem_register_nous_gate_outcome(tenant_id: str, data: NousGateOutcomeRequest, actor: str) -> dict[str, Any]:
    tenant = _serialize_mem(_mem_get_tenant(tenant_id))
    outcome = record_gate_outcome(
        tenant=tenant,
        gate=data.gate,
        outcome=data.outcome,
        days_to_close=data.days_to_close,
        module_state_at_close=data.module_state_at_close,
        political_context=data.political_context,
        payer_configuration=data.payer_configuration,
        actor=actor,
    )
    _nous_mem["gate_outcomes"].append(outcome)
    emerging_patterns = detect_layer2_gate_outcome_patterns(
        _nous_mem["gate_outcomes"],
        _nous_mem["nous_patterns"],
        actor=actor,
    )
    _nous_mem["nous_patterns"].extend(emerging_patterns)
    _tenants_mem[tenant_id]["audit_log"].append(
        _audit(
            "nous_gate_outcome_registered",
            actor,
            {
                "observation_id": outcome["id"],
                "gate": data.gate,
                "included_in_aggregate": outcome["included_in_aggregate"],
                "aggregate_exclusion_reason": outcome["aggregate_exclusion_reason"],
                "layer2_patterns_detected": [pattern["id"] for pattern in emerging_patterns],
                "observational_only": True,
            },
        )
    )
    if emerging_patterns:
        outcome["emerging_patterns"] = emerging_patterns
    return outcome


def _mem_register_nous_projection_delta(tenant_id: str, data: NousProjectionDeltaRequest, actor: str) -> dict[str, Any]:
    tenant = _serialize_mem(_mem_get_tenant(tenant_id))
    delta = record_projection_delta(
        tenant=tenant,
        module_id=data.module_id,
        metric_id=data.metric_id,
        projected_value=data.projected_value,
        actual_value=data.actual_value,
        measurement_period=data.measurement_period,
        measurement_quality=data.measurement_quality,
        actor=actor,
    )
    _nous_mem["projection_deltas"].append(delta)
    emerging_patterns = detect_layer3_projection_delta_patterns(
        _nous_mem["projection_deltas"],
        _nous_mem["nous_patterns"],
        actor=actor,
        standards_map=_load_standards_map(),
    )
    _nous_mem["nous_patterns"].extend(emerging_patterns)
    _tenants_mem[tenant_id]["audit_log"].append(
        _audit(
            "nous_projection_delta_registered",
            actor,
            {
                "observation_id": delta["id"],
                "module_id": data.module_id,
                "metric_id": data.metric_id,
                "included_in_aggregate": delta["included_in_aggregate"],
                "aggregate_exclusion_reason": delta["aggregate_exclusion_reason"],
                "layer3_patterns_detected": [pattern["id"] for pattern in emerging_patterns],
                "observational_only": True,
            },
        )
    )
    if emerging_patterns:
        delta["emerging_patterns"] = emerging_patterns
    return delta


def _mem_create_nous_pending_pattern(data: NousPendingPatternRequest, actor: str) -> dict[str, Any]:
    pattern = create_pending_pattern(
        pattern_layer=data.pattern_layer,
        pattern_description_natural=data.pattern_description_natural,
        pattern_description_technical=data.pattern_description_technical,
        observations_count=data.observations_count,
        contributing_tenant_profiles=data.contributing_tenant_profiles,
        actor=actor,
    )
    if data.confidence_level:
        pattern["confidence_level"] = data.confidence_level
    _nous_mem["nous_patterns"].append(pattern)
    return pattern


def _pattern_target_modules(pattern: dict[str, Any]) -> list[str]:
    technical = pattern.get("pattern_description_technical") or {}
    explicit = technical.get("target_modules") or technical.get("client_target_modules")
    if isinstance(explicit, list):
        return [str(item) for item in explicit if str(item) in NOUS_CLIENT_MODULES]
    module_id = str(technical.get("module_id") or "")
    return [module_id] if module_id in NOUS_CLIENT_MODULES else []


def _confidence_is_client_publishable(confidence: str | None) -> bool:
    value = str(confidence or "").lower()
    if not value:
        return False
    return not any(marker in value for marker in NOUS_EMERGING_MARKERS)


def _has_sufficient_publication_n(pattern: dict[str, Any]) -> bool:
    try:
        layer = int(pattern.get("pattern_layer") or 0)
        observations = int(pattern.get("observations_count") or 0)
    except (TypeError, ValueError):
        return False
    return observations >= NOUS_MIN_PUBLICATION_OBSERVATIONS.get(layer, 999999)


def _eidos_publication_blockers(pattern: dict[str, Any]) -> list[str]:
    technical = pattern.get("pattern_description_technical") or {}
    texts = [
        str(pattern.get("pattern_description_natural") or ""),
        str(technical.get("client_conclusion") or ""),
        str(technical.get("client_action_suggested") or ""),
        str(technical.get("client_limitation") or ""),
    ]
    normalized = "\n".join(texts).lower()
    return ["eidos_authoritative_language"] if any(phrase in normalized for phrase in EIDOS_FORBIDDEN_PUBLICATION_PHRASES) else []


def _nous_is_paused() -> bool:
    for event in reversed(_nous_mem.get("governance_events", [])):
        if event.get("scope") == "global" and event.get("action") == "pause_by_founder":
            return True
        if event.get("scope") == "global" and event.get("action") == "resume_by_founder":
            return False
    return False


def _marcos_status(pattern: dict[str, Any]) -> str:
    technical = pattern.get("pattern_description_technical") or {}
    check = technical.get("marcos_standards_check")
    if isinstance(check, dict):
        return str(check.get("status") or "requires_human_review")
    return "requires_human_review"


def _publication_blockers(pattern: dict[str, Any], tenant: dict[str, Any] | None = None) -> list[str]:
    blockers: list[str] = []
    if _nous_is_paused():
        blockers.append("nous_paused_by_founder")
    if pattern.get("pattern_status") != "approved_internal":
        blockers.append("pattern_not_approved_internal")
    if pattern.get("founder_gate_status") != "approved":
        blockers.append("founder_gate_not_approved")
    if pattern.get("bias_check_status") != "passed":
        blockers.append("bias_check_not_passed")
    if _marcos_status(pattern) != "approved":
        blockers.append("marcos_check_not_approved")
    if not _confidence_is_client_publishable(pattern.get("confidence_level")):
        blockers.append("confidence_not_client_publishable")
    if not _has_sufficient_publication_n(pattern):
        blockers.append("insufficient_publication_n")
    blockers.extend(_eidos_publication_blockers(pattern))
    technical = pattern.get("pattern_description_technical") or {}
    if technical.get("aggregate_opt_in_verified") is not True:
        blockers.append("aggregate_opt_in_not_verified")
    if not _pattern_target_modules(pattern):
        blockers.append("no_client_target_module")
    if tenant is not None and tenant.get("analytics_aggregate_opt_in") is not True:
        blockers.append("tenant_without_aggregate_opt_in")
    return blockers


def _suggestion_from_pattern(pattern: dict[str, Any], module_id: str) -> dict[str, Any]:
    technical = pattern.get("pattern_description_technical") or {}
    comparable = technical.get("municipality_profile_comparable") or {}
    limitation = technical.get("client_limitation") or "Patron agregado anonimo; no sustituye validacion tecnica ni decision humana."
    conclusion = technical.get("client_conclusion") or pattern.get("pattern_description_natural")
    action = technical.get("client_action_suggested") or "Considera revisar este supuesto antes de fijar cifras o documentos."
    return {
        "suggestion_id": f"nous-{pattern['id']}-{module_id}",
        "pattern_id": pattern["id"],
        "module_id": module_id,
        "conclusion": conclusion,
        "evidence_summary": pattern.get("statistical_significance") or "Evidencia agregada anonima disponible en A11.",
        "observations_count": pattern.get("observations_count"),
        "confidence": pattern.get("confidence_level"),
        "comparable_profile": comparable,
        "limitation": limitation,
        "action_suggested": action,
        "source_traceability": {
            "pattern_id": pattern["id"],
            "pattern_layer": pattern.get("pattern_layer"),
            "standards": ((technical.get("marcos_standards_check") or {}).get("standards_codes") or []),
            "tenant_origin_identifiers_exposed": False,
        },
        "wording_guardrail": "NOUS sugiere; humano decide.",
    }


def _published_suggestions_for_tenant(tenant: dict[str, Any], module_id: str | None = None) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []
    if tenant.get("analytics_aggregate_opt_in") is not True:
        return suggestions
    active_modules = {cap["module_id"] for cap in tenant.get("capabilities", []) if cap.get("active")}
    for pattern in _nous_mem["nous_patterns"]:
        if not pattern.get("published_to_clients"):
            continue
        if _publication_blockers(pattern, tenant):
            continue
        for target in _pattern_target_modules(pattern):
            if target not in active_modules:
                continue
            if module_id and target != module_id:
                continue
            suggestions.append(_suggestion_from_pattern(pattern, target))
    return suggestions


def _tenant_profile_with_nous_suggestions(tenant: dict[str, Any], suggestions: list[dict[str, Any]]) -> dict[str, Any]:
    profile = deepcopy(tenant.get("municipal_profile") or _empty_profile())
    automation = deepcopy(profile.get("automation") or automation_summary(profile))
    automation["nous_suggestions"] = suggestions
    automation["nous_publication_notice"] = "Sugerencias aprobadas por gate humano; NOUS no decide ni recalibra automaticamente."
    profile["automation"] = automation
    return profile


def _mem_list_nous_pattern_queue() -> dict[str, Any]:
    return {
        "observational_only": True,
        "client_publication": False,
        "automatic_prior_recalibration": False,
        "patterns": _nous_mem["nous_patterns"],
    }


def _a11_summary(patterns: list[dict[str, Any]]) -> dict[str, Any]:
    pending = [pattern for pattern in patterns if pattern.get("pattern_status") in {"draft_observed", "pending_auditor_review", "pending_founder_gate"}]
    approved = [pattern for pattern in patterns if pattern.get("pattern_status") == "approved_internal"]
    published = [pattern for pattern in patterns if pattern.get("published_to_clients") is True]
    retired_or_rejected = [pattern for pattern in patterns if pattern.get("pattern_status") in {"retired", "rejected"}]
    bias_pending = [pattern for pattern in patterns if pattern.get("bias_check_status") != "passed"]
    return {
        "panel_id": "A11",
        "title": "NOUS Insights Panel",
        "feature_gated": True,
        "client_publication_enabled": True,
        "automatic_recalibration_enabled": False,
        "tabs": {
            "A11.1": {"label": "Patrones pendientes de revision", "patterns": pending},
            "A11.2": {"label": "Patrones publicados o aprobados internos", "patterns": approved, "published_to_clients": published},
            "A11.3": {"label": "Auditoria de sesgo", "patterns": bias_pending, "retired_or_rejected": retired_or_rejected},
            "A11.4": {
                "label": "Performance de NOUS",
                "metrics": {
                    "patterns_total": len(patterns),
                    "approved_internal": len(approved),
                    "published_to_clients": len(published),
                    "automatic_recalibrations": 0,
                },
            },
            "A11.5": {
                "label": "Self-report trimestral",
                "report_status": "stub_funcional_feature_gated",
                "summary": "NOUS publica solo sugerencias aprobadas; no aplica recalibraciones ni decide por el cliente.",
            },
        },
    }


def _mem_get_nous_a11_panel() -> dict[str, Any]:
    return _a11_summary(_nous_mem["nous_patterns"])


def _mem_review_nous_pattern(pattern_id: str, data: NousPatternReviewRequest, actor: str) -> dict[str, Any]:
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern["id"] == pattern_id:
            updated = review_internal_pattern(pattern, action=data.action, actor=actor, notes=data.notes)
            _nous_mem["nous_patterns"][index] = updated
            return updated
    raise HTTPException(status_code=404, detail="nous_pattern_not_found")


def _mem_update_nous_publication_gates(pattern_id: str, data: NousPatternPublicationGatesRequest, actor: str) -> dict[str, Any]:
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern["id"] != pattern_id:
            continue
        updated = deepcopy(pattern)
        if data.bias_check_status is not None:
            updated["bias_check_status"] = data.bias_check_status
        if data.founder_gate_status is not None:
            updated["founder_gate_status"] = data.founder_gate_status
        if data.confidence_level is not None:
            updated["confidence_level"] = data.confidence_level
        technical = deepcopy(updated.get("pattern_description_technical") or {})
        if data.marcos_standards_check_status is not None:
            check = deepcopy(technical.get("marcos_standards_check") or {})
            check["status"] = data.marcos_standards_check_status
            check["human_review_required"] = True
            check["automatic_publication"] = False
            technical["marcos_standards_check"] = check
        if data.aggregate_opt_in_verified is not None:
            technical["aggregate_opt_in_verified"] = data.aggregate_opt_in_verified
        updated["pattern_description_technical"] = technical
        audit = deepcopy(updated.get("audit") or {})
        history = list(audit.get("publication_gate_history") or [])
        history.append({"actor": actor, "updated_at": _now_iso(), "notes": data.notes, "automatic_publication": False})
        audit["publication_gate_history"] = history
        updated["audit"] = audit
        _nous_mem["nous_patterns"][index] = updated
        return updated
    raise HTTPException(status_code=404, detail="nous_pattern_not_found")


def _mem_publish_nous_pattern(pattern_id: str, data: NousPatternPublishRequest, actor: str) -> dict[str, Any]:
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern["id"] != pattern_id:
            continue
        technical = deepcopy(pattern.get("pattern_description_technical") or {})
        targets = [module for module in data.target_modules if module in NOUS_CLIENT_MODULES]
        technical["target_modules"] = targets
        if data.conclusion:
            technical["client_conclusion"] = data.conclusion
        if data.action_suggested:
            technical["client_action_suggested"] = data.action_suggested
        if data.limitation:
            technical["client_limitation"] = data.limitation
        candidate = {**pattern, "pattern_description_technical": technical}
        blockers = _publication_blockers(candidate)
        if blockers:
            raise HTTPException(status_code=400, detail={"code": "nous_publication_blocked", "blockers": blockers})
        updated = deepcopy(candidate)
        updated["published_to_clients"] = True
        audit = deepcopy(updated.get("audit") or {})
        history = list(audit.get("publication_history") or [])
        history.append(
            {
                "action": "publish_to_clients",
                "actor": actor,
                "approved_by": data.approved_by,
                "target_modules": targets,
                "published_at": _now_iso(),
                "automatic_publication": False,
            }
        )
        audit["publication_history"] = history
        audit["client_publication_gate"] = "human_approved"
        updated["audit"] = audit
        _nous_mem["nous_patterns"][index] = updated
        return updated
    raise HTTPException(status_code=404, detail="nous_pattern_not_found")


def _mem_withdraw_nous_pattern(pattern_id: str, actor: str, notes: str | None = None) -> dict[str, Any]:
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern["id"] != pattern_id:
            continue
        updated = deepcopy(pattern)
        updated["published_to_clients"] = False
        updated["pattern_status"] = "retired"
        updated["retired_at"] = _now_iso()
        updated["retired_reason"] = notes or "withdrawn_from_a11"
        audit = deepcopy(updated.get("audit") or {})
        history = list(audit.get("publication_history") or [])
        history.append({"action": "withdraw_from_clients", "actor": actor, "withdrawn_at": _now_iso(), "notes": notes})
        audit["publication_history"] = history
        updated["audit"] = audit
        _nous_mem["nous_patterns"][index] = updated
        return updated
    raise HTTPException(status_code=404, detail="nous_pattern_not_found")


def _mem_record_nous_suggestion_feedback(tenant_id: str, suggestion_id: str, data: NousSuggestionFeedbackRequest, actor: str) -> dict[str, Any]:
    tenant = _serialize_mem(_mem_get_tenant(tenant_id))
    suggestions = _published_suggestions_for_tenant(tenant)
    suggestion = next((item for item in suggestions if item["suggestion_id"] == suggestion_id), None)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="nous_suggestion_not_available_for_tenant")
    if data.action == "reject" and not data.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason_required")
    if data.action == "adjust" and not data.adjustment_note:
        raise HTTPException(status_code=400, detail="adjustment_note_required")
    feedback = {
        "id": str(uuid.uuid4()),
        "suggestion_id": suggestion_id,
        "pattern_id": suggestion["pattern_id"],
        "tenant_id": tenant_id,
        "module_id": suggestion["module_id"],
        "action": data.action,
        "rejection_reason": data.rejection_reason,
        "adjustment_note": data.adjustment_note,
        "role": data.role,
        "timestamp": _now_iso(),
        "recorded_by": actor,
        "observation_only": True,
        "automatic_decision": False,
    }
    _nous_mem["suggestion_feedback"].append(feedback)
    _tenants_mem[tenant_id]["audit_log"].append(_audit("nous_suggestion_feedback_registered", actor, feedback))
    return feedback


def _feedback_summary(feedback: list[dict[str, Any]]) -> dict[str, Any]:
    accepted = [item for item in feedback if item.get("action") == "accept"]
    rejected = [item for item in feedback if item.get("action") == "reject"]
    adjusted = [item for item in feedback if item.get("action") == "adjust"]
    rejection_reasons: dict[str, int] = {}
    for item in rejected:
        reason = str(item.get("rejection_reason") or "motivo_pendiente")
        rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1
    return {
        "suggestions_accepted": len(accepted),
        "suggestions_adjusted": len(adjusted),
        "suggestions_rejected": len(rejected),
        "main_rejection_reasons": rejection_reasons,
    }


def _build_nous_self_report(patterns: list[dict[str, Any]], feedback: list[dict[str, Any]], actor: str) -> dict[str, Any]:
    feedback_stats = _feedback_summary(feedback)
    retired = [pattern for pattern in patterns if str(pattern.get("pattern_status", "")).startswith("retired")]
    bias_risks = [
        {"pattern_id": pattern.get("id"), "status": pattern.get("bias_check_status")}
        for pattern in patterns
        if pattern.get("bias_check_status") == "failed"
    ]
    rejected_total = feedback_stats["suggestions_rejected"]
    accepted_total = feedback_stats["suggestions_accepted"]
    supreme_recommendation = "continuar_operacion_controlada"
    if bias_risks:
        supreme_recommendation = "pausar_y_revisar_sesgo"
    elif rejected_total > accepted_total and rejected_total >= 3:
        supreme_recommendation = "ajustar_o_retirar_patrones_con_baja_aceptacion"
    report = {
        "id": str(uuid.uuid4()),
        "period": "quarterly",
        "generated_at": _now_iso(),
        "generated_by": actor,
        "patterns_detected": len(patterns),
        "patterns_approved": len([pattern for pattern in patterns if pattern.get("pattern_status") in {"approved_internal", "active"}]),
        "patterns_rejected": len([pattern for pattern in patterns if pattern.get("pattern_status") == "rejected"]),
        "patterns_retired": len(retired),
        "retirement_reasons": [pattern.get("retired_reason") for pattern in retired if pattern.get("retired_reason")],
        **feedback_stats,
        "post_outcome_correlation": {
            "status": "insufficient_followup_outcomes",
            "message": "Se reporta sin maquillar performance; requiere outcomes posteriores para correlacion robusta.",
        },
        "bias_risks_detected": bias_risks,
        "supreme_recommendation": supreme_recommendation,
        "kosmos_policy_validation": {
            "capability_registry_auto_update": False,
            "schema_review_required_before_registry_change": True,
        },
        "bios_archive": {
            "audit_log_retained": True,
            "silent_deletion_allowed": False,
        },
        "automatic_recalibration": False,
        "automatic_publication": False,
        "black_box_model": False,
    }
    return report


def _mem_generate_nous_self_report(actor: str) -> dict[str, Any]:
    report = _build_nous_self_report(_nous_mem["nous_patterns"], _nous_mem["suggestion_feedback"], actor)
    _nous_mem["self_reports"].append(report)
    _nous_mem["governance_events"].append(
        {
            "id": str(uuid.uuid4()),
            "scope": "global",
            "action": "quarterly_self_report_generated",
            "actor": actor,
            "reason": "scheduled_or_manual_governance_review",
            "created_at": _now_iso(),
            "report_id": report["id"],
        }
    )
    return report


def _mem_apply_nous_governance_action(pattern_id: str, data: NousGovernanceActionRequest, actor: str) -> dict[str, Any]:
    state_map = {
        "activate": "active",
        "mark_under_review": "under_review",
        "retire_bias": "retired_bias",
        "retire_low_performance": "retired_low_performance",
        "retire_stale": "retired_stale",
        "pause_by_founder": "paused_by_founder",
        "supersede": "superseded",
    }
    new_state = state_map[data.action]
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern["id"] != pattern_id:
            continue
        updated = deepcopy(pattern)
        updated["pattern_status"] = new_state
        if new_state != "active":
            updated["published_to_clients"] = False
        if new_state.startswith("retired") or new_state in {"paused_by_founder", "superseded"}:
            updated["retired_at"] = _now_iso()
            updated["retired_reason"] = data.reason
        audit = deepcopy(updated.get("audit") or {})
        events = list(audit.get("governance_history") or [])
        event = {
            "id": str(uuid.uuid4()),
            "scope": "pattern",
            "pattern_id": pattern_id,
            "action": data.action,
            "state": new_state,
            "reason": data.reason,
            "decided_by": data.decided_by,
            "actor": actor,
            "created_at": _now_iso(),
            "automatic_decision": False,
        }
        events.append(event)
        audit["governance_history"] = events
        updated["audit"] = audit
        _nous_mem["governance_events"].append(event)
        _nous_mem["nous_patterns"][index] = updated
        return updated
    raise HTTPException(status_code=404, detail="nous_pattern_not_found")


def _mem_pause_nous(data: NousPauseRequest, actor: str) -> dict[str, Any]:
    event = {
        "id": str(uuid.uuid4()),
        "scope": "global",
        "action": "pause_by_founder",
        "reason": data.reason,
        "decided_by": data.decided_by,
        "actor": actor,
        "created_at": _now_iso(),
        "automatic_decision": False,
    }
    _nous_mem["governance_events"].append(event)
    for index, pattern in enumerate(_nous_mem["nous_patterns"]):
        if pattern.get("published_to_clients"):
            _nous_mem["nous_patterns"][index] = {
                **pattern,
                "published_to_clients": False,
                "pattern_status": "paused_by_founder",
                "retired_reason": data.reason,
            }
    return {"status": "paused_by_founder", "event": event}


def _mem_run_quarterly_nous_audit(actor: str) -> dict[str, Any]:
    actions: list[dict[str, Any]] = []
    for pattern in list(_nous_mem["nous_patterns"]):
        if pattern.get("bias_check_status") == "failed":
            actions.append(
                _mem_apply_nous_governance_action(
                    pattern["id"],
                    NousGovernanceActionRequest(action="retire_bias", reason="bias_check_failed_quarterly_audit", decided_by="AUDITOR"),
                    actor,
                )
            )
        elif pattern.get("published_to_clients") and not _has_sufficient_publication_n(pattern):
            actions.append(
                _mem_apply_nous_governance_action(
                    pattern["id"],
                    NousGovernanceActionRequest(action="mark_under_review", reason="insufficient_n_after_quarterly_review", decided_by="AUDITOR"),
                    actor,
                )
            )
    report = _mem_generate_nous_self_report(actor)
    return {
        "workflow": ["AUDITOR", "MARCOS", "KOSMOS", "SUPREME", "founder"],
        "actions": actions,
        "self_report": report,
        "automatic_decision": False,
    }


def _mem_list_tenant_nous_observations(tenant_id: str) -> dict[str, Any]:
    _mem_get_tenant(tenant_id)
    return {
        "tenant_id": tenant_id,
        "observational_only": True,
        "published_patterns": [pattern for pattern in _nous_mem["nous_patterns"] if pattern.get("published_to_clients")],
        "client_visible_patterns": _published_suggestions_for_tenant(_serialize_mem(_mem_get_tenant(tenant_id))),
        "automatic_prior_recalibration": False,
        "inference_corrections": [item for item in _nous_mem["inference_corrections"] if item["tenant_id"] == tenant_id],
        "gate_outcomes": [item for item in _nous_mem["gate_outcomes"] if item["tenant_id"] == tenant_id],
        "projection_deltas": [item for item in _nous_mem["projection_deltas"] if item["tenant_id"] == tenant_id],
        "suggestion_feedback": [item for item in _nous_mem["suggestion_feedback"] if item["tenant_id"] == tenant_id],
    }


def _db_share_cross_tenant_insight(db, data: ShareInsightRequest, actor: str) -> dict[str, Any]:
    try:
        shared = approve_internal_insight(
            data.pattern,
            data.approved_by or actor,
            _db_all_tenants(db),
        )
    except PrivacyPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    audit = {
        "id": str(uuid.uuid4()),
        "action": "anonymous_insight_approved_for_sharing",
        "pattern_id": shared.get("pattern_id"),
        "shared_as_insight": True,
        "approved_by": data.approved_by or actor,
        "actor": actor,
        "notes": data.notes,
        "created_at": _now_iso(),
    }
    _analytics_audit_mem.append(audit)
    return {"status": "approved_for_anonymous_sharing", "insight": shared, "audit": audit}


def _db_set_analytics_consent(db, tenant_id: str, data: TenantAnalyticsConsentRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    enabled = data.aggregated_anonymous_analytics is True
    now = datetime.now(timezone.utc) if enabled else None
    tenant.analytics_aggregate_opt_in = enabled
    tenant.analytics_aggregate_opt_in_at = now
    tenant.analytics_aggregate_opt_in_by = (data.consented_by or actor) if enabled else None
    tenant.analytics_aggregate_opt_in_source = data.consent_source if enabled else None
    if tenant.municipal_profile:
        antecedentes = deepcopy(tenant.municipal_profile.antecedentes or {})
        automation = antecedentes.setdefault("_automation", {})
        automation["analytics_consent"] = {
            "aggregated_anonymous_analytics": enabled,
            "source": data.consent_source,
            "validated_by": (data.consented_by or actor) if enabled else None,
            "updated_at": _now_iso(),
        }
        tenant.municipal_profile.antecedentes = antecedentes
    db.add(
        TenantAuditLog(
            tenant_id=tenant_id,
            actor=actor,
            action="tenant_analytics_consent_updated",
            payload={
                "aggregated_anonymous_analytics": enabled,
                "consent_source": data.consent_source,
                "observational_only": True,
                "automatic_publication": False,
            },
        )
    )
    db.commit()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


def _db_register_nous_inference_correction(db, tenant_id: str, data: NousInferenceCorrectionRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousInferenceCorrection, NousPattern, TenantAuditLog

    tenant_dict = _tenant_to_dict(_db_get_tenant(db, tenant_id))
    correction = record_inference_correction(
        tenant=tenant_dict,
        module_id=data.module_id,
        field_id=data.field_id,
        inferred_value=data.inferred_value,
        validation_action=data.validation_action,
        corrected_value=data.corrected_value,
        corrected_by_role=data.corrected_by_role,
        actor=actor,
    )
    db.add(
        NousInferenceCorrection(
            id=correction["id"],
            tenant_id=tenant_id,
            module_id=correction["module_id"],
            field_id=correction["field_id"],
            inferred_value=correction["inferred_value"],
            validation_action=correction["validation_action"],
            corrected_value=correction["corrected_value"],
            delta_percentage=str(correction["delta_percentage"]) if correction["delta_percentage"] is not None else None,
            corrected_by_role=correction["corrected_by_role"],
            corrected_at=datetime.fromisoformat(correction["corrected_at"]),
            source_used_for_inference=correction["source_used_for_inference"],
            municipality_profile=correction["municipality_profile"],
            included_in_aggregate=correction["included_in_aggregate"],
            aggregate_exclusion_reason=correction["aggregate_exclusion_reason"],
            audit=correction["audit"],
        )
    )
    existing_corrections = [_nous_correction_model_to_dict(item) for item in db.query(NousInferenceCorrection).all()]
    existing_corrections.append(correction)
    existing_patterns = [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()]
    emerging_patterns = detect_layer1_emerging_patterns(existing_corrections, existing_patterns, actor=actor)
    for pattern in emerging_patterns:
        db.add(_nous_pattern_to_model(pattern))
    audit_payload = deepcopy(correction["audit"])
    audit_payload["layer1_patterns_detected"] = [pattern["id"] for pattern in emerging_patterns]
    db.add(TenantAuditLog(tenant_id=tenant_id, actor=actor, action="nous_inference_correction_registered", payload=audit_payload))
    db.commit()
    if emerging_patterns:
        correction["emerging_patterns"] = emerging_patterns
    return correction


def _db_register_nous_gate_outcome(db, tenant_id: str, data: NousGateOutcomeRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousGateOutcome, NousPattern, TenantAuditLog

    tenant_dict = _tenant_to_dict(_db_get_tenant(db, tenant_id))
    outcome = record_gate_outcome(
        tenant=tenant_dict,
        gate=data.gate,
        outcome=data.outcome,
        days_to_close=data.days_to_close,
        module_state_at_close=data.module_state_at_close,
        political_context=data.political_context,
        payer_configuration=data.payer_configuration,
        actor=actor,
    )
    db.add(
        NousGateOutcome(
            id=outcome["id"],
            tenant_id=tenant_id,
            gate=outcome["gate"],
            outcome=outcome["outcome"],
            closed_at=datetime.fromisoformat(outcome["closed_at"]),
            days_to_close=outcome["days_to_close"],
            module_state_at_close=outcome["module_state_at_close"],
            municipality_profile=outcome["municipality_profile"],
            political_context=outcome["political_context"],
            payer_configuration=outcome["payer_configuration"],
            included_in_aggregate=outcome["included_in_aggregate"],
            aggregate_exclusion_reason=outcome["aggregate_exclusion_reason"],
            audit=outcome["audit"],
        )
    )
    existing_outcomes = [_nous_gate_outcome_model_to_dict(item) for item in db.query(NousGateOutcome).all()]
    existing_outcomes.append(outcome)
    existing_patterns = [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()]
    emerging_patterns = detect_layer2_gate_outcome_patterns(existing_outcomes, existing_patterns, actor=actor)
    for pattern in emerging_patterns:
        db.add(_nous_pattern_to_model(pattern))
    audit_payload = deepcopy(outcome["audit"])
    audit_payload["layer2_patterns_detected"] = [pattern["id"] for pattern in emerging_patterns]
    db.add(TenantAuditLog(tenant_id=tenant_id, actor=actor, action="nous_gate_outcome_registered", payload=audit_payload))
    db.commit()
    if emerging_patterns:
        outcome["emerging_patterns"] = emerging_patterns
    return outcome


def _db_register_nous_projection_delta(db, tenant_id: str, data: NousProjectionDeltaRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern, NousProjectionDelta, TenantAuditLog

    tenant_dict = _tenant_to_dict(_db_get_tenant(db, tenant_id))
    delta = record_projection_delta(
        tenant=tenant_dict,
        module_id=data.module_id,
        metric_id=data.metric_id,
        projected_value=data.projected_value,
        actual_value=data.actual_value,
        measurement_period=data.measurement_period,
        measurement_quality=data.measurement_quality,
        actor=actor,
    )
    db.add(
        NousProjectionDelta(
            id=delta["id"],
            tenant_id=tenant_id,
            module_id=delta["module_id"],
            metric_id=delta["metric_id"],
            projected_value=str(delta["projected_value"]),
            actual_value=str(delta["actual_value"]),
            measurement_period=delta["measurement_period"],
            delta_absolute=str(delta["delta_absolute"]),
            delta_percentage=str(delta["delta_percentage"]),
            delta_direction=delta["delta_direction"],
            measurement_quality=delta["measurement_quality"],
            municipality_profile=delta["municipality_profile"],
            included_in_aggregate=delta["included_in_aggregate"],
            aggregate_exclusion_reason=delta["aggregate_exclusion_reason"],
            audit=delta["audit"],
            created_at=datetime.fromisoformat(delta["audit"]["registered_at"]),
        )
    )
    existing_deltas = [_nous_projection_delta_model_to_dict(item) for item in db.query(NousProjectionDelta).all()]
    existing_deltas.append(delta)
    existing_patterns = [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()]
    emerging_patterns = detect_layer3_projection_delta_patterns(
        existing_deltas,
        existing_patterns,
        actor=actor,
        standards_map=_load_standards_map(),
    )
    for pattern in emerging_patterns:
        db.add(_nous_pattern_to_model(pattern))
    audit_payload = deepcopy(delta["audit"])
    audit_payload["layer3_patterns_detected"] = [pattern["id"] for pattern in emerging_patterns]
    db.add(TenantAuditLog(tenant_id=tenant_id, actor=actor, action="nous_projection_delta_registered", payload=audit_payload))
    db.commit()
    if emerging_patterns:
        delta["emerging_patterns"] = emerging_patterns
    return delta


def _db_create_nous_pending_pattern(db, data: NousPendingPatternRequest, actor: str) -> dict[str, Any]:
    pattern = create_pending_pattern(
        pattern_layer=data.pattern_layer,
        pattern_description_natural=data.pattern_description_natural,
        pattern_description_technical=data.pattern_description_technical,
        observations_count=data.observations_count,
        contributing_tenant_profiles=data.contributing_tenant_profiles,
        actor=actor,
    )
    if data.confidence_level:
        pattern["confidence_level"] = data.confidence_level
    db.add(_nous_pattern_to_model(pattern))
    db.commit()
    return pattern


def _nous_correction_model_to_dict(item) -> dict[str, Any]:
    return {
        "id": item.id,
        "tenant_id": item.tenant_id,
        "module_id": item.module_id,
        "field_id": item.field_id,
        "inferred_value": item.inferred_value,
        "validation_action": item.validation_action,
        "corrected_value": item.corrected_value,
        "delta_percentage": float(item.delta_percentage) if item.delta_percentage is not None else None,
        "corrected_by_role": item.corrected_by_role,
        "corrected_at": item.corrected_at.isoformat() if item.corrected_at else None,
        "source_used_for_inference": item.source_used_for_inference,
        "municipality_profile": item.municipality_profile,
        "included_in_aggregate": item.included_in_aggregate,
        "aggregate_exclusion_reason": item.aggregate_exclusion_reason,
        "audit": item.audit,
    }


def _nous_gate_outcome_model_to_dict(item) -> dict[str, Any]:
    return {
        "id": item.id,
        "tenant_id": item.tenant_id,
        "gate": item.gate,
        "outcome": item.outcome,
        "closed_at": item.closed_at.isoformat() if item.closed_at else None,
        "days_to_close": item.days_to_close,
        "module_state_at_close": item.module_state_at_close,
        "municipality_profile": item.municipality_profile,
        "political_context": item.political_context,
        "payer_configuration": item.payer_configuration,
        "included_in_aggregate": item.included_in_aggregate,
        "aggregate_exclusion_reason": item.aggregate_exclusion_reason,
        "audit": item.audit,
    }


def _nous_projection_delta_model_to_dict(item) -> dict[str, Any]:
    return {
        "id": item.id,
        "tenant_id": item.tenant_id,
        "module_id": item.module_id,
        "metric_id": item.metric_id,
        "projected_value": float(item.projected_value),
        "actual_value": float(item.actual_value),
        "measurement_period": item.measurement_period,
        "delta_absolute": float(item.delta_absolute),
        "delta_percentage": float(item.delta_percentage),
        "delta_direction": item.delta_direction,
        "measurement_quality": item.measurement_quality,
        "municipality_profile": item.municipality_profile,
        "included_in_aggregate": item.included_in_aggregate,
        "aggregate_exclusion_reason": item.aggregate_exclusion_reason,
        "audit": item.audit,
    }


def _nous_pattern_model_to_dict(item) -> dict[str, Any]:
    return {
        "id": item.id,
        "pattern_layer": item.pattern_layer,
        "pattern_status": getattr(item, "pattern_status", "draft_observed"),
        "pattern_description_natural": item.pattern_description_natural,
        "pattern_description_technical": item.pattern_description_technical,
        "observations_count": item.observations_count,
        "confidence_level": item.confidence_level,
        "statistical_significance": item.statistical_significance,
        "contributing_tenant_profiles": item.contributing_tenant_profiles,
        "bias_check_status": item.bias_check_status,
        "founder_gate_status": item.founder_gate_status,
        "published_to_clients": item.published_to_clients,
        "retired_at": item.retired_at.isoformat() if item.retired_at else None,
        "retired_reason": item.retired_reason,
        "audit": item.audit,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def _nous_pattern_to_model(pattern: dict[str, Any]):
    from app.models.admin_tenant import NousPattern

    return NousPattern(
        id=pattern["id"],
        pattern_layer=pattern["pattern_layer"],
        pattern_status=pattern.get("pattern_status", "draft_observed"),
        pattern_description_natural=pattern["pattern_description_natural"],
        pattern_description_technical=pattern["pattern_description_technical"],
        observations_count=pattern["observations_count"],
        confidence_level=pattern["confidence_level"],
        statistical_significance=pattern["statistical_significance"],
        contributing_tenant_profiles=pattern["contributing_tenant_profiles"],
        bias_check_status=pattern["bias_check_status"],
        founder_gate_status=pattern["founder_gate_status"],
        published_to_clients=pattern["published_to_clients"],
        retired_at=datetime.fromisoformat(pattern["retired_at"]) if pattern.get("retired_at") else None,
        retired_reason=pattern["retired_reason"],
        audit=pattern["audit"],
        created_at=datetime.fromisoformat(pattern["created_at"]),
    )


def _db_list_nous_pattern_queue(db) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    return {
        "observational_only": True,
        "client_publication": False,
        "automatic_prior_recalibration": False,
        "patterns": [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()],
    }


def _db_get_nous_a11_panel(db) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    return _a11_summary([_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()])


def _db_review_nous_pattern(db, pattern_id: str, data: NousPatternReviewRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    pattern = db.query(NousPattern).filter(NousPattern.id == pattern_id).first()
    if pattern is None:
        raise HTTPException(status_code=404, detail="nous_pattern_not_found")
    updated = review_internal_pattern(_nous_pattern_model_to_dict(pattern), action=data.action, actor=actor, notes=data.notes)
    pattern.pattern_status = updated["pattern_status"]
    pattern.founder_gate_status = updated["founder_gate_status"]
    pattern.published_to_clients = False
    pattern.retired_at = datetime.fromisoformat(updated["retired_at"]) if updated.get("retired_at") else None
    pattern.retired_reason = updated["retired_reason"]
    pattern.audit = updated["audit"]
    db.commit()
    return updated


def _db_update_nous_publication_gates(db, pattern_id: str, data: NousPatternPublicationGatesRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    pattern = db.query(NousPattern).filter(NousPattern.id == pattern_id).first()
    if pattern is None:
        raise HTTPException(status_code=404, detail="nous_pattern_not_found")
    if data.bias_check_status is not None:
        pattern.bias_check_status = data.bias_check_status
    if data.founder_gate_status is not None:
        pattern.founder_gate_status = data.founder_gate_status
    if data.confidence_level is not None:
        pattern.confidence_level = data.confidence_level
    technical = deepcopy(pattern.pattern_description_technical or {})
    if data.marcos_standards_check_status is not None:
        check = deepcopy(technical.get("marcos_standards_check") or {})
        check["status"] = data.marcos_standards_check_status
        check["human_review_required"] = True
        check["automatic_publication"] = False
        technical["marcos_standards_check"] = check
    if data.aggregate_opt_in_verified is not None:
        technical["aggregate_opt_in_verified"] = data.aggregate_opt_in_verified
    audit = deepcopy(pattern.audit or {})
    history = list(audit.get("publication_gate_history") or [])
    history.append({"actor": actor, "updated_at": _now_iso(), "notes": data.notes, "automatic_publication": False})
    audit["publication_gate_history"] = history
    pattern.pattern_description_technical = technical
    pattern.audit = audit
    db.commit()
    return _nous_pattern_model_to_dict(pattern)


def _db_publish_nous_pattern(db, pattern_id: str, data: NousPatternPublishRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    pattern = db.query(NousPattern).filter(NousPattern.id == pattern_id).first()
    if pattern is None:
        raise HTTPException(status_code=404, detail="nous_pattern_not_found")
    current = _nous_pattern_model_to_dict(pattern)
    technical = deepcopy(current.get("pattern_description_technical") or {})
    targets = [module for module in data.target_modules if module in NOUS_CLIENT_MODULES]
    technical["target_modules"] = targets
    if data.conclusion:
        technical["client_conclusion"] = data.conclusion
    if data.action_suggested:
        technical["client_action_suggested"] = data.action_suggested
    if data.limitation:
        technical["client_limitation"] = data.limitation
    candidate = {**current, "pattern_description_technical": technical}
    blockers = _publication_blockers(candidate)
    if blockers:
        raise HTTPException(status_code=400, detail={"code": "nous_publication_blocked", "blockers": blockers})
    audit = deepcopy(current.get("audit") or {})
    history = list(audit.get("publication_history") or [])
    history.append({"action": "publish_to_clients", "actor": actor, "approved_by": data.approved_by, "target_modules": targets, "published_at": _now_iso(), "automatic_publication": False})
    audit["publication_history"] = history
    audit["client_publication_gate"] = "human_approved"
    pattern.pattern_description_technical = technical
    pattern.published_to_clients = True
    pattern.audit = audit
    db.commit()
    return _nous_pattern_model_to_dict(pattern)


def _db_withdraw_nous_pattern(db, pattern_id: str, actor: str, notes: str | None = None) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    pattern = db.query(NousPattern).filter(NousPattern.id == pattern_id).first()
    if pattern is None:
        raise HTTPException(status_code=404, detail="nous_pattern_not_found")
    audit = deepcopy(pattern.audit or {})
    history = list(audit.get("publication_history") or [])
    history.append({"action": "withdraw_from_clients", "actor": actor, "withdrawn_at": _now_iso(), "notes": notes})
    audit["publication_history"] = history
    pattern.published_to_clients = False
    pattern.pattern_status = "retired"
    pattern.retired_at = datetime.now(timezone.utc)
    pattern.retired_reason = notes or "withdrawn_from_a11"
    pattern.audit = audit
    db.commit()
    return _nous_pattern_model_to_dict(pattern)


def _db_published_suggestions_for_tenant(db, tenant_id: str, module_id: str | None = None) -> list[dict[str, Any]]:
    from app.models.admin_tenant import NousPattern

    tenant = _tenant_to_dict(_db_get_tenant(db, tenant_id))
    if tenant.get("analytics_aggregate_opt_in") is not True:
        return []
    active_modules = {cap["module_id"] for cap in tenant.get("capabilities", []) if cap.get("active")}
    suggestions: list[dict[str, Any]] = []
    patterns = [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).filter(NousPattern.published_to_clients == True).all()]  # noqa: E712
    for pattern in patterns:
        if _publication_blockers(pattern, tenant):
            continue
        for target in _pattern_target_modules(pattern):
            if target not in active_modules:
                continue
            if module_id and target != module_id:
                continue
            suggestions.append(_suggestion_from_pattern(pattern, target))
    return suggestions


def _db_record_nous_suggestion_feedback(db, tenant_id: str, suggestion_id: str, data: NousSuggestionFeedbackRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog

    suggestion = next((item for item in _db_published_suggestions_for_tenant(db, tenant_id) if item["suggestion_id"] == suggestion_id), None)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="nous_suggestion_not_available_for_tenant")
    if data.action == "reject" and not data.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason_required")
    if data.action == "adjust" and not data.adjustment_note:
        raise HTTPException(status_code=400, detail="adjustment_note_required")
    feedback = {
        "id": str(uuid.uuid4()),
        "suggestion_id": suggestion_id,
        "pattern_id": suggestion["pattern_id"],
        "tenant_id": tenant_id,
        "module_id": suggestion["module_id"],
        "action": data.action,
        "rejection_reason": data.rejection_reason,
        "adjustment_note": data.adjustment_note,
        "role": data.role,
        "timestamp": _now_iso(),
        "recorded_by": actor,
        "observation_only": True,
        "automatic_decision": False,
    }
    db.add(TenantAuditLog(tenant_id=tenant_id, actor=actor, action="nous_suggestion_feedback_registered", payload=feedback))
    db.commit()
    return feedback


def _db_generate_nous_self_report(db, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern, TenantAuditLog

    patterns = [_nous_pattern_model_to_dict(item) for item in db.query(NousPattern).all()]
    feedback = [
        item.payload
        for item in db.query(TenantAuditLog).filter(TenantAuditLog.action == "nous_suggestion_feedback_registered").all()
    ]
    report = _build_nous_self_report(patterns, feedback, actor)
    return report


def _db_apply_nous_governance_action(db, pattern_id: str, data: NousGovernanceActionRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    pattern = db.query(NousPattern).filter(NousPattern.id == pattern_id).first()
    if pattern is None:
        raise HTTPException(status_code=404, detail="nous_pattern_not_found")
    state_map = {
        "activate": "active",
        "mark_under_review": "under_review",
        "retire_bias": "retired_bias",
        "retire_low_performance": "retired_low_performance",
        "retire_stale": "retired_stale",
        "pause_by_founder": "paused_by_founder",
        "supersede": "superseded",
    }
    new_state = state_map[data.action]
    pattern.pattern_status = new_state
    if new_state != "active":
        pattern.published_to_clients = False
    if new_state.startswith("retired") or new_state in {"paused_by_founder", "superseded"}:
        pattern.retired_at = datetime.now(timezone.utc)
        pattern.retired_reason = data.reason
    audit = deepcopy(pattern.audit or {})
    history = list(audit.get("governance_history") or [])
    history.append({"action": data.action, "state": new_state, "reason": data.reason, "decided_by": data.decided_by, "actor": actor, "created_at": _now_iso(), "automatic_decision": False})
    audit["governance_history"] = history
    pattern.audit = audit
    db.commit()
    return _nous_pattern_model_to_dict(pattern)


def _db_pause_nous(db, data: NousPauseRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    event = {
        "id": str(uuid.uuid4()),
        "scope": "global",
        "action": "pause_by_founder",
        "reason": data.reason,
        "decided_by": data.decided_by,
        "actor": actor,
        "created_at": _now_iso(),
        "automatic_decision": False,
    }
    _nous_mem["governance_events"].append(event)
    patterns = db.query(NousPattern).filter(NousPattern.published_to_clients == True).all()  # noqa: E712
    for pattern in patterns:
        pattern.published_to_clients = False
        pattern.pattern_status = "paused_by_founder"
        pattern.retired_reason = data.reason
    db.commit()
    return {
        "status": "paused_by_founder",
        "event": event,
    }


def _db_run_quarterly_nous_audit(db, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import NousPattern

    actions: list[dict[str, Any]] = []
    for pattern in db.query(NousPattern).all():
        pattern_dict = _nous_pattern_model_to_dict(pattern)
        if pattern_dict.get("bias_check_status") == "failed":
            actions.append(
                _db_apply_nous_governance_action(
                    db,
                    pattern.id,
                    NousGovernanceActionRequest(action="retire_bias", reason="bias_check_failed_quarterly_audit", decided_by="AUDITOR"),
                    actor,
                )
            )
        elif pattern_dict.get("published_to_clients") and not _has_sufficient_publication_n(pattern_dict):
            actions.append(
                _db_apply_nous_governance_action(
                    db,
                    pattern.id,
                    NousGovernanceActionRequest(action="mark_under_review", reason="insufficient_n_after_quarterly_review", decided_by="AUDITOR"),
                    actor,
                )
            )
    report = _db_generate_nous_self_report(db, actor)
    return {"workflow": ["AUDITOR", "MARCOS", "KOSMOS", "SUPREME", "founder"], "actions": actions, "self_report": report, "automatic_decision": False}


def _document_model_to_dict(document) -> dict[str, Any]:
    return {
        "id": document.id,
        "tenant_id": document.tenant_id,
        "document_type": document.document_type,
        "title": document.title,
        "status": document.status,
        "qa_status": document.qa_status,
        "can_export_ok": document.qa_status == "ok" and document.status == "approved_by_human",
        "version": document.version,
        "content_md": document.content_md,
        "claim_ledger": document.claim_ledger,
        "provenance": document.provenance,
        "standards": document.standards,
        "blockers": document.blockers,
        "warnings": document.warnings,
        "human_review_sections": document.human_review_sections,
        "versions": document.versions,
        "review_history": document.review_history,
        "created_by": document.created_by,
        "updated_by": document.updated_by,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "updated_at": document.updated_at.isoformat() if document.updated_at else None,
    }


def _db_list_documents(db, tenant_id: str) -> list[dict[str, Any]]:
    from app.models.admin_tenant import TenantDocumentDraft

    _db_get_tenant(db, tenant_id)
    documents = (
        db.query(TenantDocumentDraft)
        .filter(TenantDocumentDraft.tenant_id == tenant_id)
        .order_by(TenantDocumentDraft.updated_at.desc())
        .all()
    )
    return [_document_model_to_dict(document) for document in documents]


def _db_get_document(db, tenant_id: str, document_id: str):
    from app.models.admin_tenant import TenantDocumentDraft

    document = (
        db.query(TenantDocumentDraft)
        .filter(TenantDocumentDraft.tenant_id == tenant_id, TenantDocumentDraft.id == document_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return document


def _db_generate_document(db, tenant_id: str, data: TenantDocumentDraftRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog, TenantDocumentDraft

    tenant = _tenant_to_dict(_db_get_tenant(db, tenant_id))
    draft = generate_document_draft(
        tenant=tenant,
        document_type=data.document_type,
        requested_by=actor,
        notes=data.notes,
    )
    created_at = datetime.fromisoformat(draft["created_at"])
    document = TenantDocumentDraft(
        id=draft["id"],
        tenant_id=tenant_id,
        document_type=draft["document_type"],
        title=draft["title"],
        status=draft["status"],
        qa_status=draft["qa_status"],
        version=draft["version"],
        content_md=draft["content_md"],
        claim_ledger=draft["claim_ledger"],
        provenance=draft["provenance"],
        standards=draft["standards"],
        blockers=draft["blockers"],
        warnings=draft["warnings"],
        human_review_sections=draft["human_review_sections"],
        versions=draft["versions"],
        review_history=draft["review_history"],
        created_by=actor,
        updated_by=actor,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(document)
    db.add(
        TenantAuditLog(
            tenant_id=tenant_id,
            actor=actor,
            action="tenant_document_draft_generated",
            payload={
                "document_id": document.id,
                "document_type": document.document_type,
                "status": document.status,
                "qa_status": document.qa_status,
                "official_document": False,
            },
        )
    )
    db.flush()
    return _document_model_to_dict(document)


def _db_update_document(db, tenant_id: str, document_id: str, data: TenantDocumentUpdateRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog

    document = _db_get_document(db, tenant_id, document_id)
    try:
        updated = update_document_draft(
            document=_document_model_to_dict(document),
            actor=actor,
            content_md=data.content_md,
            status=data.status,
            review_notes=data.review_notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    document.status = updated["status"]
    document.qa_status = updated["qa_status"]
    document.version = updated["version"]
    document.content_md = updated["content_md"]
    document.claim_ledger = updated["claim_ledger"]
    document.provenance = updated["provenance"]
    document.standards = updated["standards"]
    document.blockers = updated["blockers"]
    document.warnings = updated["warnings"]
    document.human_review_sections = updated["human_review_sections"]
    document.versions = updated["versions"]
    document.review_history = updated["review_history"]
    document.updated_by = actor
    document.updated_at = datetime.now(timezone.utc)
    db.add(
        TenantAuditLog(
            tenant_id=tenant_id,
            actor=actor,
            action="tenant_document_draft_reviewed",
            payload={
                "document_id": document_id,
                "status": document.status,
                "qa_status": document.qa_status,
                "official_document": False,
            },
        )
    )
    db.flush()
    return _document_model_to_dict(document)


def _db_apply_runtime_event(db, tenant_id: str, data: TenantRuntimeEventRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog, TenantMunicipalProfile

    tenant = _db_get_tenant(db, tenant_id)
    profile_dict = _tenant_to_dict(tenant).get("municipal_profile") or _empty_profile()
    updated = apply_runtime_event(
        existing_profile=profile_dict,
        updated_payload=profile_dict,
        registry=_load_capability_registry(),
        gates=[
            {"gate_id": gate.gate_id, "status": gate.status, "evidencia_url": gate.evidencia_url}
            for gate in tenant.gates
        ],
        event_type=data.event_type,
        event_payload=data.payload,
    )
    now = datetime.now(timezone.utc)
    profile = tenant.municipal_profile
    if profile is None:
        profile = TenantMunicipalProfile(tenant_id=tenant.id)
        db.add(profile)
    profile.antecedentes = updated["antecedentes"]
    profile.mapa_social = updated["mapa_social"]
    profile.organigrama_servicio = updated["organigrama_servicio"]
    profile.provenance_status = updated.get("provenance_status", profile_dict.get("provenance_status", "pendiente_verificacion"))
    profile.mode = updated.get("mode", profile_dict.get("mode", "carga_inicial"))
    profile.updated_by = actor
    profile.updated_at = now
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=actor,
            action="runtime_event_processed",
            payload={
                "event_type": data.event_type,
                "automatic_gate_change": False,
                "automatic_stage_transition": False,
                "external_dispatch": False,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


def _db_decide_recommendation(db, tenant_id: str, recommendation_id: str, data: RecommendationDecisionRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    profile = tenant.municipal_profile
    profile_dict = _tenant_to_dict(tenant).get("municipal_profile") or _empty_profile()
    try:
        updated = decide_recommendation(profile_dict, recommendation_id, data.action, actor, data.notes, data.adjusted_recommendation)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    profile.antecedentes = updated["antecedentes"]
    profile.mapa_social = updated["mapa_social"]
    profile.organigrama_servicio = updated["organigrama_servicio"]
    profile.updated_by = actor
    profile.updated_at = datetime.now(timezone.utc)
    db.add(TenantAuditLog(tenant_id=tenant.id, actor=actor, action="runtime_recommendation_decided", payload={"recommendation_id": recommendation_id, "action": data.action, "automatic_gate_change": False}))
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


def _db_decide_discrepancy(db, tenant_id: str, discrepancy_id: str, data: DiscrepancyDecisionRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    profile = tenant.municipal_profile
    profile_dict = _tenant_to_dict(tenant).get("municipal_profile") or _empty_profile()
    try:
        updated = decide_discrepancy(profile_dict, discrepancy_id, data.action, actor, data.notes)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    profile.antecedentes = updated["antecedentes"]
    profile.mapa_social = updated["mapa_social"]
    profile.organigrama_servicio = updated["organigrama_servicio"]
    profile.updated_by = actor
    profile.updated_at = datetime.now(timezone.utc)
    db.add(TenantAuditLog(tenant_id=tenant.id, actor=actor, action="runtime_discrepancy_decided", payload={"discrepancy_id": discrepancy_id, "action": data.action, "automatic_gate_change": False}))
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


def _db_all_tenants(db) -> list[dict[str, Any]]:
    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant

    tenants = (
        db.query(AdminTenant)
        .options(
            selectinload(AdminTenant.state),
            selectinload(AdminTenant.gates),
            selectinload(AdminTenant.capabilities),
            selectinload(AdminTenant.audit_log),
            selectinload(AdminTenant.municipal_profile),
        )
        .all()
    )
    return [_tenant_to_dict(tenant) for tenant in tenants]


def _db_cross_tenant_analytics(db, data: CrossTenantAnalyticsRequest, actor: str) -> dict[str, Any]:
    try:
        result = aggregate_cross_tenant_pattern(
            tenants=_db_all_tenants(db),
            metric=data.metric,
            requested_by=actor,
            minimum_n=data.minimum_n,
        )
    except PrivacyPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _analytics_audit_mem.append(result["audit"])
    return result


def _tenant_to_dict(tenant) -> dict[str, Any]:
    return {
        "id": tenant.id,
        "nombre": tenant.nombre,
        "estado_mx": tenant.estado_mx,
        "municipio_id": tenant.municipio_id,
        "inegi_clave": tenant.inegi_clave,
        "tier_comercial": tenant.tier_comercial,
        "activo": tenant.activo,
        "analytics_aggregate_opt_in": tenant.analytics_aggregate_opt_in,
        "analytics_aggregate_opt_in_at": tenant.analytics_aggregate_opt_in_at.isoformat() if tenant.analytics_aggregate_opt_in_at else None,
        "analytics_aggregate_opt_in_by": tenant.analytics_aggregate_opt_in_by,
        "analytics_aggregate_opt_in_source": tenant.analytics_aggregate_opt_in_source,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
        "state": {
            "tenant_id": tenant.state.tenant_id,
            "current_stage": tenant.state.current_stage,
            "fecha_ingreso": tenant.state.fecha_ingreso.isoformat() if tenant.state.fecha_ingreso else None,
            "fecha_cambio_stage": tenant.state.fecha_cambio_stage.isoformat() if tenant.state.fecha_cambio_stage else None,
            "transition_mode": tenant.state.transition_mode,
            "notas": tenant.state.notas,
        } if tenant.state else None,
        "gates": [
            {
                "gate_id": gate.gate_id,
                "status": gate.status,
                "evidencia_url": gate.evidencia_url,
                "evidencia_label": gate.evidencia_label,
                "decisor_humano": gate.decisor_humano,
                "closed_at": gate.closed_at.isoformat() if gate.closed_at else None,
                "notas": gate.notas,
                "updated_at": gate.updated_at.isoformat() if gate.updated_at else None,
            }
            for gate in tenant.gates
        ],
        "capabilities": [
            {"module_id": cap.module_id, "active": cap.active, "source": cap.source}
            for cap in tenant.capabilities
            if cap.active
        ],
        "audit_log": [
            {
                "id": log.id,
                "actor": log.actor,
                "action": log.action,
                "payload": log.payload,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in tenant.audit_log
        ],
        "municipal_profile": {
            "mode": tenant.municipal_profile.mode,
            "antecedentes": tenant.municipal_profile.antecedentes,
            "mapa_social": tenant.municipal_profile.mapa_social,
            "organigrama_servicio": tenant.municipal_profile.organigrama_servicio,
            "provenance_status": tenant.municipal_profile.provenance_status,
            "updated_by": tenant.municipal_profile.updated_by,
            "updated_at": tenant.municipal_profile.updated_at.isoformat() if tenant.municipal_profile.updated_at else None,
            "automation": automation_summary(
                {
                    "antecedentes": tenant.municipal_profile.antecedentes,
                    "mapa_social": tenant.municipal_profile.mapa_social,
                    "organigrama_servicio": tenant.municipal_profile.organigrama_servicio,
                }
            ),
        } if tenant.municipal_profile else _empty_profile(),
    }


def _db_create_tenant(db, data: TenantCreateRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import (
        AdminTenant,
        TenantAuditLog,
        TenantCapability,
        TenantGate,
        TenantMunicipalProfile,
        TenantState,
    )

    now = datetime.now(timezone.utc)
    capabilities = _default_capabilities(data.tier_comercial, data.current_stage)
    tenant = AdminTenant(
        nombre=data.nombre,
        estado_mx=data.estado_mx,
        municipio_id=data.municipio_id,
        inegi_clave=data.inegi_clave,
        tier_comercial=data.tier_comercial,
    )
    db.add(tenant)
    db.flush()
    municipal_profile = _initial_inference_profile(tenant.id, data)
    db.add(TenantState(tenant_id=tenant.id, current_stage=data.current_stage))
    for gate_id in GATE_IDS:
        db.add(TenantGate(tenant_id=tenant.id, gate_id=gate_id))
    for module_id in capabilities:
        db.add(TenantCapability(tenant_id=tenant.id, module_id=module_id, active=True))
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=actor,
            action="tenant_created",
            payload={
                "current_stage": data.current_stage,
                "tier_comercial": data.tier_comercial,
                "capabilities_count": len(capabilities),
                "automatic_stage_transition": False,
            },
            created_at=now,
        )
    )
    db.add(
        TenantMunicipalProfile(
            tenant_id=tenant.id,
            mode=municipal_profile["mode"],
            antecedentes=municipal_profile["antecedentes"],
            mapa_social=municipal_profile["mapa_social"],
            organigrama_servicio=municipal_profile["organigrama_servicio"],
            provenance_status=municipal_profile["provenance_status"],
            updated_by="hermes_initial_inference",
            updated_at=now,
        )
    )
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor="HERMES",
            action="hermes_initial_inference_completed",
            payload={
                "status": municipal_profile["antecedentes"]["_automation"]["inference"]["status"],
                "provenance_status": municipal_profile["provenance_status"],
                "official_documents_auto_sent": False,
                "automatic_stage_transition": False,
            },
            created_at=now,
        )
    )
    db.flush()
    db.refresh(tenant)
    return _tenant_to_dict(tenant)


@router.get("/users", response_model=List[UserInfo])
async def list_users(_: UserInfo = Depends(require_admin)):
    return [
        UserInfo(id=str(u["id"]), nombre=u["nombre"], email=u["email"], rol=u["rol"], zm=u["zm"])
        for u in DEMO_USERS.values()
    ]


@router.post("/users")
async def create_user(req: CreateUserRequest, _: UserInfo = Depends(require_admin)):
    if req.email in DEMO_USERS:
        raise HTTPException(status_code=409, detail="Usuario ya existe")
    new_id = str(max(int(u["id"]) for u in DEMO_USERS.values()) + 1)
    DEMO_USERS[req.email] = {
        "id": new_id,
        "nombre": req.nombre,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "rol": req.rol,
        "zm": req.zm,
    }
    logger.info(f"Usuario creado: {req.email} por admin")
    return {"ok": True, "id": new_id}


@router.delete("/users/{email}")
async def delete_user(email: str, _: UserInfo = Depends(require_admin)):
    if email not in DEMO_USERS:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if DEMO_USERS[email]["rol"] == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar el admin")
    del DEMO_USERS[email]
    return {"ok": True}


@router.get("/tenants")
async def list_tenants(_: UserInfo = Depends(require_admin), db=Depends(get_db)):
    if db is None:
        return {"tenants": [_serialize_mem(t) for t in _tenants_mem.values()]}

    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant

    tenants = (
        db.query(AdminTenant)
        .options(
            selectinload(AdminTenant.state),
            selectinload(AdminTenant.gates),
            selectinload(AdminTenant.capabilities),
            selectinload(AdminTenant.audit_log),
            selectinload(AdminTenant.municipal_profile),
        )
        .order_by(AdminTenant.created_at.desc())
        .all()
    )
    return {"tenants": [_tenant_to_dict(t) for t in tenants]}


@router.post("/tenants", status_code=201)
async def create_tenant(
    req: TenantCreateRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if req.current_stage != "validation":
        raise HTTPException(status_code=400, detail="Fase 1 solo permite crear tenants en etapa inicial validation")
    actor = user.email
    if db is None:
        return _mem_create_tenant(req, actor)
    return _db_create_tenant(db, req, actor)


def _db_get_tenant(db, tenant_id: str):
    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant

    tenant = (
        db.query(AdminTenant)
        .options(
            selectinload(AdminTenant.state),
            selectinload(AdminTenant.gates),
            selectinload(AdminTenant.capabilities),
            selectinload(AdminTenant.audit_log),
            selectinload(AdminTenant.municipal_profile),
        )
        .filter(AdminTenant.id == tenant_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    return tenant


@router.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, _: UserInfo = Depends(require_admin), db=Depends(get_db)):
    if db is None:
        return _serialize_mem(_mem_get_tenant(tenant_id))
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/tenants/{tenant_id}/municipal-profile")
async def get_tenant_municipal_profile(
    tenant_id: str,
    db=Depends(get_db),
):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    suggestions = _published_suggestions_for_tenant(tenant) if db is None else _db_published_suggestions_for_tenant(db, tenant_id)
    return {
        "tenant_id": tenant["id"],
        "municipio": tenant["nombre"],
        "estado": tenant["estado_mx"],
        "municipio_id": tenant["municipio_id"],
        "profile": _tenant_profile_with_nous_suggestions(tenant, suggestions),
    }


@router.get("/tenants/{tenant_id}/automation-summary")
async def get_tenant_automation_summary(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    return {
        "tenant_id": tenant["id"],
        "municipio_id": tenant["municipio_id"],
        "automation": automation_summary(tenant.get("municipal_profile") or _empty_profile()),
    }


@router.post("/tenants/{tenant_id}/runtime-events")
async def process_tenant_runtime_event(
    tenant_id: str,
    req: TenantRuntimeEventRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_apply_runtime_event(tenant_id, req, user.email)
    return _db_apply_runtime_event(db, tenant_id, req, user.email)


@router.post("/tenants/{tenant_id}/runtime/recommendations/{recommendation_id}/decision")
async def decide_tenant_runtime_recommendation(
    tenant_id: str,
    recommendation_id: str,
    req: RecommendationDecisionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_decide_recommendation(tenant_id, recommendation_id, req, user.email)
    return _db_decide_recommendation(db, tenant_id, recommendation_id, req, user.email)


@router.post("/tenants/{tenant_id}/runtime/discrepancies/{discrepancy_id}/decision")
async def decide_tenant_runtime_discrepancy(
    tenant_id: str,
    discrepancy_id: str,
    req: DiscrepancyDecisionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_decide_discrepancy(tenant_id, discrepancy_id, req, user.email)
    return _db_decide_discrepancy(db, tenant_id, discrepancy_id, req, user.email)


@router.post("/analytics/cross-tenant")
async def generate_cross_tenant_analytics(
    req: CrossTenantAnalyticsRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_cross_tenant_analytics(req, user.email)
    return _db_cross_tenant_analytics(db, req, user.email)


@router.post("/analytics/cross-tenant/share")
async def share_cross_tenant_insight(
    req: ShareInsightRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_share_cross_tenant_insight(req, user.email)
    return _db_share_cross_tenant_insight(db, req, user.email)


@router.get("/analytics/cross-tenant/audit")
async def list_cross_tenant_analytics_audit(_: UserInfo = Depends(require_admin)):
    return {"audit_log": _analytics_audit_mem, "minimum_n": MIN_ANALYTICS_N}


def _all_tenant_dicts(db) -> list[dict[str, Any]]:
    if db is None:
        return [_serialize_mem(tenant) for tenant in _tenants_mem.values()]
    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant
    tenants = (
        db.query(AdminTenant)
        .options(selectinload(AdminTenant.state), selectinload(AdminTenant.municipal_profile))
        .order_by(AdminTenant.created_at.desc())
        .all()
    )
    return [_tenant_to_dict(tenant) for tenant in tenants]


@router.get("/bibliography")
async def list_bibliography(
    stage: Stage | None = None,
    module_id: str | None = None,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenants = _all_tenant_dicts(db)
    records = build_bibliography_records(tenants)
    if stage:
        records = [record for record in records if record.module_id in STAGE_MODULES[stage]]
    if module_id:
        records = [record for record in records if record.module_id == module_id]
    return {
        "records": [record.model_dump(mode="json") for record in records],
        "record_count": len(records),
        "deterministic": True,
        "llm_used": False,
    }


@router.get("/bibliography/recommendations")
async def list_bibliography_recommendations(
    tenant_id: str,
    stage: Stage | None = None,
    module_id: str | None = None,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenants = _all_tenant_dicts(db)
    target = next((tenant for tenant in tenants if tenant["id"] == tenant_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    recommendations = build_evidence_recommendations(target, tenants, stage=stage, module_id=module_id)
    return {
        "tenant_id": tenant_id,
        "recommendations": [item.model_dump(mode="json") for item in recommendations],
        "automatic_recalibration": False,
        "llm_used": False,
    }


@router.get("/bibliography/coverage")
async def get_bibliography_coverage(
    tenant_id: str | None = None,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenants = _all_tenant_dicts(db)
    target = next((tenant for tenant in tenants if tenant["id"] == tenant_id), tenants[0] if tenants else None)
    if target is None:
        return {"stage_evidence_map": [], "tenant_count": 0, "llm_used": False}
    stage_map = build_stage_evidence_map(target, tenants)
    return {
        "tenant_id": target["id"],
        "tenant_count": len(tenants),
        "stage_evidence_map": [item.model_dump(mode="json") for item in stage_map],
        "llm_used": False,
    }


@router.get("/tenants/{tenant_id}/evidence-recommendations")
async def list_tenant_evidence_recommendations(
    tenant_id: str,
    stage: Stage | None = None,
    module_id: str | None = None,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenants = _all_tenant_dicts(db)
    target = next((tenant for tenant in tenants if tenant["id"] == tenant_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    recommendations = build_evidence_recommendations(target, tenants, stage=stage, module_id=module_id)
    safe = []
    for item in recommendations:
        dumped = item.model_dump(mode="json")
        if dumped["tag"] != "local":
            dumped["record"].pop("tenant_id", None)
            dumped["record"].pop("inegi_clave", None)
            dumped["record"]["municipality"] = "Municipio comparable anonimizado"
        safe.append(dumped)
    return {
        "tenant_id": tenant_id,
        "recommendations": safe,
        "cross_tenant_private_data_exposed": False,
        "automatic_recalibration": False,
        "llm_used": False,
    }


@router.patch("/tenants/{tenant_id}/analytics-consent")
async def update_tenant_analytics_consent(
    tenant_id: str,
    req: TenantAnalyticsConsentRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_set_analytics_consent(tenant_id, req, user.email)
    return _db_set_analytics_consent(db, tenant_id, req, user.email)


@router.post("/tenants/{tenant_id}/nous/inference-corrections")
async def register_nous_inference_correction(
    tenant_id: str,
    req: NousInferenceCorrectionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_register_nous_inference_correction(tenant_id, req, user.email)
    return _db_register_nous_inference_correction(db, tenant_id, req, user.email)


@router.post("/tenants/{tenant_id}/nous/gate-outcomes")
async def register_nous_gate_outcome(
    tenant_id: str,
    req: NousGateOutcomeRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_register_nous_gate_outcome(tenant_id, req, user.email)
    return _db_register_nous_gate_outcome(db, tenant_id, req, user.email)


@router.post("/tenants/{tenant_id}/nous/projection-deltas")
async def register_nous_projection_delta(
    tenant_id: str,
    req: NousProjectionDeltaRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_register_nous_projection_delta(tenant_id, req, user.email)
    return _db_register_nous_projection_delta(db, tenant_id, req, user.email)


@router.post("/nous/patterns")
async def create_nous_pending_pattern_endpoint(
    req: NousPendingPatternRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_create_nous_pending_pattern(req, user.email)
    return _db_create_nous_pending_pattern(db, req, user.email)


@router.get("/nous/patterns/queue")
async def list_nous_pattern_queue(
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_list_nous_pattern_queue()
    return _db_list_nous_pattern_queue(db)


@router.get("/nous/a11")
async def get_nous_a11_panel(
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_get_nous_a11_panel()
    return _db_get_nous_a11_panel(db)


@router.patch("/nous/patterns/{pattern_id}/review")
async def review_nous_pattern_endpoint(
    pattern_id: str,
    req: NousPatternReviewRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_review_nous_pattern(pattern_id, req, user.email)
    return _db_review_nous_pattern(db, pattern_id, req, user.email)


@router.patch("/nous/patterns/{pattern_id}/publication-gates")
async def update_nous_pattern_publication_gates(
    pattern_id: str,
    req: NousPatternPublicationGatesRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_update_nous_publication_gates(pattern_id, req, user.email)
    return _db_update_nous_publication_gates(db, pattern_id, req, user.email)


@router.post("/nous/patterns/{pattern_id}/publish")
async def publish_nous_pattern_to_clients(
    pattern_id: str,
    req: NousPatternPublishRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_publish_nous_pattern(pattern_id, req, user.email)
    return _db_publish_nous_pattern(db, pattern_id, req, user.email)


@router.post("/nous/patterns/{pattern_id}/withdraw")
async def withdraw_nous_pattern_from_clients(
    pattern_id: str,
    req: NousPatternReviewRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_withdraw_nous_pattern(pattern_id, user.email, req.notes)
    return _db_withdraw_nous_pattern(db, pattern_id, user.email, req.notes)


@router.get("/tenants/{tenant_id}/nous/suggestions")
async def list_tenant_nous_suggestions(
    tenant_id: str,
    module_id: str | None = None,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return {
            "tenant_id": tenant_id,
            "suggestions": _published_suggestions_for_tenant(_serialize_mem(_mem_get_tenant(tenant_id)), module_id),
            "automatic_decision": False,
        }
    return {"tenant_id": tenant_id, "suggestions": _db_published_suggestions_for_tenant(db, tenant_id, module_id), "automatic_decision": False}


@router.post("/tenants/{tenant_id}/nous/suggestions/{suggestion_id}/feedback")
async def record_tenant_nous_suggestion_feedback(
    tenant_id: str,
    suggestion_id: str,
    req: NousSuggestionFeedbackRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_record_nous_suggestion_feedback(tenant_id, suggestion_id, req, user.email)
    return _db_record_nous_suggestion_feedback(db, tenant_id, suggestion_id, req, user.email)


@router.get("/nous/self-report")
async def get_nous_self_report(
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_generate_nous_self_report(user.email)
    return _db_generate_nous_self_report(db, user.email)


@router.post("/nous/governance/quarterly-audit")
async def run_nous_quarterly_audit(
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_run_quarterly_nous_audit(user.email)
    return _db_run_quarterly_nous_audit(db, user.email)


@router.post("/nous/governance/pause")
async def pause_nous_by_founder(
    req: NousPauseRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_pause_nous(req, user.email)
    return _db_pause_nous(db, req, user.email)


@router.post("/nous/patterns/{pattern_id}/governance")
async def apply_nous_pattern_governance(
    pattern_id: str,
    req: NousGovernanceActionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_apply_nous_governance_action(pattern_id, req, user.email)
    return _db_apply_nous_governance_action(db, pattern_id, req, user.email)


@router.get("/tenants/{tenant_id}/nous/observations")
async def list_tenant_nous_observations(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_list_tenant_nous_observations(tenant_id)
    # DB-backed listing is intentionally deferred; storage exists and writes are supported.
    _db_get_tenant(db, tenant_id)
    return {
        "tenant_id": tenant_id,
        "observational_only": True,
        "published_patterns": [],
        "client_visible_patterns": _db_published_suggestions_for_tenant(db, tenant_id),
        "automatic_prior_recalibration": False,
    }


@router.patch("/tenants/{tenant_id}/municipal-profile")
async def update_tenant_municipal_profile(
    tenant_id: str,
    req: TenantMunicipalProfileRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_upsert_municipal_profile(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog, TenantMunicipalProfile

    tenant = _db_get_tenant(db, tenant_id)
    payload = req.model_dump()
    existing_profile = _tenant_to_dict(tenant).get("municipal_profile") or _empty_profile()
    payload = apply_runtime_automation(
        existing_profile=existing_profile,
        updated_payload=payload,
        registry=_load_capability_registry(),
        gates=[
            {
                "gate_id": gate.gate_id,
                "status": gate.status,
                "evidencia_url": gate.evidencia_url,
            }
            for gate in tenant.gates
        ],
    )
    mode = _profile_mode(payload)
    now = datetime.now(timezone.utc)
    profile = tenant.municipal_profile
    if profile is None:
        profile = TenantMunicipalProfile(tenant_id=tenant.id)
        db.add(profile)
    profile.antecedentes = payload["antecedentes"]
    profile.mapa_social = payload["mapa_social"]
    profile.organigrama_servicio = payload["organigrama_servicio"]
    profile.provenance_status = payload["provenance_status"]
    profile.mode = mode
    profile.updated_by = user.email
    profile.updated_at = now
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_municipal_profile_updated",
            payload={
                "mode": mode,
                "actors_count": len((payload.get("mapa_social") or {}).get("actores") or []),
                "recalculated_modules": ((payload.get("antecedentes") or {}).get("_automation") or {}).get("runtime", {}).get("recalculated_modules", []),
                "discrepancies": ((payload.get("antecedentes") or {}).get("_automation") or {}).get("runtime", {}).get("discrepancies", []),
                "automatic_stage_transition": False,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.patch("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    req: TenantUpdateRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_update_tenant(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog, TenantCapability

    tenant = _db_get_tenant(db, tenant_id)
    patch = req.model_dump(exclude_unset=True)
    active_capabilities = patch.pop("active_capabilities", None)
    for key, value in patch.items():
        setattr(tenant, key, value)
    if active_capabilities is not None:
        for cap in tenant.capabilities:
            db.delete(cap)
        db.flush()
        for module_id in active_capabilities:
            db.add(TenantCapability(tenant_id=tenant.id, module_id=module_id, active=True, source="manual_admin"))
    tenant.updated_at = datetime.now(timezone.utc)
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_updated",
            payload={"fields": sorted(req.model_dump(exclude_unset=True).keys())},
        )
    )
    db.flush()
    db.refresh(tenant)
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/tenants/{tenant_id}/state")
async def get_tenant_state(tenant_id: str, _: UserInfo = Depends(require_admin), db=Depends(get_db)):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    from app.city.inegi_catalog import zm_for_estado

    clave_inegi = tenant.get("inegi_clave")
    zm = zm_for_estado(clave_inegi[:2]) if isinstance(clave_inegi, str) and len(clave_inegi) >= 2 else None
    return {
        "tenant_id": tenant["id"],
        "municipal_context": {
            "municipio_id": tenant.get("municipio_id"),
            "clave_inegi": clave_inegi,
            "zm": zm,
            "municipality": tenant.get("nombre"),
            "state": tenant.get("estado_mx"),
        },
        "state": tenant["state"],
        "gates": tenant["gates"],
        "capabilities": tenant["capabilities"],
        "audit_log": tenant["audit_log"],
    }


@router.get("/tenants/{tenant_id}/platform-access/{stage}")
async def check_platform_access(
    tenant_id: str,
    stage: TenantStage,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    current_stage = tenant["state"]["current_stage"]
    try:
        assert_can_access_stage(current_stage, stage)
    except TenantStateError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return {
        "tenant_id": tenant["id"],
        "current_stage": current_stage,
        "requested_stage": stage,
        "access": "allowed",
    }


@router.post("/tenants/{tenant_id}/gates/{gate_id}/evidence")
async def register_gate_evidence(
    tenant_id: str,
    gate_id: str,
    req: GateEvidenceRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    gate_id = gate_id.upper()
    if gate_id not in GATE_IDS:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    if db is None:
        return _mem_register_evidence(tenant_id, gate_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    gate = next((g for g in tenant.gates if g.gate_id == gate_id), None)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    gate.evidencia_url = req.evidencia_url
    gate.evidencia_label = req.evidencia_label
    gate.decisor_humano = req.decisor_humano
    gate.notas = req.notas
    if gate.status == "no_iniciado":
        gate.status = "en_revision"
    gate.updated_at = datetime.now(timezone.utc)
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="gate_evidence_registered",
            payload={"gate_id": gate_id, "evidencia_url": req.evidencia_url},
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.post("/tenants/{tenant_id}/gates/{gate_id}/close")
async def close_gate_manual(
    tenant_id: str,
    gate_id: str,
    req: GateCloseRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    gate_id = gate_id.upper()
    if gate_id not in GATE_IDS:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    if db is None:
        return _mem_close_gate(tenant_id, gate_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    gate = next((g for g in tenant.gates if g.gate_id == gate_id), None)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    evidencia_url = req.evidencia_url or gate.evidencia_url
    evidencia_label = req.evidencia_label or gate.evidencia_label
    if not evidencia_url or not evidencia_label:
        raise HTTPException(status_code=400, detail="No se puede cerrar un gate sin evidencia")
    previous_status = gate.status
    now = datetime.now(timezone.utc)
    gate.status = "cerrado"
    gate.evidencia_url = evidencia_url
    gate.evidencia_label = evidencia_label
    gate.decisor_humano = req.decisor_humano
    gate.notas = req.notas or gate.notas
    gate.closed_at = now
    gate.updated_at = now
    db.flush()
    _db_register_nous_gate_outcome(
        db,
        tenant_id,
        NousGateOutcomeRequest(
            gate=gate_id,
            outcome="cerrado_exitoso",
            days_to_close=0,
            module_state_at_close=_gate_outcome_snapshot_payload(_tenant_to_dict(tenant)),
            political_context={},
            payer_configuration=None,
        ),
        user.email,
    )
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="gate_closed_manual",
            payload={
                "gate_id": gate_id,
                "status_anterior": previous_status,
                "status_nuevo": "cerrado",
                "evidencia_url": evidencia_url,
                "automatic_stage_transition": False,
                "stage_after_close": tenant.state.current_stage,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.post("/tenants/{tenant_id}/transition")
async def transition_tenant_manual(
    tenant_id: str,
    req: TenantTransitionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_transition_tenant(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    tenant_dict = _tenant_to_dict(tenant)
    current_stage = tenant_dict["state"]["current_stage"]
    try:
        decision = validate_manual_transition(
            current_stage=current_stage,
            target_stage=req.target_stage,
            gates=tenant_dict["gates"],
            capabilities=tenant_dict["capabilities"],
            manual_confirmation=req.manual_confirmation,
        )
    except TenantStateError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    now = datetime.now(timezone.utc)
    tenant.state.current_stage = req.target_stage
    tenant.state.fecha_cambio_stage = now
    tenant.state.notas = req.notas
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_stage_transition_manual",
            payload={
                "from_stage": decision.from_stage,
                "to_stage": decision.to_stage,
                "required_gate": decision.required_gate,
                "confirmed_by": req.confirmed_by,
                "manual_confirmation": True,
                "automatic_stage_transition": False,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/tenants/{tenant_id}/documents")
async def list_tenant_documents(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    documents = _mem_list_documents(tenant_id) if db is None else _db_list_documents(db, tenant_id)
    return {
        "tenant_id": tenant_id,
        "a6_documentacion_generada": documents,
        "official_auto_send_enabled": False,
        "human_review_required": True,
    }


@router.post("/tenants/{tenant_id}/documents/drafts", status_code=201)
async def generate_tenant_document_draft(
    tenant_id: str,
    req: TenantDocumentDraftRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_generate_document(tenant_id, req, user.email)
    return _db_generate_document(db, tenant_id, req, user.email)


@router.patch("/tenants/{tenant_id}/documents/{document_id}")
async def update_tenant_document_draft(
    tenant_id: str,
    document_id: str,
    req: TenantDocumentUpdateRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_update_document(tenant_id, document_id, req, user.email)
    return _db_update_document(db, tenant_id, document_id, req, user.email)


@router.post("/tenants/{tenant_id}/documents/{document_id}/export-check")
async def check_tenant_document_export(
    tenant_id: str,
    document_id: str,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        document = deepcopy(_mem_get_document(tenant_id, document_id))
    else:
        document = _document_model_to_dict(_db_get_document(db, tenant_id, document_id))
    return export_gate(document)


@router.get("/legacy/manifest")
async def get_legacy_quarantine_manifest(_: UserInfo = Depends(require_admin)):
    return {
        "generated_at": _now_iso(),
        "policy": (
            "No borrar legacy mientras exista import activo desde /v, /p, /e, /admin o export. "
            "Primero cortar dependencias cliente-facing, luego eliminar por grafo de imports y pruebas."
        ),
        "items": [
            {
                "file": "frontend/src/store/simulatorStore.ts",
                "usage": "Store historico del simulador; contiene defaults SLP, sliders y estado de laboratorio.",
                "client_facing": False,
                "replacement": "CityConsultingContext + StageWorkspace + motores deterministicos de consultoria.",
                "deletion_risk": "high",
                "deletion_criteria": "rg confirma cero imports fuera de /simulator y pruebas legacy explicitas.",
            },
            {
                "file": "frontend/src/components/simulator/**",
                "usage": "Componentes antiguos de simulacion y modulos visuales heredados.",
                "client_facing": False,
                "replacement": "Componentes platform/* conectados a Evidence Kernel y StageWorkspace.",
                "deletion_risk": "high",
                "deletion_criteria": "Ningun componente cliente importa /components/simulator; piezas utiles extraidas a lib pura.",
            },
            {
                "file": "frontend/src/app/simulator/**",
                "usage": "Ruta de laboratorio interno/founder para pruebas de motores y visualizaciones.",
                "client_facing": False,
                "replacement": "Laboratorio founder aislado o motores puros sin UI cliente.",
                "deletion_risk": "medium",
                "deletion_criteria": "Existe reemplazo admin/founder y no hay journeys comerciales activos que dependan de la ruta.",
            },
            {
                "file": "backend/app/routers/simulate.py",
                "usage": "Endpoint historico de simulacion.",
                "client_facing": False,
                "replacement": "Pipeline de consulting package, escenarios cerrados y registros de evidencia.",
                "deletion_risk": "medium",
                "deletion_criteria": "No hay consumidores frontend ni tests de MVP que lo requieran.",
            },
        ],
    }


@router.get("/logs")
async def get_logs(_: UserInfo = Depends(require_admin)):
    return [
        {"ts": "2025-04-27 09:14", "usuario": "carlos@slp.gob.mx", "accion": "Generó plan", "zm": "SLP", "estado": "completado"},
        {"ts": "2025-04-26 15:30", "usuario": "maria@qro.gob.mx",  "accion": "Generó plan", "zm": "QRO", "estado": "completado"},
    ]


@router.get("/agentes")
async def get_agentes(_: UserInfo = Depends(require_admin)):
    return [
        {"nombre": a, "estado": "idle", "ultima": "2025-04-27"}
        for a in ["Director", "Arquitecto", "Ghostwriter", "Comparador", "Mapeador", "Validador", "Humanizador"]
    ]
