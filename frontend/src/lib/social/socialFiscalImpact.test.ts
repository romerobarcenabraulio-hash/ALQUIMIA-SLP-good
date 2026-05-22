import { describe, expect, it } from 'vitest'
import type { ResultadosCalculados } from '@/types'
import { computeSocialFiscalImpact, entidadFromZmEstado } from '@/lib/social/socialFiscalImpact'

function resultadosStub(overrides: Partial<ResultadosCalculados> = {}): ResultadosCalculados {
  return {
    empleosTotalesDirectos: 40,
    empleosIndirectos: 20,
    ingresosMunicipioFiscal: 1_200_000,
    ingresosMunicipioOperativo: 800_000,
    ahorroSalud: 500_000,
    capexTotal: 10_000_000,
    ...overrides,
  } as ResultadosCalculados
}

describe('computeSocialFiscalImpact', () => {
  it('calcula empleos efectivos y cap de salida de pobreza', () => {
    const r = computeSocialFiscalImpact({
      resultados: resultadosStub(),
      estado: 'San Luis Potosí',
      municipioGeoCode: '24028',
      escenario: 'base',
    })

    expect(r.empleosDirectos).toBe(40)
    expect(r.empleosIndirectos).toBe(20)
    expect(r.empleosEfectivos).toBe(52)
    expect(r.personasBeneficiadas).toBeGreaterThan(0)
    expect(r.personasSalidaPobreza).toBeLessThanOrEqual(r.personasBeneficiadas)
    expect(r.reduccionPobrezaMunPp).toBeGreaterThanOrEqual(0)
  })

  it('construye waterfall con cuatro canales y alivio total', () => {
    const r = computeSocialFiscalImpact({
      resultados: resultadosStub(),
      estado: 'Nuevo León',
      escenario: 'base',
    })

    expect(r.waterfall).toHaveLength(4)
    expect(r.waterfall.map(c => c.id)).toEqual(['isn', 'salud', 'rescate', 'deuda_verde'])
    expect(r.alivioFiscalAnualMxn).toBe(
      r.waterfall.reduce((s, c) => s + c.montoAnualMxn, 0),
    )
  })

  it('escenario conservador reduce formalización y rescate vs optimista', () => {
    const input = {
      resultados: resultadosStub(),
      estado: 'San Luis Potosí',
      municipioGeoCode: '24028',
    }
    const conservador = computeSocialFiscalImpact({ ...input, escenario: 'conservador' })
    const optimista = computeSocialFiscalImpact({ ...input, escenario: 'optimista' })

    expect(conservador.personasBeneficiadas).toBeLessThan(optimista.personasBeneficiadas)
    const rescateCons = conservador.waterfall.find(c => c.id === 'rescate')!.montoAnualMxn
    const rescateOpt = optimista.waterfall.find(c => c.id === 'rescate')!.montoAnualMxn
    expect(rescateCons).toBeLessThan(rescateOpt)
  })

  it('advierte cuando falta municipio para reducción municipal', () => {
    const r = computeSocialFiscalImpact({
      resultados: resultadosStub(),
      estado: 'Querétaro',
    })
    expect(r.scopeWarning).toContain('municipal')
  })

  it('entidadFromZmEstado cae a SLP si el estado no está catalogado', () => {
    expect(entidadFromZmEstado('San Luis Potosí')).toBe('San Luis Potosí')
    expect(entidadFromZmEstado('desconocido')).toBe('San Luis Potosí')
  })
})
