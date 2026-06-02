/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { moduleDocumentStatus, moduleDocumentStatusLabel } from './PillarModulePanel'
import { PillarModulePanel } from './PillarModulePanel'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

describe('PillarModulePanel helpers', () => {
  it('marks pillar modules with visible document gaps', () => {
    expect(moduleDocumentStatus('city_baseline', TENANT_DIAGNOSTIC_FIXTURES['partial-city'])).toBe('gap')
    expect(moduleDocumentStatusLabel('gap')).toBe('Brecha documental')
  })

  it('does not treat fixture gaps as removed sections', () => {
    const data = TENANT_DIAGNOSTIC_FIXTURES['gap-city']
    expect(data.document_index).toHaveLength(TENANT_DIAGNOSTIC_FIXTURES['complete-city'].document_index.length)
    expect(moduleDocumentStatus('marco_legal', data)).toBe('gap')
  })

  it('renders a readable pillar module with evidence and blocked claims', () => {
    const { container } = render(
      <PillarModulePanel
        module={{
          module_id: 'city_baseline',
          label: 'M01',
          audience_mode: 'city_team',
          decision: 'Revisar linea base',
          evidence: 'Fuente trazable',
          status: 'ready',
          next_action: 'Validar',
        }}
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['partial-city']}
      />,
    )

    expect(screen.getByText('Diagnóstico de residuos sólidos')).toBeTruthy()
    expect(screen.getByText(/El diagnóstico RSU queda abierto/)).toBeTruthy()
    expect(screen.getByText('Brecha documental visible')).toBeTruthy()
    expect(screen.getByText('Evidencia usada por este módulo')).toBeTruthy()
    expect(screen.getByText('Claims bloqueados o condicionados')).toBeTruthy()
    const root = container.querySelector('section')
    expect(root?.className).toContain('border-t')
    expect(root?.className).not.toContain('rounded')
  })

  it('renders M03B technical justification without closing it as official', () => {
    render(
      <PillarModulePanel
        module={{
          module_id: 'marco_legal',
          label: 'M03B',
          audience_mode: 'city_team',
          decision: 'Revisar marco legal',
          evidence: 'Reglamento pendiente',
          status: 'ready',
          next_action: 'Cargar reglamento',
        }}
        tenantData={TENANT_DIAGNOSTIC_FIXTURES['municipio-demo']}
      />,
    )

    expect(screen.getByText('Justificación técnica preliminar')).toBeTruthy()
    expect(screen.getByText('Reglamento vigente')).toBeTruthy()
    expect(screen.getByText('Documento pendiente')).toBeTruthy()
    expect(screen.getByText('Propuesta')).toBeTruthy()
    expect(screen.getByText('Revisión humana requerida')).toBeTruthy()
    expect(screen.getByText(/no es acto de autoridad, dictamen ni aprobación/i)).toBeTruthy()
  })
})
