import { describe, expect, it } from 'vitest'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'
import type { CircularityBaseline } from '@/types'

function baseLine(cityId: string): CircularityBaseline {
  return {
    city_id: cityId,
    city_name: 'Test',
    rsu_scope: 'rsu_municipal',
    current_circularity_pct: 5,
    material_recovery_ton_day_est: 1,
    rsu_total_ton_day_est: 100,
    confidence: 0.5,
    uncertainty_pct_points: 2,
    provenance: {
      tipo: 'estimado',
      fuente_nombre: 'X',
      fuente_organismo: 'Y',
      fuente_url: null,
      fecha_dato: '2026-01-01',
      fecha_consulta: '2026-01-01',
      confianza: 0.5,
      advertencia: null,
      requiere_clave_api: false,
    },
    warnings: [],
    interpretation: 't',
    official_status: 'estimated_not_official',
  }
}

describe('isCircularityBaselineReadyForUi', () => {
  it('acepta city_id y zmActiva en distinto casing', () => {
    expect(isCircularityBaselineReadyForUi(baseLine('slp'), 'SLP')).toBe(true)
    expect(isCircularityBaselineReadyForUi(baseLine('SLP'), 'slp')).toBe(true)
  })

  it('rechaza otra ciudad', () => {
    expect(isCircularityBaselineReadyForUi(baseLine('MTY'), 'SLP')).toBe(false)
  })
})
