import { describe, expect, it } from 'vitest'
import { buildTenantConsultingApiContext } from '@/lib/tenantConsultingApiContext'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

describe('tenantConsultingApiContext', () => {
  it('keeps bibliographic demo ready when it has formal municipal context', () => {
    const status = buildTenantConsultingApiContext(TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'])

    expect(status.ready).toBe(true)
    expect(status.context).toMatchObject({
      tenantId: 'municipio-demo',
      municipioId: 'slp',
      claveInegi: '24028',
      zm: 'SLP',
    })
    expect(status.missing).toEqual([])
  })

  it('blocks API automation when a tenant truly lacks formal municipal context', () => {
    const status = buildTenantConsultingApiContext({
      ...TENANT_DIAGNOSTIC_FIXTURES['partial-city'],
      municipio_id: undefined,
      clave_inegi: undefined,
      zm: undefined,
    })

    expect(status.ready).toBe(false)
    expect(status.context).toBeNull()
    expect(status.missing).toEqual(['municipio_id', 'clave_inegi', 'zm'])
  })

  it('builds fetch context only from explicit tenant municipal metadata', () => {
    const status = buildTenantConsultingApiContext({
      ...TENANT_DIAGNOSTIC_FIXTURES['partial-city'],
      municipio_id: 'slp',
      clave_inegi: '24028',
      zm: 'SLP',
    })

    expect(status.ready).toBe(true)
    expect(status.context).toMatchObject({
      tenantId: 'partial-city',
      municipioId: 'slp',
      claveInegi: '24028',
      zm: 'SLP',
    })
  })

  it('keeps canonical non-demo fixtures ready for API automation', () => {
    const status = buildTenantConsultingApiContext(TENANT_DIAGNOSTIC_FIXTURES['partial-city'])

    expect(status.ready).toBe(true)
    expect(status.context).toMatchObject({
      municipioId: 'slp',
      claveInegi: '24028',
      zm: 'SLP',
    })
  })
})
