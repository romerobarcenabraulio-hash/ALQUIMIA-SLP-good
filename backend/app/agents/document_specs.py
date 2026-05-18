"""
Fase 3 — ÁGORA Document Intelligence: especificaciones estándar de documentos.

Este módulo define los 7 tipos de documentos que ÁGORA puede generar y el
Director de Paquete que decide cuáles generar según el ScenarioBundle.

Reglas editoriales (del Estándar Documental ALQUIMIA):
  - Nunca usar SLP como plantilla directa para QRO o MTY.
  - El documento metropolitano no sustituye reglamentos municipales.
  - Un documento jurídico municipal se genera por municipio, no por ZM.
  - Cada documento tiene audiencia, decisión y evidencia mínima declarada.
"""
from __future__ import annotations

import logging
from typing import List

from app.agents.schemas import (
    DocumentNivel,
    DocumentPlan,
    DocumentSpec,
    ScenarioBundle,
)

logger = logging.getLogger(__name__)

# ─── IDs canónicos de documentos ─────────────────────────────────────────────
DOC_EJECUTIVO         = "01_resumen_ejecutivo_municipal"
DOC_TECNICO_FINANCIERO = "02_modelo_tecnico_financiero"
DOC_JURIDICO_PREFIX   = "03_diagnostico_reforma"   # + _{municipio_id}
DOC_METROPOLITANO     = "04_coordinacion_metropolitana"
DOC_OPERATIVO         = "05_manual_operativo_90_dias"
DOC_CIUDADANO         = "06_guia_ciudadana_separacion"
DOC_FUENTES           = "07_fuentes_trazabilidad"
# Wave 1 — Logística (4 nuevos docs)
DOC_RUTAS             = "08_plan_rutas_recoleccion"
DOC_FLOTA             = "09_dimensionamiento_flota"
DOC_TERRITORIO        = "10_segmentacion_territorial"
DOC_SUPPLY_CHAIN      = "11_cadena_suministro_comercializacion"


# ─── Specs estándar ───────────────────────────────────────────────────────────

def spec_ejecutivo(zm: str, municipio_principal: str) -> DocumentSpec:
    """01 — Resumen Ejecutivo Municipal (≤4 minutos de lectura)."""
    return DocumentSpec(
        document_id=DOC_EJECUTIVO,
        titulo=f"Resumen Ejecutivo — {municipio_principal.title()} / {zm}",
        audiencia=[
            "Presidente municipal",
            "Regidores",
            "Tesorería",
            "Dirección General",
        ],
        decision_que_habilita=(
            "Autorizar la presentación del programa ALQUIMIA ante el Cabildo "
            "y el inicio de la ruta de aprobación reglamentaria"
        ),
        nivel=DocumentNivel.ejecutivo,
        secciones_obligatorias=[
            "1. Página de decisión",
            "2. Problema en 5 líneas",
            "3. Propuesta resumida",
            "4. Inversión requerida",
            "5. Retorno proyectado",
            "6. Impacto ambiental y empleos",
            "7. Riesgos principales",
            "8. Próximos 30 días",
            "9. Tabla de decisión requerida",
        ],
        tablas_obligatorias=[
            "Tablero KPI (6 cifras clave)",
            "Tabla de decisión requerida",
        ],
        figuras_obligatorias=[
            "Semáforo de viabilidad",
            "Línea de tiempo 30/90/180 días",
            "Mapa simple de actores",
        ],
        anexos_obligatorios=[],
        fuentes_minimas=[
            "Snapshot de datos con score ≥ 50",
            "Diagnóstico jurídico del municipio principal",
        ],
        criterios_de_bloqueo=[
            "snapshot_datos es None",
            "score_datos < 30",
            "Sin diagnóstico jurídico del municipio principal",
        ],
        tono="ejecutivo-institucional",
        lecturabilidad_objetivo="universitario",
        max_paginas=4,
    )


