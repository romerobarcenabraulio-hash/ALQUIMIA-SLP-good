import type { DecisionModuleId } from '@/types'

/**
 * Maps canonical module IDs to DecisionModuleIds for progression tracking.
 * Some modules don't have M-codes (like guia_circularidad, citizen_inputs)
 * and aren't part of the progression sequence.
 */
export const CANONICAL_TO_DECISION_MODULE: Record<string, DecisionModuleId | null> = {
  // M00B - Antecedentes
  antecedentes_municipales: 'M00B',

  // M01 - Baseline
  city_baseline: 'M01',

  // M02 - Social (includes M02A, M02B, M02C, M02D as sub-tabs)
  social_diagnostico: 'M02A',

  // M03 - Institutional capacity
  capacidad_institucional: 'M03',

  // M03B - Legal framework (mapped to M03 for progression)
  marco_legal: 'M03',

  // M04 - Cost of omission
  costo_omision: 'M04',

  // M05 - Implementation roadmap
  roadmap_implementacion: 'M05',

  // M06 - Infrastructure
  infraestructura: 'M06',

  // M07 - Organigram
  organigrama: 'M07',

  // M08 - Logistics
  logistica: 'M08',

  // M09 - Program costs
  costos_programa: 'M09',

  // M10 - Materials market
  mercado_materiales: 'M10',

  // M11 - Concession scheme
  esquema_concesion: 'M11',

  // M12 - Financing tree
  arbol_financiamiento: 'M12',

  // M13 - Financial scenarios
  escenarios_financieros: 'M13',

  // M14 - Implementation risks
  riesgos_modelo: 'M14',

  // M15 - Expedient
  expediente_cabildo: 'M15',

  // Modules without progression locking (not part of M00B-M15)
  guia_circularidad: null,
  citizen_inputs: null,
  organization_profile: null,
  containers_provider: null,
  market_traceability: null,
  organization_report: null,
  impact_finance: null,
  inspeccion: null,
  monitoreo_operativo: null,
  doble_materialidad: null,
  trazabilidad: null,
  evm_dashboard: null,
  risk_dashboard: null,
}

/**
 * Get the DecisionModuleId for a canonical module ID.
 * Returns null if the module is not part of the progression sequence.
 */
export function getDecisionModuleId(canonicalId: string): DecisionModuleId | null {
  return CANONICAL_TO_DECISION_MODULE[canonicalId] ?? null
}

/**
 * Check if a canonical module ID is part of the progression sequence.
 */
export function hasModuleProgression(canonicalId: string): boolean {
  return getDecisionModuleId(canonicalId) !== null
}
