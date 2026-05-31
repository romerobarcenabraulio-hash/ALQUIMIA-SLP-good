import { describe, expect, it } from 'vitest'
import { auditMetricsForExport } from './standardsCompliance'
import type { TenantMetric } from './tenantDiagnosticData'

const completeMetric: TenantMetric = {
  id: 'rsu_generation',
  label: 'Generacion RSU',
  value: 420,
  unit: 't/dia',
  source: 'Fuente municipal revisable',
  source_date: '2026-05-29',
  method: 'Cotejo documental preliminar',
  confidence: 'verified_secondary',
  territorial_scope: 'municipio',
  status: 'verificado',
  citation_id: 'public_municipal_preliminary',
}

describe('auditMetricsForExport', () => {
  it('blocks full compliance when a non-gap metric has no citation', () => {
    const audit = auditMetricsForExport([{ ...completeMetric, citation_id: undefined }])

    expect(audit.label).toBe('cumplimiento_completo_bloqueado')
    expect(audit.canClaimFullCompliance).toBe(false)
    expect(audit.missingCriticalCitations).toContain('Generacion RSU')
  })

  it('keeps critical gaps as partial compliance instead of hiding them', () => {
    const audit = auditMetricsForExport([
      {
        ...completeMetric,
        id: 'field_characterization',
        label: 'Caracterizacion local',
        value: null,
        unit: '',
        source: 'Estudio local no cargado',
        method: 'Brecha critica; no se sustituye con benchmark',
        confidence: 'critical_gap',
        status: 'brecha_critica',
        citation_id: 'local_field_study_gap',
      },
    ])

    expect(audit.label).toBe('cumplimiento_parcial')
    expect(audit.canClaimFullCompliance).toBe(false)
    expect(audit.warnings.join(' ')).toContain('brecha crítica')
  })

  it('treats fully cited metrics as methodological reference, not certification', () => {
    const audit = auditMetricsForExport([completeMetric])

    expect(audit.label).toBe('referencia_metodologica')
    expect(audit.canClaimFullCompliance).toBe(false)
    expect(audit.canExportWithWarning).toBe(true)
  })
})
