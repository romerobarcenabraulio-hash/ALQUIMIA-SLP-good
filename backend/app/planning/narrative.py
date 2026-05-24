"""Narrativa unificada de implementación — G1–G5 + actividades + riesgos."""
from __future__ import annotations

from typing import Any

from app.planning.builder import build_gantt
from app.planning.risk.risk_register import load_risk_register
from app.planning.scheduling.gate_tracker import (
    GATE_DEFINITIONS,
    check_gate_alerts,
    get_current_gate,
    load_gate_status,
)
from app.planning.task_gate_map import TASK_GATE_MAP

DEFAULT_PLANNING_PARAMS = {
    "municipio": "municipio",
    "zm": "SLP",
    "scenario_id": "narrative-default",
    "n_cas_pequeno": 1,
    "n_cas_mediano": 0,
    "n_cas_grande": 0,
    "capex_total": 1_500_000.0,
    "horizonte_semanas": 52,
}


def get_implementation_narrative(
    *,
    municipio_id: str | None = None,
    zm: str = "SLP",
    n_cas_pequeno: int = 1,
    n_cas_mediano: int = 0,
    n_cas_grande: int = 0,
    capex_total: float = 1_500_000.0,
    horizonte_semanas: int = 52,
) -> dict[str, Any]:
    """Merge GATE_DEFINITIONS + runtime state + Gantt tasks + riesgos por gate."""
    municipio = municipio_id or DEFAULT_PLANNING_PARAMS["municipio"]
    gate_status = load_gate_status()
    gate_actual = get_current_gate()
    alertas = check_gate_alerts()

    gantt = build_gantt(
        municipio=municipio,
        zm=zm,
        scenario_id=f"narrative-{municipio}",
        n_cas_pequeno=n_cas_pequeno,
        n_cas_mediano=n_cas_mediano,
        n_cas_grande=n_cas_grande,
        capex_total=capex_total,
        horizonte_semanas=horizonte_semanas,
    )

    tasks_by_gate: dict[str, list[dict[str, Any]]] = {g: [] for g in GATE_DEFINITIONS}
    for task in gantt.tasks:
        gate_id = task.fase_gate or TASK_GATE_MAP.get(task.task_id, "G1")
        tasks_by_gate.setdefault(gate_id, []).append({
            "task_id": task.task_id,
            "nombre": task.nombre,
            "responsable": task.responsable,
            "inicio_semana": task.inicio_semana,
            "duracion_semanas": task.duracion_semanas,
            "es_critica": task.es_critica,
            "fase_gate": gate_id,
        })

    risks = load_risk_register()
    risks_by_gate: dict[str, list[dict[str, Any]]] = {g: [] for g in GATE_DEFINITIONS}
    for risk in risks:
        gate_id = risk.get("gate_afectado", "")
        if gate_id in risks_by_gate:
            risks_by_gate[gate_id].append({
                "id": risk.get("id"),
                "descripcion": risk.get("descripcion"),
                "status": risk.get("status"),
                "score": risk.get("score"),
                "categoria": risk.get("categoria"),
            })

    fases: list[dict[str, Any]] = []
    for gate_id in ["G1", "G2", "G3", "G4", "G5"]:
        defn = GATE_DEFINITIONS[gate_id]
        runtime = gate_status.get(gate_id, {})
        gate_alertas = [a for a in alertas if a.get("gate_id") == gate_id]
        fases.append({
            "gate_id": gate_id,
            "fase": defn["fase"],
            "periodo": defn["periodo"],
            "descripcion": defn["descripcion"],
            "riesgo_si_no_se_cruza": defn["riesgo_si_no_se_cruza"],
            "prerequisitos": defn["prerequisitos"],
            "status": runtime.get("status", "NO_INICIADO"),
            "fecha_objetivo": runtime.get("fecha_objetivo"),
            "fecha_cruce_real": runtime.get("fecha_cruce_real"),
            "prerequisitos_completados": runtime.get("prerequisitos_completados", []),
            "notas": runtime.get("notas", ""),
            "alertas": gate_alertas,
            "actividades": tasks_by_gate.get(gate_id, []),
            "riesgos": risks_by_gate.get(gate_id, []),
        })

    return {
        "ontology": "G1-G5 = Fase 1-5 institucional (24 meses)",
        "municipio_id": municipio_id,
        "gate_actual": gate_actual,
        "definitions": GATE_DEFINITIONS,
        "fases": fases,
        "alertas_activas": alertas,
    }
