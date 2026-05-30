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
    render(
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
  })
})
