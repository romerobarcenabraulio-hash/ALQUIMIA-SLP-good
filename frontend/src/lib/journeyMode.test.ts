import { describe, expect, it } from 'vitest'
import {
  IMPLEMENTAR_MODULE_IDS,
  VALIDAR_MODULE_IDS,
  countJourneyModeModules,
  filterModuleIdsForJourneyMode,
  isModuleVisibleInJourneyMode,
  unclassifiedFunctionaryModules,
} from '@/lib/journeyMode'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

describe('journeyMode', () => {
  it('clasifica todos los módulos funcionarios (excepto guía)', () => {
    expect(unclassifiedFunctionaryModules()).toEqual([])
  })

  it('modo validar incluye Cap. 1 y Cap. 3', () => {
    expect(VALIDAR_MODULE_IDS).toContain('antecedentes_municipales')
    expect(VALIDAR_MODULE_IDS).toContain('city_baseline')
    expect(VALIDAR_MODULE_IDS).toContain('expediente_cabildo')
    expect(VALIDAR_MODULE_IDS).not.toContain('roadmap_implementacion')
    expect(VALIDAR_MODULE_IDS).not.toContain('inspeccion')
  })

  it('modo implementar incluye Cap. 2, Cap. 4 y puentes', () => {
    expect(IMPLEMENTAR_MODULE_IDS).toContain('antecedentes_municipales')
    expect(IMPLEMENTAR_MODULE_IDS).toContain('roadmap_implementacion')
    expect(IMPLEMENTAR_MODULE_IDS).toContain('gate_status')
    expect(IMPLEMENTAR_MODULE_IDS).toContain('marco_legal')
    expect(IMPLEMENTAR_MODULE_IDS).not.toContain('social_encuesta')
    expect(IMPLEMENTAR_MODULE_IDS).not.toContain('expediente_cabildo')
  })

  it('M00 siempre visible', () => {
    expect(isModuleVisibleInJourneyMode('guia_circularidad', 'validar')).toBe(true)
    expect(isModuleVisibleInJourneyMode('guia_circularidad', 'implementar')).toBe(true)
  })

  it('filtra preservando orden del journey', () => {
    const filtered = filterModuleIdsForJourneyMode(FUNCTIONARY_MODULE_ORDER, 'validar')
    const idxBaseline = filtered.indexOf('city_baseline')
    const idxExpediente = filtered.indexOf('expediente_cabildo')
    expect(idxBaseline).toBeGreaterThanOrEqual(0)
    expect(idxExpediente).toBeGreaterThan(idxBaseline)
    expect(filtered).not.toContain('logistica')
  })

  it('conteo de módulos por modo', () => {
    expect(countJourneyModeModules('validar')).toBe(VALIDAR_MODULE_IDS.length + 1)
    expect(countJourneyModeModules('implementar')).toBe(IMPLEMENTAR_MODULE_IDS.length + 1)
  })
})
