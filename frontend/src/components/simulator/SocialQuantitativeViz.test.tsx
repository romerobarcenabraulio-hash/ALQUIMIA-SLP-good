/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SocialPr4MetadataFooter } from '@/components/simulator/SocialPr4MetadataFooter'
import { SocialStatsDenseVirtualTable } from '@/components/simulator/SocialStatsDenseVirtualTable'
import type { QuantVizRow } from '@/lib/social/socialStatsQuantRows'

afterEach(cleanup)

describe('PR4 visualización ligera', () => {
  it('tabla virtualizada cuando hay más de 20 filas', () => {
    const rows: QuantVizRow[] = Array.from({ length: 25 }, (_, i) => ({
      kind: 'primary' as const,
      indicatorId: `test_ind_${i}`,
      label: `Indicador ${i}`,
      value: i,
      unit: 'u',
      availability: 'disponible_ambito_solicitado',
      meta: {
        geoLevel: 'municipio',
        vintageLabel: '2020',
        sourceId: 'src',
        geoLabel: 'g',
      },
    }))
    render(<SocialStatsDenseVirtualTable rows={rows} />)
    expect(screen.getByTestId('social-pr4-table-scroll')).toHaveAttribute('data-virtualized', 'true')
  })

  it('pie de metadatos accesible — snapshot estable', () => {
    const rows: QuantVizRow[] = [
      {
        kind: 'primary',
        indicatorId: 'a',
        label: 'Serie A',
        value: 1,
        unit: 'hab',
        availability: 'disponible_ambito_solicitado',
        meta: {
          geoLevel: 'municipio',
          vintageLabel: '2020',
          sourceId: 'INEGI_DEMO',
          geoLabel: 'X',
        },
      },
      {
        kind: 'derivative',
        derivativeId: 'ratio_x',
        label: 'Derivado bloqueado',
        value: null,
        unit: '—',
        outcome: {
          status: 'blocked',
          warning: 'Comparación bloqueada (Auditor): prueba PR4.',
        },
        meta: null,
      },
    ]
    const { container } = render(<SocialPr4MetadataFooter rows={rows} />)
    const footer = container.querySelector('[data-testid="social-pr4-metadata-footer"]')
    expect(footer).toBeTruthy()
    expect(footer).toMatchSnapshot()
  })
})
