"""Fase 12 document automation with mandatory human review.

The engine prepares traceable drafts only. It never signs, sends, approves, or
labels a formal document as final/official.
"""
from __future__ import annotations

import json
import uuid
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

DocumentState = Literal[
    "draft_generated",
    "human_review_required",
    "in_review",
    "approved_by_human",
    "rejected",
    "blocked_missing_evidence",
]

SUPPORTED_DOCUMENTS: dict[str, dict[str, Any]] = {
    "expediente_cabildo": {
        "title": "Borrador de expediente Cabildo",
        "module_ids": ["M00B", "M02", "M02C", "M02D", "M03B"],
        "critical_gates": [],
    },
    "reforma_reglamentaria_3_articulos": {
        "title": "Borrador de reforma reglamentaria / 3 articulos faltantes",
        "module_ids": ["M03B"],
        "critical_gates": [],
    },
    "acuerdo_cabildo": {
        "title": "Borrador de acuerdo de Cabildo",
        "module_ids": ["M00B", "M02D", "M03B"],
        "critical_gates": ["G1"],
    },
    "adenda_concesion": {
        "title": "Borrador de adenda de concesion",
        "module_ids": ["M03B", "M05"],
        "critical_gates": ["G2"],
    },
    "reporte_mensual_esg_gri_306": {
        "title": "Borrador de reporte mensual ESG / GRI 306",
        "module_ids": ["M01", "M06", "M09", "M10"],
        "critical_gates": ["G3"],
    },
    "oficio_estandar": {
        "title": "Borrador de oficio estandar",
        "module_ids": ["M00B"],
        "critical_gates": [],
    },
}

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "human_review_required": {"in_review", "rejected"},
    "blocked_missing_evidence": {"in_review", "rejected"},
    "in_review": {"approved_by_human", "rejected", "human_review_required"},
    "approved_by_human": set(),
    "rejected": {"in_review", "human_review_required"},
    "draft_generated": {"human_review_required", "blocked_missing_evidence"},
}


@dataclass(frozen=True)
class DocumentDraftRequest:
    document_type: str
    requested_by: str
    notes: str | None = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def load_standards_map() -> dict[str, Any]:
    path = repo_root() / "docs" / "architecture" / "standards_map.json"
    return json.loads(path.read_text(encoding="utf-8"))


def standards_for_modules(module_ids: list[str]) -> list[dict[str, Any]]:
    standards_map = load_standards_map()
    modules = {record.get("module_id"): record for record in standards_map.get("modules", [])}
    result: list[dict[str, Any]] = []
    seen: set[str] = set()
    for module_id in module_ids:
        record = modules.get(module_id) or {}
        for standard in record.get("standards") or []:
            code = str(standard.get("code") or "")
            key = f"{module_id}:{code}"
            if not code or key in seen:
                continue
            seen.add(key)
            result.append(
                {
                    "module_id": module_id,
                    "code": code,
                    "full_name": standard.get("full_name"),
                    "url": standard.get("url"),
                    "relevance": standard.get("relevance"),
                    "source": "docs/architecture/standards_map.json",
                }
            )
    return result


def nested_get(data: dict[str, Any], path: str) -> Any:
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def unwrap_value(value: Any) -> Any:
    if isinstance(value, dict) and "value" in value:
        return value.get("value")
    return value


