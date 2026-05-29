/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  TenantActorsPanel,
  TenantAntecedentesPanel,
  TenantFirstLoginSummary,
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

  it('muestra confianza y aviso preliminar para inferencias automaticas', () => {
    const inferredProfile: TenantMunicipalProfile = {
      ...slpProfile,
      provenance_status: 'preliminar_pendiente_validacion',
      automation: { preliminary_notice: 'dato preliminar pendiente de validacion' },
      antecedentes: {
        ...slpProfile.antecedentes,
        reglamento_de_limpia: {
          value: 'Reglamento identificado',
          source: { label: 'Periodico Oficial' },
          confidence: 'inferred_high_confidence',
          display_status: 'dato preliminar pendiente de validacion',
        },
      },
    }
    const { container } = render(<TenantAntecedentesPanel profile={inferredProfile} />)
    expect(container.textContent).toContain('dato preliminar pendiente de validacion')
    expect(container.textContent).toContain('Periodico Oficial · inferred_high_confidence')
  })

  it('muestra resumen de primer login con estados de confianza y missing_source', () => {
    const firstLoginProfile: TenantMunicipalProfile = {
      ...slpProfile,
      mode: 'carga_inicial',
      provenance_status: 'preliminar_pendiente_validacion',
      automation: {
        preliminary_notice: 'dato preliminar pendiente de validacion',
        inference: { status: 'partial' },
      },
      antecedentes: {
        ...slpProfile.antecedentes,
        demografia: {
          poblacion: {
            value: 1049777,
            source: { label: 'INEGI Censo 2020' },
            confidence: 'inferred_high_confidence',
            human_validation_state: 'pending_human_validation',
          },
          generacion_kg_hab_dia: {
            value: null,
            source: { label: 'SEMARNAT' },
            confidence: 'inferred_low_confidence',
            human_validation_state: 'pending_source',
          },
        },
      },
    }
    const { container } = render(<TenantFirstLoginSummary profile={firstLoginProfile} moduleLabel="M01 · línea base" />)
    expect(container.textContent).toContain('Primer login · M01')
    expect(container.textContent).toContain('INEGI Censo 2020 · inferred_high_confidence')
    expect(container.textContent).toContain('SEMARNAT · inferred_low_confidence · missing_source')
    expect(container.textContent).toContain('Pendiente carga de datos del municipio')
    expect(container.textContent).toContain('Nada estimado se presenta como oficial.')
  })

  it('muestra discrepancias y recomendaciones runtime sin tratarlas como error definitivo', () => {
    const runtimeProfile: TenantMunicipalProfile = {
      ...slpProfile,
      automation: {
        runtime: {
          discrepancies: [{
            field: 'antecedentes.demografia.poblacion',
            delta_pct: 33.2,
            not_definitive_error: true,
          }],
          recommendations: [{
            module_id: 'city_baseline',
            legacy_number: 'M01',
            recommendation: 'Usar escenario moderado hasta validar cifras reales.',
            status: 'pending_human_decision',
          }],
        },
      },
    }
    const { container } = render(<TenantAntecedentesPanel profile={runtimeProfile} />)
    expect(container.textContent).toContain('Discrepancia en revisión')
    expect(container.textContent).toContain('No es error definitivo')
    expect(container.textContent).toContain('Recomendación accionable')
    expect(container.textContent).toContain('Acción humana pendiente')
  })
})
