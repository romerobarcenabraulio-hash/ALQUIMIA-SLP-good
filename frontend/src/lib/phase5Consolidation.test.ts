import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { FUNCTIONARY_MODULE_ORDER, resolveModuleId } from '@/lib/chapterConfig'
import { RESULTADOS_SURFACE_REGISTRY } from '@/lib/simulator/variableSurfaceRegistry'

const absorbed = [
  'social_encuesta',
  'mapeo_actores',
  'organigrama_diagnostico',
  'cobertura_territorial',
  'dictamen_tecnico',
  'evaluacion_socioeconomica',
  'teoria_cambio',
  'plan_maestro',
  'ruta_critica',
  'oleadas_territoriales',
  'plan_educativo',
  'conciliacion_mensual',
  'gate_status',
] as const

describe('Fase 5 consolidacion de modulos', () => {
  it('expone 23 modulos funcionario, preservando M00 como guia', () => {
    expect(FUNCTIONARY_MODULE_ORDER).toHaveLength(23)
    expect(AUDIENCE_MODULES.functionary).toHaveLength(24)
    for (const moduleId of absorbed) {
      expect(FUNCTIONARY_MODULE_ORDER).not.toContain(moduleId)
    }
  })

  it('mantiene aliases legacy hacia modulos consolidados', () => {
    expect(resolveModuleId('social_encuesta')).toBe('social_diagnostico')
    expect(resolveModuleId('dictamen_tecnico')).toBe('capacidad_institucional')
    expect(resolveModuleId('teoria_cambio')).toBe('costo_omision')
    expect(resolveModuleId('ruta_critica')).toBe('roadmap_implementacion')
    expect(resolveModuleId('plan_educativo')).toBe('logistica')
    expect(resolveModuleId('conciliacion_mensual')).toBe('evm_dashboard')
    expect(resolveModuleId('gate_status')).toBe('risk_dashboard')
  })

  it('capability_registry retira IDs duplicados y declara tabs internos', () => {
    const registry = JSON.parse(readFileSync('../docs/architecture/capability_registry.json', 'utf8'))
    const moduleIds = registry.modules.map((module: { module_id: string }) => module.module_id)
    expect(moduleIds).toHaveLength(24)
    for (const moduleId of absorbed) {
      expect(moduleIds).not.toContain(moduleId)
    }
    expect(registry.phase5_consolidation.legacy_code_preserved).toBe(true)
    expect(registry.modules.find((module: { module_id: string }) => module.module_id === 'social_diagnostico').internal_tabs).toEqual([
      'Demografía',
      'Encuesta',
      'Actores',
      'Autoridad',
    ])
  })

  it('no deja cifras calculadas apuntando a modulos absorbidos', () => {
    const visibleModuleIds = new Set(FUNCTIONARY_MODULE_ORDER)
    for (const [field, surface] of Object.entries(RESULTADOS_SURFACE_REGISTRY)) {
      expect(visibleModuleIds.has(surface.ownerModuleId), `${field} owner ${surface.ownerModuleId}`).toBe(true)
      for (const moduleId of surface.alsoShownIn ?? []) {
        expect(visibleModuleIds.has(moduleId), `${field} alsoShownIn ${moduleId}`).toBe(true)
      }
      for (const moduleId of absorbed) {
        expect(surface.ownerModuleId, `${field} owner`).not.toBe(moduleId)
        expect(surface.alsoShownIn ?? [], `${field} alsoShownIn`).not.toContain(moduleId)
      }
    }
  })
})
