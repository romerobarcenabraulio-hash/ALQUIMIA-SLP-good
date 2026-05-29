"""HERMES/KRONOS minimal automation layer for tenant inference.

This module intentionally avoids scraping or official claims. It creates a
traceable first-pass dossier from a small public-knowledge fixture and marks
missing or estimated data as preliminary until a human validates it.
"""
from __future__ import annotations

import json
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from app.automation.runtime import apply_runtime_event, gate_evidence_backlog

ConfidenceLevel = Literal[
    "verified",
    "inferred_high_confidence",
    "inferred_medium_confidence",
    "inferred_low_confidence",
]

HumanValidationState = Literal[
    "pending_human_validation",
    "human_validated",
    "pending_source",
]

PUBLIC_KNOWLEDGE_BASE: dict[str, dict[str, Any]] = {
    "24028": {
        "municipio": "San Luis Potosi",
        "estado": "San Luis Potosi",
        "inegi_censo_2020_poblacion": 911908,
        "inegi_censo_2020_viviendas": 256612,
        "inferencia_generacion_kg_hab_dia": 1.02,
        "reglamento_limpia": "Reglamento municipal de limpia identificado; validacion juridica pendiente",
        "fuente_base": "INEGI Censo 2020 + perfil municipal precargado SLP",
    },
    "22014": {
        "municipio": "Queretaro",
        "estado": "Queretaro",
        "inegi_censo_2020_poblacion": 1049777,
        "inegi_censo_2020_viviendas": 313037,
        "inferencia_generacion_kg_hab_dia": 1.03,
        "reglamento_limpia": None,
        "fuente_base": "INEGI Censo 2020",
    },
    "19039": {
        "municipio": "Monterrey",
        "estado": "Nuevo Leon",
        "inegi_censo_2020_poblacion": 1142994,
        "inegi_censo_2020_viviendas": 342952,
        "inferencia_generacion_kg_hab_dia": 1.08,
        "reglamento_limpia": None,
        "fuente_base": "INEGI Censo 2020",
    },
}

PUBLIC_SOURCE_CATALOG: tuple[dict[str, str], ...] = (
    {"id": "inegi", "label": "INEGI", "kind": "public"},
    {"id": "conapo", "label": "CONAPO", "kind": "public"},
    {"id": "semarnat", "label": "SEMARNAT", "kind": "public"},
    {"id": "periodico_oficial", "label": "Periodico Oficial", "kind": "public"},
    {"id": "transparencia", "label": "Plataforma Nacional de Transparencia", "kind": "public"},
    {"id": "sitio_municipal", "label": "Sitio oficial municipal", "kind": "public"},
    {"id": "prensa_local", "label": "Prensa local", "kind": "public"},
    {"id": "inafed", "label": "INAFED", "kind": "public"},
    {"id": "denue", "label": "DENUE INEGI", "kind": "public"},
    {"id": "banxico_cfe", "label": "Banxico/CFE", "kind": "public"},
)


class KosmosInferenceError(ValueError):
    """Raised when an inferred datum cannot be tied to a valid module schema."""


FIELD_SCHEMAS: dict[str, dict[str, Any]] = {
    "antecedentes.presidente_municipal": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.cabildo": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.estructura_administrativa": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.reglamento_de_limpia": {"module_id": "marco_legal", "type": "string"},
    "antecedentes.concesion_actual": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.programas_previos": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.prensa_24_meses": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.proximo_proceso_electoral": {"module_id": "antecedentes_municipales", "type": "object"},
    "antecedentes.demografia.poblacion": {"module_id": "city_baseline", "type": "number", "min": 1, "max": 30_000_000},
    "antecedentes.demografia.viviendas": {"module_id": "city_baseline", "type": "number", "min": 1, "max": 20_000_000},
    "antecedentes.demografia.generacion_kg_hab_dia": {"module_id": "city_baseline", "type": "number", "min": 0.05, "max": 5},
    "mapa_social.actores": {"module_id": "social_diagnostico", "type": "array"},
    "organigrama_servicio": {"module_id": "capacidad_institucional", "type": "object"},
}