def spec_tecnico_financiero(zm: str, municipio_principal: str) -> DocumentSpec:
    """02 — Modelo Técnico-Financiero."""
    return DocumentSpec(
        document_id=DOC_TECNICO_FINANCIERO,
        titulo=f"Modelo Técnico-Financiero — {municipio_principal.title()} / {zm}",
        audiencia=[
            "Tesorería",
            "Finanzas",
            "Planeación",
            "Auditor",
        ],
        decision_que_habilita=(
            "Validar la viabilidad financiera del proyecto y autorizar el CAPEX"
        ),
        nivel=DocumentNivel.financiero,
        secciones_obligatorias=[
            "1. Supuestos",
            "2. CAPEX y OPEX",
            "3. Ingresos por material",
            "4. Flujo de caja",
            "5. Análisis de sensibilidad",
            "6. Stress tests",
            "7. Riesgos financieros",
            "8. Trazabilidad de precios",
            "9. Anexo de fórmulas",
        ],
        tablas_obligatorias=[
            "Tabla CAPEX/OPEX por fase",
            "Flujo de caja anual",
            "Matriz de escenarios",
        ],
        figuras_obligatorias=[
            "Waterfall de valor",
            "Tornado de sensibilidad",
            "Gráfica de payback y flujo acumulado",
        ],
        anexos_obligatorios=["Fórmulas del simulador ALQUIMIA"],
        fuentes_minimas=[
            "TIR, VPN, payback del simulador",
            "Tipo de cambio con fuente verificada",
            "Precio de materiales con fuente",
        ],
        criterios_de_bloqueo=[
            "KPIs financieros sin provenance",
            "Precio de material sin fuente",
        ],
        tono="técnico-riguroso",
        lecturabilidad_objetivo="especialista",
        max_paginas=20,
    )


def spec_juridico_municipal(municipio_id: str) -> DocumentSpec:
    """
    03 — Diagnóstico y Reforma Reglamentaria por municipio.
    Se genera UNO POR MUNICIPIO — no usar SLP como plantilla para QRO/MTY.
    """
    return DocumentSpec(
        document_id=f"{DOC_JURIDICO_PREFIX}_{municipio_id}",
        titulo=f"Diagnóstico y Reforma Reglamentaria — {municipio_id.replace('-', ' ').title()}",
        audiencia=[
            f"Sindicatura — {municipio_id}",
            f"Jurídico — {municipio_id}",
            f"Cabildo — {municipio_id}",
            "Servicios Públicos",
        ],
        decision_que_habilita=(
            f"Aprobar la iniciativa de reforma al Reglamento de Limpia "
            f"del municipio de {municipio_id.replace('-', ' ').title()} en sesión de Cabildo"
        ),
        nivel=DocumentNivel.municipal,
        secciones_obligatorias=[
            "1. Reglamento vigente y fuente",
            "2. Versión y fecha del reglamento",
            "3. Artículos relevantes vigentes",
            "4. Brechas identificadas",
            "5. Artículos propuestos",
            "6. Justificación técnica",
            "7. Ruta de Cabildo",
            "8. Riesgos legales",
        ],
        tablas_obligatorias=[
            "Matriz: artículo vigente → problema → propuesta → efecto",
            "Tabla de competencias",
        ],
        figuras_obligatorias=[
            "Matriz de brechas",
            "Diagrama de ruta normativa",
            "Semáforo de gate ÁGORA",
        ],
        anexos_obligatorios=[
            "Texto completo del reglamento vigente (fuente verificada)",
        ],
        fuentes_minimas=[
            f"Reglamento de Limpia de {municipio_id} con fuente verificada",
            "Diagnóstico jurídico del municipio",
        ],
        criterios_de_bloqueo=[
            "Reglamento no verificado",
            "Sin diagnóstico legal del municipio",
            "municipio_id no está en legal_municipal del bundle",
        ],
        tono="jurídico-técnico",
        lecturabilidad_objetivo="especialista-jurídico",
        max_paginas=25,
    )


