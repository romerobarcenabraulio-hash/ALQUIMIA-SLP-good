"""NOUS observational layer.

This module records observations and detects internal patterns for supervised
review. It does not publish insights, recalibrate priors, or suggest actions to
clients.
"""
from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import datetime, timezone
from collections import defaultdict
from typing import Any, Literal

ValidationAction = Literal["confirm", "adjust", "replace", "not_applicable"]
GateOutcome = Literal["cerrado_exitoso", "fallido", "diferido", "cerrado_con_modificaciones"]
MeasurementQuality = Literal["alta", "media", "baja"]
PatternReviewAction = Literal["approve_internal", "reject", "postpone", "retire"]

LAYER1_MIN_SIMILAR_CORRECTIONS = 3
LAYER1_ALLOWED_ACTIONS = {"adjust", "replace"}
LAYER2_EMERGING_N = 8
LAYER2_ESTABLISHED_N = 15
LAYER2_ROBUST_N = 30
LAYER3_MIN_MONTHS = 6
LAYER3_MIN_TENANTS = 3
LAYER3_ALLOWED_MODULES = {"M01", "M09", "M13", "M17", "city_baseline", "costos_programa", "escenarios_financieros", "monitoreo_operativo"}
LAYER3_MODULE_ALIASES = {
    "city_baseline": "M01",
    "costos_programa": "M09",
    "escenarios_financieros": "M13",
    "monitoreo_operativo": "M17",
}
PATTERN_STATES = {
    "draft_observed",
    "pending_auditor_review",
    "pending_founder_gate",
    "approved_internal",
    "rejected",
    "retired",
}
REQUIRED_MODULE_STATE_KEYS = {
    "data_completeness_pct",
    "validation_pct",
    "key_metrics",
    "recommendations_accepted",
    "recommendations_rejected",
    "rejected_reasons",
}