@dataclass(frozen=True)
class TenantSeed:
    tenant_id: str
    nombre: str
    estado_mx: str
    municipio_id: str
    inegi_clave: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _registry_module_ids(registry: dict[str, Any]) -> set[str]:
    return {
        str(module.get("module_id"))
        for module in registry.get("modules", [])
        if module.get("module_id")
    }


def validate_inferred_datum(
    *,
    datum: dict[str, Any],
    field_path: str,
    registry: dict[str, Any],
) -> dict[str, Any]:
    """KOSMOS validation: module destination, type/range, traceability."""

    schema = FIELD_SCHEMAS.get(field_path)
    if not schema:
        raise KosmosInferenceError(f"inferencia sin schema KOSMOS: {field_path}")
    module_id = schema["module_id"]
    if module_id not in _registry_module_ids(registry):
        raise KosmosInferenceError(f"module destino no existe en capability_registry: {module_id}")
    if not datum.get("source", {}).get("extracted_at") or not datum.get("method") or not datum.get("confidence"):
        raise KosmosInferenceError(f"inferencia sin trazabilidad completa: {field_path}")
    if datum.get("official") is not False:
        raise KosmosInferenceError(f"inferencia marcada indebidamente como oficial: {field_path}")

    value = datum.get("value")
    pending = datum.get("human_validation_state") == "pending_source"
    expected = schema["type"]
    if value is None and pending:
        datum["module_id"] = module_id
        datum["field_path"] = field_path
        datum["kosmos_status"] = "accepted_pending_source"
        return datum
    if expected == "number":
        if not isinstance(value, (int, float)):
            raise KosmosInferenceError(f"inferencia numerica invalida: {field_path}")
        if value < schema.get("min", float("-inf")) or value > schema.get("max", float("inf")):
            raise KosmosInferenceError(f"inferencia fuera de rango: {field_path}")
    elif expected == "string":
        if not isinstance(value, str) or not value.strip():
            raise KosmosInferenceError(f"inferencia texto invalida: {field_path}")
    elif expected == "array":
        if not isinstance(value, list):
            raise KosmosInferenceError(f"inferencia array invalida: {field_path}")
    elif expected == "object":
        if not isinstance(value, dict):
            raise KosmosInferenceError(f"inferencia objeto invalida: {field_path}")
    datum["module_id"] = module_id
    datum["field_path"] = field_path
    datum["kosmos_status"] = "accepted"
    return datum


def inferred_value(
    *,
    value: Any,
    source_id: str,
    source_label: str,
    method: str,
    confidence: ConfidenceLevel,
    pending_reason: str | None = None,
) -> dict[str, Any]:
    validation_state: HumanValidationState = (
        "pending_source" if pending_reason else "pending_human_validation"
    )
    return {
        "value": value,
        "source": {
            "id": source_id,
            "label": source_label,
            "kind": "public",
            "extracted_at": _now_iso(),
        },
        "method": method,
        "confidence": confidence,
        "human_validation_state": validation_state,
        "display_status": "dato preliminar pendiente de validacion",
        "official": False,
        "pending_reason": pending_reason,
    }


def pending_value(label: str, source_id: str, reason: str) -> dict[str, Any]:
    return inferred_value(
        value=None,
        source_id=source_id,
        source_label=label,
        method="public_source_unavailable",
        confidence="inferred_low_confidence",
        pending_reason=reason,
    )


def kosmos_value(
    *,
    field_path: str,
    registry: dict[str, Any],
    value: Any,
    source_id: str,
    source_label: str,
    method: str,
    confidence: ConfidenceLevel,
    pending_reason: str | None = None,
) -> dict[str, Any]:
    return validate_inferred_datum(
        datum=inferred_value(
            value=value,
            source_id=source_id,
            source_label=source_label,
            method=method,
            confidence=confidence,
            pending_reason=pending_reason,
        ),
        field_path=field_path,
        registry=registry,
    )


def kosmos_pending(field_path: str, registry: dict[str, Any], label: str, source_id: str, reason: str) -> dict[str, Any]:
    return validate_inferred_datum(
        datum=pending_value(label, source_id, reason),
        field_path=field_path,
        registry=registry,
    )


def _registry_dependencies(registry: dict[str, Any], changed_module: str) -> list[str]:
    result: list[str] = []
    for module in registry.get("modules", []):
        depends_on = module.get("depends_on") or []
        if changed_module in depends_on:
            result.append(module["module_id"])
    return sorted(result)


