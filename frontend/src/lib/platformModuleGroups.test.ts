import { describe, expect, it } from 'vitest'
import {
  CLIENT_GROUPS_BY_STAGE,
  PLATFORM_MODULE_GROUPS,
  childModulesForGroup,
  groupedModulesForClientStage,
  isPlatformModuleGroup,
} from './platformModuleGroups'
import type { PlatformModule } from './platformRouting'

function moduleFixture(moduleId: string): PlatformModule {
  return {
    module_id: moduleId,
    label: moduleId,
    audience_mode: 'city_team',
    status: 'ready',
    decision: 'decision',
    evidence: 'evidence',
    next_action: 'next',
  }
}

describe('platform module groups', () => {
  it('compresses client validation into Diagnóstico and Propuesta only', () => {
    expect(CLIENT_GROUPS_BY_STAGE.validation).toEqual(['validation_diagnostico', 'validation_propuesta'])
    const modules = groupedModulesForClientStage('validation')

    expect(modules.map(module => module.module_id)).toEqual(['validation_diagnostico', 'validation_propuesta'])
    expect(modules.map(module => module.label)).toEqual(['Diagnóstico', 'Propuesta'])
    expect(PLATFORM_MODULE_GROUPS.validation_diagnostico.visible_number).toBe('01')
    expect(PLATFORM_MODULE_GROUPS.validation_propuesta.visible_number).toBe('03')
  })

  it('keeps planning and execution as stage workspaces without changing legacy module ids', () => {
    expect(groupedModulesForClientStage('planning').map(module => module.module_id)).toEqual(['planning_workspace'])
    expect(groupedModulesForClientStage('execution').map(module => module.module_id)).toEqual(['execution_control_workspace'])

    expect(PLATFORM_MODULE_GROUPS.planning_workspace.child_module_ids).toContain('roadmap_implementacion')
    expect(PLATFORM_MODULE_GROUPS.planning_workspace.child_module_ids).toContain('mercado_materiales')
    expect(PLATFORM_MODULE_GROUPS.execution_control_workspace.child_module_ids).toContain('evm_dashboard')
    expect(PLATFORM_MODULE_GROUPS.execution_control_workspace.child_module_ids).toContain('risk_dashboard')
  })

  it('resolves group children from the existing legacy module catalog', () => {
    const catalog = [
      moduleFixture('antecedentes_municipales'),
      moduleFixture('city_baseline'),
      moduleFixture('social_diagnostico'),
      moduleFixture('capacidad_institucional'),
      moduleFixture('marco_legal'),
      moduleFixture('costo_omision'),
    ]

    expect(childModulesForGroup('validation_diagnostico', catalog).map(module => module.module_id)).toEqual([
      'antecedentes_municipales',
      'city_baseline',
      'social_diagnostico',
      'capacidad_institucional',
      'marco_legal',
      'costo_omision',
    ])
    expect(isPlatformModuleGroup('validation_propuesta')).toBe(true)
    expect(isPlatformModuleGroup('city_baseline')).toBe(false)
  })
})
