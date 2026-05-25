import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  monteCarloTriangularSamples,
  MONTE_CARLO_SPEC,
  perturbStateMonteCarlo,
  tornadoAnalysis,
} from '@/lib/calculator'
import { useSimulatorStore } from '@/store/simulatorStore'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('integridad de simulación (Supreme / PD&SA)', () => {
  it('M13 escenarios_financieros no usa Monte Carlo ni tornado hardcodeados', () => {
    const src = readFrontend('src/components/simulator/stacks/ScenariosExportStack.tsx')

    expect(src).not.toContain('TORNADO_VARS')
    expect(src).not.toContain('distribución triangular aprox')
    expect(src).not.toContain('~500 iteraciones')
    expect(src).toContain('MonteCarloVpnChart')
    expect(src).toContain("from '@/components/charts/TornadoChart'")
    expect(readFrontend('src/components/charts/MonteCarloVpnChart.tsx')).toContain('useLiveMonteCarlo')
  })

  it('monteCarloTriangularSamples devuelve el arreglo completo de muestras TIR', () => {
    const state = useSimulatorStore.getState()
    const samples = monteCarloTriangularSamples(state, 100, 'tir')
    expect(samples).toHaveLength(100)
    expect(samples[0]).toBeLessThanOrEqual(samples[samples.length - 1]!)
  })

  it('monteCarloTriangularSamples produce VPN y TIR ordenados', () => {
    const state = useSimulatorStore.getState()
    const vpn = monteCarloTriangularSamples(state, 50, 'vpn')
    const tir = monteCarloTriangularSamples(state, 50, 'tir')
    expect(vpn).toHaveLength(50)
    expect(tir).toHaveLength(50)
    for (let i = 1; i < vpn.length; i++) {
      expect(vpn[i]!).toBeGreaterThanOrEqual(vpn[i - 1]!)
    }
  })

  it('perturbStateMonteCarlo altera el estado sin romper calcular()', () => {
    const state = useSimulatorStore.getState()
    const perturbed = perturbStateMonteCarlo(state)
    expect(perturbed).not.toBe(state)
    expect(() => monteCarloTriangularSamples(perturbed, 5)).not.toThrow()
  })

  it('tornadoAnalysis recalcula VPN por variable OAT ±20%', () => {
    const state = useSimulatorStore.getState()
    const rows = tornadoAnalysis(state)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveProperty('plus')
    expect(rows[0]).toHaveProperty('minus')
    expect(rows[0]).toHaveProperty('range')
  })

  it('MONTE_CARLO_SPEC documenta 2000 iteraciones por defecto', () => {
    expect(MONTE_CARLO_SPEC.iterationsDefault).toBe(2000)
    expect(MONTE_CARLO_SPEC.variables.length).toBeGreaterThanOrEqual(3)
  })

  it('charts compartidos usan hook de cómputo en vivo', () => {
    const mcTir = readFrontend('src/components/charts/MonteCarloChart.tsx')
    const mcVpn = readFrontend('src/components/charts/MonteCarloVpnChart.tsx')
    expect(mcTir).toContain('useLiveMonteCarlo')
    expect(mcVpn).toContain('useLiveMonteCarlo')
    expect(mcTir).toContain('SimulationComputeTrace')
    expect(mcVpn).toContain('SimulationComputeTrace')
  })
})