def run_initial_inference(seed: TenantSeed, registry: dict[str, Any]) -> dict[str, Any]:
    """Create a partial, traceable first-login dossier for a tenant."""

    now = _now_iso()
    public_record = deepcopy(PUBLIC_KNOWLEDGE_BASE.get(seed.inegi_clave, {}))
    source_label = public_record.get("fuente_base", "Fuente publica pendiente")
    population = public_record.get("inegi_censo_2020_poblacion")
    viviendas = public_record.get("inegi_censo_2020_viviendas")
    generation = public_record.get("inferencia_generacion_kg_hab_dia")
    reglamento = public_record.get("reglamento_limpia")

    antecedentes = {
        "presidente_municipal": kosmos_pending(
            "antecedentes.presidente_municipal",
            registry,
            "Sitio oficial municipal",
            "sitio_municipal",
            "Pendiente carga/verificacion de autoridades vigentes",
        ),
        "cabildo": {
            "regidores": [],
            "sindicos": [],
            "comisiones_permanentes": [],
            "source": kosmos_pending(
                "antecedentes.cabildo",
                registry,
                "Sitio oficial municipal",
                "sitio_municipal",
                "Pendiente validacion humana de cabildo",
            ),
        },
        "estructura_administrativa": kosmos_pending(
            "antecedentes.estructura_administrativa",
            registry,
            "Plataforma Nacional de Transparencia",
            "transparencia",
            "Pendiente consulta/validacion de transparencia",
        ),
        "reglamento_de_limpia": (
            kosmos_value(
                field_path="antecedentes.reglamento_de_limpia",
                registry=registry,
                value=reglamento,
                source_id="periodico_oficial",
                source_label="Periodico Oficial / reglamento municipal",
                method="public_document_lookup",
                confidence="inferred_high_confidence",
            )
            if reglamento
            else kosmos_pending(
                "antecedentes.reglamento_de_limpia",
                registry,
                "Periodico Oficial",
                "periodico_oficial",
                "Reglamento no precargado; requiere busqueda o carga municipal",
            )
        ),
        "concesion_actual": kosmos_pending(
            "antecedentes.concesion_actual",
            registry,
            "Transparencia municipal",
            "transparencia",
            "Dato confidencial o no localizado en fuente publica confiable",
        ),
        "programas_previos": kosmos_pending(
            "antecedentes.programas_previos",
            registry,
            "Prensa local 24 meses",
            "prensa_local",
            "Pendiente barrido de prensa local",
        ),
        "prensa_24_meses": kosmos_pending(
            "antecedentes.prensa_24_meses",
            registry,
            "Prensa local 24 meses",
            "prensa_local",
            "Pendiente barrido de prensa local",
        ),
        "proximo_proceso_electoral": kosmos_pending(
            "antecedentes.proximo_proceso_electoral",
            registry,
            "Calendario electoral publico",
            "inafed",
            "Pendiente verificacion del calendario local",
        ),
        "demografia": {
            "poblacion": (
                kosmos_value(
                    field_path="antecedentes.demografia.poblacion",
                    registry=registry,
                    value=population,
                    source_id="inegi",
                    source_label=source_label,
                    method="inegi_censo_2020_seed",
                    confidence="inferred_high_confidence",
                )
                if population
                else kosmos_pending("antecedentes.demografia.poblacion", registry, "INEGI", "inegi", "Clave INEGI sin fixture de poblacion")
            ),
            "viviendas": (
                kosmos_value(
                    field_path="antecedentes.demografia.viviendas",
                    registry=registry,
                    value=viviendas,
                    source_id="inegi",
                    source_label=source_label,
                    method="inegi_censo_2020_seed",
                    confidence="inferred_high_confidence",
                )
                if viviendas
                else kosmos_pending("antecedentes.demografia.viviendas", registry, "INEGI", "inegi", "Clave INEGI sin fixture de viviendas")
            ),
            "generacion_kg_hab_dia": (
                kosmos_value(
                    field_path="antecedentes.demografia.generacion_kg_hab_dia",
                    registry=registry,
                    value=generation,
                    source_id="semarnat",
                    source_label="SEMARNAT / benchmark publico",
                    method="benchmark_publico_por_tipo_municipio",
                    confidence="inferred_medium_confidence",
                )
                if generation
                else kosmos_pending("antecedentes.demografia.generacion_kg_hab_dia", registry, "SEMARNAT", "semarnat", "Factor no precargado")
            ),
        },
        "_automation": {
            "public_knowledge_base": {
                "store": "public_knowledge_base",
                "scope": "public",
                "source_catalog": list(PUBLIC_SOURCE_CATALOG),
                "record_key": seed.inegi_clave,
            },
            "tenant_private_store": {
                "store": "tenant_private_store",
                "scope": "tenant_private",
                "tenant_id": seed.tenant_id,
                "cross_tenant_private_access": False,
            },
            "inference": {
                "status": "partial" if not public_record else "completed_with_pending_fields",
                "started_at": now,
                "completed_at": now,
                "max_runtime_minutes": 15,
                "human_decision_required": True,
                "official_documents_auto_sent": False,
                "kosmos_schema_validation": "accepted",
            },
            "runtime": {
                "last_recalculation": None,
                "recalculated_modules": [],
                "discrepancies": [],
                "gate_evidence_backlog": _gate_evidence_backlog([]),
            },
            "document_automation": {
                "status": "draft_ready_structure",
                "official_send_enabled": False,
                "requires_human_review": True,
            },
        },
    }

    mapa_social = {
        "actores": [],
        "municipio_scope": seed.municipio_id,
        "zm_scope_copied": False,
        "source": kosmos_pending(
            "mapa_social.actores",
            registry,
            "Prensa local / sitio municipal / transparencia",
            "prensa_local",
            "Pendiente inferencia de actores; no se copian actores entre municipios",
        ),
    }
    organigrama_servicio = {
        "direcciones_relevantes": [],
        "roles_operativos": [],
        "turnos": [],
        "horarios": [],
        "source": kosmos_pending(
            "organigrama_servicio",
            registry,
            "Transparencia municipal",
            "transparencia",
            "Pendiente organigrama publico validado",
        ),
    }

    active_modules = [
        module["module_id"]
        for module in registry.get("modules", [])
        if module.get("default_active") and "validation" in module.get("platforms", [])
    ]
    return {
        "mode": "carga_inicial",
        "antecedentes": antecedentes,
        "mapa_social": mapa_social,
        "organigrama_servicio": organigrama_servicio,
        "provenance_status": "preliminar_pendiente_validacion",
        "updated_by": "hermes_initial_inference",
        "updated_at": now,
        "active_modules": active_modules,
    }


