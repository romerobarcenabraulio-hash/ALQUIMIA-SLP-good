import { describe, expect, it } from 'vitest'
import {
  buildConsultingPackage,
  buildMaterialPriceMix,
  buildPrivateGeneratorMix,
  renderableClaims,
} from '@/lib/consultingPackageEngine'
import { TENANT_DIAGNOSTIC_FIXTURES, type TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

describe('consultingPackageEngine', () => {
  it('returns gaps and no scenario numbers when tenant has no evidence', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'] })

    expect(pkg.evidence_gaps.length).toBeGreaterThan(0)
    expect(pkg.scenario_set.client_controls_enabled).toBe(false)
    expect(pkg.scenario_set.scenarios.every(scenario => scenario.capture_ton_day === null)).toBe(true)
    expect(pkg.scenario_set.scenarios.every(scenario => scenario.gross_revenue_mxn_month === null)).toBe(true)
    expect(pkg.readiness_gates.some(gate => gate.id === 'local_field_study' && !gate.passed)).toBe(true)
    expect(pkg.readiness_gates.some(gate => gate.id === 'scenario_set' && !gate.passed)).toBe(true)
  })

  it('treats only the reglamento as required to emit a plan', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'] })

    expect(pkg.readiness_gates.find(gate => gate.id === 'legal_review')).toMatchObject({
      passed: false,
      required: true,
    })
    expect(pkg.readiness_gates.find(gate => gate.id === 'local_field_study')).toMatchObject({
      passed: false,
      required: false,
    })
    expect(pkg.readiness_gates.find(gate => gate.id === 'buyers_prices')).toMatchObject({
      passed: false,
      required: false,
    })
    expect(pkg.readiness_gates.find(gate => gate.id === 'scenario_set')).toMatchObject({
      passed: false,
      required: false,
    })
    expect(pkg.evidence_gaps.find(gap => gap.label.includes('Reglamento'))?.blocks).toContain('emisión de plan/declaratoria')
    expect(pkg.evidence_gaps.find(gap => gap.label.includes('Estudio'))?.blocks).not.toContain('paquete de decisión')
  })

  it('allows a conditioned plan when the reglamento is present and other documents are missing', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const tenantData: TenantDiagnosticData = {
      ...base,
      document_gaps: base.document_gaps.filter(gap => gap.document_type !== 'reglamento_limpia'),
      tenant_documents: [
        ...base.tenant_documents,
        {
          id: 'doc-legal-plan',
          tenant_id: base.tenant_id,
          uploaded_by_user_id: 'founder',
          module_id: 'M03B',
          document_type: 'reglamento_limpia',
          original_filename: 'reglamento.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 1800,
          storage_path_or_url: '/tmp/reglamento.pdf',
          upload_status: 'integrated',
          classification_confidence: 'manual',
          uploaded_at: base.generated_at,
          processed_at: base.generated_at,
        },
      ],
    }
    const pkg = buildConsultingPackage({ tenantData })

    expect(pkg.input_registry.legal_ready).toBe(true)
    expect(pkg.readiness_gates.filter(gate => gate.required && !gate.passed)).toHaveLength(0)
    expect(pkg.executive_diagnosis).toContain('puede emitir un plan razonable')
    expect(pkg.evidence_gaps.some(gap => gap.blocks.includes('paquete de decisión'))).toBe(false)
  })

  it('calculates weighted material prices when buyers are available', () => {
    const mixes = buildMaterialPriceMix({
      tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'],
      buyersAvailable: true,
    })

    expect(mixes.some(item => item.material === 'PET' && item.weighted_price_mxn_per_kg !== null)).toBe(true)
    expect(mixes.find(item => item.material === 'PET')?.note).toContain('no precio oficial')
  })

  it('models private urban capture beyond condominiums', () => {
    const mix = buildPrivateGeneratorMix({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'] })
    const labels = mix.map(item => item.label)

    expect(labels).toContain('Escuelas y universidades')
    expect(labels).toContain('Plazas y comercios')
    expect(labels).toContain('Macrogeneradores')
    expect(labels.length).toBeGreaterThan(6)
  })

  it('does not render blocked claims as affirmations', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'] })

    expect(pkg.claim_ledger.length).toBeGreaterThan(0)
    expect(renderableClaims(pkg.claim_ledger)).toHaveLength(0)
  })

  it('keeps client scenarios fixed and enables founder calibration only', () => {
    const pkg = buildConsultingPackage({
      tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'],
      buyersAvailable: true,
    })

    expect(pkg.scenario_set.client_controls_enabled).toBe(false)
    expect(pkg.scenario_set.founder_calibration_required).toBe(true)
    expect(pkg.scenario_set.scenarios).toHaveLength(5)
    expect(pkg.scenario_set.scenarios.some(scenario => scenario.capture_ton_day !== null)).toBe(true)
    expect(pkg.readiness_gates.some(gate => gate.id === 'buyers_prices' && gate.passed)).toBe(true)
  })

  it('can consume traced API layer payloads without changing the client control model', () => {
    const pkg = buildConsultingPackage({
      tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'],
      apiLayerPayloads: [
        {
          layer: 'market',
          available: true,
          source: 'POST /market/place',
          source_date: '2026-05-31',
          method: 'Colocación con compradores trazables.',
          territorial_scope: 'municipio',
          confidence: 'medium',
        },
      ],
    })

    expect(pkg.input_registry.buyers_available).toBe(true)
    expect(pkg.material_price_mix.some(item => item.weighted_price_mxn_per_kg !== null)).toBe(true)
    expect(pkg.scenario_set.client_controls_enabled).toBe(false)
    expect(pkg.readiness_gates.some(gate => gate.id === 'buyers_prices' && gate.passed)).toBe(true)
  })
})