PROTECTED_POLITICAL_KEYS = {
    "partido",
    "partido_politico",
    "lidera_fraccion",
    "fracciones_politicas",
    "political_party",
}
PERSONAL_KEYS = {
    "nombre",
    "presidente_municipal",
    "regidores",
    "sindicos",
    "titular",
    "integrantes_regidor",
    "presidente_regidor",
    "secretario_tecnico",
    "email",
    "telefono",
}
ALLOWED_POLITICAL_CONTEXT_KEYS = {
    "cabildo_composition",
    "opposition_pct",
    "elections_proximity_months",
    "media_coverage_sentiment",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def tenant_has_aggregate_opt_in(tenant: dict[str, Any]) -> bool:
    if tenant.get("analytics_aggregate_opt_in") is True:
        return True
    consent = tenant.get("analytics_consent") or {}
    if consent.get("aggregated_anonymous_analytics") is True:
        return True
    profile = tenant.get("municipal_profile") or {}
    automation = ((profile.get("antecedentes") or {}).get("_automation") or {})
    profile_consent = automation.get("analytics_consent") or {}
    return profile_consent.get("aggregated_anonymous_analytics") is True


def aggregate_decision(tenant: dict[str, Any]) -> tuple[bool, str | None]:
    if tenant_has_aggregate_opt_in(tenant):
        return True, None
    return False, "tenant_without_aggregate_opt_in"


def _band_population(value: Any) -> str:
    try:
        population = float(value)
    except (TypeError, ValueError):
        return "poblacion_pendiente"
    if population < 50_000:
        return "menos_50k"
    if population < 200_000:
        return "50k_200k"
    if population < 500_000:
        return "200k_500k"
    if population < 1_000_000:
        return "500k_1M"
    return "mas_1M"


def _region_bucket(estado: str | None) -> str:
    normalized = (estado or "").lower()
    if normalized in {"nuevo leon", "coahuila", "chihuahua", "sonora", "tamaulipas"}:
        return "norte"
    if normalized in {"san luis potosi", "queretaro", "guanajuato", "aguascalientes", "zacatecas"}:
        return "centro"
    if normalized:
        return "otra_region"
    return "region_pendiente"


def _unwrap_value(value: Any) -> Any:
    if isinstance(value, dict) and "value" in value:
        return value.get("value")
    if isinstance(value, dict) and "valor" in value:
        return value.get("valor")
    return value


def _nested_get(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    current: Any = data
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def sanitize_municipality_profile(tenant: dict[str, Any]) -> dict[str, Any]:
    """Return only non-identifying profile fields allowed for future aggregate analysis."""
    profile = tenant.get("municipal_profile") or {}
    antecedentes = profile.get("antecedentes") or {}
    demografia = antecedentes.get("demografia") or {}
    population = _unwrap_value(demografia.get("poblacion"))
    return {
        "population_range": _band_population(population),
        "region": _region_bucket(tenant.get("estado_mx")),
        "tier": tenant.get("tier_comercial") or "diagnostico",
        "municipality_profile_source": "sanitized_observational_profile",
        "protected_variables_excluded": sorted(PROTECTED_POLITICAL_KEYS | PERSONAL_KEYS),
    }


def sanitize_political_context(context: dict[str, Any] | None) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}
    for key, value in (context or {}).items():
        if key in ALLOWED_POLITICAL_CONTEXT_KEYS:
            sanitized[key] = value
    sanitized["excluded_fields"] = sorted(PROTECTED_POLITICAL_KEYS | PERSONAL_KEYS)
    return sanitized


def normalize_module_state_at_close(module_state: dict[str, Any] | None) -> dict[str, Any]:
    """Normalize a gate outcome snapshot without inventing module evidence."""
    raw = deepcopy(module_state or {})
    normalized = {
        "data_completeness_pct": raw.get("data_completeness_pct"),
        "validation_pct": raw.get("validation_pct"),
        "key_metrics": deepcopy(raw.get("key_metrics") or {}),
        "recommendations_accepted": deepcopy(raw.get("recommendations_accepted") or []),
        "recommendations_rejected": deepcopy(raw.get("recommendations_rejected") or []),
        "rejected_reasons": deepcopy(raw.get("rejected_reasons") or []),
    }
    missing = sorted(key for key in REQUIRED_MODULE_STATE_KEYS if key not in raw)
    normalized["snapshot_schema"] = "GateOutcomeSnapshot.v1"
    normalized["missing_snapshot_fields"] = missing
    normalized["snapshot_complete"] = not missing
    return normalized


def source_for_field(tenant: dict[str, Any], field_id: str) -> dict[str, Any]:
    profile = tenant.get("municipal_profile") or {}
    raw = _nested_get(profile, tuple(part for part in field_id.split(".") if part))
    if isinstance(raw, dict):
        source = raw.get("source") or raw.get("fuente") or {}
        return {
            "source_id": source.get("id") or source.get("nombre") or "source_pending",
            "source_label": source.get("label") or source.get("nombre") or "Fuente pendiente",
            "source_kind": source.get("kind") or "pending",
            "source_date": source.get("extracted_at") or source.get("fecha"),
            "method": raw.get("method") or "observational_capture",
            "confidence": raw.get("confidence") or "pending_human_validation",
        }
    return {
        "source_id": "source_pending",
        "source_label": "Fuente pendiente",
        "source_kind": "pending",
        "source_date": None,
        "method": "observational_capture",
        "confidence": "pending_human_validation",
    }


def numeric_delta(inferred_value: Any, corrected_value: Any) -> float | None:
    inferred = _unwrap_value(inferred_value)
    corrected = _unwrap_value(corrected_value)
    if not isinstance(inferred, (int, float)) or not isinstance(corrected, (int, float)):
        return None
    if inferred == 0:
        return None
    return round(((corrected - inferred) / inferred) * 100, 4)


def _delta_direction(delta_percentage: Any) -> str:
    if not isinstance(delta_percentage, (int, float)):
        return "delta_pending"
    if delta_percentage > 0:
        return "cliente_ajusto_al_alza"
    if delta_percentage < 0:
        return "cliente_ajusto_a_la_baja"
    return "sin_delta"


def _contains_forbidden_learning_key(path: str | None) -> bool:
    normalized = (path or "").lower().replace("-", "_")
    parts = {part for part in normalized.split(".") if part}
    forbidden = {key.lower() for key in PROTECTED_POLITICAL_KEYS | PERSONAL_KEYS}
    return bool(parts & forbidden)


def audit_payload(actor: str, module_id: str, included: bool, reason: str | None) -> dict[str, Any]:
    return {
        "registered_by": actor,
        "registered_at": now_iso(),
        "source_module": module_id,
        "included_in_aggregate": included,
        "aggregate_exclusion_reason": reason,
        "observational_only": True,
        "published_to_clients": False,
        "automatic_pattern_detection": False,
    }


def record_inference_correction(
    *,
    tenant: dict[str, Any],
    module_id: str,
    field_id: str,
    inferred_value: Any,
    validation_action: ValidationAction,
    corrected_value: Any,
    corrected_by_role: str,
    actor: str,
) -> dict[str, Any]:
    included, reason = aggregate_decision(tenant)
    correction = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant["id"],
        "module_id": module_id,
        "field_id": field_id,
        "inferred_value": deepcopy(inferred_value),
        "validation_action": validation_action,
        "corrected_value": deepcopy(corrected_value),
        "delta_percentage": numeric_delta(inferred_value, corrected_value),
        "corrected_by_role": corrected_by_role,
        "corrected_at": now_iso(),
        "source_used_for_inference": source_for_field(tenant, field_id),
        "municipality_profile": sanitize_municipality_profile(tenant),
        "included_in_aggregate": included,
        "aggregate_exclusion_reason": reason,
        "audit": audit_payload(actor, module_id, included, reason),
    }
    return correction


