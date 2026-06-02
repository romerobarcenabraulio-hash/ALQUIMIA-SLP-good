import { describe, expect, it } from 'vitest'
import {
  tenantMunicipalContextFromHeaders,
  tenantMunicipalContextToHeaders,
} from '@/lib/tenantMunicipalContextHeaders'
import { withTenantMunicipalContext } from '@/lib/tenantDiagnosticData'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

describe('tenantMunicipalContextHeaders', () => {
  it('round-trips formal municipal context through headers', () => {
    const headers = tenantMunicipalContextToHeaders({
      municipio_id: 'slp',
      clave_inegi: '24028',
      zm: 'SLP',
      municipality: 'San Luis Potosí',
      state: 'San Luis Potosí',
    })
    const parsed = tenantMunicipalContextFromHeaders(new Headers(headers))

    expect(parsed).toMatchObject({
      municipio_id: 'slp',
      clave_inegi: '24028',
      zm: 'SLP',
      municipality: 'San Luis Potosí',
      state: 'San Luis Potosí',
    })
  })

  it('enriches tenant diagnostic data without changing evidence status', () => {
    const data = withTenantMunicipalContext(TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'], {
      municipio_id: 'slp',
      clave_inegi: '24028',
      zm: 'SLP',
      municipality: 'San Luis Potosí',
      state: 'San Luis Potosí',
    })

    expect(data.municipio_id).toBe('slp')
    expect(data.clave_inegi).toBe('24028')
    expect(data.metrics.every(metric => metric.status === 'brecha_critica')).toBe(true)
  })
})
