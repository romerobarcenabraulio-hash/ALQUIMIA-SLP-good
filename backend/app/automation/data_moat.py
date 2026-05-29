"""Fase 14 data moat: anonymous cross-tenant analytics with privacy gates."""
from __future__ import annotations

import re
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Literal

from app.automation.inference import PUBLIC_KNOWLEDGE_BASE

MIN_ANALYTICS_N = 5
NOUS_CORRECTION_EMERGING_N = 3
NOUS_GATE_OUTCOME_EMERGING_N = 8
NOUS_ESTABLISHED_N = 15
NOUS_ROBUST_N = 30

AllowedMetric = Literal[
    "generacion_rsu_por_tipo_municipio",
    "tasas_captura_por_fraccion",
    "tiempos_promedio_gates",
    "capex_opex_real_vs_modelo",
    "riesgos_materializados_categoria",
    "exito_cabildo_agregado",
    "desviaciones_operativas_recurrentes",
]

ALLOWED_METRICS: set[str] = {
    "generacion_rsu_por_tipo_municipio",
    "tasas_captura_por_fraccion",
    "tiempos_promedio_gates",
    "capex_opex_real_vs_modelo",
    "riesgos_materializados_categoria",
    "exito_cabildo_agregado",
    "desviaciones_operativas_recurrentes",
}

PRIVATE_KEYS = {
    "id",
    "tenant_id",
    "municipio_id",
    "nombre",
    "inegi_clave",
    "presidente_municipal",
    "regidores",
    "sindicos",
    "decisor_humano",
    "actor",
    "email",
}


