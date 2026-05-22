import { describe, expect, it } from 'vitest'
import {
  buildRecyclersKpiContract,
  computeCoberturaGiros,
  getRecicladorasForZm,
} from '@/lib/recicladorasCatalog'

const ZMS_SEED = ['SLP', 'MTY', 'QRO', 'GDL'] as const

describe('recicladorasCatalog', () => {
  for (const zm of ZMS_SEED) {
    it(`catálogo ${zm} no vacío con 5 giros`, () => {
      const list = getRecicladorasForZm(zm)
      expect(list.length).toBeGreaterThanOrEqual(5)
      const { pct, faltantes } = computeCoberturaGiros(list)
      expect(pct).toBe(100)
      expect(faltantes).toHaveLength(0)
    })
  }

  it('SLP no devuelve recicladoras de MTY', () => {
    const slp = getRecicladorasForZm('SLP')
    expect(slp.every(r => r.zm_simulator_id === 'SLP')).toBe(true)
    expect(slp.some(r => r.nombre.includes('Alpek'))).toBe(false)
  })

  it('MTY devuelve compradores distintos a SLP', () => {
    const mty = getRecicladorasForZm('MTY')
    expect(mty.some(r => r.nombre.includes('Alpek'))).toBe(true)
    expect(mty.some(r => r.nombre.includes('Eco-Oro'))).toBe(false)
  })

  it('buildRecyclersKpiContract publica KPI calculado', () => {
    const kpi = buildRecyclersKpiContract({ zmId: 'QRO', municipioId: 'qro' })
    expect(kpi.recicladoras_activas).toBeGreaterThanOrEqual(5)
    expect(kpi.cobertura_giros_pct).toBe(100)
    expect(kpi.distancia_promedio_km_ca_recicladora).toBeGreaterThan(0)
    expect(kpi.fuente).toBe('recicladoras_by_zm')
  })
})
