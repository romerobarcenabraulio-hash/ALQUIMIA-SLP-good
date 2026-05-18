"""
Timeline Engine — el consultor vivo.

Responsabilidades:
1. calcular_progreso()       — % avance real vs plan, semanas de retraso
2. generar_alertas()         — alertas proactivas por tipo y severidad
3. evaluar_riesgo_politico() — score de riesgo basado en mapa de actores
4. checkpoint_requerido()    — ¿necesita el proyecto calibrar costos antes de avanzar?
5. generar_ficha_impacto()   — resumen ejecutivo de resultados (McKinsey: hacer lucir al campeón)

El engine corre:
- En cada request de /proyecto/{id}/estado
- Como cron diario (Vercel Cron → /api/cron/proyecto-pulse)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


# ── Tipos de resultado ────────────────────────────────────────────────────────

@dataclass
class ProgresoProyecto:
    proyecto_id:          str
    semanas_activo:       int
    semanas_objetivo:     int
    pct_avance:           float
    semanas_retraso_max:  int
    actividades_total:    int
    actividades_completadas: int
    actividades_criticas_pendientes: int
    proxima_actividad_municipio: Optional[str]
    proxima_actividad_alquimia:  Optional[str]
    estado_semaforo:      str  # verde | amarillo | rojo
    alertas:              list["AlertaGenerada"] = field(default_factory=list)


@dataclass
class AlertaGenerada:
    tipo:            str
    severidad:       str  # info | advertencia | critico
    titulo:          str
    descripcion:     str
    accion_sugerida: Optional[str] = None


@dataclass
class FichaImpacto:
    """Resumen ejecutivo para el campeón interno — presentation-ready."""
    municipio:            str
    periodo:              str
    semanas_activo:       int
    pct_avance:           float
    # North Star
    ton_desviadas:        Optional[float]
    tasa_desvio_pct:      Optional[float]
    co2e_evitadas:        Optional[float]
    valor_capturado_mxn:  Optional[float]
    empleos_generados:    Optional[int]
    # ROI
    roi_pct:              Optional[float]
    # Documentos
    documentos_entregados: int
    # Benchmark
    vs_benchmark_desvio:  Optional[str]  # "23% vs 31% promedio ZM" | None
    # Logros destacados (para presentar en cabildo)
    logros:               list[str] = field(default_factory=list)
    proximos_pasos:       list[str] = field(default_factory=list)


# ── Engine principal ──────────────────────────────────────────────────────────

def calcular_progreso(proyecto, db=None) -> ProgresoProyecto:
    """Calcula el estado actual del proyecto con alertas proactivas."""
    semanas = proyecto.semanas_activo()
    actividades = proyecto.actividades or []
    alertas: list[AlertaGenerada] = []

    completadas   = [a for a in actividades if a.estado == "completado"]
    pendientes    = [a for a in actividades if a.estado == "pendiente"]
    en_curso      = [a for a in actividades if a.estado == "en_curso"]
    bloqueadas    = [a for a in actividades if a.estado == "bloqueado"]
    criticas_pend = [a for a in pendientes + en_curso if a.es_critica]

    pct = proyecto.pct_avance()
    retraso_max = max(
        (a.semanas_retraso(semanas) for a in actividades),
        default=0,
    )

    # ── Alertas de retraso ────────────────────────────────────────────────────
    for act in criticas_pend:
        retraso = act.semanas_retraso(semanas)
        if retraso >= 3:
            alertas.append(AlertaGenerada(
                tipo="retraso_tarea",
                severidad="critico",
                titulo=f"Tarea crítica con {retraso} semanas de retraso",
                descripcion=f"'{act.nombre}' debió completarse en semana {act.semana_inicio + act.duracion_semanas}. "
                            f"Ejecutor: {act.ejecutor}.",
                accion_sugerida=(
                    "Escalar con el campeón interno. Reagendar o marcar como saltada si no es viable."
                    if act.ejecutor == "municipio"
                    else "Revisar prioridades del equipo ALQUIMIA."
                ),
            ))
        elif retraso >= 1:
            alertas.append(AlertaGenerada(
                tipo="retraso_tarea",
                severidad="advertencia",
                titulo=f"Tarea '{act.nombre}' con {retraso} semana(s) de retraso",
                descripcion=f"Ejecutor: {act.ejecutor}.",
                accion_sugerida="Recordatorio al responsable. Sin acción en 1 semana → escalar.",
            ))

    # ── Alertas de tareas bloqueadas ──────────────────────────────────────────
    if bloqueadas:
        alertas.append(AlertaGenerada(
            tipo="tarea_bloqueada",
            severidad="advertencia",
            titulo=f"{len(bloqueadas)} tarea(s) bloqueada(s)",
            descripcion=", ".join(a.nombre for a in bloqueadas[:3]),
            accion_sugerida="Identificar el bloqueador específico y asignar responsable para resolverlo.",
        ))

    # ── Alerta de proyecto sin arranque ──────────────────────────────────────
    if proyecto.estado == "draft":
        alertas.append(AlertaGenerada(
            tipo="sin_arranque",
            severidad="info",
            titulo="Proyecto en borrador",
            descripcion="El proyecto aún no ha sido activado. El timer no ha iniciado.",
            accion_sugerida="Confirmar fecha de inicio con el municipio y activar el proyecto.",
        ))

    # ── Alerta de checkpoint de costos pendiente ──────────────────────────────
    checkpoints_pendientes = [c for c in (proyecto.checkpoints or []) if not c.completado]
    if checkpoints_pendientes:
        alertas.append(AlertaGenerada(
            tipo="costo_sin_calibrar",
            severidad="advertencia",
            titulo="Checkpoint de costos pendiente",
            descripcion="Hay supuestos financieros sin confirmar. Los documentos no pueden alcanzar "
                        "status 'defendible' hasta completar el checkpoint.",
            accion_sugerida="Pedir al municipio que confirme los 5 supuestos clave en el portal.",
        ))

    # ── Alerta de riesgo político ─────────────────────────────────────────────
    actores_riesgo = [a for a in (proyecto.actores or []) if a.sentimiento == "en_contra" and a.influencia == "alta"]
    if actores_riesgo:
        nombres = ", ".join(a.nombre for a in actores_riesgo[:2])
        alertas.append(AlertaGenerada(
            tipo="riesgo_politico",
            severidad="critico" if len(actores_riesgo) >= 2 else "advertencia",
            titulo=f"Actor(es) de alta influencia en contra: {nombres}",
            descripcion="El mapa de actores muestra resistencia política que puede bloquear el proyecto.",
            accion_sugerida="Reunión de alineación urgente. Involucrar al campeón interno para mediar.",
        ))

    # ── Alerta de hito próximo ────────────────────────────────────────────────
    proximas = sorted(
        [a for a in pendientes if a.semana_inicio <= semanas + 2],
        key=lambda a: a.semana_inicio,
    )
    if proximas:
        p = proximas[0]
        alertas.append(AlertaGenerada(
            tipo="hito_proximo",
            severidad="info",
            titulo=f"Hito próximo: '{p.nombre}' (semana {p.semana_inicio})",
            descripcion=f"Ejecutor: {p.ejecutor}. Fase: {p.fase}.",
            accion_sugerida=None,
        ))

    # ── Semáforo ──────────────────────────────────────────────────────────────
    criticas_alertas = [a for a in alertas if a.severidad == "critico"]
    advertencias_alertas = [a for a in alertas if a.severidad == "advertencia"]

    if criticas_alertas:
        semaforo = "rojo"
    elif advertencias_alertas or retraso_max >= 1:
        semaforo = "amarillo"
    else:
        semaforo = "verde"

    # ── Próximas acciones por ejecutor ────────────────────────────────────────
    proxima_mun = next(
        (a.nombre for a in sorted(pendientes, key=lambda x: x.semana_inicio)
         if a.ejecutor in ("municipio", "compartido")),
        None,
    )
    proxima_alq = next(
        (a.nombre for a in sorted(pendientes, key=lambda x: x.semana_inicio)
         if a.ejecutor in ("alquimia", "compartido")),
        None,
    )

    return ProgresoProyecto(
        proyecto_id=proyecto.id,
        semanas_activo=semanas,
        semanas_objetivo=proyecto.horizonte_semanas,
        pct_avance=pct,
        semanas_retraso_max=retraso_max,
        actividades_total=len(actividades),
        actividades_completadas=len(completadas),
        actividades_criticas_pendientes=len(criticas_pend),
        proxima_actividad_municipio=proxima_mun,
        proxima_actividad_alquimia=proxima_alq,
        estado_semaforo=semaforo,
        alertas=alertas,
    )


def evaluar_riesgo_politico(proyecto) -> dict:
    """Score de riesgo político 0-100 basado en mapa de actores."""
    actores = proyecto.actores or []
    if not actores:
        return {"score": 0, "nivel": "desconocido", "bloqueadores": [], "campeones": []}

    scores = [a.riesgo_score() for a in actores]
    score_total = min(100, sum(scores) // max(1, len(scores)) * 2)
    nivel = "alto" if score_total >= 60 else "medio" if score_total >= 30 else "bajo"

    bloqueadores = [
        {"nombre": a.nombre, "cargo": a.cargo, "preocupacion": a.preocupacion_principal}
        for a in actores if a.es_bloqueador or (a.sentimiento == "en_contra" and a.influencia == "alta")
    ]
    campeones = [
        {"nombre": a.nombre, "cargo": a.cargo}
        for a in actores if a.es_campeon or a.sentimiento == "favorable"
    ]

    return {
        "score": score_total,
        "nivel": nivel,
        "bloqueadores": bloqueadores,
        "campeones": campeones,
        "total_actores": len(actores),
    }


def generar_ficha_impacto(proyecto, costo_servicio_mxn: float = 0.0, benchmark=None) -> FichaImpacto:
    """Genera la ficha de impacto presentation-ready para el campeón interno."""
    impactos = proyecto.impactos or []
    semanas = proyecto.semanas_activo()

    # Agregados de todos los períodos
    ton_desviadas = sum(i.ton_rsu_desviadas or 0 for i in impactos) or None
    co2e = sum(i.co2e_evitadas_ton or 0 for i in impactos) or None
    valor = sum(i.valor_capturado_mxn or 0 for i in impactos) or None
    empleos = max((i.empleos_generados or 0 for i in impactos), default=None)

    tasa_desvio = None
    if impactos:
        ultimo = max(impactos, key=lambda i: i.created_at)
        tasa_desvio = ultimo.tasa_desvio_pct

    roi = None
    if valor and costo_servicio_mxn > 0:
        roi = round((valor - costo_servicio_mxn) / costo_servicio_mxn * 100, 1)

    vs_bench = None
    if benchmark and tasa_desvio is not None:
        prom = benchmark.tasa_desvio_promedio_pct
        if prom:
            diff = round(tasa_desvio - prom, 1)
            signo = "+" if diff >= 0 else ""
            vs_bench = f"{tasa_desvio:.1f}% vs {prom:.1f}% promedio ZM ({signo}{diff}pp)"

    # Logros para cabildo
    logros: list[str] = []
    if ton_desviadas and ton_desviadas > 0:
        logros.append(f"{ton_desviadas:,.0f} toneladas desviadas del relleno sanitario")
    if co2e and co2e > 0:
        logros.append(f"{co2e:,.0f} toneladas de CO₂e evitadas")
    if valor and valor > 0:
        logros.append(f"${valor:,.0f} MXN en valor económico capturado")
    if empleos and empleos > 0:
        logros.append(f"{empleos} empleos formales generados")
    if not logros:
        logros.append("Proyecto en fase de implementación — primeros datos disponibles en oleada piloto")

    # Próximos pasos
    proximos: list[str] = []
    prog = calcular_progreso(proyecto)
    if prog.proxima_actividad_municipio:
        proximos.append(f"Acción municipio: {prog.proxima_actividad_municipio}")
    if prog.proxima_actividad_alquimia:
        proximos.append(f"Acción ALQUIMIA: {prog.proxima_actividad_alquimia}")

    return FichaImpacto(
        municipio=proyecto.municipio_id,
        periodo=datetime.now(timezone.utc).strftime("%Y-Q%q") if False else datetime.now(timezone.utc).strftime("%Y-%m"),
        semanas_activo=semanas,
        pct_avance=proyecto.pct_avance(),
        ton_desviadas=ton_desviadas,
        tasa_desvio_pct=tasa_desvio,
        co2e_evitadas=co2e,
        valor_capturado_mxn=valor,
        empleos_generados=empleos,
        roi_pct=roi,
        documentos_entregados=len(proyecto.revisiones or []),
        vs_benchmark_desvio=vs_bench,
        logros=logros,
        proximos_pasos=proximos,
    )


def checkpoint_requerido(proyecto) -> bool:
    """¿Hay un checkpoint de costos incompleto que bloquea 'defendible'?"""
    return any(not c.completado for c in (proyecto.checkpoints or []))
