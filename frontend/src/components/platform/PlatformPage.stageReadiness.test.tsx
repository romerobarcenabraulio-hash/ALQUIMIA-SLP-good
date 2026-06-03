/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StageReadinessNotice, TenantSelectionPanel } from './PlatformPage'

afterEach(() => cleanup())

describe('StageReadinessNotice', () => {
  it('does not show a readiness notice during validation', () => {
    const { container } = render(<StageReadinessNotice stage="validation" clientPreview={false} />)

    expect(container.textContent).toBe('')
  })

  it('keeps planning gated by human review and evidence', () => {
    const { container } = render(<StageReadinessNotice stage="planning" clientPreview={false} />)
    const root = container.querySelector('section')

    expect(screen.getByText('Planeación condicionada')).toBeTruthy()
    expect(screen.getByText('Esta etapa no se abre como decisión automática.')).toBeTruthy()
    expect(screen.getByText(/requiere revisión humana, evidencia mínima y gates institucionales/i)).toBeTruthy()
    expect(screen.getByText(/sin controles libres en vista cliente/i)).toBeTruthy()
    expect(root?.className).toContain('border-l-4')
    expect(root?.className).not.toContain('rounded')
  })

  it('keeps execution gated and hides internal calibration in client preview', () => {
    render(<StageReadinessNotice stage="execution" clientPreview />)

    expect(screen.getByText('Ejecución condicionada')).toBeTruthy()
    expect(screen.getByText(/requiere revisión humana, evidencia mínima y gates institucionales/i)).toBeTruthy()
    expect(screen.getByText(/Vista cliente: solo se muestra lectura condicionada/i)).toBeTruthy()
    expect(screen.getByText(/no se exponen herramientas internas de calibración/i)).toBeTruthy()
  })
})

describe('TenantSelectionPanel', () => {
  it('lets admins choose a city instead of seeing a tenant_id error', () => {
    const selected: string[] = []
    render(
      <TenantSelectionPanel
        tenants={[
          {
            id: 'slp-capital',
            nombre: 'San Luis Potosi',
            estado_mx: 'San Luis Potosi',
            municipio_id: 'slp',
            inegi_clave: '24028',
            stage: 'validation',
            gatesClosed: 1,
            gatesTotal: 5,
            pendingDocumentCount: 2,
            receivedDocumentCount: 0,
            pendingDocumentLabels: ['Reglamento de limpia', 'Estudio de cuarteo'],
            documentStatus: 'pending',
          },
          {
            id: 'qro-centro',
            nombre: 'Queretaro',
            estado_mx: 'Queretaro',
            municipio_id: 'qro',
            inegi_clave: '22014',
            stage: 'planning',
            gatesClosed: 3,
            gatesTotal: 5,
            pendingDocumentCount: 0,
            receivedDocumentCount: 4,
            pendingDocumentLabels: [],
            documentStatus: 'ok',
          },
        ]}
        loading={false}
        error={null}
        onSelect={tenantId => selected.push(tenantId)}
      />,
    )

    expect(screen.getByText('Elige el municipio que quieres analizar.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Filtrar por ciudad, estado, clave INEGI o expediente'), {
      target: { value: '24028' },
    })
    expect(screen.getByText('San Luis Potosi')).toBeTruthy()
    expect(screen.queryByText('Queretaro')).toBeNull()
    expect(screen.getByText(/Faltan 2 documentos/i)).toBeTruthy()
    expect(screen.getByText('Gates 1/5')).toBeTruthy()
    fireEvent.click(screen.getByText('San Luis Potosi'))
    expect(selected).toEqual(['slp-capital'])
  })

  it('keeps a manual tenant_id escape hatch when the admin index is unavailable', () => {
    const selected: string[] = []
    render(
      <TenantSelectionPanel
        tenants={[]}
        loading={false}
        error="Solo admins"
        onSelect={tenantId => selected.push(tenantId)}
      />,
    )

    expect(screen.getByText(/No se pudo cargar el índice admin de municipios/i)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('expediente interno'), { target: { value: 'manual-city' } })
    fireEvent.click(screen.getByText('Abrir análisis'))
    expect(selected).toEqual(['manual-city'])
  })
})