def spec_metropolitano(zm: str, municipios: List[str]) -> DocumentSpec:
    """
    04 — Coordinación Metropolitana.
    Este documento NO sustituye los reglamentos municipales.
    """
    municipios_str = ", ".join(m.title() for m in municipios)
    return DocumentSpec(
        document_id=DOC_METROPOLITANO,
        titulo=f"Coordinación Metropolitana — ZM {zm}",
        audiencia=[
            f"Presidentes municipales — ZM {zm}",
            "Coordinación regional",
            "Gobierno estatal",
        ],
        decision_que_habilita=(
            f"Firmar el convenio marco de coordinación metropolitana "
            f"entre los municipios de la ZM {zm} para implementar ALQUIMIA"
        ),
        nivel=DocumentNivel.metropolitano,
        secciones_obligatorias=[
            "1. Qué debe homologarse",
            "2. Qué NO debe homologarse (municipios retienen autonomía)",
            "3. Convenio marco propuesto",
            "4. Estándar de datos compartido",
            "5. Interoperabilidad operativa",
            "6. Fases por oleadas",
            f"7. Municipios líderes y bloqueados",
            "8. Incentivos de coordinación",
        ],
        tablas_obligatorias=[
            f"Matriz municipio × avance ({municipios_str})",
            "Tabla de dependencias entre municipios",
        ],
        figuras_obligatorias=[
            "Mapa de oleadas",
            "Diagrama de gobernanza metropolitana",
        ],
        anexos_obligatorios=[],
        fuentes_minimas=[
            f"Paquete legal metropolitano de ZM {zm}",
            "Diagnóstico de oleadas",
        ],
        criterios_de_bloqueo=[
            "Menos de 2 municipios activos (no hay necesidad de coordinación)",
            "Sin paquete metropolitano legal",
        ],
        tono="institucional-diplomático",
        lecturabilidad_objetivo="universitario",
        max_paginas=30,
    )


def spec_operativo(zm: str, municipio_principal: str) -> DocumentSpec:
    """05 — Manual Operativo 90 Días."""
    return DocumentSpec(
        document_id=DOC_OPERATIVO,
        titulo=f"Manual Operativo 90 Días — {municipio_principal.title()} / {zm}",
        audiencia=[
            "Director de Limpia",
            "Coordinadores operativos",
            "Recolectores",
            "Centros de acopio",
        ],
        decision_que_habilita=(
            "Iniciar operación del programa ALQUIMIA en campo"
        ),
        nivel=DocumentNivel.operativo,
        secciones_obligatorias=[
            "1. Semanas 1-4: arranque",
            "2. Semanas 5-8: expansión piloto",
            "3. Semanas 9-12: consolidación",
            "4. Roles y responsabilidades",
            "5. Checklist diaria por rol",
            "6. Rutas de recolección",
            "7. Bitácoras de operación",
            "8. Control de calidad de material",
            "9. Protocolo de incidencias",
            "10. Indicadores semanales",
        ],
        tablas_obligatorias=[
            "Tabla RACI",
            "Formato de bitácora",
            "Checklist por rol",
        ],
        figuras_obligatorias=[
            "Gantt 90 días",
            "Flujo de incidencias",
        ],
        anexos_obligatorios=[
            "Formatos de bitácora impresos",
            "Protocolo de evidencia fotográfica",
        ],
        fuentes_minimas=[
            "LogisticsBlueprint del paquete",
            "Rutas y centros de acopio del municipio",
        ],
        criterios_de_bloqueo=[
            "Sin LogisticsBlueprint",
            "Sin centros de acopio identificados",
        ],
        tono="operativo-claro",
        lecturabilidad_objetivo="secundaria-técnica",
        max_paginas=40,
    )


def spec_ciudadano(zm: str, municipio_principal: str) -> DocumentSpec:
    """06 — Guía Ciudadana de Separación (lenguaje de secundaria)."""
    return DocumentSpec(
        document_id=DOC_CIUDADANO,
        titulo=f"Guía Ciudadana: Cómo Separar tus Residuos — {municipio_principal.title()}",
        audiencia=[
            "Hogares",
            "Administradores de edificios",
            "Comercios",
            "Escuelas",
        ],
        decision_que_habilita=(
            "Comenzar a separar correctamente los residuos en casa o negocio"
        ),
        nivel=DocumentNivel.ciudadano,
        secciones_obligatorias=[
            "1. Qué separar",
            "2. Cómo entregarlo",
            "3. Qué días y horarios",
            "4. Qué NO hacer",
            "5. Beneficios para la familia y el municipio",
            "6. Preguntas frecuentes",
            "7. Canales de reporte y dudas",
        ],
        tablas_obligatorias=[
            "Tabla Sí/No por fracción",
            "Calendario de recolección",
        ],
        figuras_obligatorias=[
            "Pictogramas por fracción de residuo",
            "Mini flujo de entrega",
        ],
        anexos_obligatorios=[],
        fuentes_minimas=[
            "Manual operativo aprobado",
            "Horarios de recolección confirmados",
        ],
        criterios_de_bloqueo=[
            "Sin rutas de recolección definidas",
            "Sin horarios confirmados",
        ],
        tono="ciudadano-accesible",
        lecturabilidad_objetivo="secundaria",
        max_paginas=6,
    )


