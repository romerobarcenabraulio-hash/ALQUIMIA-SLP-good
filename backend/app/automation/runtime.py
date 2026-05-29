"""Fase 13 runtime automation and consultive recommendations.

The runtime engine reacts to tenant changes and operational events. It records
recommendations and recalculations, but it never closes gates, changes stages,
sends external messages, or makes political/official decisions.
"""
from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Literal

RuntimeEventType = Literal[
    "dato_actualizado_por_cliente",
    "dato_inferido_actualizado",
    "discrepancia_detectada",
    "gate_proximo",
    "kpi_desviado",
    "cierre_mensual_operativo",
    "sesion_cabildo_proxima",
]

RecommendationDecision = Literal["aceptar", "rechazar", "ajustar"]
DiscrepancyDecision = Literal["aceptar_dato_cliente", "conservar_inferido", "marcar_revision_pendiente"]

FIELD_TO_MODULE = {
    "antecedentes.presidente_municipal": "antecedentes_municipales",
    "antecedentes.cabildo": "antecedentes_municipales",
    "antecedentes.demografia.poblacion": "city_baseline",
    "antecedentes.demografia.viviendas": "city_baseline",
    "antecedentes.demografia.generacion_kg_hab_dia": "city_baseline",
    "antecedentes.reglamento_de_limpia": "marco_legal",
    "mapa_social.actores": "social_diagnostico",
    "organigrama_servicio": "capacidad_institucional",
}

