import { describe, expect, it } from 'vitest'
import { calcular } from '@/lib/calculator'
import { getProgramPopulationShare } from '@/lib/zmPopulationScale'
import { SIMULATOR_STATE_DEFAULT } from '@/store/simulatorStore'

describe('Q-024 · ámbito municipal vs ZM', () => {
  it('Soledad sola produce menos t/día RSU que la ZM SLP completa', () => {
    const base = { ...SIMULATOR_STATE_DEFAULT, zmActiva: 'SLP' }
    const full = calcular({
      ...base,
      municipiosActivos: ['slp', 'sol', 'csp', 'vip'],
    })
    const solOnly = calcular({
      ...base,
      municipiosActivos: ['sol'],
    })
    expect(solOnly.rsuTotalTonDia).toBeLessThan(full.rsuTotalTonDia)
    expect(solOnly.pobActiva).toBeLessThan(full.pobActiva)
  })

  it('participación poblacional Soledad / total ZM (constants)', () => {
    expect(getProgramPopulationShare('SLP', ['sol'])).toBeCloseTo(323409 / 1243980, 5)
  })
})
