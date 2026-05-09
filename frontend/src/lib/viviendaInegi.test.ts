import { describe, expect, it } from 'vitest'
import {
  describeMaterialPriceReference,
  getInegiHousingDistribution,
  getOperationalHousingSegments,
  isInegiLiteralHousingType,
} from '@/lib/viviendaInegi'

describe('viviendaInegi', () => {
  it('devuelve hechos estatales INEGI sin inventar categorias de vivienda', () => {
    const distribution = getInegiHousingDistribution('QRO', ['qro', 'cor', 'mar', 'hui'])

    expect(distribution?.source).toMatch(/INEGI Censo 2020/)
    expect(distribution?.statePopulation2020).toBe(2368467)
    expect(distribution?.stateOccupiedDwellings2020).toBe(668487)
    expect(distribution?.stateAvgOccupants2020).toBe(3.5)
    expect(distribution?.entityCode).toBe('22')
    expect(distribution?.blocker).toMatch(/casa\/departamento por municipio/i)
    expect(distribution?.nextAction).toMatch(/tabulado municipal/i)
    expect(distribution?.categories).toEqual([])
    expect(isInegiLiteralHousingType('residencial')).toBe(false)
  })

  it('separa pesos operativos de porcentajes oficiales INEGI', () => {
    const segments = getOperationalHousingSegments('SLP', ['vertical', 'casa'])

    expect(segments).toHaveLength(2)
    expect(segments.every(segment => segment.isInegiOfficialPct === false)).toBe(true)
    expect(segments.map(segment => segment.label)).toContain('Casa independiente')
    expect(segments[0].helper).toMatch(/no es porcentaje oficial INEGI/i)
  })

  it('reporta empty cuando no hay distribucion municipal cargada', () => {
    expect(getInegiHousingDistribution('QRO', ['qro'])).toBeNull()
    expect(getInegiHousingDistribution('EXT', ['ext'])).toBeNull()
  })

  it('describe fuente documental de precio o escenario manual sin inventar ciudad', () => {
    expect(describeMaterialPriceReference('pet', 5.5)).toMatch(/Investigacion_Precios_RSU_SLP/)
    expect(describeMaterialPriceReference('pet', 5.5)).not.toMatch(/CDMX|QRO|MTY/)
    expect(describeMaterialPriceReference('pet', 12)).toMatch(/manual/)
    expect(describeMaterialPriceReference('vidrio', 1.3)).toMatch(/Ancla corregida/)
  })
})
