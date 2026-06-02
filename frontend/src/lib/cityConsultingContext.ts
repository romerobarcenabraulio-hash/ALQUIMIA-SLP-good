import {
  buildConsultingPackage,
  renderableClaims,
  type ConsultingPackage,
  type EvidenceConfidence,
} from '@/lib/consultingPackageEngine'
import { buildConsultingInputRegistry } from '@/lib/consultingInputRegistry'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import type { ClientPlatformStage } from '@/lib/platformRouting'
import {
  STANDARD_CITY_DOCUMENT_INDEX,
  TENANT_DIAGNOSTIC_FIXTURES,
  withTenantMunicipalContext,
  type DocumentGap,
  type TenantDiagnosticData,
  type TenantDocumentSlot,
  type TenantMetric,
  type TenantMunicipalContextOverride,
} from '@/lib/tenantDiagnosticData'

export type EvidenceKernelSourceType = 'document' | 'api' | 'assumption' | 'model' | 'bibliography' | 'gap'
export type EvidenceKernelHumanStatus = 'validated_human' | 'pending_human_validation' | 'blocked_by_gap'
export type StageWorkspaceAction = 'upload_regulation' | 'upload_document' | 'review_claims' | 'export_package' | 'open_admin'

export interface EvidenceKernelRecord {
  id: string
  claim: string
  source: string
  source_date: string
  method: string
  territorial_scope: TenantMetric['territorial_scope']
  source_type: EvidenceKernelSourceType
  confidence: EvidenceConfidence
  human_status: EvidenceKernelHumanStatus
  limitation: string
  can_render_as_claim: boolean
}

export interface StageWorkspaceModule {
  module_id: string
  label: string
  stage: ClientPlatformStage
  status: 'ready' | 'conditioned' | 'blocked'
  conclusion: string
  evidence_gap_ids: string[]
  claim_ids: string[]
  actions: StageWorkspaceAction[]
}

export interface StageWorkspaceConfig {
  stage: ClientPlatformStage
  label: string
  visible_modules: StageWorkspaceModule[]
  blocked_modules: StageWorkspaceModule[]
  required_documents: TenantDocumentSlot[]
  recommended_documents: TenantDocumentSlot[]
  claims_allowed: string[]
  export_allowed: boolean
}

export interface OperationalEvent {
  tenant_id: string
  stage: ClientPlatformStage
  action: string
  result: 'ready' | 'blocked' | 'conditioned'
  evidence_ids: string[]
  created_at: string
}

export interface CityConsultingContext {
  tenant_id: string
  municipio_id?: string
  clave_inegi?: string
  zm?: string
  municipality: string
  state: string
  active_stage: ClientPlatformStage
  document_index: TenantDocumentSlot[]
  regulation: {
    status: 'available' | 'missing'
    blocks_plan: boolean
    gap?: DocumentGap
  }
  api_sources: ConsultingPackage['input_registry']['sources']
  evidence_gaps: ConsultingPackage['evidence_gaps']
  evidence_kernel: EvidenceKernelRecord[]
  readiness: ConsultingPackage['readiness_gates']
  package_summary: {
    executive_diagnosis: string
    scenario_count: number
    quantified_scenario_count: number
    private_category_count: number
    affirmable_claim_count: number
  }
  stage_workspace: StageWorkspaceConfig
  operational_events: OperationalEvent[]
  permissions: {
    admin_can_view_all: boolean
    client_tenant_only: boolean
    client_controls_enabled: false
  }
}

const STAGE_LABEL: Record<ClientPlatformStage, string> = {
  validation: 'Validación',
  planning: 'Planeación',
  execution: 'Ejecución',
}

const MODULES_BY_STAGE: Record<ClientPlatformStage, Array<{ module_id: string; label: string }>> = {
  validation: [
    { module_id: 'M00', label: 'Cómo leer la consultoría' },
    { module_id: 'M00B', label: 'Investigación municipal' },
    { module_id: 'M01', label: 'Línea base RSU' },
    { module_id: 'M02', label: 'Mapa social y privado' },
    { module_id: 'M03B', label: 'Marco legal municipal' },
    { module_id: 'M15', label: 'Paquete de decisión preliminar' },
  ],
  planning: [
    { module_id: 'M04', label: 'Costo de no actuar' },
    { module_id: 'M08', label: 'Operación y rutas' },
    { module_id: 'M13', label: 'Escenarios financieros' },
    { module_id: 'M14', label: 'Riesgos' },
    { module_id: 'M15', label: 'Hoja de ruta institucional' },
  ],
  execution: [
    { module_id: 'M16', label: 'Monitoreo operativo' },
    { module_id: 'M17', label: 'Deltas proyectado vs real' },
    { module_id: 'M18', label: 'Cumplimiento documental' },
    { module_id: 'M21', label: 'Reporte ejecutivo de avance' },
  ],
}

