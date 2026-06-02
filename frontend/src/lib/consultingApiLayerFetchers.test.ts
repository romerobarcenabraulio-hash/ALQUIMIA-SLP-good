import { describe, expect, it, vi } from 'vitest'
import { consultingApiContractForLayer } from '@/lib/consultingApiLayerContracts'
import {
  buildConsultingApiLayerUrl,
  fetchConsultingApiLayerPayload,
  fetchConsultingApiLayerPayloads,
} from '@/lib/consultingApiLayerFetchers'

const context = {
  tenantId: 'tenant-1',
  municipioId: 'slp',
  municipioNombre: 'San Luis Potosí',
  claveInegi: '24028',
  zm: 'SLP',
  sourceDate: '2026-05-31',
}

describe('consultingApiLayerFetchers', () => {
  it('builds URLs from existing API contracts without parallel namespaces', () => {
    expect(buildConsultingApiLayerUrl(consultingApiContractForLayer('national'), context)).toBe(
      'http://localhost:8000/national/municipios/slp/profile',
    )
    expect(buildConsultingApiLayerUrl(consultingApiContractForLayer('legal'), context)).toBe(
      'http://localhost:8000/legal/slp/source-manifest',
    )
    expect(buildConsultingApiLayerUrl(consultingApiContractForLayer('centros_acopio'), context)).toContain(
      '/api/v1/centros-acopio/',
    )
    expect(buildConsultingApiLayerUrl(consultingApiContractForLayer('centros_acopio'), context)).toContain(
      'clave_inegi=24028',
    )
  })

  it('normalizes successful fetch responses into traced layer payloads', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 'buyer-1' }]), { status: 200 }))
    const payload = await fetchConsultingApiLayerPayload(consultingApiContractForLayer('market'), context, { fetcher })

    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/market/buyers?zm=SLP', { method: 'GET' })
    expect(payload.layer).toBe('market')
    expect(payload.available).toBe(true)
    expect(payload.source).toBe('GET /market/buyers')
    expect(payload.territorial_scope).toBe('zm')
    expect(payload.confidence).toBe('medium')
  })

  it('normalizes failed fetch responses as blocked gaps instead of throwing', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'missing' }), { status: 404 }))
    const payload = await fetchConsultingApiLayerPayload(consultingApiContractForLayer('operations'), context, { fetcher })

    expect(payload.available).toBe(false)
    expect(payload.confidence).toBe('blocked')
    expect(payload.method).toContain('HTTP 404')
  })

  it('can fetch an explicit subset of layers for runtime assembly', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ municipio_id: 'slp' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ score_global: 72 }), { status: 200 }))

    const payloads = await fetchConsultingApiLayerPayloads(context, {
      fetcher,
      layers: ['legal', 'standards'],
    })

    expect(payloads.map(payload => payload.layer)).toEqual(['legal', 'standards'])
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
