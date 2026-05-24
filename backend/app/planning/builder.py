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
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.agents.schemas import (
    GanttPlan,
    PertNode,
    PertPlan,
    PlanningTask,
    RACIPlan,
    RACIRow,
)
from app.planning.task_gate_map import TASK_GATE_MAP


# ─── Fases canónicas del Gantt Maestro (fuente única para export ZIP) ─────────

GANTT_PHASES: list[dict[str, object]] = [
    {
        "id": "F01",
        "slug": "F01_Diseno_y_Planeacion",
        "nombre": "Diseño y planeación",
        "task_ids": ["T01", "T02", "T03"],
        "descripcion": "Diagnóstico territorial, diseño técnico y licitación",
    },
    {
        "id": "F02",
        "slug": "F02_Infraestructura",
        "nombre": "Infraestructura",
        "task_ids": ["T04", "T05", "T06"],
        "descripcion": "Construcción de CAs, equipamiento y puntos de recolección",
    },
    {
        "id": "F03",
        "slug": "F03_Flota",
        "nombre": "Flota",
        "task_ids": ["T07", "T08"],
        "descripcion": "Adquisición de flota y capacitación operativa",
    },
    {
        "id": "F04",
        "slug": "F04_Sensibilizacion",
        "nombre": "Sensibilización",
        "task_ids": ["T09", "T10", "T11"],
        "descripcion": "Comunicación ciudadana y línea base",
    },
    {
        "id": "F05",
        "slug": "F05_Tecnologia",
        "nombre": "Tecnología",
        "task_ids": ["T12", "T13"],
        "descripcion": "Sistema ALQUIMIA y prueba piloto de rutas",
    },
    {
        "id": "F06",
        "slug": "F06_Arranque_Operativo",
        "nombre": "Arranque operativo",
        "task_ids": ["T14", "T15"],
        "descripcion": "Inauguración y comercialización inicial",
    },
]