function stageAction(stage: ClientPlatformStage): StageWorkspaceAction[] {
  if (stage === 'validation') return ['upload_regulation', 'upload_document', 'review_claims', 'export_package']
  if (stage === 'planning') return ['upload_document', 'review_claims', 'export_package']
  return ['upload_document', 'review_claims', 'export_package']
}

function gapBlocksModule(gap: DocumentGap, moduleId: string) {
  return gap.module_id === moduleId || (
    moduleId === 'M15' && ['acuerdo_cabildo', 'reglamento_limpia'].includes(gap.document_type)
  ) || (
    moduleId === 'M13' && ['catalogo_compradores', 'cotizacion_materiales'].includes(gap.document_type)
  )
}

function moduleStatus(moduleId: string, gaps: DocumentGap[], regulationMissing: boolean): StageWorkspaceModule['status'] {
  if (moduleId === 'M03B' && regulationMissing) return 'blocked'
  if (moduleId === 'M15' && regulationMissing) return 'blocked'
  return gaps.some(gap => gapBlocksModule(gap, moduleId)) ? 'conditioned' : 'ready'
}

function moduleConclusion(status: StageWorkspaceModule['status'], label: string) {
  if (status === 'blocked') return `${label} queda bloqueado para emitir plan mientras falte reglamento vigente.`
  if (status === 'conditioned') return `${label} puede trabajarse con brechas explícitas; no habilita claims oficiales sin evidencia suficiente.`
  return `${label} está listo para lectura preliminar con fuente, método, alcance y revisión humana.`
}

function evidenceKernelFromPackage(pkg: ConsultingPackage): EvidenceKernelRecord[] {
  const claimEntries = pkg.claim_ledger.map(entry => ({
    id: entry.id,
    claim: entry.claim,
    source: entry.source,
    source_date: entry.source_date,
    method: entry.method,
    territorial_scope: entry.territorial_scope,
    source_type: entry.source_type,
    confidence: entry.confidence,
    human_status: entry.human_status,
    limitation: entry.confidence === 'blocked'
      ? 'No se renderiza como afirmación; se conserva como brecha o bloqueo.'
      : 'Puede mostrarse sólo con fuente, fecha, método, alcance territorial y estado humano.',
    can_render_as_claim: renderableClaims([entry]).length === 1,
  } satisfies EvidenceKernelRecord))

  const gapEntries = pkg.evidence_gaps.map(gap => ({
    id: `gap-${gap.id}`,
    claim: `${gap.label}: brecha crítica o condicionante documental.`,
    source: 'Índice documental homogéneo del tenant',
    source_date: new Date().toISOString().slice(0, 10),
    method: gap.reason,
    territorial_scope: 'municipio',
    source_type: 'gap',
    confidence: 'blocked',
    human_status: 'blocked_by_gap',
    limitation: 'No sustituye fuente local ni permite declarar verdad municipal.',
    can_render_as_claim: false,
  } satisfies EvidenceKernelRecord))

  return [...claimEntries, ...gapEntries]
}

