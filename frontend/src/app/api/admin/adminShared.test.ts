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
})
