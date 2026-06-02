import { describe, expect, it } from 'vitest'
import {
  buildTenantConsultingPackageResponse,
  buildTenantConsultingPackageResponseWithApiLayers,
} from '@/lib/tenantConsultingPackageResponse'

describe('tenantConsultingPackageResponse', () => {
  it('builds one auditable consulting response for municipio-demo', () => {
    const response = buildTenantConsultingPackageResponse('municipio-demo')

    expect(response.tenant_id).toBe('municipio-demo')
    expect(response.human_review_required).toBe(true)
    expect(response.officiality).toBe('preliminary_not_official')
    expect(response.api_request_context_status).toMatchObject({
      ready: false,
      missing: ['municipio_id', 'clave_inegi', 'zm'],
      context: null,
    })
    expect(response.consulting_package.scenario_set.client_controls_enabled).toBe(false)
    expect(response.consulting_package.scenario_set.scenarios.every(scenario => scenario.capture_ton_day === null)).toBe(true)
    expect(response.api_layer_contracts.map(contract => contract.layer)).toContain('market')
    expect(response.export_manifest.claim_ledger.affirmable_count).toBe(0)
    expect(response.export_manifest.input_registry.buyers_available).toBe(false)
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
})
