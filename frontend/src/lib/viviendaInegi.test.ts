import { describe, expect, it } from 'vitest'
import {
  describeMaterialPriceReference,
  getInegiHousingDistribution,
  isInegiLiteralHousingType,
} from '@/lib/viviendaInegi'

describe('viviendaInegi', () => {
  it('devuelve hechos estatales INEGI sin inventar categorias de vivienda', () => {
    const distribution = getInegiHousingDistribution('QRO', ['qro', 'cor', 'mar', 'hui'])

    expect(distribution?.source).toMatch(/INEGI Censo 2020/)
    expect(distribution?.statePopulation2020).toBe(2368467)
    expect(distribution?.stateOccupiedDwellings2020).toBe(668487)
    expect(distribution?.stateAvgOccupants2020).toBe(3.5)
    expect(distribution?.categories).toEqual([])
    expect(isInegiLiteralHousingType('residencial')).toBe(false)
  })

  it('reporta empty cuando no hay distribucion municipal cargada', () => {
    expect(getInegiHousingDistribution('QRO', ['qro'])).toBeNull()
    expect(getInegiHousingDistribution('EXT', ['ext'])).toBeNull()
  })

  it('describe fuente documental de precio o escenario manual sin inventar ciudad', () => {
    expect(describeMaterialPriceReference('pet', 5.5)).toMatch(/Capitulo San Luis/)
    expect(describeMaterialPriceReference('pet', 5.5)).not.toMatch(/CDMX|QRO|MTY/)
    expect(describeMaterialPriceReference('pet', 12)).toMatch(/manual/)
    expect(describeMaterialPriceReference('vidrio', 1.3)).toMatch(/Ancla corregida/)
  })
})
