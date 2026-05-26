import { describe, expect, it } from 'vitest'
import { CHART_BRIEF_CATALOG } from '@/data/chartBriefCatalog'
import { buildDynamicQhcLead, qhcWordCount } from '@/lib/chartQhcDynamic'
import { useSimulatorStore } from '@/store/simulatorStore'
import { calcular } from '@/lib/calculator'

const FORBIDDEN = [/es importante destacar/i, /cabe mencionar/i, /asimismo/i, /obviamente/i]
const MAX_WORDS = 60

describe('chart QHC editorial compact', () => {
  it('catálogo estático: ≤60 palabras y sin frases prohibidas', () => {
    const violations: string[] = []
    for (const [id, brief] of Object.entries(CHART_BRIEF_CATALOG)) {
      const lead = brief.metodologia.como_se_calcula
      const n = qhcWordCount(lead)
      if (n > MAX_WORDS) violations.push(`${id}: ${n} palabras`)
      for (const f of FORBIDDEN) {
        if (f.test(lead)) violations.push(`${id}: frase prohibida`)
      }
      if (
        !/\b(revise|priorice|use|compare|valide|configure|ejecute|abra|negocie|presente|lea|vigile|recalibre|evite|fije|invierta|justifique|exporte|ancle|no|si)\b/i.test(
          lead,
        )
      ) {
        violations.push(`${id}: sin verbo de acción`)
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('QHC dinámico con escenario: cifras y ≤60 palabras (M01, M04, M13)', () => {
    const base = useSimulatorStore.getState()
    const state = { ...base, resultados: calcular(base) }
    const ids = [
      'trayectoria-captura',
      'volumen-rsu',
      'costo-omision-acumulado',
      'm13-monte-carlo-tir',
      'm13-tornado-vpn',
    ]
    for (const id of ids) {
      const lead = buildDynamicQhcLead(id, state)
      expect(lead, id).toBeTruthy()
      expect(qhcWordCount(lead!), id).toBeLessThanOrEqual(MAX_WORDS)
      expect(/\d/.test(lead!), `${id} sin cifra`).toBe(true)
    }
  })
})
