import { describe, expect, it } from 'vitest'
import {
  describeMaterialPriceReference,
  getInegiHousingDistribution,
  isInegiLiteralHousingType,
} from '@/lib/viviendaInegi'

describe('viviendaInegi', () => {
  it('devuelve solo categorias literales INEGI cargadas', () => {
    const distribution = getInegiHousingDistribution('QRO', ['qro'])

    expect(distribution?.source).toMatch(/INEGI Censo 2020/)
    expect(distribution?.categories.map(c => c.label)).toEqual([
      'Casa independiente',
      'Departamento en edificio',
    ])
    expect(distribution?.categories.map(c => c.operationalType)).toEqual(['casa', 'vertical'])
    expect(isInegiLiteralHousingType('residencial')).toBe(false)
  })

  it('reporta empty cuando no hay distribucion cargada', () => {
    expect(getInegiHousingDistribution('EXT', ['ext'])).toBeNull()
  })

  it('describe fuente documental de precio o escenario manual sin inventar ciudad', () => {
    expect(describeMaterialPriceReference('pet', 5.5)).toMatch(/Capitulo San Luis/)
    expect(describeMaterialPriceReference('pet', 5.5)).not.toMatch(/CDMX|QRO|MTY/)
    expect(describeMaterialPriceReference('pet', 12)).toMatch(/manual/)
  })
})
