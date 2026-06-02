import { describe, expect, it } from 'vitest'
import { GET } from './route'

describe('/api/tenants/[id]/data', () => {
  it('enriches local tenant data with explicit municipal context headers', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/data', {
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
    expect(body.municipio_id).toBe('slp')
    expect(body.clave_inegi).toBe('24028')
    expect(body.zm).toBe('SLP')
    expect(body.metrics.some((metric: { status: string }) => metric.status === 'verificado')).toBe(true)
    expect(body.metrics.some((metric: { status: string }) => metric.status === 'inferido')).toBe(true)
    expect(body.metrics.some((metric: { status: string }) => metric.status === 'brecha_critica')).toBe(true)
  })

  it('blocks cross-tenant reads', async () => {
    const response = await GET(
      new Request('https://alquimia.test/api/tenants/municipio-demo/data', {
        headers: { 'x-tenant-id': 'other-tenant' },
      }),
      { params: Promise.resolve({ id: 'municipio-demo' }) },
    )

    expect(response.status).toBe(403)
  })
})
