import { describe, expect, it } from 'vitest'
import {
  buildConsultingPackage,
  buildMaterialPriceMix,
  buildPrivateGeneratorMix,
  isValidDataPoint,
  renderableClaims,
} from '@/lib/consultingPackageEngine'
import { TENANT_DIAGNOSTIC_FIXTURES, type TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

describe('consultingPackageEngine', () => {
  it('validates the immutable data philosophy for investigated, calculated and client-provided data', () => {
    expect(isValidDataPoint({
      field_id: 'poblacion_total',
      value: 794789,
      unit: 'habitantes',
      category: 'investigated',
      source_institution: 'INEGI',
      source_document: 'Censo de Población y Vivienda',
      source_year: 2020,
    })).toBe(true)

    expect(isValidDataPoint({
      field_id: 'pet_weighted_price',
      value: 5.92,
      unit: 'MXN/kg',
      category: 'calculated',
      formula: 'sum(channel.price * channel.share) - logistics - quality_penalty',
      derived_from_field_ids: ['material_research_pet', 'quality_distribution_PET'],
    })).toBe(true)

    expect(isValidDataPoint({
      field_id: 'collection_frequency',
      value: 'Tres veces por semana',
      category: 'client_provided',
      source_document_id: 'reglamento_limpia',
      literal_citation: 'La recolección se realizará tres veces por semana.',
    })).toBe(true)

    expect(isValidDataPoint({
      field_id: 'invented_number',
      value: 123,
      category: 'calculated',
      formula: 'sin linaje',
      derived_from_field_ids: ['single_source'],
    })).toBe(false)
  })

  it('returns gaps and no scenario numbers when tenant has no RSU baseline', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['gap-city'] })

    expect(pkg.evidence_gaps.length).toBeGreaterThan(0)
    expect(pkg.scenario_set.client_controls_enabled).toBe(false)
    expect(pkg.scenario_set.scenarios.every(scenario => scenario.capture_ton_day === null)).toBe(true)
    expect(pkg.scenario_set.scenarios.every(scenario => scenario.gross_revenue_mxn_month === null)).toBe(true)
    expect(pkg.readiness_gates.some(gate => gate.id === 'local_field_study' && !gate.passed)).toBe(true)
    expect(pkg.readiness_gates.some(gate => gate.id === 'scenario_set' && !gate.passed)).toBe(true)
  })

  it('calculates scenarios from bibliographic price basis without pretending local buyers are validated', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'] })

    expect(pkg.input_registry.buyers_available).toBe(false)
    expect(pkg.material_price_mix.some(item =>
      item.weighted_price_mxn_per_kg !== null
      && item.derived_from_field_ids.some(fieldId => fieldId.startsWith('bibliographic_price_basis_')),
    )).toBe(true)
    expect(pkg.scenario_set.scenarios.some(scenario => scenario.capture_ton_day !== null)).toBe(true)
    expect(pkg.scenario_set.scenarios.every(scenario => scenario.confidence === 'low')).toBe(true)
    expect(pkg.readiness_gates.find(gate => gate.id === 'buyers_prices')).toMatchObject({
      passed: false,
      required: false,
    })
    expect(pkg.readiness_gates.find(gate => gate.id === 'scenario_set')).toMatchObject({
      passed: true,
      required: false,
    })
  })

  it('treats only the reglamento as required to emit a plan', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['partial-city'] })

    expect(pkg.readiness_gates.find(gate => gate.id === 'legal_review')).toMatchObject({
      passed: false,
      required: true,
    })
    expect(pkg.plan_emission).toMatchObject({
      can_emit_plan: false,
      blocked_by_regulation: true,
      mode: 'blocked_missing_regulation',
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
      passed: true,
      required: false,
    })
    expect(pkg.evidence_gaps.find(gap => gap.label.includes('Reglamento'))?.blocks).toContain('emisión de plan/declaratoria')
    expect(pkg.evidence_gaps.find(gap => gap.label.includes('Estudio'))?.blocks).not.toContain('paquete de decisión')
  })

  it('allows a quantified conditioned plan when reglamento and traceable approximations are present', () => {
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
    expect(pkg.plan_emission).toMatchObject({
      can_emit_plan: true,
      blocked_by_regulation: false,
      mode: 'quantified_conditioned',
    })
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
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['gap-city'] })

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
    expect(pkg.plan_emission.mode).toBe('blocked_missing_regulation')
    expect(pkg.readiness_gates.some(gate => gate.id === 'buyers_prices' && gate.passed)).toBe(true)
  })

  it('emits a quantified conditioned plan only when reglamento and scenarios are both present', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const tenantData: TenantDiagnosticData = {
      ...base,
      document_gaps: base.document_gaps.filter(gap => gap.document_type !== 'reglamento_limpia'),
      tenant_documents: [
        ...base.tenant_documents,
        {
          id: 'doc-legal-quantified',
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
    const pkg = buildConsultingPackage({ tenantData, buyersAvailable: true })

    expect(pkg.scenario_set.scenarios.some(scenario => scenario.capture_ton_day !== null)).toBe(true)
    expect(pkg.plan_emission).toMatchObject({
      can_emit_plan: true,
      blocked_by_regulation: false,
      mode: 'quantified_conditioned',
    })
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
