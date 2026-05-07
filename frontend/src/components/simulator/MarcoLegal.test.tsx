/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MarcoLegal } from '@/components/simulator/MarcoLegal'
import { ReglamentoFuenteProvider } from '@/components/reglamento/ReglamentoModal'
import { useSimulatorStore } from '@/store/simulatorStore'

function withReglamento(ui: ReactElement) {
  return <ReglamentoFuenteProvider>{ui}</ReglamentoFuenteProvider>
}

describe('MarcoLegal · P2-5 objetivos institucionales', () => {
  beforeEach(() => {
    useSimulatorStore.setState({
      zmActiva: 'MTY',
      municipiosActivos: ['spg'],
      agoraLegalBloqueado: true,
    })
  })

  it('vista ciudadana — snapshot', () => {
    const { container } = render(withReglamento(<MarcoLegal mode="citizen" />))
    expect(container.firstChild).toMatchSnapshot()
  })

  it('vista funcionario — snapshot', () => {
    const { container } = render(withReglamento(<MarcoLegal mode="functionary" />))
    expect(container.firstChild).toMatchSnapshot()
  })

  it('no expone copy de gates operativos retirados', () => {
    const { container: c1 } = render(withReglamento(<MarcoLegal mode="citizen" />))
    const { container: c2 } = render(withReglamento(<MarcoLegal mode="functionary" />))
    const t = `${c1.textContent ?? ''}\n${c2.textContent ?? ''}`
    expect(t).not.toMatch(/BLOQUEANTE/)
    expect(t).not.toMatch(/★/)
    expect(t).not.toMatch(/Adenda al contrato/)
    expect(t).toMatch(/Reforma reglamentaria aprobada/)
  })
})
