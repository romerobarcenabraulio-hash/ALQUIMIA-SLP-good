"""Deterministic bibliography compatibility engine.

No LLMs, no automatic recalibration. The engine recommends compatible evidence
and states what each source cannot support.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

EvidenceTag = Literal["local", "comparable", "benchmark", "solo_contexto", "no_usable"]
EvidenceType = Literal["document", "api", "benchmark", "gap", "model"]
Stage = Literal["validation", "planning", "execution"]


class BibliographyRecord(BaseModel):
    id: str
    tenant_id: str
    municipality: str
    state: str
    municipio_id: str | None = None
    inegi_clave: str | None = None
    institution: str
    title: str
    source_date: str
    consulted_at: str
    territorial_scope: Literal["municipio", "zm", "estado", "nacional"] = "municipio"
    module_id: str
    claim_id: str
    claim_label: str
    evidence_type: EvidenceType
    method: str
    confidence: str
    restrictions: list[str] = Field(default_factory=list)


class BibliographyCompatibilityScore(BaseModel):
    territorial: int
    profile: int
    module: int
    recency: int
    evidence: int
    penalties: int
    total: int


class EvidenceRecommendation(BaseModel):
    id: str
    tag: EvidenceTag
    record: BibliographyRecord
    score: BibliographyCompatibilityScore
    confidence: Literal["high", "medium", "low", "blocked"]
    supported_claim: str
    unsupported_claim: str
    explanation: str
    stage: Stage
    module_id: str


class StageEvidenceMap(BaseModel):
    stage: Stage
    label: str
    recommendations: list[EvidenceRecommendation]
    local_count: int
    comparable_count: int
    benchmark_count: int
    blocked_count: int


STAGE_MODULES: dict[Stage, list[str]] = {
    "validation": ["M00B", "M01", "M02", "M03B", "M04", "M13", "M14", "M15"],
    "planning": ["M05", "M07", "M08", "M09", "M13", "M14"],
    "execution": ["M17", "M18", "M20", "M21"],
}
STAGE_LABELS = {"validation": "Validacion", "planning": "Planeacion", "execution": "Ejecucion"}

FIELD_CONTRACTS = {
    "antecedentes.demografia.poblacion": ("M01", "Poblacion municipal"),
    "antecedentes.demografia.viviendas": ("M01", "Viviendas municipales"),
    "antecedentes.demografia.generacion_kg_hab_dia": ("M01", "Generacion kg/hab/dia"),
}


def _now_date() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _unwrap_field(profile: dict[str, Any], dotted: str) -> dict[str, Any] | None:
    current: Any = profile
    for part in dotted.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current if isinstance(current, dict) else None


def _evidence_type(field: dict[str, Any]) -> EvidenceType:
    if field.get("value") is None:
        return "gap"
    method = str(field.get("method") or "").lower()
    source = field.get("source") or {}
    label = str(source.get("label") or "").lower()
    if "benchmark" in method or "benchmark" in label:
        return "benchmark"
    if "api" in method:
        return "api"
    if "inferred" in str(field.get("confidence") or ""):
        return "model"
    return "document"


def _territorial_scope(field: dict[str, Any]) -> Literal["municipio", "zm", "estado", "nacional"]:
    method = str(field.get("method") or "").lower()
    source = field.get("source") or {}
    label = str(source.get("label") or "").lower()
    if "benchmark" in method or "semarnat" in label:
        return "nacional"
    return "municipio"


def _restrictions(scope: str, evidence_type: EvidenceType) -> list[str]:
    restrictions: list[str] = []
    if scope != "municipio":
        restrictions.append("No soporta verdad municipal directa.")
    if scope == "zm":
        restrictions.append("Alcance ZM; debe separarse de municipio.")
    if evidence_type == "benchmark":
        restrictions.append("Benchmark; no sustituye estudio local.")
    if evidence_type == "gap":
        restrictions.append("Brecha; no usable como afirmacion.")
    if evidence_type == "model":
        restrictions.append("Inferencia/modelo; requiere revision humana.")
    return restrictions


def build_bibliography_records(tenants: list[dict[str, Any]]) -> list[BibliographyRecord]:
    records: list[BibliographyRecord] = []
    for tenant in tenants:
        profile = tenant.get("municipal_profile") or {}
        for field_path, (module_id, label) in FIELD_CONTRACTS.items():
            field = _unwrap_field(profile, field_path)
            if not field:
                continue
            source = field.get("source") or {}
            evidence_type = _evidence_type(field)
            scope = _territorial_scope(field)
            source_date = source.get("extracted_at") or tenant.get("updated_at") or _now_date()
            records.append(BibliographyRecord(
                id=f"{tenant.get('id')}:{field_path}",
                tenant_id=str(tenant.get("id")),
                municipality=str(tenant.get("nombre")),
                state=str(tenant.get("estado_mx")),
                municipio_id=tenant.get("municipio_id"),
                inegi_clave=tenant.get("inegi_clave"),
                institution=str(source.get("label") or "Fuente pendiente"),
                title=label,
                source_date=str(source_date),
                consulted_at=str(source_date),
                territorial_scope=scope,
                module_id=module_id,
                claim_id=field_path,
                claim_label=label,
                evidence_type=evidence_type,
                method=str(field.get("method") or "metodo_pendiente"),
                confidence=str(field.get("confidence") or "pending_human_validation"),
                restrictions=_restrictions(scope, evidence_type),
            ))
    return records


def _year(value: str) -> int | None:
    import re
    match = re.search(r"20\d{2}|19\d{2}", value)
    return int(match.group(0)) if match else None


def _recency(value: str) -> int:
    year = _year(value)
    if not year:
        return 8
    age = max(0, 2026 - year)
    if age <= 2:
        return 15
    if age <= 5:
        return 10
    if age <= 10:
        return 5
    return 0


def _confidence_score(confidence: str) -> int:
    if "high" in confidence or "official" in confidence:
        return 18
    if "medium" in confidence or "secondary" in confidence:
        return 10
    if "low" in confidence or "pending" in confidence:
        return 4
    if "critical" in confidence:
        return -40
    return 6


def _stage_for(module_id: str) -> Stage:
    if module_id in STAGE_MODULES["execution"]:
        return "execution"
    if module_id in STAGE_MODULES["planning"]:
        return "planning"
    return "validation"


def score_record(target: dict[str, Any], record: BibliographyRecord, module_id: str | None = None) -> BibliographyCompatibilityScore:
    same_municipality = bool(target.get("municipio_id") and target.get("municipio_id") == record.municipio_id)
    same_state = target.get("estado_mx") == record.state
    territorial = 45 if same_municipality and record.territorial_scope == "municipio" else 16 if same_state else 10 if record.territorial_scope == "nacional" else 8
    profile = 12 if same_state else 6
    module = 10 if not module_id else 18 if module_id == record.module_id else 0
    recency = _recency(record.source_date)
    evidence = _confidence_score(record.confidence)
    penalties = sum([
        -80 if record.evidence_type == "gap" else 0,
        -12 if record.evidence_type == "benchmark" else 0,
        -10 if record.evidence_type == "model" else 0,
        -8 if record.territorial_scope != "municipio" else 0,
    ])
    total = max(0, min(100, territorial + profile + module + recency + evidence + penalties))
    return BibliographyCompatibilityScore(
        territorial=territorial,
        profile=profile,
        module=module,
        recency=recency,
        evidence=evidence,
        penalties=penalties,
        total=total,
    )


def _tag(target: dict[str, Any], record: BibliographyRecord, score: BibliographyCompatibilityScore) -> EvidenceTag:
    if record.evidence_type == "gap" or score.total < 20:
        return "no_usable"
    if record.territorial_scope == "municipio" and record.municipio_id == target.get("municipio_id") and record.evidence_type == "document":
        return "local"
    if record.evidence_type == "benchmark" or record.territorial_scope == "nacional":
        return "benchmark"
    if record.territorial_scope in {"zm", "estado"}:
        return "comparable"
    return "comparable" if score.total >= 45 else "solo_contexto"


def _recommendation_confidence(tag: EvidenceTag, score: int) -> Literal["high", "medium", "low", "blocked"]:
    if tag == "no_usable":
        return "blocked"
    if tag == "local" and score >= 70:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def build_evidence_recommendations(
    target: dict[str, Any],
    tenants: list[dict[str, Any]],
    *,
    stage: Stage | None = None,
    module_id: str | None = None,
) -> list[EvidenceRecommendation]:
    records = build_bibliography_records(tenants)
    if stage:
        records = [record for record in records if record.module_id in STAGE_MODULES[stage]]
    if module_id:
        records = [record for record in records if record.module_id == module_id]
    recommendations: list[EvidenceRecommendation] = []
    for record in records:
        score = score_record(target, record, module_id)
        tag = _tag(target, record, score)
        recommendations.append(EvidenceRecommendation(
            id=f"{target.get('id')}:{record.id}",
            tag=tag,
            record=record,
            score=score,
            confidence=_recommendation_confidence(tag, score.total),
            supported_claim=(
                f"Puede soportar claim municipal sobre {record.claim_label}."
                if tag == "local"
                else "No debe soportar afirmaciones." if tag == "no_usable"
                else f"Puede contextualizar {record.claim_label} como evidencia comparable o benchmark."
            ),
            unsupported_claim=(
                "No sustituye revision humana ni oficialidad automatica."
                if tag == "local"
                else "No soporta verdad municipal, estudio local ni declaratoria oficial."
            ),
            explanation=(
                f"Fuente municipal de {record.municipality}; usable con fuente, fecha, metodo, alcance y revision humana."
                if tag == "local"
                else "La plataforma recomienda esta fuente como contexto comparable; no es estudio local ni dato oficial municipal."
            ),
            stage=_stage_for(record.module_id),
            module_id=record.module_id,
        ))
    return sorted(recommendations, key=lambda item: item.score.total, reverse=True)


def build_stage_evidence_map(target: dict[str, Any], tenants: list[dict[str, Any]]) -> list[StageEvidenceMap]:
    output: list[StageEvidenceMap] = []
    for stage in ("validation", "planning", "execution"):
        recommendations = build_evidence_recommendations(target, tenants, stage=stage)[:8]
        output.append(StageEvidenceMap(
            stage=stage,  # type: ignore[arg-type]
            label=STAGE_LABELS[stage],  # type: ignore[index]
            recommendations=recommendations,
            local_count=sum(1 for item in recommendations if item.tag == "local"),
            comparable_count=sum(1 for item in recommendations if item.tag == "comparable"),
            benchmark_count=sum(1 for item in recommendations if item.tag == "benchmark"),
            blocked_count=sum(1 for item in recommendations if item.tag == "no_usable"),
        ))
    return output
