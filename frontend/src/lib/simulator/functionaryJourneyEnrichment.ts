import type { DecisionModule } from '@/types'

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

export const FUNCTIONARY_MODULE_LABELS: Record<
  string,
  Pick<DecisionModule, 'label' | 'decision' | 'evidence' | 'next_action'>
> = {
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
}

export function enrichFunctionaryModules(modules: DecisionModule[]) {
  return modules.map(module => {
    const copy = FUNCTIONARY_MODULE_LABELS[module.module_id]
    return copy ? { ...module, ...copy } : module
  })
}
