import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

const currentUserMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: currentUserMock,
}))

function mockFounderUser() {
  currentUserMock.mockResolvedValue({
    primaryEmailAddress: { emailAddress: 'romero.barcena.braulio@gmail.com' },
    emailAddresses: [],
    publicMetadata: {},
  })
}

function mockClientUser() {
  currentUserMock.mockResolvedValue({
    primaryEmailAddress: { emailAddress: 'cliente@example.com' },
    emailAddresses: [],
    publicMetadata: {},
  })
}

describe('admin INEGI and ERP routes', () => {
  it('serves state and municipality selectors for founder/admin access', async () => {
    mockFounderUser()
    const statesRoute = await import('./inegi/states/route')
    const municipalitiesRoute = await import('./inegi/municipalities/route')

    const statesResponse = await statesRoute.GET()
    const statesBody = await statesResponse.json()
    expect(statesResponse.status).toBe(200)
    expect(statesBody.states).toContainEqual({ estado_id: '24', estado_nombre: 'San Luis Potosí' })

    const municipalitiesResponse = await municipalitiesRoute.GET(
      new NextRequest('https://alquimia.test/api/admin/inegi/municipalities?estado_id=24&q=San%20Luis&limit=20'),
    )
    const municipalitiesBody = await municipalitiesResponse.json()
    expect(municipalitiesResponse.status).toBe(200)
    expect(municipalitiesBody.municipalities[0]).toMatchObject({
      clave_inegi: '24028',
      nombre: 'San Luis Potosí',
      estado_id: '24',
      zm: 'SLP',
    })
    expect(municipalitiesBody.territorial_rule).toContain('ZM no soporta claim municipal')
  })

  it('serves ERP rows linked by INEGI without exposing private cross-tenant data', async () => {
    mockFounderUser()
    const erpRoute = await import('./erp/municipalities/route')

    const response = await erpRoute.GET(
      new NextRequest('https://alquimia.test/api/admin/erp/municipalities?estado_id=24&q=San%20Luis'),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.cross_tenant_private_data_exposed).toBe(false)
    expect(body.rows[0]).toMatchObject({
      clave_inegi: '24028',
      municipio: 'San Luis Potosí',
      estado_id: '24',
      link_status: 'tenant_sin_usuario',
    })
  })

  it('blocks local admin fallback routes for non-admin users', async () => {
    mockClientUser()
    const statesRoute = await import('./inegi/states/route')

    const response = await statesRoute.GET()
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.detail).toBe('Solo admins o analistas internos')
  })
})
