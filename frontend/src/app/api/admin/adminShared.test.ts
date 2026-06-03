import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

const currentUserMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: currentUserMock,
}))

describe('admin API local fallback', () => {
  it('allows the temporary founder email while Clerk metadata is being repaired', async () => {
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: ' ROMERO.BARCENA.BRAULIO@GMAIL.COM ' },
      emailAddresses: [],
      publicMetadata: {},
    })

    const { localAdminAuthContext } = await import('./_shared')
    const context = await localAdminAuthContext()

    expect(context.allowed).toBe(true)
    expect(context.temporary_admin_detected).toBe(true)
    expect(context.admin_metadata_detected).toBe(false)
  })

  it('keeps non-admin signed-in users out of admin fallbacks', async () => {
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'cliente@example.com' },
      emailAddresses: [],
      publicMetadata: {},
    })

    const { localAdminAuthContext } = await import('./_shared')
    const context = await localAdminAuthContext()

    expect(context.allowed).toBe(false)
    expect(context.temporary_admin_detected).toBe(false)
    expect(context.admin_metadata_detected).toBe(false)
  })

  it('returns municipality preparation fields in the ERP fallback index', async () => {
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'romero.barcena.braulio@gmail.com' },
      emailAddresses: [],
      publicMetadata: {},
    })

    const { GET } = await import('./erp/municipalities/route')
    const response = await GET(new NextRequest('https://alquimia.test/api/admin/erp/municipalities?q=San%20Luis'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.rows[0]).toHaveProperty('preparation_status')
    expect(body.rows[0]).toHaveProperty('preparation_label')
    expect(body.rows[0]).toHaveProperty('next_founder_action')
  })
})
