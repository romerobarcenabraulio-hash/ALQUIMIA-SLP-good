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

/** Módulo de Costos del Programa — tabla maestra CAPEX/OPEX, cliente-side, M07. */
export const COSTOS_PROGRAMA_MODULE: DecisionModule = {
  module_id: 'costos_programa',
  label: 'Costos del programa — CAPEX y OPEX',
  audience_mode: 'city_team',
  decision: 'Cuantificar la inversión total (CAPEX) y el costo operativo anual (OPEX) del programa, desglosados por equipo, personal y operación.',
  evidence: 'Tabla maestra de inversión por categoría, estructura de personal con prestaciones, catálogo de equipos con precios de mercado verificables, comparativa P/M/G.',
  status: 'ready',
  next_action: 'Validar precios de equipamiento con cotizaciones locales antes de presentar presupuesto al tesorero municipal.',
}

/** Módulo de Monitoreo Real — proyectado vs. medido, cliente-side, M13. */
export const MONITOREO_REAL_MODULE: DecisionModule = {
  module_id: 'monitoreo_real',
  label: 'Monitoreo — proyectado vs. real',
  audience_mode: 'city_team',
  decision: 'Comparar las proyecciones del simulador con los datos reales de operación para detectar desviaciones y corregir el rumbo.',
  evidence: 'Dashboard de semáforo con métricas clave (tonelaje, empleos, ingresos, CO₂e), datos de campo capturados, historial de desviaciones.',
  status: 'ready',
  next_action: 'Capturar los datos del primer mes de operación del piloto para calibrar las proyecciones.',
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
/** Módulo de Dictamen Técnico y Social — cliente-side, M03B. */
export const DICTAMEN_TECNICO_MODULE: DecisionModule = {
  module_id: 'dictamen_tecnico',
  label: 'Dictamen técnico y social de la reforma',
  audience_mode: 'city_team',
  decision: 'Fundamentar técnicamente y socialmente cada adendo propuesto antes de llevarlo a Cabildo.',
  evidence: 'Evidencia de 5 fracciones vs. 3, multas progresivas, condominios primero, registro obligatorio, técnica normativa y benchmarks internacionales.',
  status: 'ready',
  next_action: 'Anexar este dictamen al punto de acuerdo de Cabildo junto con los adendos del M03.',
}

/** Módulo de Costo de la Omisión — contrafactual 10 años, cliente-side, M04. */
export const COSTO_OMISION_MODULE: DecisionModule = {
  module_id: 'costo_omision',
  label: 'Costo de la omisión — ¿cuánto cuesta NO actuar?',
  audience_mode: 'city_team',
  decision: 'Cuantificar el pasivo ambiental, sanitario y económico de no implementar el programa en los próximos 10 años.',
  evidence: 'Análisis contrafactual 10 años: costo acumulado de disposición, daño a salud (OPS/INSP), cuenta regresiva relleno sanitario, multas PROFEPA estimadas, pérdida de elegibilidad para financiamiento verde.',
  status: 'ready',
  next_action: 'Presentar este análisis antes de discutir presupuesto — establece el costo de NO decidir.',
}

/** Módulo de Organigrama del Programa — estructura operativa, cliente-side, M07. */
export const ORGANIGRAMA_MODULE: DecisionModule = {
  module_id: 'organigrama_programa',
  label: 'Organigrama y estructura operativa del programa',
  audience_mode: 'city_team',
  decision: 'Definir la estructura de gobierno, roles, responsabilidades y plantilla de personal del programa antes de lanzar.',
  evidence: 'Organigrama jerárquico, matriz RACI, plantilla por tipo de CA (P/M/G), fases de capacitación y OPEX de personal dinámico.',
  status: 'ready',
  next_action: 'Validar la estructura con la Dirección de Servicios Públicos y asignar responsables nominales antes del arranque.',
}

/** Módulo de Árbol de Financiamiento — 6 caminos, cliente-side, M13. */
export const ARBOL_FINANCIAMIENTO_MODULE: DecisionModule = {
  module_id: 'arbol_financiamiento',
  label: 'Árbol de financiamiento — 6 caminos de capital',
  audience_mode: 'city_team',
  decision: 'Seleccionar el esquema de financiamiento más adecuado según la capacidad institucional, el costo de capital y los requisitos de elegibilidad.',
  evidence: 'Árbol de decisión interactivo: Municipal Directo, Concesión Privada, APP, Fideicomiso Municipal, BID/CAF, Deuda Verde BANOBRAS — con criterios, costo de capital y pros/contras.',
  status: 'ready',
  next_action: 'Confirmar esquema con el tesorero y el síndico antes de abrir cualquier proceso de licitación o crédito.',
}

/** Módulo de Expediente para Cabildo — panel de gobernanza y exportación, cliente-side, M15. */
export const EXPEDIENTE_CABILDO_MODULE: DecisionModule = {
  module_id: 'expediente_cabildo',
  label: 'Expediente completo para Cabildo',
  audience_mode: 'city_team',
  decision: 'Consolidar toda la documentación necesaria para presentar y obtener aprobación del Cabildo municipal.',
  evidence: 'Panel de gobernanza, lista de verificación pre-lanzamiento, generación de documentos ejecutivos (PDF, XLSX, JSON), acuerdo de Cabildo.',
  status: 'ready',
  next_action: 'Verificar que todos los checks de la lista estén en verde antes de agendar sesión de Cabildo.',
}

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
  dictamen_tecnico: {
    label: 'Dictamen técnico y social de la reforma',
    decision: 'Responder por qué 5 fracciones, por qué multas progresivas, por qué condominios primero — con evidencia citada.',
    evidence: 'Benchmarks internacionales, economía del material, ciencia del comportamiento, técnica normativa y mapa adendo→justificación.',
    next_action: 'Anexar al expediente de Cabildo antes de la votación del reglamento reformado.',
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
  costos_programa: {
    label: 'Costos del programa — CAPEX y OPEX',
    decision: 'Cuantificar la inversión total y el costo operativo anual del programa.',
    evidence: 'Tabla maestra CAPEX, estructura de personal, catálogo de equipos, comparativa P/M/G.',
    next_action: 'Validar precios con cotizaciones locales.',
  },
  monitoreo_real: {
    label: 'Monitoreo — proyectado vs. real',
    decision: 'Comparar proyecciones con datos reales de operación.',
    evidence: 'Dashboard semáforo, datos de campo, historial de desviaciones.',
    next_action: 'Capturar datos del primer mes de operación.',
  },
  costo_omision: {
    label: 'Costo de la omisión — ¿cuánto cuesta NO actuar?',
    decision: 'Cuantificar el pasivo ambiental, sanitario y económico de no implementar el programa en los próximos 10 años.',
    evidence: 'Costo acumulado de disposición, daño a salud (OPS/INSP), cuenta regresiva relleno, multas PROFEPA, pérdida de financiamiento verde.',
    next_action: 'Usar este análisis para abrir la conversación de presupuesto — primero el costo de no decidir.',
  },
  organigrama_programa: {
    label: 'Organigrama y estructura operativa',
    decision: 'Definir la estructura de gobierno, roles y plantilla de personal antes del arranque.',
    evidence: 'Organigrama jerárquico, matriz RACI, plantilla por tipo CA (P/M/G), fases de capacitación, OPEX de personal.',
    next_action: 'Validar con la Dirección de Servicios Públicos y asignar responsables nominales.',
  },
  arbol_financiamiento: {
    label: 'Árbol de financiamiento — 6 caminos de capital',
    decision: 'Seleccionar el esquema de financiamiento según capacidad institucional y costo de capital.',
    evidence: 'Municipal Directo, Concesión Privada, APP, Fideicomiso Municipal, BID/CAF, Deuda Verde BANOBRAS.',
    next_action: 'Confirmar esquema con el tesorero y síndico antes de cualquier licitación o crédito.',
  },
  expediente_cabildo: {
    label: 'Expediente completo para Cabildo',
    decision: 'Consolidar toda la documentación para presentar ante el Cabildo municipal.',
    evidence: 'Panel de gobernanza, checklist pre-lanzamiento, exportación de documentos ejecutivos.',
    next_action: 'Verificar que todos los checks estén en verde antes de agendar la sesión de Cabildo.',
  },
}

export function enrichFunctionaryModules(modules: DecisionModule[]) {
  return modules.map(module => {
    const copy = FUNCTIONARY_MODULE_LABELS[module.module_id]
    return copy ? { ...module, ...copy } : module
  })
}
