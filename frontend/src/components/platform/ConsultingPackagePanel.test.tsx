/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { ConsultingPackagePanel } from './ConsultingPackagePanel'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'
import { buildTenantConsultingPackageResponse } from '@/lib/tenantConsultingPackageResponse'
import { buildConsultingPackage } from '@/lib/consultingPackageEngine'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ConsultingPackagePanel', () => {
  it('renders municipio-demo as bibliographic demo with traceable calculated scenarios', () => {
    const { container } = render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['municipio-demo']}
        showTechnicalPanel={false}
      />,
    )

    expect(screen.getByText('Paquete de Consultoría RSU Gobierno')).toBeTruthy()
    expect(screen.getAllByText(/claims afirmables/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Insumos conectados')).toBeTruthy()
    expect(screen.getByText('Gates de cierre')).toBeTruthy()
    expect(screen.getByText('Compradores/precios')).toBeTruthy()
    expect(screen.getAllByText(/Sin reglamento municipal vigente integrado/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Escenario preliminar, no oficial')).toHaveLength(5)
    expect(screen.getByText('Bloquea plan')).toBeTruthy()
    expect(screen.getAllByText('Condiciona').length).toBeGreaterThan(1)
    expect(screen.queryByText('Panel técnico interno de calibración')).toBeNull()
    expect(container.textContent).toContain('$')
    expect(container.textContent).toContain('t/día')
    expect(container.textContent).toContain('Precio ponderado por material')
  })

  it('keeps private urban capture broader than condominiums in the client surface', () => {
    render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel={false}
      />,
    )

    expect(screen.getAllByText('Escuelas y universidades').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Plazas y comercios').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hospitales privados').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Industria ligera').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Macrogeneradores').length).toBeGreaterThan(0)
  })

  it('uses an unframed editorial canvas instead of wrapping the package in a card', () => {
    const { container } = render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel={false}
      />,
    )
    const root = container.querySelector('section')

    expect(root?.className).toContain('pb-8')
    expect(root?.className).not.toContain('rounded')
    expect(root?.className).not.toContain('border')
    expect(root?.className).not.toContain('bg-[#FDFCFA]')
  })

  it('shows technical calibration only for founder/admin view', () => {
    const { rerender } = render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel={false}
      />,
    )

    expect(screen.queryByText('Panel técnico interno de calibración')).toBeNull()

    rerender(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel
      />,
    )

    expect(screen.getByText('Panel técnico interno de calibración')).toBeTruthy()
  })

  it('calculates partial-city scenarios from bibliographic prices while keeping buyer gate open', () => {
    render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel={false}
      />,
    )

    expect(screen.getAllByText('Escenario preliminar, no oficial')).toHaveLength(5)
    expect(screen.getByText('Compradores/precios')).toBeTruthy()
    expect(screen.getAllByText('Condiciona').length).toBeGreaterThan(0)
  })

  it('labels calculated scenario figures as preliminary and not official', async () => {
    const response = buildTenantConsultingPackageResponse('complete-city')
    const payload = {
      ...response,
      consulting_package: buildConsultingPackage({
        tenantData: TENANT_DIAGNOSTIC_FIXTURES['complete-city'],
        buyersAvailable: true,
      }),
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['complete-city']}
        showTechnicalPanel={false}
      />,
    )

    await waitFor(() => expect(screen.getAllByText('Escenario preliminar, no oficial')).toHaveLength(5))
    expect(screen.getByText(/Los precios son de escenario y requieren cotización vigente/i)).toBeTruthy()
    expect(screen.queryByText('Panel técnico interno de calibración')).toBeNull()
  })

  it('uses the tenant consulting package API when available', async () => {
    const response = buildTenantConsultingPackageResponse('partial-city')
    const payload = {
      ...response,
      consulting_package: {
        ...response.consulting_package,
        municipality: 'Municipio API',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel={false}
      />,
    )

    await waitFor(() => expect(screen.getByText(/Municipio API:/)).toBeTruthy())
    expect(fetchMock).toHaveBeenCalledWith('/api/tenants/partial-city/consulting-package', {
      headers: { 'x-tenant-id': 'partial-city' },
    })
  })

  it('enables API layer fetch only for founder/admin technical view', async () => {
    const response = buildTenantConsultingPackageResponse('partial-city')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ConsultingPackagePanel
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
        showTechnicalPanel
      />,
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith('/api/tenants/partial-city/consulting-package', {
      headers: {
        'x-tenant-id': 'partial-city',
        'x-consulting-api-fetch-gate': 'founder-admin-reviewed',
      },
    })
  })
})