def record_gate_outcome(
    *,
    tenant: dict[str, Any],
    gate: str,
    outcome: GateOutcome,
    days_to_close: int,
    module_state_at_close: dict[str, Any],
    political_context: dict[str, Any] | None,
    payer_configuration: str | None,
    actor: str,
) -> dict[str, Any]:
    included, reason = aggregate_decision(tenant)
    result = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant["id"],
        "gate": gate,
        "outcome": outcome,
        "closed_at": now_iso(),
        "days_to_close": days_to_close,
        "module_state_at_close": normalize_module_state_at_close(module_state_at_close),
        "municipality_profile": sanitize_municipality_profile(tenant),
        "political_context": sanitize_political_context(political_context),
        "payer_configuration": payer_configuration,
        "included_in_aggregate": included,
        "aggregate_exclusion_reason": reason,
        "audit": audit_payload(actor, gate, included, reason),
    }
    return result


def record_projection_delta(
    *,
    tenant: dict[str, Any],
    module_id: str,
    metric_id: str,
    projected_value: float,
    actual_value: float,
    measurement_period: str,
    measurement_quality: MeasurementQuality,
    actor: str,
) -> dict[str, Any]:
    included, reason = aggregate_decision(tenant)
    delta_absolute = round(actual_value - projected_value, 4)
    delta_percentage = round((delta_absolute / projected_value) * 100, 4) if projected_value else 0
    if delta_absolute > 0:
        direction = "subestimacion"
    elif delta_absolute < 0:
        direction = "sobreestimacion"
    else:
        direction = "exacto"
    return {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant["id"],
        "module_id": module_id,
        "metric_id": metric_id,
        "projected_value": projected_value,
        "actual_value": actual_value,
        "measurement_period": measurement_period,
        "delta_absolute": delta_absolute,
        "delta_percentage": delta_percentage,
        "delta_direction": direction,
        "measurement_quality": measurement_quality,
        "municipality_profile": sanitize_municipality_profile(tenant),
        "included_in_aggregate": included,
        "aggregate_exclusion_reason": reason,
        "audit": audit_payload(actor, module_id, included, reason),
    }


def create_pending_pattern(
    *,
    pattern_layer: int,
    pattern_description_natural: str,
    pattern_description_technical: dict[str, Any],
    observations_count: int,
    contributing_tenant_profiles: list[dict[str, Any]],
    actor: str,
) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "pattern_layer": pattern_layer,
        "pattern_status": "draft_observed",
        "pattern_description_natural": pattern_description_natural,
        "pattern_description_technical": deepcopy(pattern_description_technical),
        "observations_count": observations_count,
        "confidence_level": "emergente_interno" if observations_count >= LAYER1_MIN_SIMILAR_CORRECTIONS else "pending_insufficient_data",
        "statistical_significance": None,
        "contributing_tenant_profiles": deepcopy(contributing_tenant_profiles),
        "bias_check_status": "not_run",
        "founder_gate_status": "pending",
        "published_to_clients": False,
        "retired_at": None,
        "retired_reason": None,
        "audit": {
            "registered_by": actor,
            "registered_at": now_iso(),
            "observational_only": True,
            "automatic_publication": False,
        },
        "created_at": now_iso(),
    }