MODULE_RECOMMENDATION_RECIPES: dict[str, dict[str, Any]] = {
    "city_baseline": {
        "legacy_number": "M01",
        "recommendation": "Usar escenario moderado como base y dejar ambicioso como sensibilidad hasta validar cifras operativas reales.",
        "justification": "La linea base combina poblacion INEGI y factor preliminar de generacion; aun requiere validacion municipal antes de presentarse como oficial.",
        "source_field": "antecedentes.demografia.poblacion",
        "trade_offs": ["Menor riesgo de sobreprometer", "Puede subestimar beneficios si el municipio valida mayor captura real"],
        "confidence": "inferred_high_confidence",
    },
    "social_diagnostico": {
        "legacy_number": "M02C",
        "recommendation": "Priorizar actores con influencia alta/media y postura por verificar antes de llevar el expediente a Cabildo.",
        "justification": "El mapa social aun distingue actores preliminares y pendientes; la estrategia debe enfocarse en reducir incertidumbre politica.",
        "source_field": "mapa_social.actores",
        "trade_offs": ["Reduce sorpresas en Cabildo", "Exige trabajo humano de validacion local"],
        "confidence": "inferred_medium_confidence",
    },
    "marco_legal": {
        "legacy_number": "M03B",
        "recommendation": "Preparar borrador de tres articulos faltantes, pero mantenerlo como revision juridica pendiente.",
        "justification": "El reglamento se precarga desde Periodico Oficial o queda pendiente; no debe tratarse como dictamen legal final.",
        "source_field": "antecedentes.reglamento_de_limpia",
        "trade_offs": ["Acelera revision juridica", "No sustituye criterio del secretario o juridico municipal"],
        "confidence": "inferred_medium_confidence",
    },
    "costo_omision": {
        "legacy_number": "M04",
        "recommendation": "Usar el costo de omision como argumento financiero principal solo si la fuente del volumen RSU queda trazada.",
        "justification": "El argumento financiero depende de poblacion, generacion per capita y supuestos de captura.",
        "source_field": "antecedentes.demografia.generacion_kg_hab_dia",
        "trade_offs": ["Mensaje claro para Cabildo", "Debe mostrarse como estimacion si faltan datos reales"],
        "confidence": "inferred_medium_confidence",
    },
    "roadmap_implementacion": {
        "legacy_number": "M05",
        "recommendation": "Construir cronograma sugerido con G1 como punto de control, sin mover etapa automaticamente.",
        "justification": "El roadmap debe respetar gates manuales y evidencia cargada.",
        "source_field": "runtime.gate_evidence_backlog",
        "trade_offs": ["Ordena proximos pasos", "No reemplaza decision del founder"],
        "confidence": "inferred_medium_confidence",
    },
    "infraestructura": {
        "legacy_number": "M06",
        "recommendation": "Marcar ubicaciones de centros de acopio como preliminares hasta tener DENUE o evidencia geoespacial validada.",
        "justification": "La ubicacion depende de datos publicos y cobertura territorial todavia no verificada.",
        "source_field": "organigrama_servicio",
        "trade_offs": ["Evita prometer sitios no confirmados", "Puede requerir carga adicional del municipio"],
        "confidence": "inferred_low_confidence",
    },
    "logistica": {
        "legacy_number": "M08",
        "recommendation": "Sugerir rutas solo como hipotesis operativa hasta recibir turnos, horarios y zonas atendidas.",
        "justification": "El organigrama operativo y horarios gobiernan cualquier recomendacion de rutas.",
        "source_field": "organigrama_servicio",
        "trade_offs": ["Permite iniciar conversacion operativa", "No debe ejecutarse sin validacion de campo"],
        "confidence": "inferred_low_confidence",
    },
    "escenarios_financieros": {
        "legacy_number": "M13",
        "recommendation": "Defender escenario financiero conservador si hay discrepancias abiertas mayores a 20%.",
        "justification": "Las discrepancias abiertas degradan confiabilidad de proyecciones.",
        "source_field": "runtime.discrepancies",
        "trade_offs": ["Mayor defensibilidad", "Puede reducir ambicion del caso financiero"],
        "confidence": "inferred_medium_confidence",
    },
    "riesgos_modelo": {
        "legacy_number": "M14",
        "recommendation": "Elevar a prioritario cualquier riesgo asociado a fuente pendiente o discrepancia sin decision humana.",
        "justification": "AUDITOR exige que incertidumbre material se conserve visible.",
        "source_field": "runtime.discrepancies",
        "trade_offs": ["Protege trazabilidad", "Aumenta carga de revision humana"],
        "confidence": "inferred_medium_confidence",
    },
    "monitoreo_operativo": {
        "legacy_number": "M17",
        "recommendation": "Comparar proyectado vs real y abrir revision si el KPI operativo se desvia mas de 20%.",
        "justification": "La automatizacion detecta desviacion, pero el responsable humano define accion correctiva.",
        "source_field": "runtime.events",
        "trade_offs": ["Deteccion temprana", "No debe generar alertas externas automaticas"],
        "confidence": "inferred_medium_confidence",
    },
    "doble_materialidad": {
        "legacy_number": "M18",
        "recommendation": "Mantener temas materiales como preliminares hasta tener evidencia operativa de al menos un periodo.",
        "justification": "La materialidad requiere datos reales y validacion del cliente.",
        "source_field": "runtime.events",
        "trade_offs": ["Evita sobreafirmar ESG", "Retrasa lenguaje de cumplimiento"],
        "confidence": "inferred_low_confidence",
    },
    "risk_dashboard": {
        "legacy_number": "M21",
        "recommendation": "Mostrar gates, riesgos y decisiones pendientes en prioridad alta cuando falte evidencia de gate proximo.",
        "justification": "El dashboard de riesgo debe ayudar a decidir, no cerrar gates por si mismo.",
        "source_field": "runtime.gate_evidence_backlog",
        "trade_offs": ["Enfoca atencion ejecutiva", "Puede elevar carga de seguimiento manual"],
        "confidence": "inferred_medium_confidence",
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def nested_get(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    current: Any = data
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def field_path_tuple(field_path: str) -> tuple[str, ...]:
    return tuple(part for part in field_path.split(".") if part)


def unwrap_value(value: Any) -> Any:
    if isinstance(value, dict) and "value" in value:
        return value.get("value")
    if isinstance(value, dict) and "valor" in value:
        return value.get("valor")
    return value


def source_summary(value: Any) -> dict[str, Any]:
    if isinstance(value, dict) and isinstance(value.get("source"), dict):
        source = value["source"]
        return {
            "source_id": source.get("id"),
            "source_label": source.get("label"),
            "source_kind": source.get("kind"),
            "source_date": source.get("extracted_at"),
            "method": value.get("method"),
            "confidence": value.get("confidence"),
            "human_validation_state": value.get("human_validation_state"),
            "official": value.get("official") is True,
        }
    if isinstance(value, dict) and isinstance(value.get("fuente"), dict):
        source = value["fuente"]
        return {
            "source_id": source.get("id") or "tenant_declared_source",
            "source_label": source.get("label") or source.get("nombre") or "Fuente declarada por cliente",
            "source_kind": source.get("kind") or "tenant_private",
            "source_date": source.get("fecha") or source.get("extracted_at") or now_iso(),
            "method": value.get("method") or "client_declared_source",
            "confidence": value.get("confidence") or source.get("confidence") or "pending_human_validation",
            "human_validation_state": source.get("status") or value.get("human_validation_state") or "pending_human_validation",
            "official": value.get("official") is True,
        }
    return {
        "source_id": "tenant_private_store",
        "source_label": "Dato cargado por cliente",
        "source_kind": "tenant_private",
        "source_date": now_iso(),
        "method": "client_update",
        "confidence": "pending_human_validation",
        "human_validation_state": "pending_human_validation",
        "official": False,
    }


def registry_module_ids(registry: dict[str, Any]) -> set[str]:
    return {
        str(module.get("module_id"))
        for module in registry.get("modules", [])
        if module.get("module_id")
    }


def traceable_source(profile: dict[str, Any], field_path: str) -> dict[str, Any]:
    raw = nested_get(profile, field_path_tuple(field_path))
    value = unwrap_value(raw)
    if raw is None or value is None:
        return {
            "field_path": field_path,
            "source_status": "pending_source",
            "evidence_basis": "pending_source",
            "official": False,
            "pending_reason": "Dato fuente no disponible en Tenant Private Store ni Public Knowledge Base.",
        }
    provenance = source_summary(raw)
    source_status = provenance.get("human_validation_state") or "pending_human_validation"
    evidence_basis = "public_source" if provenance.get("source_kind") == "public" else "tenant_private_store"
    return {
        "field_path": field_path,
        "value": value,
        "source_status": source_status,
        "evidence_basis": evidence_basis,
        "provenance": provenance,
        "official": False,
    }


def extract_numeric(profile: dict[str, Any], path: tuple[str, ...]) -> float | None:
    value = unwrap_value(nested_get(profile, path))
    if isinstance(value, (int, float)):
        return float(value)
    return None


def city_baseline_calculation(profile: dict[str, Any]) -> dict[str, Any] | None:
    population = extract_numeric(profile, ("antecedentes", "demografia", "poblacion"))
    generation = extract_numeric(profile, ("antecedentes", "demografia", "generacion_kg_hab_dia"))
    if population is None or generation is None:
        return None
    kg_day = population * generation
    return {
        "formula": "poblacion * generacion_kg_hab_dia / 1000 = toneladas_dia",
        "inputs": {
            "poblacion": population,
            "generacion_kg_hab_dia": generation,
        },
        "outputs": {
            "kg_day": round(kg_day, 2),
            "tons_day": round(kg_day / 1000, 2),
        },
        "method": "calculo_derivado_no_oficial",
        "official": False,
    }


def actor_count(profile: dict[str, Any]) -> int | None:
    actores = unwrap_value(nested_get(profile, ("mapa_social", "actores")))
    if isinstance(actores, list):
        return len(actores)
    return None


def changed_fields(existing_profile: dict[str, Any], updated_payload: dict[str, Any]) -> list[dict[str, Any]]:
    watched = [
        ("antecedentes.presidente_municipal", ("antecedentes", "presidente_municipal")),
        ("antecedentes.cabildo", ("antecedentes", "cabildo")),
        ("antecedentes.demografia.poblacion", ("antecedentes", "demografia", "poblacion")),
        ("antecedentes.demografia.viviendas", ("antecedentes", "demografia", "viviendas")),
        ("antecedentes.demografia.generacion_kg_hab_dia", ("antecedentes", "demografia", "generacion_kg_hab_dia")),
        ("antecedentes.reglamento_de_limpia", ("antecedentes", "reglamento_de_limpia")),
        ("mapa_social.actores", ("mapa_social", "actores")),
        ("organigrama_servicio", ("organigrama_servicio",)),
    ]
    changes = []
    for field_path, path in watched:
        before_raw = nested_get(existing_profile, path)
        after_raw = nested_get(updated_payload, path)
        before = unwrap_value(before_raw)
        after = unwrap_value(after_raw)
        if before != after:
            changes.append(
                {
                    "field_path": field_path,
                    "source_module": FIELD_TO_MODULE[field_path],
                    "before": before,
                    "after": after,
                    "inferred_source": source_summary(before_raw),
                    "client_source": source_summary(after_raw),
                }
            )
    return changes


def registry_recalculation_targets(registry: dict[str, Any], source_module: str) -> list[str]:
    targets: set[str] = set()
    mode = "produces_data_for"
    for module in registry.get("modules", []):
        if module.get("module_id") == source_module:
            targets.add(source_module)
            targets.update(str(item) for item in module.get("produces_data_for") or [])
    if not targets:
        mode = "depends_on_reverse_fallback"
        for module in registry.get("modules", []):
            if source_module in (module.get("depends_on") or []):
                targets.add(str(module.get("module_id")))
    if not targets:
        mode = "self_recalculate_no_declared_downstream"
        targets.add(source_module)
    return sorted(target for target in targets if target), mode


def gate_evidence_backlog(gates: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    backlog = []
    for gate in gates or []:
        if gate.get("status") != "cerrado" and not gate.get("evidencia_url"):
            backlog.append({"gate_id": str(gate.get("gate_id")), "missing": "evidencia_url", "status": "pendiente_evidencia"})
    return backlog


def ensure_runtime(automation: dict[str, Any]) -> dict[str, Any]:
    runtime = automation.setdefault("runtime", {})
    runtime.setdefault("events", [])
    runtime.setdefault("recalculation_log", [])
    runtime.setdefault("recalculated_modules", [])
    runtime.setdefault("discrepancies", [])
    runtime.setdefault("recommendations", [])
    runtime.setdefault("recommendation_decisions", [])
    runtime.setdefault("discrepancy_decisions", [])
    runtime.setdefault("external_dispatches", [])
    runtime.setdefault("automatic_gate_changes", False)
    runtime.setdefault("automatic_stage_transitions", False)
    return runtime


def make_event(event_type: RuntimeEventType, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    priority = "P1" if event_type in {"kpi_desviado", "gate_proximo"} else "P2"
    return {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "payload": payload or {},
        "priority": priority,
        "created_at": now_iso(),
        "external_dispatch": False,
        "automatic_gate_change": False,
        "automatic_stage_transition": False,
    }


def detect_discrepancies(changes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    discrepancies = []
    for change in changes:
        before = change.get("before")
        after = change.get("after")
        if isinstance(before, (int, float)) and isinstance(after, (int, float)) and before:
            delta_pct = abs(float(after) - float(before)) / abs(float(before))
            if delta_pct > 0.20:
                discrepancies.append(
                    {
                        "discrepancy_id": str(uuid.uuid4()),
                        "field": change["field_path"],
                        "source_module": change["source_module"],
                        "inferred_value": before,
                        "client_value": after,
                        "delta_pct": round(delta_pct * 100, 2),
                        "status": "requiere_revision_humana",
                        "reason": "client_update_differs_more_than_20_percent",
                        "inferred_source": change["inferred_source"],
                        "client_source": change["client_source"],
                        "not_definitive_error": True,
                    }
                )
    return discrepancies


def recommendation_for_module(
    module_id: str,
    *,
    cause: str,
    event_id: str | None,
    profile: dict[str, Any],
    registry: dict[str, Any],
) -> dict[str, Any] | None:
    if module_id not in registry_module_ids(registry):
        return None
    recipe = MODULE_RECOMMENDATION_RECIPES.get(module_id)
    if not recipe:
        return None
    source = traceable_source(profile, recipe["source_field"])
    calculation = city_baseline_calculation(profile) if module_id in {"city_baseline", "costo_omision"} else None
    if calculation:
        source["calculation"] = calculation
        source["evidence_basis"] = "calculation"

    recommendation = recipe["recommendation"]
    justification = recipe["justification"]
    if module_id in {"city_baseline", "costo_omision"} and calculation:
        tons_day = calculation["outputs"]["tons_day"]
        population = calculation["inputs"]["poblacion"]
        generation = calculation["inputs"]["generacion_kg_hab_dia"]
        recommendation = (
            f"Trabajar con escenario moderado: poblacion {population:,.0f} y factor "
            f"{generation:.2f} kg/hab/dia producen una lectura preliminar de {tons_day:,.2f} t/dia."
        )
        justification = (
            "La cifra deriva de un calculo trazable, no oficial; requiere validacion humana "
            "antes de usarse en expediente o comunicacion publica."
        )
    elif module_id == "social_diagnostico":
        count = actor_count(profile)
        if count is not None and count < 15:
            recommendation = (
                f"Completar mapa social antes de decision: hay {count} actores capturados y el minimo operativo es 15."
            )
            justification = "La estrategia por actor seria incompleta si se presenta sin el minimo de cobertura local."
    elif source["source_status"] == "pending_source":
        recommendation = f"{recipe['recommendation']} Mantener como pendiente hasta cargar fuente verificable."
        justification = f"{recipe['justification']} La fuente requerida no esta disponible todavia."

    recommendation_id = f"REC-{module_id}-{uuid.uuid4().hex[:8]}"
    return {
        "recommendation_id": recommendation_id,
        "module_id": module_id,
        "legacy_number": recipe["legacy_number"],
        "cause": cause,
        "event_id": event_id,
        "recommendation": recommendation,
        "justification": justification,
        "source": source,
        "trade_offs": recipe["trade_offs"],
        "confidence": "inferred_low_confidence" if source["source_status"] == "pending_source" else recipe["confidence"],
        "human_action_options": ["aceptar", "rechazar", "ajustar"],
        "status": "pending_human_decision",
        "created_at": now_iso(),
    }


def append_unique_recommendations(
    runtime: dict[str, Any],
    module_ids: list[str],
    *,
    cause: str,
    event_id: str | None,
    profile: dict[str, Any],
    registry: dict[str, Any],
) -> None:
    existing_open = {
        (rec.get("module_id"), rec.get("cause"))
        for rec in runtime.get("recommendations", [])
        if rec.get("status") == "pending_human_decision"
    }
    for module_id in module_ids:
        key = (module_id, cause)
        if key in existing_open:
            continue
        rec = recommendation_for_module(module_id, cause=cause, event_id=event_id, profile=profile, registry=registry)
        if rec:
            runtime["recommendations"].append(rec)


def default_recommendation_modules() -> list[str]:
    return [
        "city_baseline",
        "social_diagnostico",
        "marco_legal",
        "costo_omision",
        "roadmap_implementacion",
        "infraestructura",
        "logistica",
        "escenarios_financieros",
        "riesgos_modelo",
        "monitoreo_operativo",
        "doble_materialidad",
        "risk_dashboard",
    ]


def apply_runtime_event(
    *,
    existing_profile: dict[str, Any] | None,
    updated_payload: dict[str, Any],
    registry: dict[str, Any],
    gates: list[dict[str, Any]] | None,
    event_type: RuntimeEventType,
    event_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    existing_profile = existing_profile or {}
    payload = deepcopy(updated_payload)
    automation = deepcopy(
        ((existing_profile.get("antecedentes") or {}).get("_automation"))
        or ((payload.get("antecedentes") or {}).get("_automation"))
        or {}
    )
    incoming_automation = (payload.get("antecedentes") or {}).get("_automation") or {}
    if incoming_automation.get("analytics_consent"):
        automation["analytics_consent"] = deepcopy(incoming_automation["analytics_consent"])
    if not automation:
        automation = {
            "public_knowledge_base": {"store": "public_knowledge_base", "scope": "public"},
            "tenant_private_store": {
                "store": "tenant_private_store",
                "scope": "tenant_private",
                "cross_tenant_private_access": False,
            },
        }
    runtime = ensure_runtime(automation)
    event = make_event(event_type, event_payload)
    runtime["events"].append(event)
    runtime["last_event"] = event
    runtime["gate_evidence_backlog"] = gate_evidence_backlog(gates)

    changes = changed_fields(existing_profile, payload) if event_type == "dato_actualizado_por_cliente" else []
    recalculated: set[str] = set()
    for change in changes:
        targets, dependency_mode = registry_recalculation_targets(registry, change["source_module"])
        recalculated.update(targets)
        runtime["recalculation_log"].append(
            {
                "recalculation_id": str(uuid.uuid4()),
                "event_id": event["event_id"],
                "field_path": change["field_path"],
                "source_module": change["source_module"],
                "targets": targets,
                "dependency_mode": dependency_mode,
                "cause": "tenant_data_updated",
                "created_at": now_iso(),
            }
        )
    runtime["last_recalculation"] = now_iso()
    runtime["recalculated_modules"] = sorted(set(runtime.get("recalculated_modules") or []) | recalculated)

    new_discrepancies = detect_discrepancies(changes)
    for discrepancy in new_discrepancies:
        runtime["discrepancies"].append(discrepancy)
        runtime["events"].append(make_event("discrepancia_detectada", {"discrepancy_id": discrepancy["discrepancy_id"], "field": discrepancy["field"]}))

    modules_for_recommendation = sorted(recalculated)
    if event_type in {"gate_proximo", "kpi_desviado", "cierre_mensual_operativo", "sesion_cabildo_proxima"}:
        modules_for_recommendation.extend(["roadmap_implementacion", "monitoreo_operativo", "risk_dashboard"])
    if new_discrepancies:
        modules_for_recommendation.extend(["escenarios_financieros", "riesgos_modelo"])
    if len([rec for rec in runtime["recommendations"] if rec.get("status") == "pending_human_decision"]) < 3:
        modules_for_recommendation.extend(default_recommendation_modules()[:3])
    append_unique_recommendations(
        runtime,
        sorted(set(modules_for_recommendation)),
        cause=event_type,
        event_id=event["event_id"],
        profile=payload,
        registry=registry,
    )
    runtime["external_dispatches"] = []
    runtime["automatic_gate_changes"] = False
    runtime["automatic_stage_transitions"] = False
    payload.setdefault("antecedentes", {})["_automation"] = automation
    return payload


def decide_recommendation(
    profile: dict[str, Any],
    recommendation_id: str,
    action: RecommendationDecision,
    actor: str,
    notes: str | None = None,
    adjusted_recommendation: str | None = None,
) -> dict[str, Any]:
    updated = deepcopy(profile)
    automation = updated.setdefault("antecedentes", {}).setdefault("_automation", {})
    runtime = ensure_runtime(automation)
    for rec in runtime["recommendations"]:
        if rec.get("recommendation_id") == recommendation_id:
            rec["status"] = f"human_{action}"
            rec["decided_by"] = actor
            rec["decided_at"] = now_iso()
            rec["decision_notes"] = notes
            if action == "ajustar":
                rec["adjusted_recommendation"] = adjusted_recommendation or rec["recommendation"]
            runtime["recommendation_decisions"].append(
                {
                    "recommendation_id": recommendation_id,
                    "action": action,
                    "actor": actor,
                    "notes": notes,
                    "created_at": rec["decided_at"],
                    "automatic_gate_change": False,
                    "automatic_stage_transition": False,
                    "external_dispatch": False,
                }
            )
            return updated
    raise ValueError("recomendacion no encontrada")


def decide_discrepancy(
    profile: dict[str, Any],
    discrepancy_id: str,
    action: DiscrepancyDecision,
    actor: str,
    notes: str | None = None,
) -> dict[str, Any]:
    updated = deepcopy(profile)
    automation = updated.setdefault("antecedentes", {}).setdefault("_automation", {})
    runtime = ensure_runtime(automation)
    for discrepancy in runtime["discrepancies"]:
        if discrepancy.get("discrepancy_id") == discrepancy_id:
            discrepancy["status"] = action
            discrepancy["decided_by"] = actor
            discrepancy["decided_at"] = now_iso()
            discrepancy["decision_notes"] = notes
            runtime["discrepancy_decisions"].append(
                {
                    "discrepancy_id": discrepancy_id,
                    "action": action,
                    "actor": actor,
                    "notes": notes,
                    "created_at": discrepancy["decided_at"],
                }
            )
            return updated
    raise ValueError("discrepancia no encontrada")
