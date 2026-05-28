import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { DecisionModule } from '@/types'
import {
  filterModulesForPlatform,
  platformPathForStage,
  readOnlyModuleIds,
  type CapabilityRegistry,
  type TenantStatePayload,
} from '@/lib/platformRouting'

const registry = JSON.parse(
  readFileSync('../docs/architecture/capability_registry.json', 'utf8'),
) as CapabilityRegistry

function moduleFixture(moduleId: string): DecisionModule {
  return {
    module_id: moduleId,
    label: moduleId,
    decision: '',
    evidence: '',
    next_action: '',
    status: 'ready',
    audience_mode: 'city_team',
  }
}

const allModules = registry.modules.map(module => moduleFixture(module.module_id))

function tenantState(current_stage: TenantStatePayload['state']['current_stage']): TenantStatePayload {
  return {
    tenant_id: `tenant-${current_stage}`,
    state: { current_stage },
    capabilities: registry.modules.map(module => ({
      module_id: module.module_id,
      active: true,
      source: 'test',
    })),
  }
}

describe('platformRouting · Fase 3', () => {
  it('resuelve ruta canonica desde current_stage', () => {
    expect(platformPathForStage('validation')).toBe('/v')
    expect(platformPathForStage('planning')).toBe('/p')
    expect(platformPathForStage('execution')).toBe('/e')
    expect(platformPathForStage('expansion')).toBe('/e')
  })

  it('/v muestra validation y oculta execution', () => {
    const modules = filterModulesForPlatform(allModules, registry, tenantState('validation'), 'validation')
    const ids = modules.map(module => module.module_id)

    expect(ids).toContain('city_baseline')
    expect(ids).toContain('expediente_cabildo')
    expect(ids).not.toContain('roadmap_implementacion')
    expect(ids).not.toContain('evm_dashboard')
    expect(readOnlyModuleIds(modules).size).toBe(0)
  })

  it('/p muestra planning y validation como Lectura', () => {
    const modules = filterModulesForPlatform(allModules, registry, tenantState('planning'), 'planning')
    const ids = modules.map(module => module.module_id)
    const readonly = readOnlyModuleIds(modules)

    expect(ids).toContain('city_baseline')
    expect(ids).toContain('roadmap_implementacion')
    expect(ids).not.toContain('evm_dashboard')
    expect(readonly.has('city_baseline')).toBe(true)
    expect(readonly.has('roadmap_implementacion')).toBe(false)
  })

  it('/e muestra execution y etapas previas como Lectura', () => {
    const modules = filterModulesForPlatform(allModules, registry, tenantState('execution'), 'execution')
    const ids = modules.map(module => module.module_id)
    const readonly = readOnlyModuleIds(modules)

    expect(ids).toContain('city_baseline')
    expect(ids).toContain('roadmap_implementacion')
    expect(ids).toContain('evm_dashboard')
    expect(readonly.has('city_baseline')).toBe(true)
    expect(readonly.has('roadmap_implementacion')).toBe(true)
    expect(readonly.has('evm_dashboard')).toBe(false)
  })

  it('respeta capabilities inactivas por tenant', () => {
    const state = tenantState('execution')
    state.capabilities = state.capabilities.map(capability =>
      capability.module_id === 'evm_dashboard'
        ? { ...capability, active: false }
        : capability,
    )

    const modules = filterModulesForPlatform(allModules, registry, state, 'execution')
    expect(modules.map(module => module.module_id)).not.toContain('evm_dashboard')
  })
})
