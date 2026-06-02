import { describe, expect, it } from 'vitest'
import { authorizedFounderViewMode, isFounderOrAdmin } from './FounderViewModeSwitcher'

describe('FounderViewModeSwitcher access', () => {
  it('allows the temporary personal admin email without Clerk metadata', () => {
    expect(isFounderOrAdmin(undefined, 'romero.barcena.braulio@gmail.com')).toBe(true)
    expect(isFounderOrAdmin({}, ' Romero.Barcena.Braulio@Gmail.com ')).toBe(true)
    expect(isFounderOrAdmin({}, 'otra@cuenta.com', ['romero.barcena.braulio@gmail.com'])).toBe(true)
  })

  it('keeps regular users out of internal view switching', () => {
    expect(isFounderOrAdmin({}, 'cliente@example.com')).toBe(false)
    expect(isFounderOrAdmin({ role: 'client' }, 'cliente@example.com')).toBe(false)
  })

  it('still accepts explicit founder/admin metadata', () => {
    expect(isFounderOrAdmin({ role: 'founder' }, 'cliente@example.com')).toBe(true)
    expect(isFounderOrAdmin({ has_admin_access: true }, 'cliente@example.com')).toBe(true)
  })

  it('forces regular users into client view even if local storage says admin', () => {
    expect(authorizedFounderViewMode(false, 'admin')).toBe('client')
    expect(authorizedFounderViewMode(false, 'client')).toBe('client')
    expect(authorizedFounderViewMode(true, 'admin')).toBe('admin')
  })
})