def _confidence_for_layer2(n: int) -> str:
    if n >= LAYER2_ROBUST_N:
        return "robusto"
    if n >= LAYER2_ESTABLISHED_N:
        return "establecido"
    if n >= LAYER2_EMERGING_N:
        return "emergente"
    return "insufficient_gate_outcomes"


def _confidence_for_layer3(months: int, tenants: int) -> str:
    if months >= 12 and tenants >= 5:
        return "recalibracion_establecida_interna"
    if months >= LAYER3_MIN_MONTHS and tenants >= LAYER3_MIN_TENANTS:
        return "recalibracion_emergente_interna"
    return "insufficient_projection_deltas"


def _wilson_interval(successes: int, n: int, z: float = 1.96) -> dict[str, float | int]:
    if n <= 0:
        return {"n": n, "successes": successes, "low": 0.0, "high": 0.0, "proportion": 0.0}
    p = successes / n
    denominator = 1 + (z**2 / n)
    centre = p + (z**2 / (2 * n))
    margin = z * ((p * (1 - p) + z**2 / (4 * n)) / n) ** 0.5
    return {
        "n": n,
        "successes": successes,
        "proportion": round(p, 4),
        "low": round((centre - margin) / denominator, 4),
        "high": round((centre + margin) / denominator, 4),
    }


def _layer2_group_key(outcome: dict[str, Any]) -> tuple[str, str, str, str, str]:
    profile = outcome.get("municipality_profile") or {}
    context = outcome.get("political_context") or {}
    opposition = context.get("opposition_pct")
    try:
        opposition_value = float(opposition)
        if opposition_value >= 50:
            opposition_band = "oposicion_mayoritaria"
        elif opposition_value >= 35:
            opposition_band = "oposicion_relevante"
        else:
            opposition_band = "oposicion_baja_o_pendiente"
    except (TypeError, ValueError):
        opposition_band = "oposicion_pendiente"
    return (
        outcome.get("gate") or "gate_pending",
        profile.get("population_range") or "poblacion_pendiente",
        profile.get("region") or "region_pendiente",
        outcome.get("payer_configuration") or "payer_pending",
        opposition_band,
    )


def _is_layer2_eligible(outcome: dict[str, Any]) -> bool:
    if outcome.get("included_in_aggregate") is not True:
        return False
    political_context = outcome.get("political_context") or {}
    for key in political_context:
        if key in PROTECTED_POLITICAL_KEYS or key in PERSONAL_KEYS:
            return False
    module_state = outcome.get("module_state_at_close") or {}
    return bool(module_state.get("snapshot_schema") == "GateOutcomeSnapshot.v1")


