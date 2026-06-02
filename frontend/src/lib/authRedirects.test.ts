import { describe, expect, it } from 'vitest'
import { sanitizeAuthRedirectPath } from './authRedirects'

describe('sanitizeAuthRedirectPath', () => {
  it('defaults empty or external redirects to the consulting package', () => {
    expect(sanitizeAuthRedirectPath()).toBe('/v')
    expect(sanitizeAuthRedirectPath('')).toBe('/v')
    expect(sanitizeAuthRedirectPath('https://evil.example/v')).toBe('/v')
    expect(sanitizeAuthRedirectPath('//evil.example/v')).toBe('/v')
  })

  it('blocks legacy simulator redirects', () => {
    expect(sanitizeAuthRedirectPath('/simulator')).toBe('/v')
    expect(sanitizeAuthRedirectPath('/simulator#propuestas-simulador')).toBe('/v')
    expect(sanitizeAuthRedirectPath('/simulator?tenant_id=municipio-demo')).toBe('/v')
  })

  it('preserves internal consulting and onboarding redirects', () => {
    expect(sanitizeAuthRedirectPath('/v')).toBe('/v')
    expect(sanitizeAuthRedirectPath('/v?tenant_id=abc')).toBe('/v?tenant_id=abc')
    expect(sanitizeAuthRedirectPath('/gobierno/rsu')).toBe('/gobierno/rsu')
    expect(sanitizeAuthRedirectPath('/onboarding/perfil')).toBe('/onboarding/perfil')
  })
})