def spec_fuentes_trazabilidad(zm: str) -> DocumentSpec:
    """07 — Anexo de Fuentes y Trazabilidad (para auditor)."""
    return DocumentSpec(
        document_id=DOC_FUENTES,
        titulo=f"Anexo de Fuentes y Trazabilidad — ZM {zm}",
        audiencia=[
            "Auditor externo",
            "Equipo técnico ALQUIMIA",
            "Oposición",
            "Prensa especializada",
        ],
        decision_que_habilita=(
            "Verificar la trazabilidad completa de todos los datos usados en el paquete"
        ),
        nivel=DocumentNivel.tecnico,
        secciones_obligatorias=[
            "1. Manifest de datos",
            "2. Fuentes por KPI",
            "3. Fecha de consulta de cada fuente",
            "4. Tipo de dato y confianza",
            "5. Fórmulas clave del simulador",
            "6. Supuestos documentados",
            "7. Limitaciones conocidas",
            "8. Advertencias activas",
            "9. Datos no disponibles",
        ],
        tablas_obligatorias=[
            "Tabla de provenance por KPI",
            "Árbol de cálculo por KPI crítico",
            "Matriz de supuestos",
            "Log de advertencias",
        ],
        figuras_obligatorias=[],
        anexos_obligatorios=[],
        fuentes_minimas=[
            "DataProvenance del snapshot",
            "KPIs con trazabilidad",
        ],
        criterios_de_bloqueo=[
            "snapshot_datos es None",
            "kpis_con_provenance está vacío",
        ],
        tono="técnico-riguroso",
        lecturabilidad_objetivo="especialista",
        max_paginas=15,
    )


def spec_rutas_logisticas(zm: str, municipio: str) -> DocumentSpec:
    """08 — Plan de Rutas de Recolección Separada."""
    return DocumentSpec(
        document_id=DOC_RUTAS,
        titulo=f"Plan de Rutas de Recolección — {municipio.title()} / {zm}",
        audiencia=[
            "Director de Servicios Públicos",
            "Jefe de Recolección",
            "Operador logístico",
        ],
        decision_que_habilita="Aprobar el diseño de rutas y calcular el costo operativo mensual de recolección separada",
        nivel=DocumentNivel.operativo,
        secciones_obligatorias=[
            "1. Zonificación de sectores",
            "2. Rutas por sector y CA asignado",
            "3. Frecuencias y horarios",
            "4. Costo mensual por ruta",
            "5. Costo total mensual de operación vial",
            "6. Supuestos y fuentes (diesel, mantenimiento, km)",
        ],
        tablas_obligatorias=[
            "Tabla de rutas: sector, CA, km, frecuencia, costo mensual",
            "Resumen de costo operativo mensual",
        ],
        figuras_obligatorias=[],
        fuentes_minimas=["Precio diesel PEMEX con fecha", "Distancias estimadas con etiqueta"],
        criterios_de_bloqueo=["Sin rutas definidas", "Sin precio de diesel declarado"],
        tono="técnico-operativo",
        lecturabilidad_objetivo="técnico",
        max_paginas=8,
    )