class PrivacyPolicyError(ValueError):
    """Raised when an aggregate pattern could leak private tenant data."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def population_band(population: float | int | None) -> str:
    if population is None:
        return "poblacion_pendiente"
    if population < 100_000:
        return "menor_100k"
    if population < 500_000:
        return "100k_500k"
    if population < 1_000_000:
        return "500k_1m"
    return "mayor_1m"


def municipality_type(population: float | int | None) -> str:
    if population is None:
        return "tipo_pendiente"
    if population >= 1_000_000:
        return "capital_grande_o_metropolitano"
    if population >= 500_000:
        return "capital_media"
    if population >= 100_000:
        return "ciudad_intermedia"
    return "municipio_pequeno"


def region_bucket(estado: str | None) -> str:
    normalized = (estado or "").lower()
    if normalized in {"nuevo leon", "coahuila", "chihuahua", "sonora", "tamaulipas"}:
        return "norte"
    if normalized in {"san luis potosi", "queretaro", "guanajuato", "aguascalientes", "zacatecas"}:
        return "centro_bajio"
    if normalized:
        return "otra_region"
    return "region_pendiente"


def unwrap_value(value: Any) -> Any:
    if isinstance(value, dict) and "value" in value:
        return value.get("value")
    return value


def nested_get(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    current: Any = data
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def numeric_value(data: dict[str, Any], path: tuple[str, ...]) -> float | None:
    value = unwrap_value(nested_get(data, path))
    if isinstance(value, (int, float)):
        return float(value)
    return None


def analytics_consent_enabled(tenant: dict[str, Any]) -> bool:
    profile = tenant.get("municipal_profile") or {}
    automation = (profile.get("antecedentes") or {}).get("_automation") or {}
    consent = automation.get("analytics_consent") or tenant.get("analytics_consent") or {}
    return consent.get("aggregated_anonymous_analytics") is True


def tenant_private_record(tenant: dict[str, Any]) -> dict[str, Any]:
    profile = tenant.get("municipal_profile") or {}
    population = numeric_value(profile, ("antecedentes", "demografia", "poblacion"))
    kg_hab_dia = numeric_value(profile, ("antecedentes", "demografia", "generacion_kg_hab_dia"))
    return {
        "tenant_id": tenant.get("id"),
        "municipio_id": tenant.get("municipio_id"),
        "nombre": tenant.get("nombre"),
        "estado_mx": tenant.get("estado_mx"),
        "inegi_clave": tenant.get("inegi_clave"),
        "population": population,
        "kg_hab_dia": kg_hab_dia,
        "population_band": population_band(population),
        "municipality_type": municipality_type(population),
        "region_bucket": region_bucket(tenant.get("estado_mx")),
        "gates": deepcopy(tenant.get("gates") or []),
        "runtime": ((profile.get("antecedentes") or {}).get("_automation") or {}).get("runtime") or {},
        "profile": profile,
        "analytics_consent": analytics_consent_enabled(tenant),
    }


def public_knowledge_snapshot() -> dict[str, Any]:
    return {
        "store": "public_knowledge_base",
        "scope": "public",
        "record_count": len(PUBLIC_KNOWLEDGE_BASE),
        "fields": ["inegi_censo_2020_poblacion", "inegi_censo_2020_viviendas", "inferencia_generacion_kg_hab_dia"],
    }


def private_store_snapshot(tenants: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "store": "tenant_private_store",
        "scope": "tenant_private",
        "tenant_count": len(tenants),
        "cross_tenant_private_access": False,
        "private_records_not_returned": True,
    }


def aggregated_store_snapshot() -> dict[str, Any]:
    return {
        "store": "aggregated_anonymous_analytics",
        "scope": "anonymous_aggregate",
        "minimum_n": MIN_ANALYTICS_N,
        "consent_required": True,
        "identifiers_allowed": False,
    }


def forbidden_tokens_from_tenants(tenants: list[dict[str, Any]]) -> set[str]:
    tokens: set[str] = set()
    for tenant in tenants:
        for key in ("id", "municipio_id", "nombre", "inegi_clave"):
            value = tenant.get(key)
            if value:
                tokens.add(str(value).lower())
        profile = tenant.get("municipal_profile") or {}
        cabildo = (profile.get("antecedentes") or {}).get("cabildo") or {}
        for collection_key in ("regidores", "sindicos", "comisiones_permanentes"):
            for item in cabildo.get(collection_key) or []:
                if isinstance(item, dict):
                    for value in item.values():
                        if isinstance(value, str) and len(value) > 3:
                            tokens.add(value.lower())
    return tokens


def scan_for_identifiers(value: Any, forbidden_tokens: set[str], path: str = "") -> list[str]:
    leaks: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in PRIVATE_KEYS:
                leaks.append(f"{path}.{key}".strip("."))
            leaks.extend(scan_for_identifiers(child, forbidden_tokens, f"{path}.{key}".strip(".")))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            leaks.extend(scan_for_identifiers(child, forbidden_tokens, f"{path}[{index}]"))
    elif isinstance(value, str):
        lowered = value.lower()
        for token in forbidden_tokens:
            if token and token in lowered:
                leaks.append(path or "<root>")
    return leaks


def mean(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 4)


def build_pattern(metric: str, private_records: list[dict[str, Any]], minimum_n: int) -> dict[str, Any]:
    if metric == "generacion_rsu_por_tipo_municipio":
        grouped: dict[str, list[float]] = {}
        for record in private_records:
            if record["kg_hab_dia"] is None:
                continue
            grouped.setdefault(record["municipality_type"], []).append(record["kg_hab_dia"])
        return {
            "metric": metric,
            "pattern_id": f"PAT-{uuid.uuid4().hex[:10]}",
            "cohort": "municipios_comparables_anonimizados",
            "groups": [
                {"municipality_type": key, "n": len(values), "avg_kg_hab_dia": mean(values)}
                for key, values in sorted(grouped.items())
                if len(values) >= minimum_n
            ],
            "fields_used": ["population_band", "municipality_type", "kg_hab_dia"],
        }
    if metric == "tiempos_promedio_gates":
        return {
            "metric": metric,
            "pattern_id": f"PAT-{uuid.uuid4().hex[:10]}",
            "cohort": "gates_anonimizados",
            "groups": [{"gate": gate_id, "n": len(private_records), "avg_days": None, "status": "pendiente_datos_reales"} for gate_id in ("G1", "G2", "G3")],
            "fields_used": ["gate_id", "closed_at"],
        }
    return {
        "metric": metric,
        "pattern_id": f"PAT-{uuid.uuid4().hex[:10]}",
        "cohort": "analytics_anonimos",
        "groups": [{"n": len(private_records), "status": "pendiente_datos_reales"}],
        "fields_used": ["anonymous_operational_metric"],
    }


def build_anonymous_recommendation(pattern: dict[str, Any]) -> str:
    return (
        "Según análisis de municipios comparables anonimizados, este patrón puede orientar "
        "una revisión interna preliminar. No identifica municipios origen, no es patrón NOUS "
        "publicable y no debe presentarse como certeza universal."
    )


def validate_anonymous_output(pattern: dict[str, Any], tenants: list[dict[str, Any]], minimum_n: int) -> None:
    if pattern.get("cohort_n", 0) < minimum_n:
        raise PrivacyPolicyError("minimum_n_not_met")
    if not pattern.get("groups"):
        raise PrivacyPolicyError("no_anonymous_group_meets_minimum_n")
    leaks = scan_for_identifiers(pattern, forbidden_tokens_from_tenants(tenants))
    if leaks:
        raise PrivacyPolicyError(f"identifier_leak_detected: {', '.join(leaks[:5])}")


def aggregate_cross_tenant_pattern(
    *,
    tenants: list[dict[str, Any]],
    metric: str,
    requested_by: str,
    minimum_n: int = MIN_ANALYTICS_N,
) -> dict[str, Any]:
    if metric not in ALLOWED_METRICS:
        raise PrivacyPolicyError("metric_not_allowed")
    effective_minimum_n = max(int(minimum_n), MIN_ANALYTICS_N)
    all_private_records = [tenant_private_record(tenant) for tenant in tenants]
    private_records = [record for record in all_private_records if record.get("analytics_consent") is True]
    cohort_n = len(private_records)
    audit_id = str(uuid.uuid4())
    if cohort_n < effective_minimum_n:
        return {
            "status": "blocked",
            "reason": "minimum_n_not_met",
            "minimum_n": effective_minimum_n,
            "requested_minimum_n": minimum_n,
            "cohort_n": cohort_n,
            "total_tenants_seen": len(all_private_records),
            "consent_required": True,
            "metric": metric,
            "audit": {
                "audit_id": audit_id,
                "pattern_generated": False,
                "requested_by": requested_by,
                "created_at": now_iso(),
                "fields_used": [],
                "cohort_n": cohort_n,
                "total_tenants_seen": len(all_private_records),
                "shared_as_insight": False,
                "approved_by": None,
            },
        }
    pattern = build_pattern(metric, private_records, effective_minimum_n)
    pattern["cohort_n"] = cohort_n
    pattern["minimum_n"] = effective_minimum_n
    pattern["requested_minimum_n"] = minimum_n
    pattern["total_tenants_seen"] = len(all_private_records)
    pattern["consent_policy"] = "contract_opt_in_required"
    pattern["methodology"] = "Tenant private records are transformed into population bands and anonymous municipality types before aggregation."
    pattern["limitations"] = [
        "No identifica municipios origen.",
        "No debe presentarse como certeza universal.",
        "Municipios pequenos requieren cohortes suficientes para reducir reidentificacion indirecta.",
        "N=5 permite observacion agregada interna; no autoriza publicacion NOUS a clientes.",
    ]
    pattern["recommendation_phrase"] = build_anonymous_recommendation(pattern)
    pattern["insight_visibility"] = "internal_only"
    pattern["shareable_after_founder_approval"] = False
    pattern["shared_as_insight"] = False
    pattern["nous_status"] = "observational_only"
    pattern["nous_publication_eligible"] = False
    pattern["founder_gate_status"] = "not_started"
    pattern["bias_check_status"] = "not_run"
    pattern["publication_blocker"] = "NOUS requiere storage observacional, bias audit y founder gate antes de publicar patrones a clientes."
    pattern["nous_thresholds"] = {
        "correction_emerging_n": NOUS_CORRECTION_EMERGING_N,
        "gate_outcome_emerging_n": NOUS_GATE_OUTCOME_EMERGING_N,
        "established_n": NOUS_ESTABLISHED_N,
        "robust_n": NOUS_ROBUST_N,
    }
    try:
        validate_anonymous_output(pattern, tenants, effective_minimum_n)
    except PrivacyPolicyError as exc:
        return {
            "status": "blocked",
            "reason": str(exc),
            "minimum_n": effective_minimum_n,
            "requested_minimum_n": minimum_n,
            "cohort_n": cohort_n,
            "total_tenants_seen": len(all_private_records),
            "metric": metric,
            "audit": {
                "audit_id": audit_id,
                "pattern_generated": False,
                "requested_by": requested_by,
                "created_at": now_iso(),
                "fields_used": pattern.get("fields_used") or [],
                "cohort_n": cohort_n,
                "total_tenants_seen": len(all_private_records),
                "shared_as_insight": False,
                "approved_by": None,
            },
        }
    return {
        "status": "ready",
        "stores": {
            "tenant_private_store": private_store_snapshot(tenants),
            "public_knowledge_base": public_knowledge_snapshot(),
            "aggregated_anonymous_analytics": aggregated_store_snapshot(),
        },
        "pattern": pattern,
        "audit": {
            "audit_id": audit_id,
            "pattern_generated": True,
            "pattern_id": pattern["pattern_id"],
            "metric": metric,
            "cohort_n": cohort_n,
            "total_tenants_seen": len(all_private_records),
            "fields_used": pattern["fields_used"],
            "shared_as_insight": False,
            "approved_by": None,
            "requested_by": requested_by,
            "created_at": now_iso(),
        },
    }


def approve_internal_insight(pattern: dict[str, Any], actor: str, tenants: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    sanitized = deepcopy(pattern)
    if tenants is not None:
        validate_anonymous_output(sanitized, tenants, int(sanitized.get("minimum_n") or MIN_ANALYTICS_N))
    if sanitized.get("nous_publication_eligible") is not True:
        raise PrivacyPolicyError("nous_founder_bias_gate_required")
    if sanitized.get("bias_check_status") != "passed":
        raise PrivacyPolicyError("nous_bias_check_required")
    if sanitized.get("founder_gate_status") != "approved":
        raise PrivacyPolicyError("nous_founder_gate_required")
    sanitized["insight_visibility"] = "shareable_anonymous"
    sanitized["shared_as_insight"] = True
    sanitized["approved_by"] = actor
    sanitized["approved_at"] = now_iso()
    sanitized["recommendation_phrase"] = build_anonymous_recommendation(pattern)
    return sanitized