def _slugify(text: str, max_len: int = 48) -> str:
    import re
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip())
    s = re.sub(r"_+", "_", s).strip("_")
    return s[:max_len] or "item"


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

    def _pert(t_o: float, t_m: float, t_p: float) -> tuple[int, float, float, float]:
        """Retorna (duracion_semanas_round, t_o, t_m, t_p). Duración = round(β-PERT)."""
        dur = (t_o + 4 * t_m + t_p) / 6
        sigma = (t_p - t_o) / 6
        return max(1, round(dur)), t_o, t_m, t_p

    d01, o01, m01, p01 = _pert(1.5, 2.0, 3.5)   # T01: diagnóstico
    d02, o02, m02, p02 = _pert(2.0, 3.0, 5.0)   # T02: diseño técnico
    d03, o03, m03, p03 = _pert(2.0, 3.0, 6.0)   # T03: licitación — alta varianza
    d04, o04, m04, p04 = _pert(dur_infra * 0.8, dur_infra, dur_infra * 1.4)  # T04: construcción
    d05, o05, m05, p05 = _pert(3.0, 4.0, 6.0)   # T05: equipamiento

    tasks = [
        # ── FASE 1: Diseño y planeación ───────────────────────────────────────
        PlanningTask(
            task_id="T01",
            nombre="Diagnóstico territorial y levantamiento de datos",
            descripcion="Estudio de caracterización RSU, mapeo de zonas, análisis de rutas.",
            responsable="Dirección de Servicios Públicos",
            inicio_semana=1, duracion_semanas=d01,
            t_optimista=o01, t_probable=m01, t_pesimista=p01,
            sigma=(p01 - o01) / 6,
            predecesoras=[], es_critica=True,
            costo_mxn=costo_diseno * 0.4,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T02",
            nombre="Diseño técnico de Centros de Acopio",
            descripcion="Planos arquitectónicos, ingeniería civil y especificaciones técnicas.",
            responsable="Dirección de Obras Públicas",
            inicio_semana=2, duracion_semanas=d02,
            t_optimista=o02, t_probable=m02, t_pesimista=p02,
            sigma=(p02 - o02) / 6,
            predecesoras=["T01"], es_critica=True,
            costo_mxn=costo_diseno * 0.4,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T03",
            nombre="Proceso licitatorio y adjudicación de obra",
            descripcion="Llamado a licitación, evaluación de propuestas y contrato.",
            responsable="Comité de Adquisiciones",
            inicio_semana=4, duracion_semanas=d03,
            t_optimista=o03, t_probable=m03, t_pesimista=p03,
            sigma=(p03 - o03) / 6,
            predecesoras=["T02"], es_critica=True,
            costo_mxn=costo_diseno * 0.2,
            fuente_costo="supuesto_editable",
        ),
        # ── FASE 2: Infraestructura ───────────────────────────────────────────
        PlanningTask(
            task_id="T04",
            nombre=f"Construcción de {n_cas_pequeno + n_cas_mediano} CAs pequeños/medianos",
            descripcion="Cimentación, estructura, instalaciones y equipamiento básico.",
            responsable="Empresa constructora",
            inicio_semana=7, duracion_semanas=d04,
            t_optimista=o04, t_probable=m04, t_pesimista=p04,
            sigma=(p04 - o04) / 6,
            predecesoras=["T03"], es_critica=True,
            costo_mxn=costo_infra * 0.70,
            fuente_costo="estimado_mercado",
        ),
        PlanningTask(
            task_id="T05",
            nombre=f"Instalación equipamiento CA{' grande' if n_cas_grande > 0 else ''}",
            descripcion="Prensas, básculas, bandas, contenedores, señalética.",
            responsable="Proveedor de equipamiento",
            inicio_semana=7 + d04 - 3, duracion_semanas=d05,
            t_optimista=o05, t_probable=m05, t_pesimista=p05,
            sigma=(p05 - o05) / 6,
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
    for task in tasks:
        task.fase_gate = TASK_GATE_MAP.get(task.task_id, "G1")
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
        # Usar β-PERT cuando hay estimados de 3 puntos
        tiempo_esp = t.duracion_pert() if t.t_optimista is not None else float(t.duracion_semanas)
        varianza = t.varianza_pert() if t.t_optimista is not None else 0.0
        sigma_nodo = math.sqrt(varianza) if varianza > 0 else 0.0
        nodes.append(PertNode(
            node_id=tid,
            nombre=t.nombre,
            tiempo_esperado=tiempo_esp,
            tiempo_temprano=round(es, 2),
            tiempo_tardio=round(ls, 2),
            holgura=round(holgura, 2),
            es_critico=abs(holgura) < 0.01,
            t_optimista=t.t_optimista,
            t_probable=t.t_probable,
            t_pesimista=t.t_pesimista,
            varianza=round(varianza, 4),
            sigma=round(sigma_nodo, 4),
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


# ─── Desglose diario y mapeo a calendario ─────────────────────────────────────

# Días festivos federales México (mes-día, fijos)
_FESTIVOS_MX = {
    (1, 1), (2, 5), (3, 21), (9, 16), (11, 2), (11, 20), (12, 25)
}


def _es_dia_habil(d: date) -> bool:
    """Retorna True si la fecha es un día hábil (lunes-viernes, no festivo federal)."""
    if d.weekday() >= 5:  # sábado=5, domingo=6
        return False
    if (d.month, d.day) in _FESTIVOS_MX:
        return False
    return True


def _añadir_dias_habiles(start: date, dias: int) -> date:
    """Avanza `dias` días hábiles desde `start`."""
    current = start
    added = 0
    while added < dias:
        current += timedelta(days=1)
        if _es_dia_habil(current):
            added += 1
    return current


# Plantillas de actividades diarias por tarea (15 tareas del Gantt Maestro)
_DAILY_TEMPLATES: Dict[str, List[str]] = {
    "T01": [
        "Reunión kick-off con DGA — recopilación de datos RSU existentes",
        "Descarga y revisión de reportes INEGI / CONAGUA previos",
        "Recorrido de campo zona norte — levantamiento predial",
        "Recorrido de campo zona sur — levantamiento predial",
        "Recorrido de campo zona centro — identificación colonias clave",
        "Entrevistas con operadores actuales del servicio de limpia",
        "Entrevistas con Dirección de Medio Ambiente",
        "Análisis de composición RSU: revisión de datos históricos",
        "Análisis de rutas actuales: eficiencia y frecuencia",
        "Mapeo de actores: pepenadores, recicladores, líderes comunitarios",
        "Análisis SIG: densidad habitacional por colonia",
        "Diagnóstico de estado del relleno sanitario / tiradero",
        "Redacción del diagnóstico técnico — borrador 1",
        "Revisión interna del diagnóstico con equipo ALQUIMIA",
        "Entrega formal del diagnóstico técnico al municipio",
    ],
    "T02": [
        "Revisión de normas técnicas: NOM-083, NMX-AA-061, Guía SEMARNAT 2022",
        "Definición de tipología de CAs según composición RSU",
        "Selección de terrenos candidatos — análisis de viabilidad",
        "Visita técnica a terrenos candidatos con equipo de obras",
        "Elaboración de programa arquitectónico del CA",
        "Desarrollo de planos arquitectónicos (planta baja)",
        "Desarrollo de planos de instalaciones hidráulicas",
        "Desarrollo de planos eléctricos y de iluminación",
        "Especificaciones técnicas de equipamiento fijo",
        "Especificaciones técnicas de báscula y sistemas de pesaje",
        "Revisión con Dirección de Obras Públicas",
        "Ajustes post-revisión — planos definitivos",
        "Elaboración de presupuesto de obra detallado",
        "Entrega del proyecto ejecutivo al municipio",
        "Presentación ante cabildo — validación de diseño",
        "Ajustes finales por observaciones de cabildo",
        "Firma de aprobación del proyecto ejecutivo",
        "Preparación de documentos para licitación",
        "Registro del proyecto en SINFRA / plataforma estatal",
        "Cierre de paquete de licitación",
    ],
    "T03": [
        "Publicación de convocatoria en DiarioOficial / portal municipal",
        "Junta de aclaraciones con licitantes — sesión 1",
        "Junta de aclaraciones — sesión 2 (si aplica)",
        "Recepción de propuestas técnicas",
        "Revisión de propuestas técnicas — evaluación interna",
        "Recepción de propuestas económicas",
        "Análisis comparativo de propuestas económicas",
        "Elaboración del dictamen de adjudicación",
        "Revisión del dictamen con síndico municipal",
        "Notificación del fallo a todos los participantes",
        "Firma del contrato con empresa ganadora",
        "Entrega de anticipo (si aplica)",
        "Inicio formal de obra: acta de inicio",
        "Registro del contrato en CompraNet / sistema estatal",
        "Briefing operativo a empresa contratista",
    ],
    "T04": [
        "Limpieza y preparación del terreno",
        "Trazo y nivelación",
        "Excavación de cimientos",
        "Colado de cimientos y contratrabes",
        "Levantamiento de muros perimetrales",
        "Levantamiento de muros internos",
        "Instalación de cubierta / techumbre",
        "Instalaciones hidráulicas — red de agua",
        "Instalaciones sanitarias — drenaje",
        "Instalaciones eléctricas — acometida",
        "Instalaciones eléctricas — circuitos internos",
        "Iluminación LED de área de trabajo",
        "Piso industrial antiderrapante — zona de pesaje",
        "Piso industrial — zona de almacenamiento",
        "Acabados: aplanados y pintura",
        "Señalética de seguridad e identificación de materiales",
        "Instalación de portones y accesos",
        "Área verde perimetral (si aplica)",
        "Conexión a servicios municipales (agua, drenaje, luz)",
        "Pruebas hidráulicas y eléctricas",
        "Limpieza de obra y retiro de escombro",
        "Supervisión final: lista de pendientes",
        "Corrección de observaciones",
        "Entrega física del inmueble al municipio",
    ],
    "T05": [
        "Recepción y cotejo de equipo de báscula mayor",
        "Instalación de báscula de piso (camiones)",
        "Recepción de báscula de mostrador (sacos)",
        "Instalación de bandas clasificadoras",
        "Recepción de prensa hidráulica para plástico",
        "Instalación y prueba de prensa plástico",
        "Recepción de prensa para cartón/papel",
        "Instalación y prueba de prensa cartón",
        "Recepción de trituradora de vidrio",
        "Instalación y prueba de trituradora vidrio",
        "Recepción de contenedores diferenciados (6 fracciones)",
        "Distribución de contenedores en zonas internas",
        "Instalación de sistema de CCTV",
        "Instalación de red de datos / WiFi",
        "Prueba integral de todo el equipamiento",
        "Capacitación al personal operativo en equipos",
        "Elaboración de manual de operación del CA",
        "Entrega de documentación técnica de equipos",
        "Acta de entrega-recepción del equipamiento",
        "Inicio de operación en modo prueba (soft launch)",
    ],
}

# Para tareas sin template específico, usar actividades genéricas
_DAILY_TEMPLATE_GENERICO = [
    "Revisión de avances con equipo técnico",
    "Actualización de bitácora de proyecto",
    "Coordinación con responsables municipales",
    "Seguimiento de entregables pendientes",
    "Informe de avance semanal",
]


def build_daily_breakdown(
    tasks: List[PlanningTask],
    fecha_inicio: date,
) -> List[Dict[str, Any]]:
    """
    Expande las tareas del Gantt en actividades diarias con fechas de calendario reales.

    Args:
        tasks: Lista de PlanningTask del Gantt Maestro.
        fecha_inicio: Fecha de inicio del programa (primer día hábil).

    Returns:
        Lista de dicts con: task_id, subtarea_id, nombre_tarea, actividad_diaria,
        dia_relativo (1-based), fecha_calendario (ISO str), es_hito.
    """
    resultado: List[Dict[str, Any]] = []

    for task in tasks:
        dias_habiles = task.duracion_semanas * 5  # ≈ 5 días hábiles por semana
        template = _DAILY_TEMPLATES.get(task.task_id, _DAILY_TEMPLATE_GENERICO)

        # Calcular fecha de inicio real de esta tarea
        tarea_inicio = _añadir_dias_habiles(fecha_inicio, (task.inicio_semana - 1) * 5)

        for dia in range(1, dias_habiles + 1):
            actividad_idx = min(dia - 1, len(template) - 1)
            actividad = template[actividad_idx]

            # Fecha calendario del día hábil
            fecha_dia = _añadir_dias_habiles(tarea_inicio, dia - 1)

            resultado.append({
                "task_id": task.task_id,
                "subtarea_id": f"{task.task_id}-D{dia:02d}",
                "nombre_tarea": task.nombre,
                "actividad_diaria": actividad,
                "dia_relativo": dia,
                "semana_relativa": math.ceil(dia / 5),
                "fecha_calendario": fecha_dia.isoformat(),
                "dia_semana": fecha_dia.strftime("%A"),
                "es_hito": dia == dias_habiles,  # último día = hito de cierre
                "responsable": task.responsable,
            })

    return resultado


def semanas_a_fecha(semanas: int, fecha_inicio: date) -> date:
    """Convierte un número de semanas relativas a una fecha real de calendario."""
    return _añadir_dias_habiles(fecha_inicio, (semanas - 1) * 5)
