"""
PlanningBuilder — Genera GanttPlan, PertPlan y RACIPlan deterministas.

Los planes se construyen a partir del escenario financiero (CostModel + ScenarioInput)
y los parámetros operativos del municipio. Son la base del Módulo 3 (M03) en el frontend.

Metodología:
- El Gantt se organiza en 5 fases: Diseño, Infraestructura, Flota, Sensibilización, Operación.
- El PERT calcula tiempos tempranos/tardíos y la ruta crítica.
- La RACI cubre los 15 procesos clave del programa de circularidad.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from app.agents.schemas import (
    GanttPlan,
    PertNode,
    PertPlan,
    PlanningTask,
    RACIPlan,
    RACIRow,
)


# ─── Templates de tareas por fase ────────────────────────────────────────────

def _gantt_tasks(
    municipio: str,
    n_cas_pequeno: int,
    n_cas_mediano: int,
    n_cas_grande: int,
    capex_total: float,
    horizonte_semanas: int = 52,
) -> List[PlanningTask]:
    """
    Genera la lista de tareas del Gantt Maestro basada en el escenario.
    Los costos son proporcionales al CAPEX total del escenario.
    """
    n_cas = n_cas_pequeno + n_cas_mediano + n_cas_grande
    costo_diseno      = capex_total * 0.05
    costo_infra       = capex_total * 0.55
    costo_flota       = capex_total * 0.25
    costo_sensib      = capex_total * 0.05
    costo_tecnologia  = capex_total * 0.10

    # Duración de infraestructura escala con número de CAs
    dur_infra = max(8, n_cas * 3)

    tasks = [
        # ── FASE 1: Diseño y planeación (semanas 1-4) ─────────────────────────
        PlanningTask(
            task_id="T01",
            nombre="Diagnóstico territorial y levantamiento de datos",
            descripcion="Estudio de caracterización RSU, mapeo de zonas, análisis de rutas.",
            responsable="Dirección de Servicios Públicos",
            inicio_semana=1, duracion_semanas=2,
            predecesoras=[], es_critica=True,
            costo_mxn=costo_diseno * 0.4,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T02",
            nombre="Diseño técnico de Centros de Acopio",
            descripcion="Planos arquitectónicos, ingeniería civil y especificaciones técnicas.",
            responsable="Dirección de Obras Públicas",
            inicio_semana=2, duracion_semanas=3,
            predecesoras=["T01"], es_critica=True,
            costo_mxn=costo_diseno * 0.4,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T03",
            nombre="Proceso licitatorio y adjudicación de obra",
            descripcion="Llamado a licitación, evaluación de propuestas y contrato.",
            responsable="Comité de Adquisiciones",
            inicio_semana=4, duracion_semanas=3,
            predecesoras=["T02"], es_critica=True,
            costo_mxn=costo_diseno * 0.2,
            fuente_costo="supuesto_editable",
        ),
        # ── FASE 2: Infraestructura (semanas 7 + dur_infra) ───────────────────
        PlanningTask(
            task_id="T04",
            nombre=f"Construcción de {n_cas_pequeno + n_cas_mediano} CAs pequeños/medianos",
            descripcion="Cimentación, estructura, instalaciones y equipamiento básico.",
            responsable="Empresa constructora",
            inicio_semana=7, duracion_semanas=dur_infra,
            predecesoras=["T03"], es_critica=True,
            costo_mxn=costo_infra * 0.70,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T05",
            nombre=f"Instalación equipamiento CA{' grande' if n_cas_grande > 0 else ''}",
            descripcion="Prensas, básculas, bandas, contenedores, señalética.",
            responsable="Proveedor de equipamiento",
            inicio_semana=7 + dur_infra - 3, duracion_semanas=4,
            predecesoras=["T04"], es_critica=False,
            costo_mxn=costo_infra * 0.20,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T06",
            nombre="Adecuación puntos de recolección / mangas de colores",
            descripcion="Colocación de contenedores diferenciados en rutas de alta densidad.",
            responsable="Dirección de Servicios Públicos",
            inicio_semana=7, duracion_semanas=4,
            predecesoras=["T03"], es_critica=False,
            costo_mxn=costo_infra * 0.10,
            fuente_costo="estimado_mercado",
        ),
        # ── FASE 3: Flota (semanas 7-18) ──────────────────────────────────────
        PlanningTask(
            task_id="T07",
            nombre="Adquisición / licitación de flota de recolección",
            descripcion="Compra o arrendamiento de camiones separadores y vehículos de apoyo.",
            responsable="Comité de Adquisiciones",
            inicio_semana=7, duracion_semanas=8,
            predecesoras=["T03"], es_critica=True,
            costo_mxn=costo_flota * 0.90,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T08",
            nombre="Capacitación de choferes y operarios",
            descripcion="Talleres de separación, manejos, rutas y protocolos de seguridad.",
            responsable="Recursos Humanos",
            inicio_semana=14, duracion_semanas=2,
            predecesoras=["T07"], es_critica=False,
            costo_mxn=costo_flota * 0.10,
            fuente_costo="supuesto_editable",
        ),
        # ── FASE 4: Sensibilización (semanas 1-16) ────────────────────────────
        PlanningTask(
            task_id="T09",
            nombre="Diseño campaña de comunicación ciudadana",
            descripcion="Materiales, mensajes clave, canales digitales y presenciales.",
            responsable="Dirección de Comunicación Social",
            inicio_semana=1, duracion_semanas=4,
            predecesoras=[], es_critica=False,
            costo_mxn=costo_sensib * 0.30,
            fuente_costo="supuesto_editable",
        ),
        PlanningTask(
            task_id="T10",
            nombre="Implementación de campaña de sensibilización masiva",
            descripcion="Eventos, redes sociales, visitas a escuelas, volantes.",
            responsable="Dirección de Comunicación Social",
            inicio_semana=5, duracion_semanas=8,
            predecesoras=["T09"], es_critica=False,
            costo_mxn=costo_sensib * 0.50,
            fuente_costo="supuesto_editable",
        ),
        PlanningTask(
            task_id="T11",
            nombre="Encuesta de línea base ciudadana",
            descripcion="Levantamiento de la SurveyTemplate para medir participación inicial.",
            responsable="Dirección de Servicios Públicos",
            inicio_semana=3, duracion_semanas=2,
            predecesoras=["T09"], es_critica=False,
            costo_mxn=costo_sensib * 0.20,
            fuente_costo="supuesto_editable",
        ),
        # ── FASE 5: Tecnología (semanas 5-14) ─────────────────────────────────
        PlanningTask(
            task_id="T12",
            nombre="Implementación sistema de pesaje y trazabilidad (ALQUIMIA)",
            descripcion="Instalación, configuración e integración del sistema de datos.",
            responsable="Proveedor TI",
            inicio_semana=5, duracion_semanas=6,
            predecesoras=["T03"], es_critica=False,
            costo_mxn=costo_tecnologia * 0.70,
            fuente_costo="supuesto_editable",
        ),
        PlanningTask(
            task_id="T13",
            nombre="Prueba piloto de rutas y ajustes operativos",
            descripcion="Operación en zona piloto, medición, ajuste de rutas y frecuencias.",
            responsable="Dirección de Servicios Públicos",
            inicio_semana=7 + dur_infra, duracion_semanas=3,
            predecesoras=["T04", "T07", "T08"], es_critica=True,
            costo_mxn=costo_tecnologia * 0.20,
            fuente_costo="supuesto_editable",
        ),
        # ── FASE 6: Arranque operativo ────────────────────────────────────────
        PlanningTask(
            task_id="T14",
            nombre="Arranque oficial del programa municipal",
            descripcion="Inauguración, evento público, primera jornada de recolección separada.",
            responsable="Presidencia Municipal",
            inicio_semana=7 + dur_infra + 3, duracion_semanas=1,
            predecesoras=["T13"], es_critica=True,
            costo_mxn=0.0,
            fuente_costo="n/a",
        ),
        PlanningTask(
            task_id="T15",
            nombre="Primeras ventas de materiales reciclables",
            descripcion="Comercialización del primer lote con compradores identificados.",
            responsable="Operador del CA",
            inicio_semana=7 + dur_infra + 5, duracion_semanas=2,
            predecesoras=["T14"], es_critica=False,
            costo_mxn=0.0,
            fuente_costo="n/a",
        ),
    ]
    return tasks


def build_gantt(
    municipio: str,
    zm: str,
    scenario_id: str,
    n_cas_pequeno: int = 1,
    n_cas_mediano: int = 0,
    n_cas_grande: int = 0,
    capex_total: float = 1_500_000.0,
    horizonte_semanas: int = 52,
) -> GanttPlan:
    tasks = _gantt_tasks(
        municipio=municipio,
        n_cas_pequeno=n_cas_pequeno,
        n_cas_mediano=n_cas_mediano,
        n_cas_grande=n_cas_grande,
        capex_total=capex_total,
        horizonte_semanas=horizonte_semanas,
    )
    return GanttPlan(
        zm=zm,
        municipio=municipio,
        scenario_id=scenario_id,
        tasks=tasks,
        horizonte_semanas=horizonte_semanas,
        costo_total_mxn=sum(t.costo_mxn for t in tasks),
    )


# ─── PERT ─────────────────────────────────────────────────────────────────────

def build_pert(gantt: GanttPlan) -> PertPlan:
    """
    Calcula el diagrama PERT a partir del GanttPlan.
    Implementa el algoritmo de paso hacia adelante (ES/EF) y
    paso hacia atrás (LS/LF) para identificar la ruta crítica.
    """
    tasks = {t.task_id: t for t in gantt.tasks}
    n_tasks = {tid: len(t.predecesoras) for tid, t in tasks.items()}

    # Calcular tiempos tempranos (ES, EF)
    early_start: Dict[str, float] = {}
    early_finish: Dict[str, float] = {}

    order = _topological_sort(tasks)
    for tid in order:
        t = tasks[tid]
        if not t.predecesoras:
            es = float(t.inicio_semana - 1)
        else:
            es = max(early_finish.get(p, 0.0) for p in t.predecesoras)
        early_start[tid] = es
        early_finish[tid] = es + t.duracion_semanas

    total_duration = max(early_finish.values()) if early_finish else 0.0

    # Calcular tiempos tardíos (LS, LF)
    late_finish: Dict[str, float] = {tid: total_duration for tid in tasks}
    late_start:  Dict[str, float] = {}

    for tid in reversed(order):
        t = tasks[tid]
        lf = late_finish[tid]
        late_start[tid] = lf - t.duracion_semanas
        for pred in t.predecesoras:
            late_finish[pred] = min(late_finish.get(pred, total_duration), late_start[tid])

    nodes: List[PertNode] = []
    for tid, t in tasks.items():
        es = early_start.get(tid, 0.0)
        ef = early_finish.get(tid, 0.0)
        lf = late_finish.get(tid, total_duration)
        ls = late_start.get(tid, 0.0)
        holgura = ls - es
        nodes.append(PertNode(
            node_id=tid,
            nombre=t.nombre,
            tiempo_esperado=float(t.duracion_semanas),
            tiempo_temprano=round(es, 2),
            tiempo_tardio=round(ls, 2),
            holgura=round(holgura, 2),
            es_critico=abs(holgura) < 0.01,
        ))

    return PertPlan(
        zm=gantt.zm,
        municipio=gantt.municipio,
        scenario_id=gantt.scenario_id,
        nodes=nodes,
        duracion_total_semanas=round(total_duration, 1),
    )


def _topological_sort(tasks: Dict[str, Any]) -> List[str]:
    """Ordenamiento topológico de las tareas por dependencias."""
    visited: set = set()
    order: List[str] = []

    def visit(tid: str) -> None:
        if tid in visited:
            return
        visited.add(tid)
        for pred in tasks[tid].predecesoras:
            if pred in tasks:
                visit(pred)
        order.append(tid)

    for tid in tasks:
        visit(tid)
    return order


# ─── RACI ─────────────────────────────────────────────────────────────────────

def build_raci(
    municipio: str,
    zm: str,
    scenario_id: str,
) -> RACIPlan:
    """Genera la matriz RACI estándar para el programa de circularidad municipal."""
    filas = [
        RACIRow(
            proceso="Aprobación del Programa Municipal de Reciclaje",
            responsable="Cabildo Municipal",
            aprueba="Presidencia Municipal",
            consulta=["Dirección de Servicios Públicos", "Tesorería"],
            informa=["Ciudadanos", "SEMARNAT estatal"],
            plazo_semanas=2,
            norma_aplicable="Reglamento de Aseo Público",
        ),
        RACIRow(
            proceso="Diseño y licitación de Centros de Acopio",
            responsable="Dirección de Obras Públicas",
            aprueba="Comité de Adquisiciones",
            consulta=["Dirección de Servicios Públicos", "Tesorería"],
            informa=["Cabildo Municipal"],
            plazo_semanas=6,
            norma_aplicable="Ley de Adquisiciones Municipal",
        ),
        RACIRow(
            proceso="Adquisición de flota de recolección separada",
            responsable="Comité de Adquisiciones",
            aprueba="Presidencia Municipal",
            consulta=["Dirección de Servicios Públicos", "Tesorería"],
            informa=["Cabildo Municipal"],
            plazo_semanas=8,
        ),
        RACIRow(
            proceso="Operación diaria de rutas de recolección",
            responsable="Dirección de Servicios Públicos",
            aprueba="Dirección de Servicios Públicos",
            consulta=["Operadores de CA"],
            informa=["Presidencia Municipal"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Operación de Centros de Acopio",
            responsable="Operador del CA (municipal o concesionario)",
            aprueba="Dirección de Servicios Públicos",
            consulta=["Proveedor TI (pesaje/trazabilidad)"],
            informa=["Tesorería", "Presidencia Municipal"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Comercialización de materiales reciclables",
            responsable="Operador del CA",
            aprueba="Dirección de Servicios Públicos",
            consulta=["Tesorería", "Asesor legal"],
            informa=["Presidencia Municipal"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Campaña de sensibilización ciudadana",
            responsable="Dirección de Comunicación Social",
            aprueba="Presidencia Municipal",
            consulta=["Dirección de Servicios Públicos", "Educación"],
            informa=["Ciudadanos", "Cabildo"],
            plazo_semanas=8,
        ),
        RACIRow(
            proceso="Monitoreo y reporte de KPIs del programa",
            responsable="Dirección de Servicios Públicos",
            aprueba="Presidencia Municipal",
            consulta=["Proveedor TI"],
            informa=["Cabildo", "SEMARNAT estatal", "Ciudadanos"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Recaudación de cuota de servicio de reciclaje",
            responsable="Tesorería Municipal",
            aprueba="Cabildo Municipal",
            consulta=["Asesor legal", "Dirección de Servicios Públicos"],
            informa=["Presidencia Municipal"],
            plazo_semanas=None,
            norma_aplicable="Ley de Ingresos Municipal",
        ),
        RACIRow(
            proceso="Gestión de residuos de manejo especial",
            responsable="Dirección de Medio Ambiente",
            aprueba="Dirección de Medio Ambiente",
            consulta=["SEMARNAT estatal", "Empresa autorizada SEMARNAT"],
            informa=["Presidencia Municipal"],
            plazo_semanas=None,
            norma_aplicable="NOM-052-SEMARNAT",
        ),
        RACIRow(
            proceso="Auditoría financiera del programa",
            responsable="Órgano Interno de Control",
            aprueba="Cabildo Municipal",
            consulta=["Tesorería", "Dirección de Servicios Públicos"],
            informa=["SEMARNAT estatal", "Ciudadanos"],
            plazo_semanas=52,
        ),
        RACIRow(
            proceso="Renovación y actualización del Reglamento de Aseo Público",
            responsable="Secretaría del Ayuntamiento",
            aprueba="Cabildo Municipal",
            consulta=["Asesor legal", "Dirección de Servicios Públicos"],
            informa=["Ciudadanos"],
            plazo_semanas=12,
            norma_aplicable="Ley Orgánica Municipal",
        ),
        RACIRow(
            proceso="Registro y verificación de Centros de Acopio privados",
            responsable="Dirección de Medio Ambiente",
            aprueba="Dirección de Medio Ambiente",
            consulta=["Dirección de Desarrollo Económico"],
            informa=["Ciudadanos", "Empresas"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Respuesta a denuncias ciudadanas (tiraderos, fauna nociva)",
            responsable="Dirección de Servicios Públicos",
            aprueba="Dirección de Servicios Públicos",
            consulta=["Dirección de Seguridad Pública"],
            informa=["Presidencia Municipal", "Ciudadano denunciante"],
            plazo_semanas=None,
        ),
        RACIRow(
            proceso="Evaluación anual y ajuste del programa",
            responsable="Dirección de Servicios Públicos",
            aprueba="Presidencia Municipal",
            consulta=["Cabildo Municipal", "Ciudadanos (encuesta)"],
            informa=["SEMARNAT estatal", "Sociedad Civil"],
            plazo_semanas=52,
        ),
    ]

    return RACIPlan(
        zm=zm,
        municipio=municipio,
        scenario_id=scenario_id,
        filas=filas,
    )
