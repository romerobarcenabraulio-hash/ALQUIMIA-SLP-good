import type { DecisionModule } from '@/types'

/** Módulo introductorio literario — Steps for Circularity. Guía obligatoria antes de M01. */
export const GUIA_CIRCULARIDAD_MODULE: DecisionModule = {
  module_id: 'guia_circularidad',
  label: 'Steps for Circularity — Guía de lectura',
  audience_mode: 'city_team',
  decision: 'Entender qué es ALQUIMIA, cuál es el problema de RSU y cómo se navega el simulador antes de interpretar los datos.',
  evidence: 'Narrativa editorial estructurada en 5 pasos: Analizar, Diagnosticar, Planear, Ejecutar, Monitorear. Sin gráficas ni cálculos — solo contexto.',
  status: 'ready',
  next_action: 'Leer la guía completa. Luego navegar al Módulo 01 — Línea Base.',
}

/** Módulo de Logística Operativa — cliente-side, M06 en la nueva arquitectura narrativa. */
export const LOGISTICA_MODULE: DecisionModule = {
  module_id: 'logistica_operativa',
  label: 'Logística operativa y diseño de piloto',
  audience_mode: 'city_team',
  decision: 'Diseñar la zona piloto, calcular rutas y definir la operación diaria antes de lanzar el programa.',
  evidence: 'Matriz de selección de piloto (5 criterios ponderados), rutas calculadas dinámicamente, bitácora PER, análisis de cuellos de botella.',
  status: 'ready',
  next_action: 'Validar zona piloto con el equipo de campo y confirmar disponibilidad de camiones antes de la primera oleada.',
}

/** Módulo de Esquema de Concesión — cliente-side, M09 en la nueva arquitectura narrativa. */
export const ESQUEMA_CONCESION_MODULE: DecisionModule = {
  module_id: 'esquema_concesion',
  label: 'Esquema de concesión y modelo de negocio',
  audience_mode: 'city_team',
  decision: 'Definir quién opera el CA, cómo se distribuyen los ingresos y cuánto recibe el municipio.',
  evidence: 'Árbol de decisión institucional, distribución de ingresos por esquema (A/B/C/D), derrama industrial por sector (reciclaje, acerera, agrícola), empleos por sector.',
  status: 'ready',
  next_action: 'Seleccionar esquema con presidencia y síndico municipal. Preparar instrumento legal correspondiente.',
}

/** Módulo de Doble Materialidad — cliente-side, M12 en la nueva arquitectura narrativa. */
export const DOBLE_MATERIALIDAD_MODULE: DecisionModule = {
  module_id: 'doble_materialidad',
  label: 'Doble materialidad y reporte ESG',
  audience_mode: 'city_team',
  decision: 'Reportar el programa bajo estándares internacionales (GRI 306, ESRS E5) para acceso a financiamiento verde.',
  evidence: 'Matriz de doble materialidad CSRD, GRI 306 Disclosures derivados del simulador, KPIs proyectado vs. real, template de reporte BID/GCF.',
  status: 'ready',
  next_action: 'Generar informe GRI 306 y compartir con BANOBRAS / financiadores internacionales.',
}

/** Módulo solo de cliente: no viene en el JSON de `/city/journey/steps`. */
export const SOURCE_TRACEABILITY_MODULE: DecisionModule = {
  module_id: 'source_traceability',
  label: 'Bibliografía y cálculos',
  audience_mode: 'city_team',
  decision: 'Verificar qué afirmación sostiene cada número del simulador.',
  evidence: 'Matriz de trazabilidad de fuentes, fórmulas, estado de verificación y acción correctiva.',
  status: 'ready',
  next_action: 'Cerrar pendientes de fuente antes de usar el escenario como soporte público formal.',
}

/**
 * Módulo de estudio demográfico y contexto social — cliente-side, se inyecta
 * después de `municipal_context` para el recorrido de funcionario.
 * Integra los 16 componentes Social* del sistema ALQUIMIA.
 */
export const SOCIAL_STUDY_MODULE: DecisionModule = {
  module_id: 'social_study',
  label: 'Estudio demográfico y contexto social',
  audience_mode: 'city_team',
  decision: 'Leer el contexto sociodemográfico del municipio antes de diseñar estrategia de separación.',
  evidence: 'Indicadores INEGI Censo 2020, CONEVAL 2022, ENOE 2024, ENIGH 2022 — sin cifras inventadas.',
  status: 'ready',
  next_action: 'Revisar rezago social, informalidad y riesgo reputacional antes de cerrar diseño del programa.',
}

export const FUNCTIONARY_MODULE_LABELS: Record<
  string,
  Pick<DecisionModule, 'label' | 'decision' | 'evidence' | 'next_action'>
