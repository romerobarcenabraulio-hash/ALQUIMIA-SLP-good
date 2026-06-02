import type { CitationRecord, TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'
import { CITATION_REGISTRY } from '@/lib/tenantDiagnosticData'

export type EvidenceRecommendationTag = 'local' | 'comparable' | 'benchmark' | 'solo_contexto' | 'no_usable'
export type BibliographyEvidenceType = 'document' | 'api' | 'benchmark' | 'gap' | 'model'
export type PlatformStage = 'validation' | 'planning' | 'execution'

export interface BibliographyRecord {
  id: string
  tenant_id: string
  municipality: string
  state: string
  municipio_id?: string
  zm?: string
  citation_id: string
  institution: string
  title: string
  parent_document?: string
  url?: string
  source_date: string
  consulted_at: string
  territorial_scope: TenantMetric['territorial_scope']
  module_id: string
  claim_id: string
  claim_label: string
  evidence_type: BibliographyEvidenceType
  method: string
  confidence: TenantMetric['confidence']
  restrictions: string[]
}

export interface BibliographyCompatibilityScore {
  territorial: number
  profile: number
  module: number
  recency: number
  evidence: number
  penalties: number
  total: number
}

export interface EvidenceRecommendation {
  id: string
  tag: EvidenceRecommendationTag
  record: BibliographyRecord
  score: BibliographyCompatibilityScore
  confidence: 'high' | 'medium' | 'low' | 'blocked'
  supported_claim: string
  unsupported_claim: string
  explanation: string
  stage: PlatformStage
  module_id: string
}

export interface StageEvidenceMap {
  stage: PlatformStage
  label: string
  recommendations: EvidenceRecommendation[]
  local_count: number
  comparable_count: number
  benchmark_count: number
  blocked_count: number
}

const STAGE_MODULES: Record<PlatformStage, string[]> = {
  validation: ['M00B', 'M01', 'M02', 'M03B', 'M04', 'M13', 'M14', 'M15'],
  planning: ['M05', 'M07', 'M08', 'M09', 'M13', 'M14'],
  execution: ['M17', 'M18', 'M20', 'M21'],
}

const STAGE_LABELS: Record<PlatformStage, string> = {
  validation: 'Validación',
  planning: 'Planeación',
  execution: 'Ejecución',
}

const METRIC_MODULE: Record<string, string> = {
  rsu_generation: 'M01',
  field_characterization: 'M01',
  collection_coverage: 'M08',
  routes_time_study: 'M08',
  psp_acceptance: 'M13',
}

function moduleForMetric(metric: TenantMetric): string {
  if (metric.field_id?.startsWith('M')) return metric.field_id.split('.')[0]
  return METRIC_MODULE[metric.id] ?? 'M00B'
}

function evidenceType(metric: TenantMetric, citation: CitationRecord): BibliographyEvidenceType {
  if (metric.status === 'brecha_critica' || metric.confidence === 'critical_gap') return 'gap'
  if (metric.status === 'inferido') return 'model'
  const text = `${citation.institution} ${citation.title} ${citation.parent_document ?? ''}`.toLowerCase()
  if (metric.territorial_scope === 'nacional' || text.includes('benchmark')) return 'benchmark'
  if (metric.source.toLowerCase().includes('api')) return 'api'
  return 'document'
}

function yearFromDate(value: string): number | null {
  const match = value.match(/20\d{2}|19\d{2}/)
  return match ? Number(match[0]) : null
}

function recencyScore(value: string) {
  const year = yearFromDate(value)
  if (!year) return 8
  const age = Math.max(0, 2026 - year)
  if (age <= 2) return 15
  if (age <= 5) return 10
  if (age <= 10) return 5
  return 0
}

function confidenceScore(confidence: TenantMetric['confidence']) {
  if (confidence === 'verified_official') return 20
  if (confidence === 'verified_secondary') return 16
  if (confidence === 'inferred_medium') return 8
  if (confidence === 'inferred_low' || confidence === 'pending_validation') return 4
  return -40
}

function recommendationStage(moduleId: string): PlatformStage {
  if (STAGE_MODULES.execution.includes(moduleId)) return 'execution'
  if (STAGE_MODULES.planning.includes(moduleId)) return 'planning'
  return 'validation'
}

export function buildBibliographyRecords(tenants: TenantDiagnosticData[]): BibliographyRecord[] {
  return tenants.flatMap(tenant =>
    tenant.metrics.flatMap(metric => {
      if (!metric.citation_id) return []
      const citation = CITATION_REGISTRY[metric.citation_id]
      if (!citation) return []
      const moduleId = moduleForMetric(metric)
      const type = evidenceType(metric, citation)
      return [{
        id: `${tenant.tenant_id}:${metric.id}:${citation.id}`,
        tenant_id: tenant.tenant_id,
        municipality: tenant.municipality,
        state: tenant.state,
        municipio_id: tenant.municipio_id,
        zm: tenant.zm,
        citation_id: citation.id,
        institution: citation.institution,
        title: citation.title,
        parent_document: citation.parent_document,
        url: citation.url,
        source_date: metric.source_date || citation.year_or_date,
        consulted_at: metric.consulted_at || citation.consulted_at,
        territorial_scope: metric.territorial_scope,
        module_id: moduleId,
        claim_id: metric.id,
        claim_label: metric.label,
        evidence_type: type,
        method: metric.method,
        confidence: metric.confidence,
        restrictions: restrictionsFor(metric, type),
      }]
    }),
  )
}

function restrictionsFor(metric: TenantMetric, type: BibliographyEvidenceType): string[] {
  const restrictions: string[] = []
  if (metric.territorial_scope !== 'municipio') restrictions.push('No soporta verdad municipal directa.')
  if (metric.territorial_scope === 'zm') restrictions.push('Alcance ZM; debe separarse de municipio.')
  if (type === 'benchmark') restrictions.push('Benchmark; no sustituye estudio local.')
  if (type === 'gap') restrictions.push('Brecha; no usable como afirmación.')
  if (type === 'model') restrictions.push('Inferencia/modelo; requiere revisión humana.')
  return restrictions
}

function scoreRecord(target: TenantDiagnosticData, record: BibliographyRecord, moduleId?: string): BibliographyCompatibilityScore {
  const sameMunicipality = Boolean(target.municipio_id && record.municipio_id === target.municipio_id)
  const sameState = target.state === record.state
  const sameZm = Boolean(target.zm && record.zm === target.zm)
  const territorial = sameMunicipality && record.territorial_scope === 'municipio'
    ? 45
    : sameZm && record.territorial_scope === 'zm'
      ? 22
      : sameState
        ? 16
        : record.territorial_scope === 'nacional'
          ? 10
          : 8
  const profile = sameState ? 12 : 6
  const moduleScore = !moduleId ? 10 : record.module_id === moduleId ? 18 : 0
  const recency = recencyScore(record.source_date)
  const evidence = confidenceScore(record.confidence)
  const penalties = [
    record.evidence_type === 'gap' ? -80 : 0,
    record.evidence_type === 'benchmark' ? -12 : 0,
    record.evidence_type === 'model' ? -10 : 0,
    record.territorial_scope === 'zm' && !sameMunicipality ? -15 : 0,
    record.territorial_scope !== 'municipio' ? -8 : 0,
  ].reduce((sum, item) => sum + item, 0)
  const total = Math.max(0, Math.min(100, territorial + profile + moduleScore + recency + evidence + penalties))
  return { territorial, profile, module: moduleScore, recency, evidence, penalties, total }
}

function tagFor(target: TenantDiagnosticData, record: BibliographyRecord, score: BibliographyCompatibilityScore): EvidenceRecommendationTag {
  if (record.evidence_type === 'gap' || score.total < 20) return 'no_usable'
  if (record.territorial_scope === 'municipio' && target.municipio_id && record.municipio_id === target.municipio_id && record.evidence_type === 'document') return 'local'
  if (record.evidence_type === 'benchmark' || record.territorial_scope === 'nacional') return 'benchmark'
  if (record.territorial_scope === 'zm' || record.territorial_scope === 'estado') return 'comparable'
  return score.total >= 45 ? 'comparable' : 'solo_contexto'
}

function recommendationConfidence(tag: EvidenceRecommendationTag, score: number): EvidenceRecommendation['confidence'] {
  if (tag === 'no_usable') return 'blocked'
  if (tag === 'local' && score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export function buildEvidenceRecommendations(
  target: TenantDiagnosticData,
  allTenants: TenantDiagnosticData[],
  options: { stage?: PlatformStage; module_id?: string } = {},
): EvidenceRecommendation[] {
  const stageModules = options.stage ? STAGE_MODULES[options.stage] : null
  return buildBibliographyRecords(allTenants)
    .filter(record => !stageModules || stageModules.includes(record.module_id))
    .filter(record => !options.module_id || record.module_id === options.module_id)
    .map(record => {
      const score = scoreRecord(target, record, options.module_id)
      const tag = tagFor(target, record, score)
      const stage = recommendationStage(record.module_id)
      return {
        id: `${target.tenant_id}:${record.id}`,
        tag,
        record,
        score,
        confidence: recommendationConfidence(tag, score.total),
        supported_claim: tag === 'local'
          ? `Puede soportar claim municipal sobre ${record.claim_label}.`
          : tag === 'no_usable'
            ? 'No debe soportar afirmaciones.'
            : `Puede contextualizar ${record.claim_label} como evidencia comparable o benchmark.`,
        unsupported_claim: tag === 'local'
          ? 'No sustituye revisión humana ni oficialidad automática.'
          : 'No soporta verdad municipal, estudio local ni declaratoria oficial.',
        explanation: explanationFor(target, record, tag),
        stage,
        module_id: record.module_id,
      }
    })
    .sort((a, b) => b.score.total - a.score.total)
}

function explanationFor(target: TenantDiagnosticData, record: BibliographyRecord, tag: EvidenceRecommendationTag): string {
  if (tag === 'local') {
    return `Fuente municipal de ${record.municipality}; puede alimentar claims si conserva fuente, fecha, método, alcance y revisión humana.`
  }
  if (tag === 'benchmark') {
    return 'La plataforma recomienda esta fuente como contexto comparable; no es estudio local ni dato oficial municipal.'
  }
  if (tag === 'comparable') {
    return `Fuente comparable para ${target.municipality}; útil para hipótesis, riesgos o contexto, no para cerrar verdad municipal.`
  }
  if (tag === 'solo_contexto') {
    return 'Fuente de bajo ajuste; usar sólo como contexto metodológico.'
  }
  return 'Fuente no usable para afirmaciones por brecha, baja confianza o incompatibilidad territorial.'
}

export function buildStageEvidenceMap(target: TenantDiagnosticData, tenants: TenantDiagnosticData[]): StageEvidenceMap[] {
  return (['validation', 'planning', 'execution'] as PlatformStage[]).map(stage => {
    const recommendations = buildEvidenceRecommendations(target, tenants, { stage }).slice(0, 8)
    return {
      stage,
      label: STAGE_LABELS[stage],
      recommendations,
      local_count: recommendations.filter(item => item.tag === 'local').length,
      comparable_count: recommendations.filter(item => item.tag === 'comparable').length,
      benchmark_count: recommendations.filter(item => item.tag === 'benchmark').length,
      blocked_count: recommendations.filter(item => item.tag === 'no_usable').length,
    }
  })
}
