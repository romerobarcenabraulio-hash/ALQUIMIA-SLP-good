import { describe, expect, it } from 'vitest'
import { moduleSubtitle, moduleTitle } from './moduleTitles'

describe('moduleTitles', () => {
  it('uses human titles for Prompt 4B pillar modules', () => {
    expect(moduleTitle('city_baseline', 'M01')).toBe('Diagnóstico de residuos sólidos')
    expect(moduleTitle('marco_legal', 'M03B')).toBe('Marco legal y reglamento')
    expect(moduleTitle('costo_omision', 'M04')).toBe('Costo de no actuar')
    expect(moduleTitle('escenarios_financieros', 'M13')).toBe('Escenarios financieros')
    expect(moduleTitle('riesgos_modelo', 'M14')).toBe('Riesgos de implementación')
    expect(moduleTitle('expediente_cabildo', 'M15')).toBe('Expediente documental')
  })

  it('keeps module codes as subtitles instead of principal titles', () => {
    expect(moduleSubtitle('city_baseline')).toContain('M01')
    expect(moduleSubtitle('marco_legal')).toContain('M03B')
  })
})
