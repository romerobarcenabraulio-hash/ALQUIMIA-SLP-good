import { describe, expect, it } from 'vitest'
import {
  buildBibliographyRecords,
  buildEvidenceRecommendations,
} from '@/lib/bibliographyIntelligence'
import { TENANT_DIAGNOSTIC_FIXTURES, type TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

describe('bibliographyIntelligence', () => {
  it('allows local municipal bibliography to support municipal claims', () => {
    const target = TENANT_DIAGNOSTIC_FIXTURES['complete-city']
    const recommendations = buildEvidenceRecommendations(target, [target], { module_id: 'M01' })
    const local = recommendations.find(item => item.tag === 'local')

    expect(local?.confidence).toBe('high')
    expect(local?.supported_claim).toContain('Puede soportar claim municipal')
    expect(local?.unsupported_claim).not.toContain('No soporta verdad municipal')
  })

  it('keeps national benchmark as benchmark, not local evidence', () => {
    const target = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const benchmarkTenant: TenantDiagnosticData = {
      ...target,
      tenant_id: 'national-benchmark',
      metrics: target.metrics.map(metric => metric.id === 'rsu_generation'
        ? {
            ...metric,
            territorial_scope: 'nacional',
            method: 'Benchmark nacional comparable; no estudio local',
            confidence: 'inferred_medium',
            status: 'inferido',
          }
        : metric),
    }
    const recommendations = buildEvidenceRecommendations(target, [benchmarkTenant], { module_id: 'M01' })
    const benchmark = recommendations.find(item => item.tag === 'benchmark')

    expect(benchmark).toBeTruthy()
    expect(benchmark?.unsupported_claim).toContain('No soporta verdad municipal')
    expect(benchmark?.explanation).toContain('no es estudio local')
  })

  it('does not let ZM scope support municipal truth without scope warning', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['complete-city']
    const zmTenant: TenantDiagnosticData = {
      ...base,
      tenant_id: 'zm-source',
      metrics: base.metrics.map(metric => ({
        ...metric,
        territorial_scope: 'zm',
      })),
    }
    const recommendations = buildEvidenceRecommendations(base, [zmTenant], { module_id: 'M01' })
    const comparable = recommendations.find(item => item.record.territorial_scope === 'zm')

    expect(comparable?.tag).not.toBe('local')
    expect(comparable?.unsupported_claim).toContain('No soporta verdad municipal')
    expect(comparable?.record.restrictions).toContain('Alcance ZM; debe separarse de municipio.')
  })

  it('penalizes old sources by recency score', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['complete-city']
    const current = buildBibliographyRecords([base]).find(record => record.module_id === 'M01')
    const oldTenant: TenantDiagnosticData = {
      ...base,
      tenant_id: 'old-source',
      metrics: base.metrics.map(metric => ({
        ...metric,
        source_date: '2010-01-01',
      })),
    }
    const old = buildEvidenceRecommendations(base, [oldTenant], { module_id: 'M01' })[0]
    const fresh = buildEvidenceRecommendations(base, [base], { module_id: 'M01' })[0]

    expect(current).toBeTruthy()
    expect(old.score.recency).toBeLessThan(fresh.score.recency)
    expect(old.score.total).toBeLessThan(fresh.score.total)
  })
})
