/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  TenantActorsPanel,
  TenantAntecedentesPanel,
  TenantOrganigramaServicioPanel,
} from '@/components/simulator/TenantProfilePanels'
import type { TenantMunicipalProfile } from '@/lib/tenantMunicipalProfile'

const slpProfile: TenantMunicipalProfile = {
  mode: 'operacion',
  provenance_status: 'pendiente_verificacion',
  antecedentes: {
    cabildo: {
      sindicos: [{ cargo: 'Sindicatura 1', estado: 'pendiente_verificacion' }],
      regidores: Array.from({ length: 15 }, (_, idx) => ({ cargo: `Regiduria ${idx + 1}`, estado: 'pendiente_verificacion' })),
      comisiones_permanentes: [{ nombre: 'Comision de Servicios Municipales', estado: 'pendiente_verificacion' }],
    },
    presidente_municipal: { estado: 'pendiente_verificacion' },
  },
  mapa_social: {
    actores: Array.from({ length: 15 }, (_, idx) => ({
      actor_id: `slp-a${idx + 1}`,
      nombre: `Actor institucional ${idx + 1}`,
      tipo_actor: 'municipal',
      influencia: 'media',
      postura: 'por_verificar',
      evidencia_fuente: 'Pendiente de verificacion documental municipal',
      fecha_actualizacion: '2026-05-28',
    })),
  },
  organigrama_servicio: {
    roles_operativos: [{ rol: 'Coordinacion RSU', responsabilidad: 'Coordinar reportes' }],
    turnos: [{ nombre: 'Matutino', horario: '06:00-14:00' }],
    horarios: [{ actividad: 'Recoleccion domiciliaria', horario: 'Pendiente carga de datos del municipio' }],
  },
}

describe('TenantProfilePanels · Fase 6', () => {
  it('renderiza SLP en modo operacion sin presentar pendientes como oficiales', () => {
    const { container } = render(<TenantActorsPanel profile={slpProfile} />)
    expect(container.textContent).toContain('Operación')
    expect(container.textContent).toContain('15/15')
    expect(container.textContent).toContain('actores mínimos')
    expect(container.textContent).toContain('Pendiente de verificacion documental municipal')
    expect(container.textContent).toContain('Nada estimado se presenta como oficial.')
  })

  it('renderiza cabildo y organigrama desde tenant profile', () => {
    const antecedentes = render(<TenantAntecedentesPanel profile={slpProfile} />)
    expect(antecedentes.container.textContent).toContain('Sindicatura 1')
    expect(antecedentes.container.textContent).toContain('Regiduria 15')
    expect(antecedentes.container.textContent).toContain('Comision de Servicios Municipales')

    const organigrama = render(<TenantOrganigramaServicioPanel profile={slpProfile} />)
    expect(organigrama.container.textContent).toContain('Coordinacion RSU')
    expect(organigrama.container.textContent).toContain('Matutino')
    expect(organigrama.container.textContent).toContain('Pendiente carga de datos del municipio')
  })

  it('muestra carga inicial cuando faltan datos del municipio', () => {
    const { container } = render(<TenantActorsPanel profile={null} />)
    expect(container.textContent).toContain('Carga inicial')
    expect(container.textContent).toContain('Pendiente carga de datos del municipio')
  })
})