def _extract_numeric(profile: dict[str, Any], path: tuple[str, ...]) -> float | None:
    current: Any = profile
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    if isinstance(current, dict) and "value" in current:
        current = current["value"]
    if isinstance(current, (int, float)):
        return float(current)
    return None


def _gate_evidence_backlog(gates: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    return gate_evidence_backlog(gates)


def apply_runtime_automation(
    *,
    existing_profile: dict[str, Any] | None,
    updated_payload: dict[str, Any],
    registry: dict[str, Any],
    gates: list[dict[str, Any]] | None,
) -> dict[str, Any]:
    """Mark recalculations/discrepancies after client/admin updates tenant data."""
    return apply_runtime_event(
        existing_profile=existing_profile,
        updated_payload=updated_payload,
        registry=registry,
        gates=gates,
        event_type="dato_actualizado_por_cliente",
        event_payload={"trigger": "tenant_profile_patch"},
    )


def automation_summary(profile: dict[str, Any] | None) -> dict[str, Any]:
    profile = profile or {}
    automation = (profile.get("antecedentes") or {}).get("_automation") or {}
    runtime = automation.get("runtime") or {}
    return {
        "preliminary_notice": "dato preliminar pendiente de validacion",
        "public_private_separation": {
            "public_store": (automation.get("public_knowledge_base") or {}).get("store"),
            "tenant_private_store": (automation.get("tenant_private_store") or {}).get("store"),
            "cross_tenant_private_access": (automation.get("tenant_private_store") or {}).get("cross_tenant_private_access") is True,
        },
        "inference": automation.get("inference") or {},
        "runtime": runtime,
        "document_automation": automation.get("document_automation") or {},
    }
