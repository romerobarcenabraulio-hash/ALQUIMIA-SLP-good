import { describe, expect, it } from 'vitest'
import { evaluateWhitelistedRatio } from '@/lib/social/socialStatsDerivatives'
import { PR4_AUDITOR_RATIO_WHITELIST } from '@/lib/social/pr4DerivativeWhitelist'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'

const rule = PR4_AUDITOR_RATIO_WHITELIST[0]!

const baseSlice = {
  label: 'x',
  unit: 'habitantes',
  geoLevel: 'municipio' as const,
  geoCode: '24028',
  geoLabel: 'Mun',
  vintageLabel: '2020 · demo estática',
  sourceId: 'demo_bundle_pr3',
}

function bundleWithSlices(
  a: { indicatorId: string; value: number; vintage?: string },
  b: { indicatorId: string; value: number; vintage?: string },
): SocialStatsBundle {
  return {
    buildId: 'b',
    slices: [
      {
        ...baseSlice,
        indicatorId: a.indicatorId,
        value: a.value,
        vintageLabel: a.vintage ?? baseSlice.vintageLabel,
      },
      {
        ...baseSlice,
        indicatorId: b.indicatorId,
        value: b.value,
        vintageLabel: b.vintage ?? baseSlice.vintageLabel,
      },
    ],
  }
}

describe('PR4 derivados lista blanca', () => {
  it('caso homogéneo válido: ratio con misma unidad, geo y vintage', () => {
    const bundle = bundleWithSlices(
      { indicatorId: rule.numeratorIndicatorId, value: 450_000 },
      { indicatorId: rule.denominatorIndicatorId, value: 900_000 },
    )
    const out = evaluateWhitelistedRatio(bundle, { municipioCve: '24028', zmSimulatorId: 'SLP' }, rule)
    expect(out.status).toBe('ok')
    if (out.status === 'ok') {
      expect(out.value).toBeCloseTo(0.5, 5)
      expect(out.meta.geoLevel).toBe('municipio')
      expect(out.meta.sourceId).toContain('demo_bundle_pr3')
    }
  })

  it('comparación bloqueada: vintage distinto entre series homogéneas en nominador/denominador', () => {
    const bundle = bundleWithSlices(
      { indicatorId: rule.numeratorIndicatorId, value: 100, vintage: '2020 · demo estática' },
      { indicatorId: rule.denominatorIndicatorId, value: 200, vintage: '2021 · otra cohorte' },
    )
    const out = evaluateWhitelistedRatio(bundle, { municipioCve: '24028', zmSimulatorId: null }, rule)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') {
      expect(out.warning).toMatch(/Comparación bloqueada/)
    }
  })
})
