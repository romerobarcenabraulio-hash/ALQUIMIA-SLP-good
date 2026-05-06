"""Prompts del pipeline documental ÁGORA — siete artefactos paralelos (Q-023)."""

from __future__ import annotations

from collections.abc import Callable

from .schemas import PlanRequest


_DISCLAIMER_BLOQUE = """> **⚠️ BORRADOR — SIMULACIÓN ALQUIMIA · NO OFICIAL**
> Este documento fue generado automáticamente como insumo de análisis y planeación municipal.
> **No constituye dictamen jurídico, acto de autoridad, resolución administrativa, propuesta de ley
> oficial ni asesoría legal certificada.** Las cifras, proyecciones, plazos y referencias normativas
> son estimaciones del modelo basadas en los parámetros declarados por el usuario; no sustituyen
> estudios oficiales, diagnósticos certificados, instrumentos jurídicos firmados ni resoluciones de
> autoridad competente. Antes de presentar este documento ante un cabildo, autoridad, contraparte
> contractual o medio de comunicación, debe ser revisado y validado por profesionistas con cédula
> vigente en la materia (abogado, ingeniero ambiental, auditor público según corresponda).
> Las normas citadas (LGPGIR, LGEEPA y NOM correspondientes) se mencionan como marco de referencia
> general; su aplicación específica al municipio requiere verificación en fuente oficial (DOF,
> gaceta estatal, portal municipal). — **ALQUIMIA · Plataforma de Simulación de Circularidad Municipal**

---

"""


def _bloque_contexto(req: PlanRequest) -> str:
    return f"""CONTEXTO OPERATIVO (no inventar otros datos numéricos municipales):
- Municipio / ámbito de referencia: {req.municipio}
- Estado: {req.estado}
- Población (habitantes, parámetro declarado): {req.poblacion:,}
- Generación de RSU reconocida por el cliente: {req.generacion_rsu_dia:.4f} toneladas por día
- Ingreso anual estimado (modelo del cliente): MXN {req.ingreso_estimado_anual_mxn:,.2f}
- Escenario de trayectoria: {req.escenario}
- Paquete sectorial: {req.sector_pack_id}

RESTRICCIONES:
- Redacta en español, estilo formal institucional mexicano (informe a presidencia municipal / cabildo).
- Referencia marco legal real: LGPGIR, LGEEPA y NOM-083-SEMARNAT-2003 / NOM-161-SEMARNAT-2011
  solo como marco normativo de referencia general; no afirmes datos estadísticos locales no provistos arriba.
- NO inventes tasas, encuestas INEGI específicas ni cifras de desempeño nacional/metropolitano no dadas en el contexto.
- Extensión solicitada: entre 400 y 800 palabras, en prosa con subtítulos markdown (##).
- OBLIGATORIO: el documento debe comenzar EXACTAMENTE con el siguiente bloque de aviso antes de
  cualquier otro contenido, sin modificarlo:

{_DISCLAIMER_BLOQUE}"""


