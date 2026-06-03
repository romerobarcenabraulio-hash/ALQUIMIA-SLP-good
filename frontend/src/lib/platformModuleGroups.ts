import type { ClientPlatformStage, PlatformModule } from '@/lib/platformRouting'

export type PlatformModuleGroupId =
  | 'validation_diagnostico'
  | 'validation_propuesta'
  | 'planning_workspace'
  | 'execution_control_workspace'

export interface PlatformModuleGroup {
  module_id: PlatformModuleGroupId
  label: string
  nav_subtitle: string
  visible_number: string
  decision: string
  evidence: string
  next_action: string
  child_module_ids: string[]
}

export const PLATFORM_MODULE_GROUPS: Record<PlatformModuleGroupId, PlatformModuleGroup> = {
  validation_diagnostico: {
    module_id: 'validation_diagnostico',
    label: 'Diagnóstico',
    nav_subtitle: 'Investigación, línea base, sociedad, capacidad y reglamento',
    visible_number: '01',
    decision: 'Entender el punto de partida municipal con evidencia investigada, calculada o aportada por el cliente.',
    evidence: 'Antecedentes, línea base RSU, mapa social, capacidad institucional, marco legal y costo de no actuar.',
    next_action: 'Revisar brechas y fuentes antes de abrir la propuesta.',
    child_module_ids: [
      'antecedentes_municipales',
      'city_baseline',
      'social_diagnostico',
      'capacidad_institucional',
      'marco_legal',
      'costo_omision',
    ],
  },
  validation_propuesta: {
    module_id: 'validation_propuesta',
    label: 'Propuesta',
    nav_subtitle: 'Escenarios, mercado, riesgos y expediente preliminar',
    visible_number: '03',
    decision: 'Validar si la propuesta preliminar puede convertirse en base de planeación contractual.',
    evidence: 'Escenarios cerrados, mercado y mix de precios, riesgos, expediente preliminar y matriz de evidencia por claim.',
    next_action: 'Validar propuesta para continuar a planeación; no equivale a aprobación política.',
    child_module_ids: [
      'escenarios_financieros',
      'mercado_materiales',
      'riesgos_modelo',
      'expediente_cabildo',
      'trazabilidad',
    ],
  },
  planning_workspace: {
    module_id: 'planning_workspace',
    label: 'Planeación',
    nav_subtitle: 'Ruta, operación, costos, mercado y financiamiento',
    visible_number: 'P',
    decision: 'Convertir la propuesta validada en hoja de ruta operativa y financiera.',
    evidence: 'Roadmap, infraestructura, organigrama, logística, costos, mercado, concesión y financiamiento.',
    next_action: 'Cerrar responsables, supuestos y documentos críticos antes de ejecución.',
    child_module_ids: [
      'roadmap_implementacion',
      'infraestructura',
      'organigrama',
      'logistica',
      'costos_programa',
      'mercado_materiales',
      'esquema_concesion',
      'arbol_financiamiento',
    ],
  },
  execution_control_workspace: {
    module_id: 'execution_control_workspace',
    label: 'Ejecución y control',
    nav_subtitle: 'Inspección, monitoreo, trazabilidad, EVM y riesgos vivos',
    visible_number: 'E',
    decision: 'Monitorear ejecución contra lo planeado sin automatizar gates ni decisiones humanas.',
    evidence: 'Inspección, monitoreo operativo, materialidad, trazabilidad, EVM y riesgos/gates.',
    next_action: 'Actualizar evidencia real, deltas y riesgos vivos con fuentes fechadas.',
    child_module_ids: [
      'inspeccion',
      'monitoreo_operativo',
      'doble_materialidad',
      'trazabilidad',
      'evm_dashboard',
      'risk_dashboard',
    ],
  },
}

export const CLIENT_GROUPS_BY_STAGE: Record<ClientPlatformStage, PlatformModuleGroupId[]> = {
  validation: ['validation_diagnostico', 'validation_propuesta'],
  planning: ['planning_workspace'],
  execution: ['execution_control_workspace'],
}

export function isPlatformModuleGroup(moduleId: string | null | undefined): moduleId is PlatformModuleGroupId {
  return Boolean(moduleId && moduleId in PLATFORM_MODULE_GROUPS)
}

export function visibleModuleNumber(moduleId: string, fallback: string): string {
  return isPlatformModuleGroup(moduleId) ? PLATFORM_MODULE_GROUPS[moduleId].visible_number : fallback
}

export function groupedModulesForClientStage(stage: ClientPlatformStage): PlatformModule[] {
  return CLIENT_GROUPS_BY_STAGE[stage].map(groupId => {
    const group = PLATFORM_MODULE_GROUPS[groupId]
    return {
      module_id: group.module_id,
      label: group.label,
      audience_mode: 'city_team',
      status: 'ready',
      nav_subtitle: group.nav_subtitle,
      decision: group.decision,
      evidence: group.evidence,
      next_action: group.next_action,
      platform_readonly: false,
    }
  })
}

export function childModulesForGroup(
  groupId: PlatformModuleGroupId,
  moduleCatalog: ReadonlyArray<PlatformModule>,
): PlatformModule[] {
  const byId = new Map(moduleCatalog.map(module => [module.module_id, module]))
  return PLATFORM_MODULE_GROUPS[groupId].child_module_ids
    .map(moduleId => byId.get(moduleId))
    .filter(Boolean) as PlatformModule[]
}
