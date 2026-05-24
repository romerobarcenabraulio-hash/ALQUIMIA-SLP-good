"""
Export Gantt Maestro a CSV compatible con ClickUp.
"""
from __future__ import annotations

from datetime import date, timedelta

from app.agents.schemas import GanttPlan
from app.export.gantt_hierarchy import GanttPhase


def _csv_field(value: str) -> str:
    escaped = value.replace('"', '""')
    return f'"{escaped}"'


def _add_days(start: date, days: int) -> date:
    return start + timedelta(days=days)


def _fmt_clickup(d: date) -> str:
    return f"{d.month:02d}/{d.day:02d}/{d.year}"


def generate_clickup_csv(
    gantt: GanttPlan,
    hierarchy: list[GanttPhase],
    fecha_inicio: date | None = None,
) -> bytes:
    start = fecha_inicio or date.today()
    headers = [
        "Task Name", "List", "Assignee", "Start Date", "Due Date",
        "Priority", "Status", "Description", "Etapa", "Actividad", "Fase",
    ]
    rows: list[str] = [",".join(headers)]

    for fase in hierarchy:
        for etapa in fase.etapas:
            task = next((t for t in gantt.tasks if t.task_id == etapa.task_id), None)
            if not task:
                continue
            task_start = _add_days(start, (task.inicio_semana - 1) * 7)
            task_end = _add_days(task_start, task.duracion_semanas * 7)
            row = [
                task.nombre,
                f"ALQUIMIA — {fase.nombre}",
                task.responsable,
                _fmt_clickup(task_start),
                _fmt_clickup(task_end),
                "High" if task.es_critica else "Normal",
                "To Do",
                task.descripcion or "",
                etapa.task_id,
                "",
                fase.phase_id,
            ]
            rows.append(",".join(_csv_field(v) for v in row))

            for act in etapa.actividades:
                act_start = date.fromisoformat(act.fecha_calendario) if act.fecha_calendario else task_start
                act_row = [
                    act.nombre,
                    f"ALQUIMIA — {fase.nombre}",
                    act.responsable,
                    _fmt_clickup(act_start),
                    _fmt_clickup(act_start),
                    "Normal",
                    "To Do",
                    f"{etapa.task_id} · día {act.dia_relativo}",
                    etapa.task_id,
                    act.actividad_id,
                    fase.phase_id,
                ]
                rows.append(",".join(_csv_field(v) for v in act_row))

    return "\n".join(rows).encode("utf-8")
