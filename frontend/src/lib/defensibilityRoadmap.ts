export type DefensibilityAction =
  | 'institutional_case_studies'
  | 'regulatory_relationships'
  | 'embedded_methodology'
  | 'financial_network_effects'

export type DefensibilityStatus = 'blocked' | 'ready_for_founder' | 'active'

export interface DefensibilityReadinessInput {
  founderSignedCommitment: boolean
  directContractsWithCaseStudyClause: number
  founderMonthlyRegulatoryBlock: boolean
  exportMethodologyMarkersEnabled: boolean
  prioritizedFinancialInstitutions: number
  platform0QuarterlyTrackingReady: boolean
}

export interface DefensibilityQuarterMetrics {
  publicCaseStudies: number
  formalRegulatoryInteractions: number
  exportsWithMethodologyMarkersPct: number
  financialInstitutionsWithTechnicalMeeting: number
  fundedCompetitorDetected: boolean
  consecutiveStalledQuarters: number
}

export const DEFENSIBILITY_ACTIONS: Record<DefensibilityAction, string> = {
  institutional_case_studies: 'Casos faro institucionales',
  regulatory_relationships: 'Relaciones regulatorias',
  embedded_methodology: 'Metodología embebida en documentos',
  financial_network_effects: 'Network effects con instituciones financieras',
}

export const REQUIRED_FINANCIAL_INSTITUTIONS = [
  'BANOBRAS',
  'NAFIN',
  'BID Invest',
  'CAF',
] as const

export function evaluateDefensibilityReadiness(input: DefensibilityReadinessInput) {
  const checks = [
    {
      id: 'founder_commitment',
      pass: input.founderSignedCommitment,
      reason: 'Founder debe firmar compromiso personal de 18 meses.',
    },
    {
      id: 'case_study_clause',
      pass: input.directContractsWithCaseStudyClause >= 1,
      reason: 'Al menos el primer contrato Tier Diagnóstico debe incluir cláusula case study.',
    },
    {
      id: 'regulatory_calendar',
      pass: input.founderMonthlyRegulatoryBlock,
      reason: 'Debe existir bloque mensual fijo para frente regulatorio rotatorio.',
    },
    {
      id: 'methodology_markers',
      pass: input.exportMethodologyMarkersEnabled,
      reason: 'Exports formales deben incluir marcadores metodológicos sobrios.',
    },
    {
      id: 'financial_institution_list',
      pass: input.prioritizedFinancialInstitutions >= REQUIRED_FINANCIAL_INSTITUTIONS.length,
      reason: 'Debe existir lista priorizada de BANOBRAS, NAFIN, BID Invest y CAF.',
    },
    {
      id: 'quarterly_tracking',
      pass: input.platform0QuarterlyTrackingReady,
      reason: 'Métricas trimestrales deben trackearse en Plataforma 0 o registro founder.',
    },
  ]

  const status: DefensibilityStatus = checks.every(check => check.pass)
    ? 'active'
    : input.founderSignedCommitment
      ? 'ready_for_founder'
      : 'blocked'

  return {
    status,
    checks,
    blocked_reasons: checks.filter(check => !check.pass).map(check => check.reason),
  }
}

export function shouldEscalateDefensibilityReview(metrics: DefensibilityQuarterMetrics) {
  const negativeSignals = [
    metrics.publicCaseStudies <= 0,
    metrics.formalRegulatoryInteractions < 2,
    metrics.exportsWithMethodologyMarkersPct < 100,
    metrics.financialInstitutionsWithTechnicalMeeting <= 0,
    metrics.fundedCompetitorDetected,
  ]
  const failedSignals = negativeSignals.filter(Boolean).length

  return {
    escalate: failedSignals >= 3 && metrics.consecutiveStalledQuarters >= 2,
    failedSignals,
    reason: failedSignals >= 3 && metrics.consecutiveStalledQuarters >= 2
      ? 'Tres o más métricas retrocedieron o se estancaron durante dos trimestres consecutivos.'
      : 'Mantener seguimiento trimestral founder-only.',
  }
}

export function buildEmbeddedMethodologyMarkers(version: string, year: number) {
  return {
    footer: `Documento elaborado con metodología ALQUIMIA · alquimiaplatform.com/metodologia · Versión ${version}`,
    bibliography: `ALQUIMIA. Metodología de diagnóstico y planeación de residuos sólidos urbanos municipales. Versión ${version}. México: ALQUIMIA, ${year}. https://alquimiaplatform.com/metodologia.`,
    traceability_note: 'Cada cifra crítica debe conservar fuente, fecha de validación, método, confianza y alcance territorial.',
  }
}

export function defensibilityClientFacingClaimsAllowed() {
  return {
    allowed: false,
    reason: 'La defensibilidad es roadmap founder-only; no debe venderse como garantía, certificación ni ventaja ya obtenida.',
  }
}
