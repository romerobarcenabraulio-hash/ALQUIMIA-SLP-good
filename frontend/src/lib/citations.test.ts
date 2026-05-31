import { describe, expect, it } from 'vitest'
import { buildBibliography, hasMinimumEvidence, metricCitationLabel } from '@/lib/citations'
import { tenantDiagnosticDataFor } from '@/lib/tenantDiagnosticData'

describe('citations · MVP 5R rigor minimo', () => {
  it('genera bibliografia minima sin duplicar citas', () => {
    const data = tenantDiagnosticDataFor('complete-city')
    const bibliography = buildBibliography(data.metrics)

    expect(bibliography.length).toBeGreaterThan(0)
    expect(bibliography[0]).toContain('Consultado el')
    expect(new Set(bibliography).size).toBe(bibliography.length)
  })

  it('cada metrica fixture tiene metadata minima o queda tratable como brecha', () => {
    for (const tenantId of ['complete-city', 'partial-city', 'gap-city']) {
      const data = tenantDiagnosticDataFor(tenantId)
      expect(data.document_index).toHaveLength(6)
      for (const metric of data.metrics) {
        expect(hasMinimumEvidence(metric)).toBe(true)
        expect(metricCitationLabel(metric, data.metrics)).not.toBe('')
      }
    }
  })
})
