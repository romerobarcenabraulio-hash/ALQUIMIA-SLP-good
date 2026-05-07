import { describe, expect, it } from 'vitest'
import {
  buildDespliegueOperativoSeries,
  empleosCaDesdeMix,
  empleoFormalDirectoCierre,
  fasesDespliegueVisibles,
} from '@/lib/despliegueOperativoSeries'

describe('despliegueOperativoSeries', () => {
  it('empleosCaDesdeMix interpreta mix §2.4', () => {
    expect(empleosCaDesdeMix('3P+0M+0G')).toBe(3 * 5)
    expect(empleosCaDesdeMix('5P+1M+0G')).toBe(5 * 5 + 14)
  })

  it('Acelerado muestra más fases que Conservador para mismo horizonte', () => {
    const h = 4
    expect(fasesDespliegueVisibles(h, 'Acelerado')).toBeGreaterThan(
      fasesDespliegueVisibles(h, 'Conservador'),
    )
  })

  it('serie acumula CA y tiene cierre con empleo', () => {
    const s = buildDespliegueOperativoSeries(5, 'Realista')
    expect(s.length).toBeGreaterThan(0)
    expect(s[s.length - 1].caAcumulados).toBeGreaterThanOrEqual(s[0].caAcumulados)
    expect(empleoFormalDirectoCierre(s)).toBeGreaterThan(80)
  })
})
