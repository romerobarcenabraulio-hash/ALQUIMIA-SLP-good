import type { DecisionModule } from '@/types'

export type TenantStage = 'validation' | 'planning' | 'execution' | 'expansion'
export type ClientPlatformStage = Exclude<TenantStage, 'expansion'>

export interface CapabilityModule {
  module_id: string
  legacy_number?: string
  name: string
  platforms: TenantStage[]
  editable_in: TenantStage
  readonly_after_stage: TenantStage | null
  default_active: boolean
  min_tier: string
}

export interface CapabilityRegistry {
  version: string
  modules: CapabilityModule[]
}

export interface TenantCapability {
  module_id: string
  active: boolean
  source: string
}

export interface TenantStatePayload {
  tenant_id: string
  municipal_context?: {
    municipio_id?: string | null
    clave_inegi?: string | null
    zm?: string | null
    municipality?: string | null
    state?: string | null
  } | null
  state: {
    current_stage: TenantStage
    transition_mode?: string
  }
  capabilities: TenantCapability[]
}

export interface PlatformModule extends DecisionModule {
  platform_readonly?: boolean
}

export const PLATFORM_PATH_BY_STAGE: Record<ClientPlatformStage, '/v' | '/p' | '/e'> = {
  validation: '/v',
  planning: '/p',
  execution: '/e',
}

export const PLATFORM_LABEL_BY_STAGE: Record<ClientPlatformStage, string> = {
  validation: 'Validacion',
  planning: 'Planeacion',
  execution: 'Ejecucion',
}

export function platformPathForStage(stage: TenantStage): '/v' | '/p' | '/e' {
  if (stage === 'planning') return '/p'
  if (stage === 'execution' || stage === 'expansion') return '/e'
  return '/v'
}

export function registryByModule(registry: CapabilityRegistry): Map<string, CapabilityModule> {
  return new Map(registry.modules.map(module => [module.module_id, module]))
}

export function activeCapabilitySet(capabilities: TenantCapability[]): Set<string> {
  return new Set(capabilities.filter(cap => cap.active !== false).map(cap => cap.module_id))
}

export function filterModulesForPlatform(
  modules: DecisionModule[],
  registry: CapabilityRegistry,
  tenantState: TenantStatePayload,
  platformStage: ClientPlatformStage,
): PlatformModule[] {
  const byModule = registryByModule(registry)
  const active = activeCapabilitySet(tenantState.capabilities)

  return modules.flatMap<PlatformModule>(module => {
    const spec = byModule.get(module.module_id)
    if (!spec) {
      if (module.module_id === 'guia_circularidad') {
        return [{ ...module, platform_readonly: false }]
      }
      return []
    }
    if (!active.has(module.module_id)) return []
    if (!spec.platforms.includes(platformStage)) return []

    return [{
      ...module,
      platform_readonly: spec.editable_in !== platformStage,
      nav_subtitle: spec.editable_in !== platformStage ? 'Lectura' : module.nav_subtitle,
    }]
  })
}

export function readOnlyModuleIds(modules: PlatformModule[]): Set<string> {
  return new Set(modules.filter(module => module.platform_readonly).map(module => module.module_id))
}