def source_from_value(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    source = value.get("source")
    if not isinstance(source, dict):
        return None
    return {
        "source_id": source.get("id"),
        "source_label": source.get("label"),
        "source_kind": source.get("kind"),
        "source_date": source.get("extracted_at"),
        "method": value.get("method"),
        "confidence": value.get("confidence"),
        "human_validation_state": value.get("human_validation_state"),
        "display_status": value.get("display_status"),
        "official": value.get("official") is True,
        "pending_reason": value.get("pending_reason"),
    }


def collect_claims(tenant: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    profile = tenant.get("municipal_profile") or {}
    fields = [
        ("municipio.nombre", tenant.get("nombre")),
        ("municipio.estado_mx", tenant.get("estado_mx")),
        ("municipio.municipio_id", tenant.get("municipio_id")),
        ("municipio.inegi_clave", tenant.get("inegi_clave")),
        ("antecedentes.reglamento_de_limpia", nested_get(profile, "antecedentes.reglamento_de_limpia")),
        ("antecedentes.demografia.poblacion", nested_get(profile, "antecedentes.demografia.poblacion")),
        ("antecedentes.demografia.viviendas", nested_get(profile, "antecedentes.demografia.viviendas")),
        ("antecedentes.demografia.generacion_kg_hab_dia", nested_get(profile, "antecedentes.demografia.generacion_kg_hab_dia")),
        ("mapa_social.actores", nested_get(profile, "mapa_social.actores")),
        ("organigrama_servicio", nested_get(profile, "organigrama_servicio")),
    ]
    claims: list[dict[str, Any]] = []
    warnings: list[str] = []
    missing_sources: list[str] = []
    for index, (field_path, raw_value) in enumerate(fields, start=1):
        source = source_from_value(raw_value)
        display_value = unwrap_value(raw_value)
        if display_value is None:
            warnings.append(f"{field_path}: Pendiente carga de datos del municipio")
        if source is None and field_path.startswith(("antecedentes.", "mapa_social.", "organigrama_servicio")):
            missing_sources.append(field_path)
            warnings.append(f"{field_path}: sin fuente trazable; requiere validacion humana")
        claims.append(
            {
                "claim_id": f"CLM-{index:03d}",
                "field_path": field_path,
                "value": display_value,
                "provenance": source,
                "preliminary": bool(source and source.get("human_validation_state") != "human_validated"),
                "official": bool(source and source.get("official") is True),
            }
        )
    return claims, warnings, missing_sources


def closed_gate_ids(tenant: dict[str, Any]) -> set[str]:
    return {
        str(gate.get("gate_id"))
        for gate in tenant.get("gates") or []
        if gate.get("status") == "cerrado" and gate.get("evidencia_url")
    }


def document_blockers(tenant: dict[str, Any], spec: dict[str, Any], missing_sources: list[str]) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    closed = closed_gate_ids(tenant)
    for gate_id in spec.get("critical_gates") or []:
        if gate_id not in closed:
            blockers.append(
                {
                    "code": "BLOCKED_MISSING_GATE_EVIDENCE",
                    "gate_id": gate_id,
                    "reason": f"Falta evidencia critica de {gate_id}; no puede exportarse como ok.",
                }
            )
    for field_path in missing_sources:
        if field_path in {"antecedentes.reglamento_de_limpia", "organigrama_servicio"}:
            blockers.append(
                {
                    "code": "BLOCKED_MISSING_SOURCE",
                    "field_path": field_path,
                    "reason": "Dato critico sin fuente; documento queda bloqueado hasta revision humana.",
                }
            )
    return blockers


def review_sections(document_type: str) -> list[dict[str, str]]:
    common = [
        {"section": "lectura_ejecutiva", "reason": "Confirmar que la sintesis es fiel a evidencia disponible."},
        {"section": "datos_preliminares", "reason": "Validar o corregir datos inferidos antes de uso formal."},
        {"section": "provenance_claimledger", "reason": "Revisar fuente, fecha, metodo y confianza por claim."},
        {"section": "lenguaje_institucional", "reason": "Confirmar que se mantiene como borrador para revision."},
    ]
    if document_type in {"reforma_reglamentaria_3_articulos", "acuerdo_cabildo", "adenda_concesion"}:
        common.append({"section": "revision_juridica", "reason": "Revision humana obligatoria por secretaria/juridico municipal."})
    return common


def render_content(
    *,
    tenant: dict[str, Any],
    spec: dict[str, Any],
    claims: list[dict[str, Any]],
    standards: list[dict[str, Any]],
    blockers: list[dict[str, str]],
    warnings: list[str],
) -> str:
    municipality = tenant.get("nombre") or tenant.get("municipio_id")
    population = next((claim.get("value") for claim in claims if claim["field_path"] == "antecedentes.demografia.poblacion"), None)
    standard_codes = ", ".join(s["code"] for s in standards[:6]) or "pendiente MARCOS"
    blocker_text = "\n".join(f"- {b['code']}: {b['reason']}" for b in blockers) or "- Sin bloqueos criticos; revision humana sigue obligatoria."
    warning_text = "\n".join(f"- {warning}" for warning in warnings[:8]) or "- Sin advertencias adicionales."
    claim_text = "\n".join(
        f"- {claim['claim_id']} · {claim['field_path']} · {claim.get('value')} · "
        f"{((claim.get('provenance') or {}).get('source_label') or 'sin fuente')} · "
        f"{((claim.get('provenance') or {}).get('confidence') or 'pendiente')} · "
        f"{'dato preliminar pendiente de validacion' if claim.get('preliminary') else 'validado'}"
        for claim in claims
    )
    return f"""# {spec['title']}

**Estado:** borrador para revision humana obligatoria
**Tenant:** {municipality} ({tenant.get('municipio_id')})
**Advertencia:** La maquina prepara este borrador. No es documento oficial, no esta firmado y no sustituye revision juridica ni aprobacion municipal.

## Lectura ejecutiva

Observacion tecnica preliminar: {municipality} cuenta con una base documental inicial para preparar {spec['title'].lower()}, pero toda seccion marcada como preliminar requiere validacion humana antes de cualquier uso formal.

## Cifra o dato rector

- Poblacion base usada: {population if population is not None else 'Pendiente carga de datos del municipio'}
- Estandares MARCOS citados: {standard_codes}

## Bloqueos y advertencias

{blocker_text}

{warning_text}

## Secciones que requieren validacion humana

- Lectura ejecutiva y supuestos.
- Datos inferidos o pendientes.
- Redaccion juridica o administrativa.
- ClaimLedger/provenance completo.

## ClaimLedger / provenance

{claim_text}
"""


def generate_document_draft(
    *,
    tenant: dict[str, Any],
    document_type: str,
    requested_by: str,
    notes: str | None = None,
) -> dict[str, Any]:
    if document_type not in SUPPORTED_DOCUMENTS:
        raise ValueError(f"document_type no soportado: {document_type}")
    spec = SUPPORTED_DOCUMENTS[document_type]
    claims, warnings, missing_sources = collect_claims(tenant)
    standards = standards_for_modules(spec["module_ids"])
    blockers = document_blockers(tenant, spec, missing_sources)
    status: DocumentState = "blocked_missing_evidence" if blockers else "human_review_required"
    qa_status = "blocked" if blockers else "partial"
    created_at = now_iso()
    content_md = render_content(
        tenant=tenant,
        spec=spec,
        claims=claims,
        standards=standards,
        blockers=blockers,
        warnings=warnings,
    )
    document_id = str(uuid.uuid4())
    version_entry = {
        "version": 1,
        "status": status,
        "content_md": content_md,
        "created_by": requested_by,
        "created_at": created_at,
        "notes": notes,
    }
    return {
        "id": document_id,
        "tenant_id": tenant["id"],
        "document_type": document_type,
        "title": spec["title"],
        "status": status,
        "qa_status": qa_status,
        "can_export_ok": False,
        "version": 1,
        "content_md": content_md,
        "claim_ledger": {
            "claim_ledger_id": f"CL-{document_id}",
            "claims": claims,
            "qa_status": qa_status,
            "official_document": False,
        },
        "provenance": {
            "source": "tenant_private_store + public_knowledge_base",
            "tenant_id": tenant["id"],
            "municipio_id": tenant.get("municipio_id"),
            "generated_at": created_at,
            "generated_by": requested_by,
            "human_review_required": True,
            "official_document": False,
        },
        "standards": standards,
        "blockers": blockers,
        "warnings": warnings,
        "human_review_sections": review_sections(document_type),
        "versions": [version_entry],
        "review_history": [
            {
                "action": "draft_generated",
                "actor": requested_by,
                "created_at": created_at,
                "status": status,
                "qa_status": qa_status,
                "human_review_required": True,
                "official_document": False,
            }
        ],
        "created_by": requested_by,
        "updated_by": requested_by,
        "created_at": created_at,
        "updated_at": created_at,
    }


def update_document_draft(
    *,
    document: dict[str, Any],
    actor: str,
    content_md: str | None = None,
    status: str | None = None,
    review_notes: str | None = None,
) -> dict[str, Any]:
    updated = deepcopy(document)
    if status:
        allowed = ALLOWED_TRANSITIONS.get(updated["status"], set())
        if status != updated["status"] and status not in allowed:
            raise ValueError(f"transicion documental no permitida: {updated['status']} -> {status}")
        if status == "approved_by_human" and updated.get("blockers"):
            raise ValueError("no se puede aprobar con bloqueos criticos")
        updated["status"] = status
    if content_md is not None:
        updated["content_md"] = content_md
        updated["version"] = int(updated.get("version") or 1) + 1
        updated["versions"].append(
            {
                "version": updated["version"],
                "status": updated["status"],
                "content_md": content_md,
                "created_by": actor,
                "created_at": now_iso(),
                "notes": review_notes,
            }
        )
    updated["qa_status"] = "blocked" if updated.get("blockers") else ("ok" if updated["status"] == "approved_by_human" else "partial")
    updated["can_export_ok"] = updated["qa_status"] == "ok" and updated["status"] == "approved_by_human"
    updated["updated_by"] = actor
    updated["updated_at"] = now_iso()
    updated["review_history"].append(
        {
            "action": "human_review_update",
            "actor": actor,
            "created_at": updated["updated_at"],
            "status": updated["status"],
            "qa_status": updated["qa_status"],
            "notes": review_notes,
            "official_document": False,
        }
    )
    return updated


def export_gate(document: dict[str, Any]) -> dict[str, Any]:
    blockers = list(document.get("blockers") or [])
    if blockers:
        return {
            "document_id": document["id"],
            "qa_status": "blocked",
            "can_export_ok": False,
            "blockers": blockers,
            "warnings": document.get("warnings") or [],
        }
    if document.get("status") != "approved_by_human":
        return {
            "document_id": document["id"],
            "qa_status": "partial",
            "can_export_ok": False,
            "blockers": [{"code": "HUMAN_REVIEW_REQUIRED", "reason": "Falta aprobacion humana; no puede marcarse ok."}],
            "warnings": document.get("warnings") or [],
        }
    return {
        "document_id": document["id"],
        "qa_status": "ok",
        "can_export_ok": True,
        "blockers": [],
        "warnings": document.get("warnings") or [],
    }
