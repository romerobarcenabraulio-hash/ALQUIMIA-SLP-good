import { describe, expect, it } from 'vitest'
import { calcular } from '@/lib/calculator'
import { ZMS } from '@/lib/constants'
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
    const zm = ZMS.find(z => z.id === 'SLP')
    const sol = zm?.municipios.find(m => m.id === 'sol')
    expect(zm).toBeTruthy()
    expect(sol).toBeTruthy()
    expect(getProgramPopulationShare('SLP', ['sol'])).toBeCloseTo(sol!.pop / zm!.totalPop, 5)
  })
})
