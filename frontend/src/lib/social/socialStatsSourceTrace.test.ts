import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  SOCIAL_STATS_BUNDLE_EMBEDDED,
  SOCIAL_STATS_SLICES_FILENAME,
} from '@/data/socialStats/embeddedBundle'
import {
  assertCapaSocialSlicesInBundleTraceable,
  SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS,
  validateCapaSocialSliceTrace,
} from '@/lib/social/socialStatsSourceTrace'
import type { OfficialStatSlice, SocialStatsBundle } from '@/types/socialOfficialStats'

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const publicFixture = path.join(frontendRoot, 'public/data/social-stats', SOCIAL_STATS_SLICES_FILENAME)

function readPublicFixture(): SocialStatsBundle {
  const raw = readFileSync(publicFixture, 'utf8')
  return JSON.parse(raw) as SocialStatsBundle
}

describe('socialStatsSourceTrace (capa social)', () => {
  it('bundle embebido cumple trazabilidad para indicadores públicos', () => {
    expect(() => assertCapaSocialSlicesInBundleTraceable(SOCIAL_STATS_BUNDLE_EMBEDDED)).not.toThrow()
  })

  it(`fixture público ${SOCIAL_STATS_SLICES_FILENAME} mantiene geoLevel, vintageLabel y tab/hint`, () => {
    const bundle = readPublicFixture()
    expect(() => assertCapaSocialSlicesInBundleTraceable(bundle)).not.toThrow()
  })

  it('falla validación si un indicador público pierde geoLevel o vintageLabel (regresión)', () => {
    const base = SOCIAL_STATS_BUNDLE_EMBEDDED.slices.find(
      (s) => s.indicatorId === 'dem_pob_ref_mun' && s.geoCode === '24028',
    )!
    const sinVintage: SocialStatsBundle = {
      buildId: 'test',
      slices: [{ ...base, vintageLabel: '   ' }],
    }
    expect(() => assertCapaSocialSlicesInBundleTraceable(sinVintage)).toThrow(/vintageLabel/)

    const sinGeo = { ...base, geoLevel: '' } as unknown as OfficialStatSlice
    const sinGeoBundle: SocialStatsBundle = { buildId: 'test', slices: [sinGeo] }
    expect(() => assertCapaSocialSlicesInBundleTraceable(sinGeoBundle)).toThrow(/geoLevel/)
  })

  it('cada id en SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS aparece al menos una vez en el fixture', () => {
    const bundle = readPublicFixture()
    const ids = new Set(bundle.slices.map((s) => s.indicatorId))
    for (const id of SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS) {
      expect(ids.has(id), `falta indicatorId ${id} en fixture`).toBe(true)
    }
  })

  it('validateCapaSocialSliceTrace detecta falta de tab e hint', () => {
    const base = SOCIAL_STATS_BUNDLE_EMBEDDED.slices[0]!
    const bad: OfficialStatSlice = {
      ...base,
      sourceSpreadsheetTab: undefined,
      excelRowHint: undefined,
    }
    expect(validateCapaSocialSliceTrace(bad)).toContain('sourceSpreadsheetTab|excelRowHint')
  })
})
