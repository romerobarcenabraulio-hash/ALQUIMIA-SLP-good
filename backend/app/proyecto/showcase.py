"""
Proyecto showcase del simulador (ids `sim-{municipio_id}`).

El frontend usa estos IDs sin crear filas en Postgres. Si la BD no tiene
esquema de proyecto vivo o el registro no existe, el router devuelve estado
demo coherente en lugar de HTTP 500.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


def is_simulator_proyecto_id(proyecto_id: str) -> bool:
    return proyecto_id.startswith("sim-")


def municipio_from_sim_id(proyecto_id: str) -> str:
    if proyecto_id.startswith("sim-"):
        return proyecto_id[4:] or "slp"
    return proyecto_id


def db_error_is_schema_missing(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "does not exist" in msg or "undefinedtable" in msg


class ShowcaseProyecto:
    """Proyecto ligero compatible con timeline_engine."""

    def __init__(self, proyecto_id: str):
        self.id = proyecto_id
        self.municipio_id = municipio_from_sim_id(proyecto_id)
        self.zm = "zmvt"
        self.estado = "draft"
        self.negociacion = "municipal_directo"
        self.horizonte_semanas = 52
        self.fecha_inicio: Optional[datetime] = None
        self.campeon_nombre: Optional[str] = None
        self.campeon_cargo: Optional[str] = None
        self.campeon_email: Optional[str] = None
        self.actividades: list = []
        self.checkpoints: list = []
        self.actores: list = []
        self.impactos: list = []
        self.revisiones: list = []

    def semanas_activo(self) -> int:
        if not self.fecha_inicio:
            return 0
        delta = datetime.now(timezone.utc) - self.fecha_inicio.replace(tzinfo=timezone.utc)
        return max(0, delta.days // 7)

    def pct_avance(self) -> float:
        return 0.0


def build_showcase_estado(proyecto_id: str, *, schema_pending: bool = False) -> dict:
    from app.proyecto.timeline_engine import calcular_progreso, evaluar_riesgo_politico, checkpoint_requerido

    p = ShowcaseProyecto(proyecto_id)
    progreso = calcular_progreso(p)
    riesgo = evaluar_riesgo_politico(p)

    note = (
        "Modo simulador — ejecuta apply_migrations_manual.sql en Neon (sección 0001) "
        "para persistir proyecto vivo."
        if schema_pending
        else "Modo simulador — proyecto demo (sin registro en BD)."
    )

    return {
        "proyecto_id": proyecto_id,
        "municipio_id": p.municipio_id,
        "zm": p.zm,
        "estado": p.estado,
        "negociacion": p.negociacion,
        "semanas_activo": progreso.semanas_activo,
        "semanas_objetivo": progreso.semanas_objetivo,
        "pct_avance": progreso.pct_avance,
        "semanas_retraso_max": progreso.semanas_retraso_max,
        "actividades_total": progreso.actividades_total,
        "actividades_completadas": progreso.actividades_completadas,
        "criticas_pendientes": progreso.actividades_criticas_pendientes,
        "semaforo": progreso.estado_semaforo,
        "proxima_accion_municipio": progreso.proxima_actividad_municipio,
        "proxima_accion_alquimia": progreso.proxima_actividad_alquimia or "Generar diagnóstico inicial (R0)",
        "riesgo_politico": riesgo,
        "checkpoint_pendiente": checkpoint_requerido(p),
        "campeon": {"nombre": p.campeon_nombre, "cargo": p.campeon_cargo, "email": p.campeon_email},
        "alertas": [
            {
                "tipo": a.tipo,
                "severidad": a.severidad,
                "titulo": a.titulo,
                "descripcion": a.descripcion,
                "accion": a.accion_sugerida,
            }
            for a in progreso.alertas
        ],
        "message": note,
        "is_showcase": True,
    }