def detect_layer2_gate_outcome_patterns(
    outcomes: list[dict[str, Any]],
    existing_patterns: list[dict[str, Any]] | None = None,
    *,
    actor: str,
) -> list[dict[str, Any]]:
    """Detect internal layer-2 gate patterns from opt-in gate outcomes only."""
    existing_patterns = existing_patterns or []
    seen_keys = {
        tuple((pattern.get("pattern_description_technical") or {}).get("pattern_key") or [])
        for pattern in existing_patterns
        if pattern.get("pattern_layer") == 2 and (pattern.get("pattern_description_technical") or {}).get("pattern_key")
    }
    grouped: dict[tuple[str, str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for outcome in outcomes:
        if _is_layer2_eligible(outcome):
            grouped[_layer2_group_key(outcome)].append(outcome)

    patterns: list[dict[str, Any]] = []
    for key, items in grouped.items():
        if len(items) < LAYER2_EMERGING_N or key in seen_keys:
            continue
        gate, population_range, region, payer_configuration, opposition_band = key
        outcome_counts: dict[str, int] = defaultdict(int)
        for item in items:
            outcome_counts[str(item.get("outcome"))] += 1
        successful = outcome_counts.get("cerrado_exitoso", 0) + outcome_counts.get("cerrado_con_modificaciones", 0)
        interval = _wilson_interval(successful, len(items))
        confidence = _confidence_for_layer2(len(items))
        natural = (
            f"Se observaron {len(items)} outcomes de {gate} en municipios comparables "
            f"({population_range}, {region}, {opposition_band}). "
            f"La proporción de cierre exitoso o con modificaciones fue {interval['proportion']}. "
            "Patron interno de gate; no publicable al cliente sin bias check y founder gate."
        )
        pattern = create_pending_pattern(
            pattern_layer=2,
            pattern_description_natural=natural,
            pattern_description_technical={
                "pattern_key": list(key),
                "gate": gate,
                "municipality_profile_comparable": {
                    "population_range": population_range,
                    "region": region,
                    "opposition_band": opposition_band,
                    "payer_configuration": payer_configuration,
                },
                "outcome_counts": dict(outcome_counts),
                "success_definition": ["cerrado_exitoso", "cerrado_con_modificaciones"],
                "success_proportion": interval["proportion"],
                "confidence_interval_95": {"low": interval["low"], "high": interval["high"]},
                "statistical_methods": {
                    "counts": True,
                    "proportions": True,
                    "wilson_interval_95": True,
                    "fisher_exact": "not_applied_single_cohort",
                },
                "outcome_ids": [item.get("id") for item in items],
                "publication_block": "client_publication_forbidden_until_bias_check_and_founder_gate",
                "automatic_gate_change": False,
                "client_visible": False,
            },
            observations_count=len(items),
            contributing_tenant_profiles=[item.get("municipality_profile") or {} for item in items],
            actor=actor,
        )
        pattern["confidence_level"] = confidence
        pattern["statistical_significance"] = (
            f"n={len(items)}; success_proportion={interval['proportion']}; "
            f"wilson_95_ci={interval['low']}-{interval['high']}; fisher_exact=not_applied_single_cohort"
        )
        patterns.append(pattern)
    return patterns


def _layer3_group_key(delta: dict[str, Any]) -> tuple[str, str, str, str, str]:
    profile = delta.get("municipality_profile") or {}
    return (
        delta.get("module_id") or "module_pending",
        delta.get("metric_id") or "metric_pending",
        profile.get("population_range") or "poblacion_pendiente",
        profile.get("region") or "region_pendiente",
        delta.get("delta_direction") or "direction_pending",
    )


def _is_layer3_eligible(delta: dict[str, Any]) -> bool:
    if delta.get("included_in_aggregate") is not True:
        return False
    if delta.get("module_id") not in LAYER3_ALLOWED_MODULES:
        return False
    if not isinstance(delta.get("delta_percentage"), (int, float)):
        return False
    if not delta.get("measurement_period"):
        return False
    return delta.get("measurement_quality") in {"alta", "media"}


def _mean(values: list[float]) -> float:
    return round(sum(values) / len(values), 4) if values else 0.0


def _stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    avg = sum(values) / len(values)
    variance = sum((value - avg) ** 2 for value in values) / (len(values) - 1)
    return round(variance**0.5, 4)


def _bayesian_update(prior: float, observations: list[float], prior_weight: int = 3) -> dict[str, Any]:
    likelihood = _mean(observations)
    posterior = round(((prior * prior_weight) + sum(observations)) / (prior_weight + len(observations)), 4)
    return {
        "formula": "posterior = ((prior * prior_weight) + sum(observations)) / (prior_weight + n)",
        "prior": prior,
        "prior_weight": prior_weight,
        "observations": observations,
        "likelihood_mean": likelihood,
        "posterior": posterior,
        "replicable": True,
        "applied": False,
        "requires_founder_approval": True,
    }


def marcos_standards_check_for_recalibration(module_id: str, standards_map: dict[str, Any] | None) -> dict[str, Any]:
    """Return the MARCOS review envelope; it never approves a recalibration automatically."""
    canonical_module_id = LAYER3_MODULE_ALIASES.get(module_id, module_id)
    modules = (standards_map or {}).get("modules") or []
    module_entry = next((item for item in modules if item.get("module_id") == canonical_module_id), None)
    standards = (module_entry or {}).get("standards") or []
    standard_codes = [item.get("code") for item in standards if item.get("code")]
    status = "requires_human_review" if standard_codes else "blocked_missing_standard"
    return {
        "status": status,
        "module_id": canonical_module_id,
        "standards_codes": standard_codes,
        "standards_count": len(standard_codes),
        "contradiction_detected": False,
        "automatic_publication": False,
        "human_review_required": True,
        "message": (
            "MARCOS requiere revision humana contra standards_map antes de aplicar o publicar."
            if standard_codes
            else "MARCOS bloquea la propuesta porque no hay estandar aplicable registrado."
        ),
    }


def detect_layer3_projection_delta_patterns(
    deltas: list[dict[str, Any]],
    existing_patterns: list[dict[str, Any]] | None = None,
    *,
    actor: str,
    standards_map: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Detect internal layer-3 projection-delta patterns without applying recalibration."""
    existing_patterns = existing_patterns or []
    seen_keys = {
        tuple((pattern.get("pattern_description_technical") or {}).get("pattern_key") or [])
        for pattern in existing_patterns
        if pattern.get("pattern_layer") == 3 and (pattern.get("pattern_description_technical") or {}).get("pattern_key")
    }
    grouped: dict[tuple[str, str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for delta in deltas:
        if _is_layer3_eligible(delta):
            grouped[_layer3_group_key(delta)].append(delta)

    patterns: list[dict[str, Any]] = []
    for key, items in grouped.items():
        periods = sorted({str(item.get("measurement_period")) for item in items if item.get("measurement_period")})
        tenant_ids = sorted({str(item.get("tenant_id")) for item in items if item.get("tenant_id")})
        if len(periods) < LAYER3_MIN_MONTHS or len(tenant_ids) < LAYER3_MIN_TENANTS or key in seen_keys:
            continue
        module_id, metric_id, population_range, region, delta_direction = key
        delta_percentages = [float(item["delta_percentage"]) for item in items]
        average_delta = _mean(delta_percentages)
        deviation = _stdev(delta_percentages)
        consistency = round(
            sum(1 for value in delta_percentages if (value >= 0) == (average_delta >= 0)) / len(delta_percentages),
            4,
        )
        prior = 0.0
        recalibration = _bayesian_update(prior, delta_percentages)
        confidence = _confidence_for_layer3(len(periods), len(tenant_ids))
        natural = (
            f"Se observaron {len(items)} deltas proyectado vs real en {module_id}/{metric_id} "
            f"durante {len(periods)} meses y {len(tenant_ids)} tenants comparables "
            f"({population_range}, {region}). La media del delta fue {average_delta}% "
            f"con desviacion {deviation}. Propuesta interna de recalibracion supervisada; no aplicada."
        )
        pattern = create_pending_pattern(
            pattern_layer=3,
            pattern_description_natural=natural,
            pattern_description_technical={
                "pattern_key": list(key),
                "module_id": module_id,
                "metric_id": metric_id,
                "municipality_profile_comparable": {
                    "population_range": population_range,
                    "region": region,
                },
                "measurement_periods": periods,
                "tenant_count": len(tenant_ids),
                "delta_direction": delta_direction,
                "delta_mean_percentage": average_delta,
                "delta_standard_deviation": deviation,
                "consistency": consistency,
                "recalibration_proposal": recalibration,
                "changelog_required_before_apply": True,
                "retroactive_to_validated_inferences": False,
                "automatic_apply": False,
                "client_visible": False,
                "marcos_standards_check_required": True,
                "marcos_standards_check": marcos_standards_check_for_recalibration(module_id, standards_map),
                "publication_block": "requires_auditor_bias_review_marcos_check_and_founder_gate",
                "delta_ids": [item.get("id") for item in items],
            },
            observations_count=len(items),
            contributing_tenant_profiles=[item.get("municipality_profile") or {} for item in items],
            actor=actor,
        )
        pattern["confidence_level"] = confidence
        pattern["statistical_significance"] = (
            f"months={len(periods)}; tenants={len(tenant_ids)}; n={len(items)}; "
            f"mean_delta={average_delta}; stdev={deviation}; consistency={consistency}; "
            "bayesian_update=transparent_not_applied"
        )
        patterns.append(pattern)
    return patterns


def _layer1_group_key(correction: dict[str, Any]) -> tuple[str, str, str, str, str]:
    profile = correction.get("municipality_profile") or {}
    source = correction.get("source_used_for_inference") or {}
    return (
        correction.get("field_id") or "field_pending",
        profile.get("population_range") or "poblacion_pendiente",
        profile.get("region") or "region_pendiente",
        source.get("source_id") or source.get("source_label") or "source_pending",
        _delta_direction(correction.get("delta_percentage")),
    )


def _is_layer1_eligible(correction: dict[str, Any]) -> bool:
    if correction.get("included_in_aggregate") is not True:
        return False
    if correction.get("validation_action") not in LAYER1_ALLOWED_ACTIONS:
        return False
    if _contains_forbidden_learning_key(correction.get("field_id")):
        return False
    if not isinstance(correction.get("delta_percentage"), (int, float)):
        return False
    profile = correction.get("municipality_profile") or {}
    excluded = set(profile.get("protected_variables_excluded") or [])
    return (PROTECTED_POLITICAL_KEYS | PERSONAL_KEYS).issubset(excluded)


def detect_layer1_emerging_patterns(
    corrections: list[dict[str, Any]],
    existing_patterns: list[dict[str, Any]] | None = None,
    *,
    actor: str,
) -> list[dict[str, Any]]:
    """Detect internal layer-1 patterns from opt-in inference corrections only.

    A pattern with n=3 is an internal observation, not a client-facing insight.
    This function does not publish, recalibrate, or produce recommendations.
    """
    existing_patterns = existing_patterns or []
    seen_keys = {
        tuple((pattern.get("pattern_description_technical") or {}).get("pattern_key") or [])
        for pattern in existing_patterns
        if pattern.get("pattern_layer") == 1 and (pattern.get("pattern_description_technical") or {}).get("pattern_key")
    }

    grouped: dict[tuple[str, str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for correction in corrections:
        if _is_layer1_eligible(correction):
            grouped[_layer1_group_key(correction)].append(correction)

    patterns: list[dict[str, Any]] = []
    for key, items in grouped.items():
        if len(items) < LAYER1_MIN_SIMILAR_CORRECTIONS or key in seen_keys:
            continue
        field_id, population_range, region, source_id, delta_direction = key
        deltas = [float(item["delta_percentage"]) for item in items]
        average_delta = round(sum(deltas) / len(deltas), 4)
        source_labels = sorted(
            {
                (item.get("source_used_for_inference") or {}).get("source_label") or "Fuente pendiente"
                for item in items
            }
        )
        natural = (
            f"Se observaron {len(items)} correcciones similares en {field_id} "
            f"para municipios comparables ({population_range}, {region}). "
            f"El delta promedio fue {average_delta}% contra la fuente original {source_id}. "
            "Observacion emergente interna; no publicable al cliente."
        )
        patterns.append(
            create_pending_pattern(
                pattern_layer=1,
                pattern_description_natural=natural,
                pattern_description_technical={
                    "pattern_key": list(key),
                    "field_id": field_id,
                    "municipality_profile_comparable": {
                        "population_range": population_range,
                        "region": region,
                    },
                    "source_original_id": source_id,
                    "source_original_labels": source_labels,
                    "delta_direction": delta_direction,
                    "average_delta_percentage": average_delta,
                    "validation_actions": sorted({item.get("validation_action") for item in items}),
                    "correction_ids": [item.get("id") for item in items],
                    "publication_block": "client_publication_forbidden_until_founder_gate_and_bias_review",
                    "automatic_prior_recalibration": False,
                    "client_visible": False,
                },
                observations_count=len(items),
                contributing_tenant_profiles=[item.get("municipality_profile") or {} for item in items],
                actor=actor,
            )
        )
    return patterns


def review_internal_pattern(
    pattern: dict[str, Any],
    *,
    action: PatternReviewAction,
    actor: str,
    notes: str | None = None,
) -> dict[str, Any]:
    updated = deepcopy(pattern)
    if action == "approve_internal":
        updated["pattern_status"] = "approved_internal"
        updated["founder_gate_status"] = "pending"
    elif action == "reject":
        updated["pattern_status"] = "rejected"
        updated["founder_gate_status"] = "blocked_rejected"
    elif action == "postpone":
        updated["pattern_status"] = "pending_auditor_review"
        updated["founder_gate_status"] = "pending"
    elif action == "retire":
        updated["pattern_status"] = "retired"
        updated["founder_gate_status"] = "blocked_retired"
        updated["retired_at"] = now_iso()
        updated["retired_reason"] = notes or "retired_by_internal_review"
    updated["published_to_clients"] = False
    history = list((updated.get("audit") or {}).get("review_history") or [])
    history.append(
        {
            "action": action,
            "actor": actor,
            "notes": notes,
            "reviewed_at": now_iso(),
            "client_publication": False,
            "automatic_recalibration": False,
        }
    )
    audit = deepcopy(updated.get("audit") or {})
    audit["review_history"] = history
    audit["last_reviewed_by"] = actor
    audit["last_reviewed_at"] = now_iso()
    audit["observational_only"] = True
    audit["automatic_publication"] = False
    updated["audit"] = audit
    return updated