> = {
  guia_circularidad: {
    label: 'Steps for Circularity — Guía de lectura',
    decision: 'Entender qué es ALQUIMIA, cuál es el problema de RSU y cómo se navega el simulador.',
    evidence: 'Narrativa editorial en 5 pasos: Analizar, Diagnosticar, Planear, Ejecutar, Monitorear.',
    next_action: 'Leer la guía completa y navegar al Módulo 01 — Línea Base.',
  },
  city_baseline: {
    label: 'Problema y resumen ejecutivo',
    decision: 'Entender el costo municipal, sanitario y económico de no separar antes de plantear metas.',
    evidence: 'RSU activo, salud pública, derrama por valorización y supuestos editables del escenario.',
    next_action: 'Ajustar vivienda, generación, precios y costo de disposición antes de revisar marco jurídico.',
  },
  municipal_context: {
    label: 'Contexto sociodemográfico y marco legal municipal',
    decision:
      'Integrar lectura sociodemográfica de referencia (KPIs con trazabilidad, sin acto jurídico) con el marco jurídico local: qué puede ejecutarse con reglamento vigente y qué requiere reforma.',
    evidence:
      'Panel de contexto social, indicadores versionados, diagnóstico legal por municipio y fuentes localizadas.',
    next_action:
      'Revisar alcance geográfico y advertencias antes de citar cifras; validar fuente municipal competente antes de sanciones o documentos oficiales.',
  },
  future_goals: {
    label: 'Metas futuras / Gantt-PERT',
    decision: 'Convertir metas de circularidad en ruta temporal, dependencias y brechas de capacidad.',
    evidence: 'Horizonte, curva de captura, calendario y dependencia territorial de implementación.',
    next_action: 'Confirmar compatibilidad entre metas, capacidad e infraestructura por trimestre.',
  },
  infrastructure_operations: {
    label: 'Infraestructura en espacio-tiempo',
    decision: 'Definir qué infraestructura se crea, dónde, cuándo y con qué capacidad operativa.',
    evidence: 'Zonas, rutas, centros de acopio, bitácora PER y flujo material conectado al territorio.',
    next_action: 'Validar responsables, rutas, evidencia operativa y capacidad instalada.',
  },
  risk_trends: {
    label: 'Riesgos y tendencias',
    decision: 'Cuantificar riesgos de mercado, políticos, operativos y regulatorios antes de comprometer el programa.',
    evidence: 'Fórmulas documentadas por dimensión, score ponderado y tendencias externas con trazabilidad.',
    next_action: 'Revisar dimensiones en rojo y validar supuestos con equipo jurídico y operativo.',
  },
  market_traceability: {
    label: 'Mercado, causalidad y riesgos',
    decision: 'Validar mercado, trazabilidad y compradores antes de cerrar el escenario.',
    evidence: 'Grafo causal, KPIs del simulador y explicaciones trazables a fuentes.',
    next_action: 'Reconstruir el grafo tras cambiar supuestos; cerrar warnings antes de exportar.',
  },
  inspeccion_predios: {
    label: 'Inspección de predios / estrategia administrativa',
    decision: 'Separar educación, visita técnica, evidencia e inspección sin presentar sanciones firmes.',
    evidence: 'Bitácora, actor responsable, predio/ruta y evidencia requerida por el flujo operativo.',
    next_action: 'Usar la evidencia para mejorar cumplimiento y preparar revisión jurídica municipal.',
  },
  scenarios_export: {
    label: 'Escenarios, derrama y salida',
    decision: 'Comparar derrama base, sensibilidad financiera y salida ejecutiva sin carácter oficial.',
    evidence: 'Monte Carlo, waterfall, tornado, KPIs, supuestos, exportables y advertencias de validación pendientes.',
    next_action: 'Revisar matriz de fuentes antes de presentar cifras en sesión pública.',
  },
  social_study: {
    label: 'Estudio demográfico y contexto social',
    decision: 'Integrar lectura sociodemográfica trazable (INEGI, CONEVAL, ENOE) antes de diseñar la estrategia de participación ciudadana.',
    evidence: 'Indicadores versionados con fuente, matriz de riesgo social, bitácora de supuestos y panel exportable.',
    next_action: 'Revisar rezago social, informalidad del sector y riesgo reputacional antes de cerrar diseño del programa.',
  },
  logistica_operativa: {
    label: 'Logística operativa y diseño de piloto',
    decision: 'Diseñar la zona piloto con criterios objetivos y calcular las rutas antes del arranque.',
    evidence: 'Matriz de selección (densidad, vialidad, actor aliado, composición RSU, apoyo político), rutas dinámicas por capacidad de camión, operación PER, cuellos de botella estacionales.',
    next_action: 'Confirmar zona piloto con el equipo de campo antes de la primera oleada operativa.',
  },
  esquema_concesion: {
    label: 'Esquema de concesión y modelo de negocio',
    decision: 'Definir quién opera el CA y cuánto recibe el municipio — la pregunta que el cabildo realmente vota.',
    evidence: 'Árbol de decisión institucional (3 preguntas), distribución de ingresos por esquema A/B/C/D, ingresos fiscales reales (ISN+derechos), derrama industrial y empleos por sector.',
    next_action: 'Presentar esquema recomendado a presidencia y síndico. Iniciar instrumento legal correspondiente.',
  },
  doble_materialidad: {
    label: 'Doble materialidad y reporte ESG',
    decision: 'Convertir los resultados del programa en lenguaje de financiadores (GRI 306, ESRS E5) para acceder a crédito verde.',
    evidence: 'Matriz doble materialidad CSRD, disclosures GRI 306 derivados del simulador, KPIs proyectado vs. real, template BID/GCF.',
    next_action: 'Enviar informe GRI 306 a BANOBRAS o financiador seleccionado como paso previo a solicitud de crédito.',
  },
}

export function enrichFunctionaryModules(modules: DecisionModule[]) {
  return modules.map(module => {
    const copy = FUNCTIONARY_MODULE_LABELS[module.module_id]
    return copy ? { ...module, ...copy } : module
  })
}
