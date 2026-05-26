/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Conclusion } from '@/components/editorial/Conclusion'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

vi.mock('@/store/simulatorStore', () => ({
  useSimulatorStore: (selector: (s: { zmActiva: string; municipiosActivos: string[] }) => unknown) =>
    selector({ zmActiva: 'SLP', municipiosActivos: ['slp'] }),
}))

describe('editorial components', () => {
  it('Conclusion renders without card classes', () => {
    const { container } = render(<Conclusion>El escenario aguanta ante Cabildo.</Conclusion>)
    expect(screen.getByText(/El escenario aguanta/)).toBeTruthy()
    expect(container.querySelector('[class*="rounded-[14px]"]')).toBeNull()
  })

  it('AnchorFigure shows figure and context', () => {
    render(<AnchorFigure figure="18.2%" context="TIR del proyecto" />)
    expect(screen.getByText('18.2%')).toBeTruthy()
    expect(screen.getByText('TIR del proyecto')).toBeTruthy()
  })

  it('KpiAnchorGrid maps items', () => {
    render(
      <KpiAnchorGrid
        items={[
          { label: 'VPN', value: '$756M' },
          { label: 'TIR', value: '18%' },
        ]}
        columns={2}
      />,
    )
    expect(screen.getByText('$756M')).toBeTruthy()
    expect(screen.getByText('VPN')).toBeTruthy()
  })
})

describe('NarrativeBridge editorial layout', () => {
  it('renders summary without colored bridge background', () => {
    const { container } = render(
      <NarrativeBridge
        summary="Con TIR 18% el caso central aguanta."
        evidence={[{ label: 'TIR', value: '18%' }]}
      />,
    )
    expect(screen.getByText(/Con TIR 18%/)).toBeTruthy()
    expect(container.querySelector('.bg-\\[\\#F1F6E5\\]')).toBeNull()
    expect(container.querySelector('.bg-amber-50')).toBeNull()
  })
})
