/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  buildOfficialNumericVisualizationFooter,
  formatOfficialStatValueForDisplay,
  OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER,
} from '@/lib/social/aggregatedKpiCopy'

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

describe('aggregatedKpiCopy', () => {
  it('disclaimer pre-numérico es breve y ancla no dictamen', () => {
    expect(OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER).toMatch(/no dictamen/)
    expect(OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER.length).toBeLessThan(220)
  })

  it('pie numérico no supera 45 palabras (casos típicos)', () => {
    const a = buildOfficialNumericVisualizationFooter({
      unit: 'habitantes',
      geoLabel: 'San Luis Potosí, SLP · municipio 24028',
      geoLevel: 'municipio',
      geoCode: '24028',
      vintageLabel: '2020 · demo estática',
    })
    expect(wordCount(a)).toBeLessThanOrEqual(45)

    const b = buildOfficialNumericVisualizationFooter({
      unit: 'habitantes',
      geoLabel: 'X'.repeat(200),
      geoLevel: 'zm_estadistica',
      geoCode: 'MTY',
      vintageLabel: '2020 · corte largo de demostración para prueba de pie de tarjeta estadística',
    })
    expect(wordCount(b)).toBeLessThanOrEqual(45)
  })

  it('habitantes sin decimales artificiales', () => {
    const r = formatOfficialStatValueForDisplay({
      value: 912_871.0,
      unit: 'habitantes',
      caveat: 'Valor ilustrativo',
    })
    expect(r.display).toMatch(/912[,\u00A0]871/)
    expect(r.display).not.toMatch(/\.[0-9]/)
    expect(r.precisionNote).toBeTruthy()
  })

  it('años enteros sin nota si no hay caveat de incertidumbre', () => {
    const r = formatOfficialStatValueForDisplay({ value: 32, unit: 'años' })
    expect(r.display).toBe('32')
    expect(r.precisionNote).toBeNull()
  })
})