def spec_flota_vehicular(zm: str, municipio: str) -> DocumentSpec:
    """09 — Dimensionamiento de Flota Vehicular."""
    return DocumentSpec(
        document_id=DOC_FLOTA,
        titulo=f"Dimensionamiento de Flota — {municipio.title()} / {zm}",
        audiencia=[
            "Director de Servicios Públicos",
            "Tesorería",
            "Comité de Adquisiciones",
        ],
        decision_que_habilita="Autorizar la licitación y adquisición de la flota de recolección separada",
        nivel=DocumentNivel.operativo,
        secciones_obligatorias=[
            "1. Demanda de recolección (ton/día)",
            "2. Número de unidades requeridas",
            "3. Especificaciones técnicas del vehículo",
            "4. CAPEX de flota con precio y fuente",
            "5. OPEX vehicular mensual (diesel + mantenimiento)",
            "6. Ciclo de reposición y costo proyectado",
            "7. Clasificación de fuentes de precios",
        ],
        tablas_obligatorias=[
            "Tabla de flota: tipo, capacidad, unidades, precio unitario, CAPEX total",
            "OPEX vehicular mensual detallado",
        ],
        fuentes_minimas=["Precio de camión con URL o cotización", "Precio diesel PEMEX"],
        criterios_de_bloqueo=["Sin precio de vehículo declarado"],
        tono="técnico-operativo",
        lecturabilidad_objetivo="técnico",
        max_paginas=10,
    )


def spec_territorio(zm: str, municipio: str) -> DocumentSpec:
    """10 — Segmentación Territorial y Secuencia de Arranque."""
    return DocumentSpec(
        document_id=DOC_TERRITORIO,
        titulo=f"Segmentación Territorial — {municipio.title()} / {zm}",
        audiencia=[
            "Director de Servicios Públicos",
            "Presidencia Municipal",
            "Comunicación Social",
        ],
        decision_que_habilita="Definir el orden de arranque por zonas y priorizar la campaña de sensibilización",
        nivel=DocumentNivel.operativo,
        secciones_obligatorias=[
            "1. Zonificación municipal (Zona A/B/C)",
            "2. Criterios de priorización",
            "3. Cobertura por ola (% viviendas)",
            "4. CA asignado por zona",
            "5. Riesgos de baja participación y mitigaciones",
            "6. Semana estimada de cobertura total",
        ],
        tablas_obligatorias=[
            "Tabla de zonas: nombre, tipo, CA, viviendas, ton/día, riesgo",
            "Cronograma de arranque por ola",
        ],
        fuentes_minimas=["Estimación de viviendas con fuente (INEGI o estimado)"],
        criterios_de_bloqueo=["Sin zonificación definida"],
        tono="técnico-operativo",
        lecturabilidad_objetivo="técnico",
        max_paginas=8,
    )


def spec_supply_chain(zm: str, municipio: str) -> DocumentSpec:
    """11 — Cadena de Suministro y Comercialización."""
    return DocumentSpec(
        document_id=DOC_SUPPLY_CHAIN,
        titulo=f"Cadena de Suministro y Comercialización — {municipio.title()} / {zm}",
        audiencia=[
            "Director de Servicios Públicos",
            "Tesorería",
            "Operador del CA",
        ],
        decision_que_habilita="Confirmar compradores de materiales y proyectar ingresos reales por venta",
        nivel=DocumentNivel.operativo,
        secciones_obligatorias=[
            "1. Volúmenes por material (ton/año)",
            "2. Precios de mercado por material con fuente",
            "3. Compradores identificados en la ZM",
            "4. Ingreso bruto y ajustado por material",
            "5. Materiales sin comprador identificado (riesgo)",
            "6. Recomendaciones para asegurar mercado",
            "7. Líneas de ingreso para el CostModel",
        ],
        tablas_obligatorias=[
            "Tabla de materiales: vol, precio, comprador, ingreso ajustado, riesgo",
            "Resumen de ingresos totales proyectados",
        ],
        fuentes_minimas=["Precio PET con fuente y fecha", "Al menos un comprador identificado"],
        criterios_de_bloqueo=["Sin precios de materiales declarados"],
        tono="técnico-financiero",
        lecturabilidad_objetivo="técnico",
        max_paginas=10,
    )


# ─── Director de Paquete ─────────────────────────────────────────────────────

