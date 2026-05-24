"""
Jerarquía Fase → Etapa → Actividad para el ZIP de implementación.

Fuente de verdad: app/planning/builder.py (GANTT_PHASES, _DAILY_TEMPLATES,
build_daily_breakdown).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any

from app.agents.schemas import GanttPlan, PlanningTask
from app.planning.builder import (
    GANTT_PHASES,
    _slugify,
    build_daily_breakdown,
)


@dataclass
class GanttActividad:
    actividad_id: str
    slug: str
    nombre: str
    dia_relativo: int
    semana_relativa: int
    fecha_calendario: str
    responsable: str
    es_hito: bool = False


@dataclass
class GanttEtapa:
    task_id: str
    slug: str
    nombre: str
    descripcion: str
    responsable: str
    inicio_semana: int
    duracion_semanas: int
    predecesoras: list[str]
    es_critica: bool
    costo_mxn: float
    actividades: list[GanttActividad] = field(default_factory=list)


@dataclass
class GanttPhase:
    phase_id: str
    slug: str
    nombre: str
    descripcion: str
    etapas: list[GanttEtapa] = field(default_factory=list)


def _etapa_slug(task: PlanningTask) -> str:
    num = task.task_id.replace("T", "")
    short = _slugify(task.nombre, max_len=36)
    return f"E{num}_{task.task_id}_{short}"


def _actividad_slug(act: dict[str, Any], idx: int) -> str:
    raw = act.get("actividad_diaria", f"actividad_{idx}")
    short = _slugify(raw, max_len=40)
    return f"A{idx:02d}_{short}"


def build_hierarchy(
    gantt: GanttPlan,
    fecha_inicio: date | None = None,
) -> list[GanttPhase]:
    """Construye árbol Fase/Etapa/Actividad fiel al Gantt Maestro."""
    start = fecha_inicio or date.today()
    tasks_by_id = {t.task_id: t for t in gantt.tasks}
    daily_rows = build_daily_breakdown(gantt.tasks, start)

    # Agrupar actividades por task_id
    acts_by_task: dict[str, list[dict[str, Any]]] = {}
    for row in daily_rows:
        acts_by_task.setdefault(row["task_id"], []).append(row)

    phases: list[GanttPhase] = []
    for phase_def in GANTT_PHASES:
        etapas: list[GanttEtapa] = []
        for tid in phase_def["task_ids"]:  # type: ignore[index]
            task = tasks_by_id.get(str(tid))
            if not task:
                continue
            raw_acts = acts_by_task.get(task.task_id, [])
            actividades: list[GanttActividad] = []
            for i, act in enumerate(raw_acts, start=1):
                actividades.append(
                    GanttActividad(
                        actividad_id=act.get("subtarea_id", f"{task.task_id}-D{i:02d}"),
                        slug=_actividad_slug(act, i),
                        nombre=str(act.get("actividad_diaria", "")),
                        dia_relativo=int(act.get("dia_relativo", i)),
                        semana_relativa=int(act.get("semana_relativa", 1)),
                        fecha_calendario=str(act.get("fecha_calendario", "")),
                        responsable=str(act.get("responsable", task.responsable)),
                        es_hito=bool(act.get("es_hito", False)),
                    )
                )
            etapas.append(
                GanttEtapa(
                    task_id=task.task_id,
                    slug=_etapa_slug(task),
                    nombre=task.nombre,
                    descripcion=task.descripcion,
                    responsable=task.responsable,
                    inicio_semana=task.inicio_semana,
                    duracion_semanas=task.duracion_semanas,
                    predecesoras=list(task.predecesoras),
                    es_critica=task.es_critica,
                    costo_mxn=task.costo_mxn,
                    actividades=actividades,
                )
            )
        phases.append(
            GanttPhase(
                phase_id=str(phase_def["id"]),
                slug=str(phase_def["slug"]),
                nombre=str(phase_def["nombre"]),
                descripcion=str(phase_def["descripcion"]),
                etapas=etapas,
            )
        )
    return phases
