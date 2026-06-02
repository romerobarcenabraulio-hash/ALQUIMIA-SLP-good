import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('/api/tenants/[id]/consulting-package', () => {
  it('returns the consulting package and export manifest for the requested tenant', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/consulting-package'),
      { params: Promise.resolve({ id: 'municipio-demo' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.tenant_id).toBe('municipio-demo')
    expect(body.human_review_required).toBe(false)
    expect(body.consulting_package.scenario_set.client_controls_enabled).toBe(false)
    expect(body.export_manifest.claim_ledger.affirmable_count).toBeGreaterThan(0)
  })

  it('accepts explicit municipal context without changing tenant isolation', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/consulting-package', {
        headers: {
          'x-tenant-id': 'municipio-demo',
          'x-municipio-id': 'slp',
          'x-clave-inegi': '24028',
          'x-zm': 'SLP',
          'x-municipio-nombre': 'San Luis Potosí',
          'x-estado-mx': 'San Luis Potosí',
        },
      }),
      { params: Promise.resolve({ id: 'municipio-demo' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.api_request_context_status).toMatchObject({
      ready: true,
      context: {
        municipioId: 'slp',
        claveInegi: '24028',
        zm: 'SLP',
      },
    })
    expect(body.consulting_package.scenario_set.scenarios.some((scenario: { capture_ton_day: number | null }) => scenario.capture_ton_day !== null)).toBe(true)
  })

  it('runs API layer fetch only behind founder/admin gate', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify([{ id: 'buyer-1' }]), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(
      new Request('https://alquimia.test/api/tenants/partial-city/consulting-package', {
        headers: {
          'x-tenant-id': 'partial-city',
          'x-consulting-api-fetch-gate': 'founder-admin-reviewed',
        },
      }),
      { params: Promise.resolve({ id: 'partial-city' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.api_layer_fetch_status.enabled).toBe(true)
    expect(body.api_layer_fetch_status.fetched_layers).toContain('market')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('blocks cross-tenant reads', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/consulting-package', {
        headers: { 'x-tenant-id': 'other-tenant' },
      }),
      { params: Promise.resolve({ id: 'municipio-demo' }) },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ detail: 'Acceso cross-tenant bloqueado' })
  })
})
