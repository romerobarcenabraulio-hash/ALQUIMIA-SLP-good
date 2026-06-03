import { describe, expect, it } from 'vitest'
import { buildMunicipalityPreparationSummary } from './municipalityPreparation'
import { tenantDiagnosticDataFor } from './tenantDiagnosticData'

describe('municipality preparation status', () => {
  it('keeps bibliography-only municipalities waiting for regulation', () => {
    const summary = buildMunicipalityPreparationSummary(tenantDiagnosticDataFor('municipio-demo'), {
      tenantLinked: true,
      userLinked: false,
    })

    expect(summary.status).toBe('bibliografia_minima')
    expect(summary.nextAction).toContain('reglamento')
  })

  it('marks a linked tenant with user as already in client operation', () => {
    const summary = buildMunicipalityPreparationSummary(tenantDiagnosticDataFor('municipio-demo'), {
      tenantLinked: true,
      userLinked: true,
    })

    expect(summary.status).toBe('en_cliente')
  })

  it('keeps missing regulation as an explicit preparation blocker', () => {
    const summary = buildMunicipalityPreparationSummary(tenantDiagnosticDataFor('gap-city'))

    expect(summary.status).toBe('reglamento_identificado')
    expect(summary.nextAction).toContain('Subir reglamento')
  })
})
