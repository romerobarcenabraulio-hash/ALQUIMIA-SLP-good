/**
 * Client-side module definitions for the functionary journey.
 * Single registry keyed by module_id — consumed by page.tsx and enrichment.
 */

import type { DecisionModule } from '@/types'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { CHAPTERS, FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

const base = (
  m: Pick<DecisionModule, 'module_id' | 'label' | 'decision' | 'evidence' | 'next_action'> &
    Partial<DecisionModule>,
): DecisionModule => ({
  audience_mode: 'city_team',
  status: 'ready',
  ...m,
})

export const CLIENT_FUNCTIONARY_MODULES: Record<string, DecisionModule> = {
  guia_circularidad: base({
    module_id: 'guia_circularidad',
    label: 'Pasos hacia la circularidad — Guía de lectura',
    decision: 'Entender qué es ALQUIMIA, cuál es el problema de RSU y cómo se navega el simulador.',
    evidence: `${CHAPTERS.length} capítulos · modos validar propuesta / implementar · fuentes documentadas.`,
    next_action: 'Abrir M01 — Línea base territorial y RSU',
  }),
  city_baseline: base({
    module_id: 'city_baseline',
    label: 'Línea base territorial y RSU',
    decision: 'Cuantificar cuánto RSU genera el municipio, de qué tipo y cuánto se recupera hoy.',
    evidence: 'RSU activo, composición por material, población y vivienda — fuentes INEGI/SEMARNAT.',
    next_action: 'Validar supuestos de generación antes del diagnóstico social.',
  }),
  impacto_ambiental: base({
    module_id: 'impacto_ambiental',
    label: 'Impacto ambiental y sanitario',
    decision: 'Cuantificar PM2.5, biogás, extensión de relleno y daño sanitario sin programa.',
    evidence: 'Modelo OPS/INSP, emisiones CH₄, casos IRA/dengue evitados, comparativa con/sin programa.',
    next_action: 'Usar estos KPIs en el argumento de costo de omisión y evaluación socioeconómica.',
  }),
  social_diagnostico: base({
    module_id: 'social_diagnostico',
    label: 'Diagnóstico demográfico y vulnerabilidad',
    decision: 'Entender quién vive en el municipio, rezago social e informalidad del sector.',
    evidence: 'INEGI Censo 2020, CONEVAL 2022, matriz de riesgo social, supuestos trazables.',
    next_action: 'Revisar brechas antes de la encuesta de aceptación ciudadana.',
  }),
  social_encuesta: base({
    module_id: 'social_encuesta',
    label: 'Encuesta de aceptación ciudadana',
    decision: '¿Cuánta disposición real hay a separar? Medir IPC por tipo de vivienda.',
    evidence: 'IPC global y segmentado, índice de preparación ciudadana, dato de campo vs pendiente.',
    next_action: 'Completar encuesta de campo para que §3 del estudio de impacto tenga datos reales.',
  }),
  mapeo_actores: base({
    module_id: 'mapeo_actores',
    label: 'Mapeo de actores y voluntad política',
    decision: 'Identificar aliados, bloqueadores y ciclo electoral que afectan el programa.',
    evidence: 'Mapa de actores Proyecto Vivo, estándares de readiness, impacto proyectado.',
    next_action: 'Validar voluntad política antes de agendar reforma reglamentaria.',
  }),
  organigrama_diagnostico: base({
    module_id: 'organigrama_diagnostico',
    label: 'Organigrama actual — gobierno y concesionario',
    decision: '¿Cómo está organizado hoy el servicio RSU, desde el primer contacto hasta cabildo?',
    evidence: 'Cadena de contacto, organigrama municipal as-is, operador/concesionario, vacíos e interfaces.',
    next_action: 'Completar checklist de campo antes de asumir capacidad institucional.',
  }),
  capacidad_institucional: base({
    module_id: 'capacidad_institucional',
    label: 'Capacidad institucional del municipio',
    decision: '¿Qué capacidad real tiene el municipio hoy para operar el programa?',
    evidence: 'Presupuesto disponible, plantilla existente, historial de programas, bloqueo ÁGORA legal.',
    next_action: 'Desbloquear checklist jurídico antes de comprometer esquema de concesión.',
  }),
  marco_legal: base({
    module_id: 'marco_legal',
    label: 'Marco legal y brechas reglamentarias',
    decision: 'Qué puede ejecutarse con reglamento vigente y qué requiere reforma.',
    evidence: 'Diagnóstico legal por municipio, adendos prioritarios, ciclo de vida legislativo.',
    next_action: 'Priorizar adendos de alta prioridad para agenda de cabildo.',
  }),
  cobertura_territorial: base({
    module_id: 'cobertura_territorial',
    label: 'Cobertura territorial y comparativa ZM',
    decision: 'Comparar cobertura normativa del municipio vs municipios vecinos de la ZM.',
    evidence: 'Matriz de cobertura por municipio, mapa territorial, brechas metropolitanas.',
    next_action: 'Identificar vacíos de coordinación metropolitana antes del piloto.',
  }),
  dictamen_tecnico: base({
    module_id: 'dictamen_tecnico',
    label: 'Dictamen técnico de la reforma',
    decision: 'Fundamentar 5 fracciones, multas graduadas y condominios primero con evidencia.',
    evidence: 'Benchmarks internacionales, economía del material, técnica normativa.',
    next_action: 'Anexar dictamen al expediente de cabildo.',
  }),
  costo_omision: base({
    module_id: 'costo_omision',
    label: 'Costo de la omisión — contrafactual 10 años',
    decision: '¿Cuánto cuesta NO actuar en 10 años?',
    evidence: 'Disposición acumulada, daño sanitario, relleno saturado, multas PROFEPA, elegibilidad verde.',
    next_action: 'Presentar antes de discutir presupuesto del programa.',
  }),
  evaluacion_socioeconomica: base({
    module_id: 'evaluacion_socioeconomica',
    label: 'Evaluación socioeconómica',
    decision: '¿Qué beneficio fiscal y social justifica Cabildo? Empleos, pobreza, deuda estatal.',
    evidence: 'Costo-beneficio social SHCP/CONEVAL, waterfall fiscal, reducción pobreza mun+estado.',
    next_action: 'Incluir §7 cuantificado en el estudio de impacto para cabildo.',
  }),
  teoria_cambio: base({
    module_id: 'teoria_cambio',
    label: 'Teoría de cambio — cómo se conecta todo',
    decision: 'Ver el hilo causal completo: inputs → actividades → outputs → outcomes → impacto.',
    evidence: 'Teoría de cambio dinámica con datos del simulador en cada columna.',
    next_action: 'Cerrar Cap 1 y pasar a planificación estratégica.',
  }),
  plan_maestro: base({
    module_id: 'plan_maestro',
    label: 'Plan maestro y metas de captura',
    decision: 'Fijar metas de captura viables al horizonte del programa.',
    evidence: 'Curva de captura, horizonte, calendario maestro Gantt.',
    next_action: 'Confirmar metas con capacidad e infraestructura disponible.',
  }),
  roadmap_implementacion: base({
    module_id: 'roadmap_implementacion',
    label: 'Roadmap de implementación (24 meses)',
    decision: 'Entender las 5 fases institucionales G1–G5, sus actividades y gates antes de dimensionar operación.',
    evidence: 'Timeline G1–G5, actividades T01–T15 por fase, prerequisitos y riesgos asociados.',
    next_action: 'Revisar la fase actual y confirmar prerequisitos en M21B antes de avanzar.',
  }),
  ruta_critica: base({
    module_id: 'ruta_critica',
    label: 'Ruta crítica PERT-RACI',
    decision: 'Identificar dependencias críticas y responsables por hito.',
    evidence: 'Diagrama PERT, matriz RACI, semanas críticas.',
    next_action: 'Asignar responsables nominales antes de oleadas territoriales.',
  }),
  oleadas_territoriales: base({
    module_id: 'oleadas_territoriales',
    label: 'Oleadas territoriales de despliegue',
    decision: 'Secuenciar el despliegue por colonias/zonas con mapa de avance.',
    evidence: 'Mapa circularidad, oleadas por territorio, hitos por fase.',
    next_action: 'Validar primera oleada con logística operativa.',
  }),
  infraestructura: base({
    module_id: 'infraestructura',
    label: 'Infraestructura — dimensionamiento CAs',
    decision: 'Definir mix P/M/G, capacidad y ubicación de centros de acopio.',
    evidence: 'Gap de capacidad, mapa CAs, ocupación proyectada, break-even CA-P.',
    next_action: 'Confirmar mix antes de cotizar CAPEX.',
  }),
  organigrama: base({
    module_id: 'organigrama',
    label: 'Organigrama y estructura de personal',
    decision: 'Definir quién opera, quién responde y cuánto cuesta el personal.',
    evidence: 'Organigrama jerárquico, RACI, plantilla P/M/G, empleos por sector.',
    next_action: 'Validar con Dirección de Servicios Públicos.',
  }),
  logistica: base({
    module_id: 'logistica',
    label: 'Logística, rutas y diseño de piloto',
    decision: 'Diseñar zona piloto, rutas y flota requerida.',
    evidence: 'Matriz selección piloto, camiones requeridos, PER, estacionalidad.',
    next_action: 'Confirmar zona piloto con equipo de campo.',
  }),
  plan_educativo: base({
    module_id: 'plan_educativo',
    label: 'Plan educativo y comunicación social',
    decision: '¿Cómo capacitamos y comunicamos antes del arranque?',
    evidence: 'Plan H1/H2, costo educación anual, brecha IPC, comunicación política.',
    next_action: 'Alinear ventana educativa con oleada 1.',
  }),
  costos_programa: base({
    module_id: 'costos_programa',
    label: 'Costos del programa — CAPEX y OPEX',
    decision: 'Cuantificar inversión total y costo operativo anual.',
    evidence: 'Tabla maestra CAPEX/OPEX, personal, equipos, comparativa P/M/G.',
    next_action: 'Validar precios con cotizaciones locales.',
  }),
  mercado_materiales: base({
    module_id: 'mercado_materiales',
    label: 'Mercado de materiales y compradores',
    decision: 'Verificar demanda real para cada fracción de material.',
    evidence: 'Compradores, precios, sensibilidad de ingreso, condiciones de mercado.',
    next_action: 'Cerrar offtake antes del esquema de concesión.',
  }),
  esquema_concesion: base({
    module_id: 'esquema_concesion',
    label: 'Esquema de concesión y operador',
    decision: '¿Quién opera el CA y cuánto recibe el municipio?',
    evidence: 'Árbol decisión A/B/C/D, ISN, derechos, derrama por sector.',
    next_action: 'Presentar esquema a presidencia y síndico.',
  }),
  arbol_financiamiento: base({
    module_id: 'arbol_financiamiento',
    label: 'Árbol de financiamiento — 6 caminos',
    decision: 'Seleccionar vehículo de capital según capacidad institucional.',
    evidence: 'Municipal, concesión, APP, fideicomiso, BID/CAF, deuda verde BANOBRAS.',
    next_action: 'Confirmar con tesorería antes de licitación.',
  }),
  escenarios_financieros: base({
    module_id: 'escenarios_financieros',
    label: 'Escenarios financieros — TIR/VPN/Monte Carlo',
    decision: '¿Cuál es el retorno bajo distintos supuestos?',
    evidence: 'TIR, VPN, MOIC, payback, Monte Carlo, tornado VPN, DSCR.',
    next_action: 'Seleccionar escenario base para expediente.',
  }),
  riesgos_modelo: base({
    module_id: 'riesgos_modelo',
    label: 'Riesgos y sensibilidad del modelo',
    decision: '¿Qué puede deteriorar el escenario base?',
    evidence: 'Score riesgo total, dimensiones política/mercado/operativa/regulatoria.',
    next_action: 'Mitigar dimensiones en rojo antes de cabildo.',
  }),
  expediente_cabildo: base({
    module_id: 'expediente_cabildo',
    label: 'Expediente completo para Cabildo',
    decision: 'Consolidar documentación para sesión de cabildo.',
    evidence: 'Gobernanza, checklist, export PDF/XLSX, cotización recomendada.',
    next_action: 'Verificar checks en verde antes de agendar sesión.',
  }),
  inspeccion: base({
    module_id: 'inspeccion',
    label: 'Inspección y estrategia de enforcement',
    decision: 'Mecanismo de cumplimiento ciudadano sostenible.',
    evidence: 'Estrategia inspección, bitácora, semáforo cumplimiento.',
    next_action: 'Capacitar inspectores antes del arranque.',
  }),
  monitoreo_operativo: base({
    module_id: 'monitoreo_operativo',
    label: 'Monitoreo — proyectado vs. real',
    decision: 'Comparar proyecciones con datos de campo.',
    evidence: 'Dashboard semáforo, captura, comparación, historial desviaciones.',
    next_action: 'Capturar datos del primer mes de operación.',
  }),
  doble_materialidad: base({
    module_id: 'doble_materialidad',
    label: 'Doble materialidad y reporte ESG',
    decision: 'Reportar bajo GRI 306 / ESRS E5 para crédito verde.',
    evidence: 'Matriz doble materialidad, disclosures GRI, template BID/GCF.',
    next_action: 'Enviar informe GRI a financiador seleccionado.',
  }),
  trazabilidad: base({
    module_id: 'trazabilidad',
    label: 'Trazabilidad de fuentes y bibliografía',
    decision: 'Verificar qué afirmación sostiene cada número.',
    evidence: 'Matriz trazabilidad, fórmulas, estado verificación.',
    next_action: 'Cerrar pendientes de fuente antes de uso público formal.',
  }),
  evm_dashboard: base({
    module_id: 'evm_dashboard',
    label: 'EVM — Control presupuestal',
    decision: 'Monitorear el desempeño real del proyecto vs plan usando Earned Value Management.',
    evidence: 'CPI, SPI, SV, CV, TCPI, EAC (×3) y VAC calculados desde CAPEX del simulador y costos reales ingresados.',
    next_action: 'Ingresar el % avance real y los costos acumulados para obtener el semáforo actualizado.',
  }),
  conciliacion_mensual: base({
    module_id: 'conciliacion_mensual',
    label: 'Conciliación mensual de presupuesto',
    decision: 'Verificar que el presupuesto ejercido corresponde al avance físico reportado.',
    evidence: 'Tabla de partidas presupuestales vs. costos reales ingresados por el PMO.',
    next_action: 'Cargar los costos del mes en curso y comparar contra el PV del PERT schedule.',
  }),
  risk_dashboard: base({
    module_id: 'risk_dashboard',
    label: 'Registro de riesgos KRONOS',
    decision: 'Visualizar y gestionar los 6 riesgos críticos del proyecto con su scoring calculado.',
    evidence: 'Registro dinámico R01–R06: Score = Prob × Impacto (matriz PMBOK 6ed). Semáforo derivado del score.',
    next_action: 'Asignar owner a riesgos ROJO y documentar el plan de mitigación.',
  }),
  gate_status: base({
    module_id: 'gate_status',
    label: 'Estado de gates G1–G5',
    decision: 'Confirmar si el proyecto puede avanzar al siguiente gate o si hay prerequisitos bloqueantes.',
    evidence: 'Prerequisitos de cada gate verificados contra el estado real de módulos del simulador.',
    next_action: 'Revisar los prerequisitos del gate actual y cerrar los abiertos antes de la fecha límite.',
  }),
}

/** Build ordered journey from AUDIENCE_MODULES.functionary + backend merge. */
export function buildFunctionaryJourney(backendModules: DecisionModule[]): DecisionModule[] {
  const byId = Object.fromEntries(backendModules.map(m => [m.module_id, m]))
  const ids = AUDIENCE_MODULES.functionary
  return ids.map(id => {
    const client = CLIENT_FUNCTIONARY_MODULES[id]
    const backend = byId[id]
    if (client && backend) return { ...client, ...backend, module_id: id }
    if (client) return client
    if (backend) return backend
    return base({
      module_id: id,
      label: id,
      decision: 'Módulo en despliegue.',
      evidence: '—',
      next_action: 'Continuar al siguiente paso.',
    })
  })
}
