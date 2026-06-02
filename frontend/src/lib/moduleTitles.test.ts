import { describe, expect, it } from 'vitest'
import { moduleSubtitle, moduleTitle } from './moduleTitles'

describe('moduleTitles', () => {
  it('uses consulting titles for the operational module index', () => {
    expect(moduleTitle('guia_circularidad', 'M00')).toBe('Cómo leer la consultoría')
    expect(moduleTitle('city_baseline', 'M01')).toBe('Línea base RSU')
    expect(moduleTitle('social_diagnostico', 'M02')).toBe('Mapa social y privado urbano')
    expect(moduleTitle('marco_legal', 'M03B')).toBe('Marco legal municipal')
    expect(moduleTitle('costo_omision', 'M04')).toBe('Costo de no actuar')
    expect(moduleTitle('roadmap_implementacion', 'M05')).toBe('Hoja de ruta')
    expect(moduleTitle('mercado_materiales', 'M10')).toBe('Mercado de materiales')
    expect(moduleTitle('esquema_concesion', 'M11')).toBe('Modelo operativo y concesión')
    expect(moduleTitle('arbol_financiamiento', 'M12')).toBe('Árbol de financiamiento')
    expect(moduleTitle('escenarios_financieros', 'M13')).toBe('Escenarios financieros')
    expect(moduleTitle('riesgos_modelo', 'M14')).toBe('Riesgos de implementación')
    expect(moduleTitle('expediente_cabildo', 'M15')).toBe('Expediente documental')
    expect(moduleTitle('monitoreo_operativo', 'M17')).toBe('Monitoreo proyectado vs real')
    expect(moduleTitle('trazabilidad', 'M19')).toBe('Trazabilidad de evidencia')
  })

  it('keeps module codes as subtitles instead of principal titles', () => {
    expect(moduleSubtitle('city_baseline')).toContain('M01')
    expect(moduleSubtitle('marco_legal')).toContain('M03B')
    expect(moduleSubtitle('roadmap_implementacion')).toContain('M05')
    expect(moduleSubtitle('roadmap_implementacion')).not.toContain('M05D')
  })
})
