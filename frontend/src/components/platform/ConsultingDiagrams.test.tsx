/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ConsultingDiagramSuite } from '@/components/platform/ConsultingDiagrams'
import { buildConsultingPackage } from '@/lib/consultingPackageEngine'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

afterEach(() => cleanup())

describe('ConsultingDiagramSuite', () => {
  it('renders the mandatory editorial diagrams without simulator dependencies', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['complete-city'] })
    render(<ConsultingDiagramSuite pkg={pkg} />)

    expect(screen.getByText('Flujo 100% RSU')).toBeInTheDocument()
    expect(screen.getByText('Mapa de captura privada')).toBeInTheDocument()
    expect(screen.getByText('Cascada de escenarios')).toBeInTheDocument()
    expect(screen.getByText('Matriz riesgo-impacto')).toBeInTheDocument()
    expect(screen.getByText('Evidencia por claim')).toBeInTheDocument()
    expect(screen.getByText('Hoja de ruta por fases')).toBeInTheDocument()
  })

  it('keeps blocked values explicit instead of filling visual diagrams with fake numbers', () => {
    const pkg = buildConsultingPackage({ tenantData: TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'] })
    render(<ConsultingDiagramSuite pkg={pkg} />)

    expect(screen.getAllByText(/Bloqueado|Brecha/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Las cifras bloqueadas no se sustituyen con estimaciones decorativas.').length).toBeGreaterThan(0)
  })
})
