import { describe, expect, it } from 'vitest'
import { resolveOfficialStat } from '@/lib/social/socialStatsResolve'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'

const bundle: SocialStatsBundle = {
  buildId: 'test',
  slices: [
    {
      indicatorId: 'x',
      label: 'Municipio',
      value: 1,
      unit: 'u',
      geoLevel: 'municipio',
      geoCode: '14039',
      geoLabel: 'Mun',
      vintageLabel: 'v',
      sourceId: 's',
    },
    {
      indicatorId: 'x',
      label: 'Entidad',
      value: 2,
      unit: 'u',
      geoLevel: 'entidad_federativa',
      geoCode: '14',
      geoLabel: 'Jalisco',
      vintageLabel: 'v',
      sourceId: 's',
    },
    {
      indicatorId: 'x',
      label: 'ZM',
      value: 3,
      unit: 'u',
      geoLevel: 'zm_estadistica',
      geoCode: 'MTY',
      geoLabel: 'ZM MTY',
      vintageLabel: 'v',
      sourceId: 's',
    },
  ],
}

describe('resolveOfficialStat', () => {
  it('prioriza municipio cuando coincide CVE', () => {
    const r = resolveOfficialStat(bundle, 'x', { municipioCve: '14039', zmSimulatorId: 'MTY' })
    expect(r.availability).toBe('disponible_ambito_solicitado')
    expect(r.slice?.value).toBe(1)
    expect(r.slice?.geoLevel).toBe('municipio')
  })

  it('sin fila municipal pero con entidad derivada del CVE → disponible_otro_ambito', () => {
    const r = resolveOfficialStat(bundle, 'x', { municipioCve: '14120', zmSimulatorId: null })
    expect(r.availability).toBe('disponible_otro_ambito')
    expect(r.slice?.geoLevel).toBe('entidad_federativa')
    expect(r.slice?.value).toBe(2)
  })

  it('sin municipio ni entidad pero con ZM → disponible_otro_ambito', () => {
    const b: SocialStatsBundle = {
      buildId: 'z',
      slices: bundle.slices.filter(s => s.geoLevel === 'zm_estadistica'),
    }
    const r = resolveOfficialStat(b, 'x', { municipioCve: null, zmSimulatorId: 'MTY' })
    expect(r.availability).toBe('disponible_otro_ambito')
    expect(r.slice?.value).toBe(3)
  })

  it('no_disponible cuando no hay coincidencia', () => {
    const r = resolveOfficialStat(bundle, 'x', { municipioCve: '99999', zmSimulatorId: 'XXX' })
    expect(r.availability).toBe('no_disponible')
    expect(r.slice).toBeNull()
  })
})