def prompt_marco_legal(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-1 · Marco legal municipal

Elabora el documento "Marco Legal Municipal" orientado al servicio de limpia y manejo de residuos sólidos urbanos:

1. Relación entre la Ley General para la Prevención y Gestión Integral de los Residuos y las competencias municipales.
2. Rol del Reglamento de limpia o equivalente municipal y ordenanzas relacionadas (sin citar texto inexistente; indica típicamente qué debe contener una reforma tipo).
3. Artículos o figuras típicamente aplicables a separación en origen, recolección diferenciada y centros de acopio (descripción cualitativa).
4. Ámbitos de coordinación estado-municipio y riesgos de ilegalidad por omisión del servicio.
5. Cierre con "Próximos pasos institucionales" alineados al escenario dado.

Salida únicamente como markdown bien formateado (# título principal, luego ## secciones)."""
    )


def prompt_iniciativa_reforma(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-2 · Iniciativa de reforma reglamentaria

Redacta un borrador tipo "iniciativa de adendo / iniciativa reglamentaria" para conocimiento del cabildo que:

1. Exponiendo motivos (sin datos inventados más allá de los parámetros recibidos).
2. Objeto del adendo en materia de RSU y centros de acopio públicos/concesionados.
3. Dos o tres puntos de dictamen esperado (comités, estudios jurídicos, consulta ciudadana mencionada de forma procesal).
4. Transitorios sugeridos (plazos razonables, sin fechas específicas inventadas más allá del horizonte 36 meses como referencia de política únicamente si lo deseas como propuesta cualitativa).
5. Marco de vigilancia ciudadana mencionándose rendición de cuentas sin crear obligaciones ilegales.

Salida sólo markdown estructural."""
    )


def prompt_modelo_concesion(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-3 · Modelo de concesión de centro de acopio (CA)

Describe un esquema jurídico-financiero de referencia para el primer centro de acopio:

1. Figura contractual (contrato público/concesión de obra/servicios — descripción doctrinal mexicana típica, sin modelo jurisdiccional específico falso).
2. Cláusulas clave sugeridas: objeto, vigencia tipo, remuneración tipo, garantías típicas, reversión/residuales.
3. Riesgos fiscales y de competencia mencionados a alto nivel (sin montos tributarios específicos no provistos).
4. KPIs administrativos mínimos (tonelaje, pureza declarada por el modelo, seguridad industrial).
5. Anexos esperados técnico-jurídicos (sin inventar estudios locales).

Markdown, tono consejo técnico a la tesorería jurídica municipal."""
    )


def prompt_plan_36(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-4 · Plan de implementación 36 meses

Desarrolla un plan tipo fases 0 a 3 distribuidas en hasta 36 meses con:

1. Diagnóstico y sala técnica (fase 0).
2. Adecuación normativa y obra preparatoria (fase 1).
3. Operación diferenciada y escala territorial (fase 2–3 combinadas cualitativamente).
4. Tabla textual de hitos esperados mes aproximado (solo como ilustración, sin calendarios exactos ficticios específicos a días corridos locales).
5. Indicadores de seguimiento vinculados al escenario (conservador/moderado/acelerado).

Sólo markdown, sin bullets numerados hasta seis niveles."""
    )


def prompt_benchmark_latam(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-5 · Benchmark LATAM comparativo

Construye una comparativa de tres municipios/ciudades de América Latina similares en tamaño (sin inventar cifras de producción específicas que no están en este contexto; usa sólo orden de magnitud cualitativa o parámetro del cliente para anclaje).

Para cada ciudad: nombre, modelo de política de residuos descrito cualitativamente, lección institucional. Concluye con transferibilidad cautelosa al municipio del contexto usando solo los datos recibidos arriba.

Markdown; no afirmes resultados KPI numéricos de esas ciudades si no están en el contexto (usa formulaciones como "literatura de referencia típica" con cuidado)."""
    )


def prompt_stakeholders(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-6 · Mapeo de stakeholders

Entrega una matriz en prosa markdown con subtítulos: presidencia municipal, cabildo, secretaría de servicios / ecología típica, concesionario o operador, sector productivo cercano, población y recicladores de base formalizados. Para cada grupo: rol, información mínima requerida, riesgos de comunicación institucución–ciudadanía sin dramatización.

Markdown con ## por grupo."""
    )


def prompt_reporte_ejecutivo(req: PlanRequest) -> str:
    base = _bloque_contexto(req)
    return (
        base
        + """

TAREA — DOC-7 · Reporte ejecutivo (equiv. máx. dos páginas impresas)

Producción de memorando ejecutivo ciudadano-presidente municipal que:

1. Resuma en qué consiste formalizar política RSU ante el cabildo.
2. Una síntesis de requerimientos legales mencionados (LGPGIR, reglamentos, estándares NOM mencionadas genéricamente).
3. Una lectura económica de alto nivel alineada a ingreso anual declarado MXN sin deducir cifras adicionales.
4. Una frase sobre riesgo reputacional institucional prudente.
5. Decide tres acciones tácticas próximos 120 días (sin fecha invención día/mes locales).

Markdown conciso, sin repeticiones redundantes más allá del límite 400–650 palabras aprox."""
    )


PROMPTS_BY_FILENAME: tuple[tuple[str, Callable[[PlanRequest], str]], ...] = (
    ("01_marco_legal.md", prompt_marco_legal),
    ("02_iniciativa_reforma.md", prompt_iniciativa_reforma),
    ("03_modelo_concesion.md", prompt_modelo_concesion),
    ("04_plan_implementacion.md", prompt_plan_36),
    ("05_benchmark_latam.md", prompt_benchmark_latam),
    ("06_mapeo_stakeholders.md", prompt_stakeholders),
    ("07_reporte_ejecutivo.md", prompt_reporte_ejecutivo),
)
