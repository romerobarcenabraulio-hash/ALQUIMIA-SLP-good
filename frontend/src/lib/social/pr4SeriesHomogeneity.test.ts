import { describe, expect, it } from 'vitest'
import type { QuantVizRow } from '@/lib/social/socialStatsQuantRows'
import { analyzePr4TerritorialMix } from '@/lib/social/pr4SeriesHomogeneity'

describe('PR4 homogeneidad territorial (Navigator)', () => {
  it('marca mezcla cuando dos primarias tienen distinto geoLevel', () => {
    const rows: QuantVizRow[] = [
      {
        kind: 'primary',
        indicatorId: 'a',
        label: 'A',
        value: 1,
        unit: 'hab',
        availability: 'disponible_ambito_solicitado',
        meta: {
          geoLevel: 'municipio',
          vintageLabel: '2020',
          sourceId: 'x',
          geoLabel: 'Mun',
          geoCode: '24028',
        },
      },
      {
        kind: 'primary',
        indicatorId: 'b',
        label: 'B',
        value: 2,
        unit: 'hab',
        availability: 'disponible_ambito_solicitado',
        meta: {
          geoLevel: 'zm_estadistica',
          vintageLabel: '2020',
          sourceId: 'x',
          geoLabel: 'ZM',
          geoCode: 'MTY',
        },
      },
    ]
    const a = analyzePr4TerritorialMix(rows)
    expect(a.hasMixedTabulationFrames).toBe(true)
    expect(a.distinctKeys).toBe(2)
  })

  it('no marca mezcla con una sola primaria con valor', () => {
    const rows: QuantVizRow[] = [
      {
        kind: 'primary',
        indicatorId: 'a',
        label: 'A',
        value: 1,
        unit: 'hab',
        availability: 'disponible_ambito_solicitado',
        meta: {
          geoLevel: 'municipio',
          vintageLabel: '2020',
          sourceId: 'x',
          geoLabel: 'Mun',
          geoCode: '24028',
        },
      },
    ]
    expect(analyzePr4TerritorialMix(rows).hasMixedTabulationFrames).toBe(false)
  })
})
