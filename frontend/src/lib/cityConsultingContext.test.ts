import { describe, expect, it } from 'vitest'
import { buildCityConsultingContext } from '@/lib/cityConsultingContext'
import {
  STANDARD_CITY_DOCUMENT_INDEX,
  TENANT_DIAGNOSTIC_FIXTURES,
  type TenantDiagnosticData,
} from '@/lib/tenantDiagnosticData'

describe('cityConsultingContext', () => {
  it('keeps every city on the same document index and module structure', () => {
    const context = buildCityConsultingContext(TENANT_DIAGNOSTIC_FIXTURES['partial-city'], 'validation')

    expect(context.document_index.map(slot => slot.id)).toEqual(STANDARD_CITY_DOCUMENT_INDEX.map(slot => slot.id))
    expect(context.stage_workspace.visible_modules.map(module => module.module_id)).toEqual([
      'M00',
      'M00B',
      'M01',
      'M02',
      'M03B',
      'M15',
    ])
  })

  it('treats regulation as the only plan/declaratory blocker', () => {
    const context = buildCityConsultingContext(TENANT_DIAGNOSTIC_FIXTURES['complete-city'], 'planning')
    const legalGate = context.readiness.find(gate => gate.id === 'legal_review')
    const nonLegalRequired = context.readiness.filter(gate => gate.id !== 'legal_review' && gate.required)

    expect(legalGate?.required).toBe(true)
    expect(nonLegalRequired).toHaveLength(0)
    expect(context.regulation.blocks_plan).toBe(false)
    expect(context.stage_workspace.export_allowed).toBe(true)
  })

  it('blocks plan export when regulation is missing but keeps the workspace usable', () => {
    const demo = TENANT_DIAGNOSTIC_FIXTURES['municipio-demo']
    const context = buildCityConsultingContext(demo, 'validation')

    expect(context.regulation.status).toBe('missing')
    expect(context.regulation.blocks_plan).toBe(true)
    expect(context.stage_workspace.export_allowed).toBe(false)
    expect(context.stage_workspace.visible_modules.length).toBeGreaterThan(0)
  })

  it('does not render blocked or gap records as claims', () => {
    const demo = TENANT_DIAGNOSTIC_FIXTURES['municipio-demo']
    const context = buildCityConsultingContext(demo, 'validation')

    expect(context.evidence_kernel.some(record => record.confidence === 'blocked')).toBe(true)
    expect(context.evidence_kernel.filter(record => record.can_render_as_claim).every(record => record.source && record.source_date && record.method)).toBe(true)
  })

  it('does not mix ZM claims into municipal renderable claims', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const tenantData: TenantDiagnosticData = {
      ...base,
      metrics: [
        ...base.metrics,
        {
          id: 'zm_context_only',
          label: 'Contexto ZM',
          value: 100,
          unit: 't/día',
          source: 'Fuente metropolitana comparable',
          source_date: '2026-05-29',
          method: 'Contexto comparable; no soporta claim municipal',
          confidence: 'inferred_low',
          territorial_scope: 'zm',
          status: 'inferido',
        },
      ],
    }
    const context = buildCityConsultingContext(tenantData, 'validation')
    const zmRecord = context.evidence_kernel.find(record => record.id === 'claim-zm_context_only')

    expect(zmRecord?.territorial_scope).toBe('zm')
    expect(zmRecord?.limitation).toContain('fuente')
    expect(zmRecord?.claim).not.toContain('oficial')
  })
})
