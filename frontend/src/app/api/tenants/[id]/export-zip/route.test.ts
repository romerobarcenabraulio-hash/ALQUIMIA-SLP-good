import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('/api/tenants/[id]/export-zip', () => {
  it('includes consulting package, manifest, ledger, registry and scenarios in the ZIP', async () => {
    const tenantId = `municipio-demo-export-${Date.now()}`
    const response = await GET(
      new Request(`https://alquimia.test/api/tenants/${tenantId}/export-zip`),
      { params: Promise.resolve({ id: tenantId }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')

    const zip = await JSZip.loadAsync(await response.arrayBuffer())
    const expectedFiles = [
      'consulting_manifest.json',
      'consulting_package.json',
      'export_notice.json',
      'claim_ledger.json',
      'input_registry.json',
      'scenario_set.json',
      'bibliography_recommendations.json',
      'api_layer_fetch_status.json',
      '01_PAQUETE_CONSULTIVO.md',
    ]

    for (const filename of expectedFiles) {
      expect(zip.file(filename), filename).toBeTruthy()
    }

    const manifest = JSON.parse(await zip.file('consulting_manifest.json')!.async('string'))
    const pkg = JSON.parse(await zip.file('consulting_package.json')!.async('string'))
    const notice = JSON.parse(await zip.file('export_notice.json')!.async('string'))
    const md = await zip.file('01_PAQUETE_CONSULTIVO.md')!.async('string')

    expect(manifest.package_type).toBe('consulting_package_rsu_gobierno')
    expect(manifest.human_review_required).toBe(true)
    expect(notice.officiality).toBe('preliminary_not_official')
    expect(notice.human_review_required).toBe(true)
    expect(notice.client_controls_enabled).toBe(false)
    expect(notice.warning).toContain('Paquete preliminar no oficial')
    expect(md).toContain('Oficialidad: preliminary_not_official')
    expect(md).toContain('Revisión humana requerida: sí')
    expect(md).toContain('Bibliografía compatible y límites de uso')
    expect(md).toContain('no sustituye estudio local')
    expect(manifest.readiness_gates.some((gate: { id: string }) => gate.id === 'scenario_set')).toBe(true)
    expect(manifest.bibliography_recommendations.length).toBeGreaterThan(0)
    expect(pkg.scenario_set.client_controls_enabled).toBe(false)
    expect(pkg.readiness_gates.some((gate: { id: string }) => gate.id === 'claim_ledger')).toBe(true)
    const fetchStatus = JSON.parse(await zip.file('api_layer_fetch_status.json')!.async('string'))
    expect(fetchStatus.enabled).toBe(false)
  })

  it('includes API layer fetch status when founder/admin gate is provided', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify([{ id: 'buyer-1' }]), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(
      new Request('https://alquimia.test/api/tenants/partial-city/export-zip', {
        headers: {
          'x-tenant-id': 'partial-city',
          'x-consulting-api-fetch-gate': 'founder-admin-reviewed',
        },
      }),
      { params: Promise.resolve({ id: 'partial-city' }) },
    )

    expect(response.status).toBe(200)
    const zip = await JSZip.loadAsync(await response.arrayBuffer())
    const fetchStatus = JSON.parse(await zip.file('api_layer_fetch_status.json')!.async('string'))
    const pkg = JSON.parse(await zip.file('consulting_package.json')!.async('string'))

    expect(fetchStatus.enabled).toBe(true)
    expect(fetchStatus.fetched_layers).toContain('market')
    expect(pkg.input_registry.buyers_available).toBe(true)
  })

  it('blocks cross-tenant export attempts', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/export-zip', {
        headers: { 'x-tenant-id': 'other-tenant' },
      }),
      { params: Promise.resolve({ id: 'municipio-demo' }) },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ detail: 'Acceso cross-tenant bloqueado' })
  })
})
