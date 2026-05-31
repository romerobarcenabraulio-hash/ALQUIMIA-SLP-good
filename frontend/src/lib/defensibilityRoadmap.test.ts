import { describe, expect, it } from 'vitest'
import {
  buildEmbeddedMethodologyMarkers,
  defensibilityClientFacingClaimsAllowed,
  evaluateDefensibilityReadiness,
  shouldEscalateDefensibilityReview,
} from './defensibilityRoadmap'

describe('defensibilityRoadmap', () => {
  it('blocks defensibility activation until founder signs the 18-month commitment', () => {
    const result = evaluateDefensibilityReadiness({
      founderSignedCommitment: false,
      directContractsWithCaseStudyClause: 3,
      founderMonthlyRegulatoryBlock: true,
      exportMethodologyMarkersEnabled: true,
      prioritizedFinancialInstitutions: 4,
      platform0QuarterlyTrackingReady: true,
    })

    expect(result.status).toBe('blocked')
    expect(result.blocked_reasons).toContain('Founder debe firmar compromiso personal de 18 meses.')
  })

  it('requires operational prerequisites before marking the roadmap active', () => {
    const result = evaluateDefensibilityReadiness({
      founderSignedCommitment: true,
      directContractsWithCaseStudyClause: 0,
      founderMonthlyRegulatoryBlock: false,
      exportMethodologyMarkersEnabled: true,
      prioritizedFinancialInstitutions: 2,
      platform0QuarterlyTrackingReady: false,
    })

    expect(result.status).toBe('ready_for_founder')
    expect(result.checks.filter(check => !check.pass)).toHaveLength(4)
  })

  it('marks the roadmap active only when every founder-only gate is satisfied', () => {
    const result = evaluateDefensibilityReadiness({
      founderSignedCommitment: true,
      directContractsWithCaseStudyClause: 1,
      founderMonthlyRegulatoryBlock: true,
      exportMethodologyMarkersEnabled: true,
      prioritizedFinancialInstitutions: 4,
      platform0QuarterlyTrackingReady: true,
    })

    expect(result.status).toBe('active')
    expect(result.blocked_reasons).toEqual([])
  })

  it('escalates quarterly review only after sustained multi-signal stagnation', () => {
    const result = shouldEscalateDefensibilityReview({
      publicCaseStudies: 0,
      formalRegulatoryInteractions: 0,
      exportsWithMethodologyMarkersPct: 80,
      financialInstitutionsWithTechnicalMeeting: 0,
      fundedCompetitorDetected: true,
      consecutiveStalledQuarters: 2,
    })

    expect(result.escalate).toBe(true)
    expect(result.failedSignals).toBe(5)
  })

  it('builds sober methodology markers without claiming official certification', () => {
    const markers = buildEmbeddedMethodologyMarkers('1.0', 2026)

    expect(markers.footer).toContain('metodología ALQUIMIA')
    expect(markers.bibliography).toContain('Metodología de diagnóstico')
    expect(markers.footer).not.toMatch(/certifica|garantiza|oficial/i)
  })

  it('keeps defensibility claims out of client-facing promises', () => {
    expect(defensibilityClientFacingClaimsAllowed()).toEqual({
      allowed: false,
      reason: 'La defensibilidad es roadmap founder-only; no debe venderse como garantía, certificación ni ventaja ya obtenida.',
    })
  })
})