def build_document_plan(bundle: ScenarioBundle) -> DocumentPlan:
    """
    Director de Paquete: recibe un ScenarioBundle y decide qué documentos
    generar, en qué orden y para quién.

    Reglas:
    - Siempre genera: ejecutivo, técnico-financiero, fuentes.
    - Por cada municipio activo: genera documento jurídico municipal propio.
    - Si hay > 1 municipio: también genera capa metropolitana.
    - Si hay LogisticsBlueprint: también genera manual operativo.
    - Siempre genera guía ciudadana (lenguaje accesible para todos).
    """
    specs: list[DocumentSpec] = []
    warnings: list[str] = []
    municipio_principal = bundle.municipios_activos[0]

    # 1. Resumen ejecutivo (siempre)
    spec_ej = spec_ejecutivo(bundle.zm, municipio_principal)
    if bundle.snapshot_datos is None:
        warnings.append(
            f"[{spec_ej.document_id}] snapshot_datos es None — "
            "el documento ejecutivo tendrá advertencias de datos."
        )
    specs.append(spec_ej)

    # 2. Modelo técnico-financiero (siempre)
    if bundle.kpis_con_provenance:
        specs.append(spec_tecnico_financiero(bundle.zm, municipio_principal))
    else:
        warnings.append(
            f"[{DOC_TECNICO_FINANCIERO}] BLOQUEADO — "
            "kpis_con_provenance está vacío. No se puede generar modelo financiero sin datos."
        )

    # 3. Diagnóstico jurídico: uno por municipio
    municipios_sin_legal = []
    for municipio_id in bundle.municipios_activos:
        if bundle.tiene_legal_para_municipio(municipio_id):
            specs.append(spec_juridico_municipal(municipio_id))
        else:
            municipios_sin_legal.append(municipio_id)
            warnings.append(
                f"[{DOC_JURIDICO_PREFIX}_{municipio_id}] BLOQUEADO — "
                f"municipio '{municipio_id}' no tiene diagnóstico jurídico verificado."
            )

    # 4. Coordinación metropolitana (solo si > 1 municipio)
    if bundle.requiere_capa_metropolitana():
        specs.append(spec_metropolitano(bundle.zm, bundle.municipios_activos))
    else:
        logger.debug(
            f"[{DOC_METROPOLITANO}] omitido — solo 1 municipio activo ({municipio_principal})"
        )

    # 5. Manual operativo (siempre — se llena con LogisticsBlueprint cuando esté disponible)
    specs.append(spec_operativo(bundle.zm, municipio_principal))

    # 6. Guía ciudadana (siempre)
    specs.append(spec_ciudadano(bundle.zm, municipio_principal))

    # 7. Anexo de fuentes y trazabilidad (siempre — es el ancla de credibilidad)
    if bundle.kpis_con_provenance or bundle.snapshot_datos:
        specs.append(spec_fuentes_trazabilidad(bundle.zm))
    else:
        warnings.append(
            f"[{DOC_FUENTES}] BLOQUEADO — "
            "sin snapshot_datos ni kpis_con_provenance no se puede construir el anexo de fuentes."
        )

    # 8–11. Documentos logísticos (Wave 1) — siempre generados
    # Los 4 agentes logísticos corren en paralelo con el bloque 3 del pipeline.
    specs.append(spec_rutas_logisticas(bundle.zm, municipio_principal))
    specs.append(spec_flota_vehicular(bundle.zm, municipio_principal))
    specs.append(spec_territorio(bundle.zm, municipio_principal))
    specs.append(spec_supply_chain(bundle.zm, municipio_principal))

    if municipios_sin_legal:
        warnings.append(
            f"ADVERTENCIA: {len(municipios_sin_legal)} municipio(s) sin diagnóstico legal: "
            f"{', '.join(municipios_sin_legal)}. "
            "Los documentos jurídicos correspondientes no se generarán hasta que se verifique el reglamento."
        )

    logger.info(
        f"DocumentPlan construido para ZM {bundle.zm}: "
        f"{len(specs)} documentos, {len(warnings)} advertencias"
    )

    return DocumentPlan(
        bundle_id=bundle.scenario_id,
        zm=bundle.zm,
        municipios=bundle.municipios_activos,
        specs=specs,
        warnings=warnings,
    )