function buildStageWorkspaceConfig(
  stage: ClientPlatformStage,
  tenantData: TenantDiagnosticData,
  pkg: ConsultingPackage,
  evidenceKernel: EvidenceKernelRecord[],
): StageWorkspaceConfig {
  const openGaps = tenantData.document_gaps.filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)
  const regulationMissing = openGaps.some(gap => gap.document_type === 'reglamento_limpia')
  const modules = MODULES_BY_STAGE[stage].map(module => {
    const status = moduleStatus(module.module_id, openGaps, regulationMissing)
    return {
      ...module,
      stage,
      status,
      conclusion: moduleConclusion(status, module.label),
      evidence_gap_ids: openGaps.filter(gap => gapBlocksModule(gap, module.module_id)).map(gap => gap.id),
      claim_ids: evidenceKernel.filter(record => record.can_render_as_claim).slice(0, 4).map(record => record.id),
      actions: stageAction(stage),
    }
  })

  return {
    stage,
    label: STAGE_LABEL[stage],
    visible_modules: modules,
    blocked_modules: modules.filter(module => module.status === 'blocked'),
    required_documents: tenantData.document_index.length ? tenantData.document_index : STANDARD_CITY_DOCUMENT_INDEX,
    recommended_documents: tenantData.document_index.filter(slot => slot.status !== 'ready'),
    claims_allowed: evidenceKernel.filter(record => record.can_render_as_claim).map(record => record.id),
    export_allowed: !regulationMissing && pkg.readiness_gates.some(gate => gate.id === 'legal_review' && gate.passed),
  }
}

function operationalEventsForContext(
  tenantData: TenantDiagnosticData,
  stage: ClientPlatformStage,
  workspace: StageWorkspaceConfig,
  pkg: ConsultingPackage,
): OperationalEvent[] {
  const now = new Date().toISOString()
  return [
    {
      tenant_id: tenantData.tenant_id,
      stage,
      action: 'stage_visited',
      result: workspace.blocked_modules.length ? 'blocked' : 'ready',
      evidence_ids: workspace.claims_allowed.slice(0, 3),
      created_at: now,
    },
    {
      tenant_id: tenantData.tenant_id,
      stage,
      action: 'document_status_reviewed',
      result: pkg.evidence_gaps.length ? 'conditioned' : 'ready',
      evidence_ids: pkg.evidence_gaps.slice(0, 3).map(gap => gap.id),
      created_at: now,
    },
  ]
}

export function buildCityConsultingContext(
  tenantData: TenantDiagnosticData,
  stage: ClientPlatformStage,
  pkg = buildConsultingPackage({
    tenantData,
    inputRegistry: buildConsultingInputRegistry(tenantData),
    bibliographyTenants: Object.values(TENANT_DIAGNOSTIC_FIXTURES),
  }),
): CityConsultingContext {
  const openReglamentoGap = tenantData.document_gaps.find(gap =>
    gap.status === 'pending' && !gap.marked_not_applicable && gap.document_type === 'reglamento_limpia',
  )
  const evidenceKernel = evidenceKernelFromPackage(pkg)
  const stageWorkspace = buildStageWorkspaceConfig(stage, tenantData, pkg, evidenceKernel)
  const scenarioCount = pkg.scenario_set.scenarios.length
  const quantifiedScenarioCount = pkg.scenario_set.scenarios.filter(scenario => scenario.capture_ton_day !== null).length

  return {
    tenant_id: tenantData.tenant_id,
    municipio_id: tenantData.municipio_id,
    clave_inegi: tenantData.clave_inegi,
    zm: tenantData.zm,
    municipality: tenantData.municipality,
    state: tenantData.state,
    active_stage: stage,
    document_index: tenantData.document_index.length ? tenantData.document_index : STANDARD_CITY_DOCUMENT_INDEX,
    regulation: {
      status: openReglamentoGap ? 'missing' : 'available',
      blocks_plan: Boolean(openReglamentoGap),
      gap: openReglamentoGap,
    },
    api_sources: pkg.input_registry.sources,
    evidence_gaps: pkg.evidence_gaps,
    evidence_kernel: evidenceKernel,
    readiness: pkg.readiness_gates,
    package_summary: {
      executive_diagnosis: pkg.executive_diagnosis,
      scenario_count: scenarioCount,
      quantified_scenario_count: quantifiedScenarioCount,
      private_category_count: pkg.private_generator_mix.length,
      affirmable_claim_count: evidenceKernel.filter(record => record.can_render_as_claim).length,
    },
    stage_workspace: stageWorkspace,
    operational_events: operationalEventsForContext(tenantData, stage, stageWorkspace, pkg),
    permissions: {
      admin_can_view_all: true,
      client_tenant_only: true,
      client_controls_enabled: false,
    },
  }
}

export function buildCityConsultingContextForTenant(
  tenantId: string,
  stage: ClientPlatformStage,
  context: TenantMunicipalContextOverride = {},
) {
  const tenantData = withTenantMunicipalContext(getTenantArchiveData(tenantId), context)
  return buildCityConsultingContext(tenantData, stage)
}
