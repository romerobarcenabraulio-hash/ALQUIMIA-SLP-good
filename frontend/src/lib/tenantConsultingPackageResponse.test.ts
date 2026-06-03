import { describe, expect, it } from 'vitest'
import {
  buildTenantConsultingPackageResponse,
  buildTenantConsultingPackageResponseWithApiLayers,
} from '@/lib/tenantConsultingPackageResponse'

describe('tenantConsultingPackageResponse', () => {
  it('builds one auditable consulting response for municipio-demo', () => {
    const response = buildTenantConsultingPackageResponse('municipio-demo')

    expect(response.tenant_id).toBe('municipio-demo')
    expect(response.human_review_required).toBe(false)
    expect(response.officiality).toBe('preliminary_not_official')
    expect(response.api_request_context_status).toMatchObject({
      ready: true,
      missing: [],
      context: {
        municipioId: 'slp',
        claveInegi: '24028',
        zm: 'SLP',
      },
    })
    expect(response.consulting_package.scenario_set.client_controls_enabled).toBe(false)
    expect(response.consulting_package.scenario_set.scenarios.some(scenario => scenario.capture_ton_day !== null)).toBe(true)
    expect(response.consulting_package.plan_emission.blocked_by_regulation).toBe(true)
    expect(response.api_layer_contracts.map(contract => contract.layer)).toContain('market')
    expect(response.bibliography_chicago.length).toBeGreaterThan(0)
    expect(response.bibliography_chicago[0]).toContain('Consultado el')
    expect(response.compatible_bibliography_chicago.length).toBeGreaterThan(0)
    expect(response.compatible_bibliography_chicago[0]).toHaveProperty('unsupported_claim')
    expect(response.export_manifest.claim_ledger.affirmable_count).toBeGreaterThan(0)
    expect(response.export_manifest.bibliography_chicago).toEqual(response.bibliography_chicago)
    expect(response.export_manifest.input_registry.buyers_available).toBe(true)
    expect(response.export_manifest.template_readiness.some(template => template.template.id === 'expediente_diagnostico_cabildo')).toBe(true)
  })

  it('keeps package and export manifest aligned on claim counts', () => {
    const response = buildTenantConsultingPackageResponse('partial-city')
    const packageBlocked = response.consulting_package.claim_ledger.filter(claim => claim.confidence === 'blocked').length

    expect(response.api_request_context_status).toMatchObject({
      ready: true,
      missing: [],
      context: {
        municipioId: 'slp',
        claveInegi: '24028',
        zm: 'SLP',
      },
    })
    expect(response.export_manifest.claim_ledger.blocked_count).toBe(packageBlocked)
    expect(response.export_manifest.tenant_id).toBe(response.consulting_package.tenant_id)
    expect(response.export_manifest.api_layer_contracts).toEqual(response.api_layer_contracts)
  })

  it('applies traced API layer payloads only through the explicit fetch path', async () => {
    const response = await buildTenantConsultingPackageResponseWithApiLayers('partial-city', {}, {
      layers: ['market'],
      fetcher: async () => new Response(JSON.stringify([{ id: 'buyer-1' }]), { status: 200 }),
    })

    expect(response.api_layer_fetch_status).toMatchObject({
      enabled: true,
      reason: 'founder_admin_gate',
      fetched_layers: ['market'],
      blocked_layers: [],
    })
    expect(response.consulting_package.input_registry.buyers_available).toBe(true)
  })

  it('loads Evidence Registry recommendations only through founder reviewed fetch path', async () => {
    const response = await buildTenantConsultingPackageResponseWithApiLayers('municipio-demo', {}, {
      layers: ['market'],
      fetcher: async (input) => {
        const url = String(input)
        if (url.includes('/research/bibliography/recommendations')) {
          return new Response(JSON.stringify({
            recommendations: [
              {
                score: 82,
                tag: 'benchmark',
                explanation: 'Benchmark usable para cálculo trazable; no sustituye estudio local.',
                record: {
                  id: 'fallback:semarnat:dbgirsu-2020',
                  institution: 'SEMARNAT',
                  title: 'Diagnóstico Básico para la Gestión Integral de los Residuos 2020',
                  url: 'https://www.gob.mx/semarnat',
                  published_at: '2020',
                  consulted_at: '2026-06-02',
                  municipio_id: null,
                  module_id: 'M01',
                  stage: 'validation',
                  category: 'benchmarks_nacionales',
                  evidence_scope: 'benchmark',
                  evidence_use: 'feeds_calculation',
                  confidence: 0.72,
                  method: 'benchmark_nacional_para_calculo',
                  claim_can_support: 'Cálculo trazable o contexto comparable, según etiqueta.',
                  claim_cannot_support: 'No convierte evidencia comparable, ZM, nacional o benchmark en estudio local.',
                  limitations: ['Benchmark; no desbloquea estudio local.'],
                  chicago_citation: 'SEMARNAT. "Diagnóstico Básico." 2020. Consultado el 2026-06-02.',
                },
              },
            ],
          }), { status: 200 })
        }
        return new Response(JSON.stringify([{ id: 'buyer-1' }]), { status: 200 })
      },
    })

    expect(response.api_layer_fetch_status).toMatchObject({
      enabled: true,
      evidence_registry_recommendations: 1,
    })
    expect(response.compatible_bibliography_chicago[0]).toMatchObject({
      id: 'municipio-demo:registry:fallback:semarnat:dbgirsu-2020',
      tag: 'benchmark',
    })
    expect(response.compatible_bibliography_chicago[0].unsupported_claim).toContain('benchmark en estudio local')
  })
})
