import { describe, expect, it } from 'vitest'
import { tenantIdForMunicipio, profileModeLabel } from '@/lib/tenantMunicipalProfile'

describe('tenant municipal profile routing', () => {
  it('resuelve tenant por municipio sin mezclar ZM', () => {
    expect(tenantIdForMunicipio(['slp'])).toBe('slp-capital')
    expect(tenantIdForMunicipio(['monterrey'])).toBe('monterrey')
    expect(tenantIdForMunicipio(['guanajuato'])).toBe('guanajuato-capital')
  })

  it('mantiene etiquetas de modo carga inicial y operacion', () => {
    expect(profileModeLabel('carga_inicial')).toBe('Carga inicial')
    expect(profileModeLabel('operacion')).toBe('Operación')
  })
})
