import type { DocumentGap, TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'
import {
  buildConsultingInputRegistry,
  type ConsultingInputRegistry,
} from '@/lib/consultingInputRegistry'
import {
  buildConsultingInputRegistryWithApiLayers,
  type ConsultingApiLayerPayload,
} from '@/lib/consultingApiLayerAdapters'
import {
  buildEvidenceRecommendations,
  buildStageEvidenceMap,
  type EvidenceRecommendation,
  type StageEvidenceMap,
} from '@/lib/bibliographyIntelligence'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'

export type ClaimSourceType = 'document' | 'api' | 'assumption' | 'model'
export type ClaimHumanStatus = 'validated_human' | 'pending_human_validation' | 'blocked_by_gap'
export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'blocked'
export type DataCategory = 'investigated' | 'calculated' | 'client_provided'

export interface DataPoint {
  field_id: string
  value: number | string
  unit?: string
  category: DataCategory
  source_institution?: string
  source_document?: string
  source_year?: number
  source_url?: string
  consulted_at?: string
  formula?: string
  derived_from_field_ids?: string[]
  methodology_url?: string
  source_document_id?: string
  source_page?: number
  literal_citation?: string
  uploaded_at?: string
  uploaded_by_user_id?: string
}

export interface ClaimLedgerEntry {
  id: string
  claim: string
  source: string
  source_date: string
  method: string
  territorial_scope: TenantMetric['territorial_scope']
  source_type: ClaimSourceType
  confidence: EvidenceConfidence
  human_status: ClaimHumanStatus
}

export interface EvidenceGap {
  id: string
  module_id: string
  label: string
  reason: string
  priority: DocumentGap['priority']
  blocks: string[]
}

export interface PrivateGeneratorMix {
  id: string
  label: string
  share_pct: number | null
  capture_difficulty: 'low' | 'medium' | 'high'
  material_bias: string[]
  evidence_status: 'documented' | 'scenario_assumption' | 'critical_gap'
  rationale: string
}

export interface MaterialPriceChannel {
  label: string
  share_pct: number
  price_mxn_per_kg: number
  rationale: string
  data_category: DataCategory
  source: string
  confidence: EvidenceConfidence
}

export interface MaterialPriceMix {
  material: string
  weighted_price_mxn_per_kg: number | null
  channels: MaterialPriceChannel[]
  rejection_pct: number
  logistics_cost_mxn_per_kg: number
  quality_penalty_mxn_per_kg: number
  formula: string
  derived_from_field_ids: string[]
  confidence: EvidenceConfidence
  source: string
  note: string
}

export interface ConsultingScenario {
  id: 'minimum_viable' | 'conservative' | 'base_realistic' | 'optimized' | 'stress'
  label: string
  conclusion: string
  capture_ton_day: number | null
  circularity_pct: number | null
  gross_revenue_mxn_month: number | null
  opex_signal: 'not_available' | 'low' | 'medium' | 'high'
  confidence: EvidenceConfidence
  assumptions: string[]
  blocked_by: string[]
}

export interface ScenarioSet {
  scenarios: ConsultingScenario[]
  client_controls_enabled: false
  founder_calibration_required: boolean
}

export interface ReadinessGate {
  id: string
  label: string
  passed: boolean
  required: boolean
  evidence: string
  blocks: string
}

export interface PlanEmissionStatus {
  can_emit_plan: boolean
  blocked_by_regulation: boolean
  mode: 'blocked_missing_regulation' | 'conditioned_with_gaps' | 'quantified_conditioned'
  label: string
  explanation: string
  required_human_action: string
}

export interface ConsultingPackage {
  tenant_id: string
  municipality: string
  executive_diagnosis: string
  evidence_gaps: EvidenceGap[]
  private_generator_mix: PrivateGeneratorMix[]
  material_price_mix: MaterialPriceMix[]
  scenario_set: ScenarioSet
  risk_matrix: Array<{ risk: string; level: 'low' | 'medium' | 'high'; mitigation: string }>
  roadmap: Array<{ phase: string; gate: string; output: string }>
  claim_ledger: ClaimLedgerEntry[]
  conditional_recommendations: string[]
  input_registry: ConsultingInputRegistry
  readiness_gates: ReadinessGate[]
  plan_emission: PlanEmissionStatus
  evidence_recommendations: EvidenceRecommendation[]
  stage_evidence_map: StageEvidenceMap[]
}

export interface ConsultingPackageInput {
  tenantData: TenantDiagnosticData
  buyersAvailable?: boolean
  inputRegistry?: ConsultingInputRegistry
  apiLayerPayloads?: ConsultingApiLayerPayload[]
  documentedPrivateMix?: Partial<Record<string, number>>
  bibliographyTenants?: TenantDiagnosticData[]
}

const PRIVATE_CATEGORIES: Array<Omit<PrivateGeneratorMix, 'share_pct' | 'evidence_status' | 'rationale'>> = [
  { id: 'private_subdivisions', label: 'Privadas y fraccionamientos', capture_difficulty: 'medium', material_bias: ['PET', 'cartón', 'orgánico'] },
  { id: 'vertical_housing', label: 'Vivienda vertical', capture_difficulty: 'medium', material_bias: ['PET', 'cartón', 'vidrio'] },
  { id: 'schools', label: 'Escuelas y universidades', capture_difficulty: 'low', material_bias: ['PET', 'cartón', 'papel'] },
  { id: 'retail_plazas', label: 'Plazas y comercios', capture_difficulty: 'low', material_bias: ['cartón', 'PET', 'aluminio'] },
  { id: 'markets', label: 'Mercados y abasto', capture_difficulty: 'high', material_bias: ['orgánico', 'cartón'] },
  { id: 'hospitality', label: 'Restaurantes y hoteles', capture_difficulty: 'medium', material_bias: ['orgánico', 'vidrio', 'aluminio'] },
  { id: 'offices', label: 'Oficinas y servicios privados', capture_difficulty: 'low', material_bias: ['papel', 'PET', 'cartón'] },
  { id: 'private_healthcare', label: 'Hospitales privados', capture_difficulty: 'high', material_bias: ['cartón', 'PET'] },
  { id: 'light_industry', label: 'Industria ligera', capture_difficulty: 'medium', material_bias: ['cartón', 'HDPE', 'aluminio'] },
  { id: 'macro_generators', label: 'Macrogeneradores', capture_difficulty: 'medium', material_bias: ['cartón', 'PET', 'HDPE'] },
]

const MATERIALS = ['PET', 'HDPE', 'cartón', 'vidrio', 'aluminio', 'orgánico', 'otros'] as const
type MaterialLabel = (typeof MATERIALS)[number]

const MATERIAL_RESEARCH_KEY: Partial<Record<MaterialLabel, keyof typeof MATERIAL_PRICE_RESEARCH>> = {
  PET: 'pet',
  HDPE: 'hdpe',
  cartón: 'papel',
  vidrio: 'vidrio',
  aluminio: 'aluminio',
  orgánico: 'organico',
}

const QUALITY_DISTRIBUTIONS: Record<MaterialLabel, Array<{ label: string; share_pct: number; factor: number; rationale: string }>> = {
  PET: [
    { label: 'PET limpio alta calidad', share_pct: 30, factor: 1.18, rationale: 'Fracción premium condicionada a separación, compactación y comprador validado.' },
    { label: 'PET calidad media', share_pct: 45, factor: 1.0, rationale: 'Fracción estándar esperada en escenario base con separación municipal incompleta.' },
    { label: 'PET baja calidad', share_pct: 20, factor: 0.68, rationale: 'Castigo por mezcla, humedad, color o baja homogeneidad del lote.' },
    { label: 'PET rechazado o sin salida', share_pct: 5, factor: 0, rationale: 'Merma de clasificación; no debe convertirse en ingreso.' },
  ],
  HDPE: [
    { label: 'HDPE limpio', share_pct: 28, factor: 1.12, rationale: 'Premium sólo si hay segregación y comprador recurrente.' },
    { label: 'HDPE mixto', share_pct: 47, factor: 1.0, rationale: 'Escenario base con calidad media.' },
    { label: 'HDPE castigado', share_pct: 20, factor: 0.7, rationale: 'Castigo por contaminación, color o presentación.' },
    { label: 'HDPE rechazado', share_pct: 5, factor: 0, rationale: 'Merma sin ingreso.' },
  ],
  cartón: [
    { label: 'Cartón limpio seco', share_pct: 35, factor: 1.12, rationale: 'Mejor precio si se conserva seco y separado.' },
    { label: 'Cartón mixto', share_pct: 40, factor: 1.0, rationale: 'Precio base documental para papel/cartón mezclado.' },
    { label: 'Cartón húmedo o contaminado', share_pct: 20, factor: 0.55, rationale: 'Castigo por humedad, grasa o mezcla.' },
    { label: 'Rechazo', share_pct: 5, factor: 0, rationale: 'Fracción sin valorización.' },
  ],
  vidrio: [
    { label: 'Vidrio separado por color', share_pct: 20, factor: 1.15, rationale: 'Sólo aplica con acopio y comprador compatible.' },
    { label: 'Vidrio mixto', share_pct: 55, factor: 1.0, rationale: 'Escenario más probable por manejo municipal.' },
    { label: 'Vidrio con alta logística', share_pct: 20, factor: 0.5, rationale: 'Castigo por peso, distancia y baja densidad de valor.' },
    { label: 'Rechazo', share_pct: 5, factor: 0, rationale: 'Material no valorizado.' },
  ],
  aluminio: [
    { label: 'Aluminio limpio', share_pct: 45, factor: 1.08, rationale: 'Material con mercado más líquido, si hay separación.' },
    { label: 'Aluminio mixto', share_pct: 40, factor: 1.0, rationale: 'Precio base documental conservador.' },
    { label: 'Aluminio castigado', share_pct: 12, factor: 0.75, rationale: 'Castigo por mezcla o presentación.' },
    { label: 'Rechazo', share_pct: 3, factor: 0, rationale: 'Merma menor esperada.' },
  ],
  orgánico: [
    { label: 'Orgánico aprovechable', share_pct: 45, factor: 1.0, rationale: 'Sólo si existe manejo separado y salida de composta.' },
    { label: 'Orgánico condicionado', share_pct: 30, factor: 0.65, rationale: 'Castigo por mezcla o humedad no controlada.' },
    { label: 'Orgánico no aprovechable', share_pct: 25, factor: 0, rationale: 'Sin separación o comprador, no genera ingreso.' },
  ],
  otros: [
    { label: 'Otros recuperables', share_pct: 20, factor: 0.8, rationale: 'Fracción heterogénea con comprador especializado.' },
    { label: 'Otros condicionados', share_pct: 35, factor: 0.4, rationale: 'Requiere separación fina y volumen.' },
    { label: 'Otros sin salida', share_pct: 45, factor: 0, rationale: 'No se monetiza sin evidencia de comprador.' },
  ],
}

const SCENARIO_MULTIPLIER: Record<ConsultingScenario['id'], number> = {
  minimum_viable: 0.08,
  conservative: 0.14,
  base_realistic: 0.22,
  optimized: 0.34,
  stress: 0.05,
}

const SCENARIO_LABEL: Record<ConsultingScenario['id'], string> = {
  minimum_viable: 'Mínimo viable',
  conservative: 'Conservador',
  base_realistic: 'Base realista',
  optimized: 'Optimizado',
  stress: 'Estrés',
}

function metricById(data: TenantDiagnosticData, id: string): TenantMetric | undefined {
  return data.metrics.find(metric => metric.id === id)
}

function numericMetric(data: TenantDiagnosticData, id: string): number | null {
  const metric = metricById(data, id)
  if (!metric || metric.value === null || metric.status === 'brecha_critica') return null
  const value = Number(metric.value)
  return Number.isFinite(value) ? value : null
}

function confidenceForMetric(metric: TenantMetric): EvidenceConfidence {
  if (metric.confidence === 'verified_official' || metric.confidence === 'verified_secondary') return 'high'
  if (metric.confidence === 'inferred_medium') return 'medium'
  if (metric.confidence === 'inferred_low' || metric.confidence === 'pending_validation') return 'low'
  return 'blocked'
}

function claimFromMetric(metric: TenantMetric): ClaimLedgerEntry | null {
  if (!metric.source || !metric.source_date || !metric.method) return null
  const blocked = metric.status === 'brecha_critica' || metric.value === null
  return {
    id: `claim-${metric.id}`,
    claim: blocked
      ? `${metric.label}: brecha crítica documentada.`
      : `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}.`,
    source: metric.source,
    source_date: metric.source_date,
    method: metric.method,
    territorial_scope: metric.territorial_scope,
    source_type: metric.status === 'inferido' ? 'model' : 'document',
    confidence: blocked ? 'blocked' : confidenceForMetric(metric),
    human_status: metric.validation_status ?? (metric.status === 'verificado' ? 'validated_human' : blocked ? 'blocked_by_gap' : 'pending_human_validation'),
  }
}

export function renderableClaims(entries: ClaimLedgerEntry[]): ClaimLedgerEntry[] {
  return entries.filter(entry =>
    Boolean(entry.claim && entry.source && entry.source_date && entry.method && entry.confidence !== 'blocked'),
  )
}

export function isValidDataPoint(dp: DataPoint): boolean {
  if (dp.category === 'investigated') {
    return Boolean(dp.source_institution && dp.source_document && dp.source_year)
  }
  if (dp.category === 'calculated') {
    return Boolean(dp.formula && dp.derived_from_field_ids && dp.derived_from_field_ids.length >= 2)
  }
  if (dp.category === 'client_provided') {
    return Boolean(dp.source_document_id && dp.literal_citation)
  }
  return false
}

export function buildPrivateGeneratorMix(input: ConsultingPackageInput): PrivateGeneratorMix[] {
  return PRIVATE_CATEGORIES.map(category => {
    const share = input.documentedPrivateMix?.[category.id] ?? null
    return {
      ...category,
      share_pct: share,
      evidence_status: share === null ? 'critical_gap' : 'documented',
      rationale: share === null
        ? 'Falta censo o fuente API/documental para cuantificar esta categoría en el municipio.'
        : 'Participación documentada o cargada por el tenant; usar como insumo de escenario, no como dato oficial sin revisión.',
    }
  })
}

export function buildMaterialPriceMix(input: ConsultingPackageInput): MaterialPriceMix[] {
  const registry = input.inputRegistry
    ?? (input.apiLayerPayloads
      ? buildConsultingInputRegistryWithApiLayers(input.tenantData, input.apiLayerPayloads)
      : buildConsultingInputRegistry(input.tenantData))
  const buyersAvailable = input.buyersAvailable ?? registry.buyers_available
  return MATERIALS.map(material => {
    if (!buyersAvailable) {
      return {
        material,
        weighted_price_mxn_per_kg: null,
        channels: [],
        rejection_pct: 0,
        logistics_cost_mxn_per_kg: 0,
        quality_penalty_mxn_per_kg: 0,
        formula: 'bloqueado_sin_compradores_ni_precios',
        derived_from_field_ids: [],
        confidence: 'blocked',
        source: 'Compradores y precios no cargados',
        note: 'Sin comprador, cotización o catálogo vigente, el material no genera ingreso en el paquete cliente.',
      }
    }

    const researchKey = MATERIAL_RESEARCH_KEY[material]
    const research = researchKey ? MATERIAL_PRICE_RESEARCH[researchKey] : null
    const basePrice = research?.recommended ?? 1
    const source = research
      ? `${research.sourceSummary}. ${research.explanation}`
      : 'Sin referencia documental especifica; usar sólo como supuesto interno de escenario.'
    const channels: MaterialPriceChannel[] = QUALITY_DISTRIBUTIONS[material].map(channel => ({
      label: channel.label,
      share_pct: channel.share_pct,
      price_mxn_per_kg: Number((basePrice * channel.factor).toFixed(2)),
      rationale: channel.rationale,
      data_category: 'calculated',
      source,
      confidence: research ? (research.status === 'validado' ? 'medium' : 'low') : 'low',
    }))
    const rejection_pct = channels.find(channel => /rechaz|sin salida|no aprovechable/i.test(channel.label))?.share_pct ?? 0
    const logistics = material === 'vidrio' ? 0.75 : material === 'orgánico' ? 0.3 : 0.45
    const qualityPenalty = material === 'orgánico' ? 0.35 : material === 'vidrio' ? 0.2 : 0.25
    const weighted = channels.reduce((sum, channel) => sum + channel.price_mxn_per_kg * (channel.share_pct / 100), 0)
    const net = weighted - logistics - qualityPenalty
    return {
      material,
      weighted_price_mxn_per_kg: Math.max(0, Number(net.toFixed(2))),
      channels,
      rejection_pct,
      logistics_cost_mxn_per_kg: logistics,
      quality_penalty_mxn_per_kg: qualityPenalty,
      formula: 'sum(channel.price_mxn_per_kg * channel.share_pct / 100) - logistics_cost_mxn_per_kg - quality_penalty_mxn_per_kg',
      derived_from_field_ids: [
        `material_research_${researchKey ?? material}`,
        `quality_distribution_${material}`,
        `buyers_available_${input.tenantData.tenant_id}`,
      ],
      confidence: research?.status === 'validado' ? 'medium' : 'low',
      source,
      note: 'Precio ponderado de escenario por distribución de calidad; no precio oficial, cotización ni garantía contractual. La confianza sube con cotización local o datos del cliente.',
    }
  })
}

function buildEvidenceGaps(data: TenantDiagnosticData): EvidenceGap[] {
  const blocksForGap = (gap: DocumentGap) => {
    if (gap.document_type === 'reglamento_limpia') {
      return ['emisión de plan/declaratoria', 'propuesta legal defendible']
    }
    if (gap.document_type.includes('estudio')) {
      return ['confianza cuantitativa', 'claims de caracterización']
    }
    if (gap.document_type === 'catalogo_compradores' || gap.document_type === 'cotizacion_materiales') {
      return ['derrama económica', 'escenarios financieros']
    }
    return ['trazabilidad de claims específicos', 'alcance de recomendaciones']
  }

  return data.document_gaps
    .filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)
    .map(gap => ({
      id: gap.id,
      module_id: gap.module_id,
      label: gap.label,
      reason: gap.reason,
      priority: gap.priority,
      blocks: blocksForGap(gap),
    }))
}

function buildScenarios(data: TenantDiagnosticData, materialMix: MaterialPriceMix[], gaps: EvidenceGap[]): ScenarioSet {
  const rsuTonDay = numericMetric(data, 'rsu_generation')
  const usablePrice = materialMix.find(item => item.weighted_price_mxn_per_kg !== null)?.weighted_price_mxn_per_kg ?? null
  const blockedBy = gaps.slice(0, 4).map(gap => gap.label)
  const canCalculate = rsuTonDay !== null && usablePrice !== null
  const ids: ConsultingScenario['id'][] = ['minimum_viable', 'conservative', 'base_realistic', 'optimized', 'stress']

  return {
    client_controls_enabled: false,
    founder_calibration_required: true,
    scenarios: ids.map(id => {
      if (!canCalculate) {
        return {
          id,
          label: SCENARIO_LABEL[id],
          conclusion: 'Escenario bloqueado hasta cargar línea base RSU y precios/compradores trazables.',
          capture_ton_day: null,
          circularity_pct: null,
          gross_revenue_mxn_month: null,
          opex_signal: 'not_available',
          confidence: 'blocked',
          assumptions: ['No se habilitan sliders ni cifras de relleno sin evidencia mínima.'],
          blocked_by: blockedBy,
        }
      }

      const capture = Number((rsuTonDay * SCENARIO_MULTIPLIER[id]).toFixed(2))
      const circularity = Number(((capture / rsuTonDay) * 100).toFixed(1))
      return {
        id,
        label: SCENARIO_LABEL[id],
        conclusion: `${SCENARIO_LABEL[id]} captura ${capture} t/día bajo supuestos trazados y revisión pendiente.`,
        capture_ton_day: capture,
        circularity_pct: circularity,
        gross_revenue_mxn_month: Math.round(capture * 1000 * usablePrice * 30),
        opex_signal: id === 'optimized' ? 'high' : id === 'stress' ? 'medium' : 'medium',
        confidence: 'low',
        assumptions: [
          'Mix privado urbano distribuido por categorías; requiere censo local para elevar confianza.',
          'Precio ponderado de escenario; requiere cotización vigente antes de decisión comercial.',
        ],
        blocked_by: blockedBy,
      }
    }),
  }
}

function buildReadinessGates(
  data: TenantDiagnosticData,
  inputRegistry: ConsultingInputRegistry,
  scenarioSet: ScenarioSet,
  claimLedger: ClaimLedgerEntry[],
): ReadinessGate[] {
  const hasRsuBaseline = numericMetric(data, 'rsu_generation') !== null
  const hasAffirmableClaims = renderableClaims(claimLedger).length > 0
  const hasOpenReglamentoGap = data.document_gaps.some(gap =>
    gap.status === 'pending' && !gap.marked_not_applicable && gap.document_type === 'reglamento_limpia',
  )
  const hasScenarioNumbers = scenarioSet.scenarios.some(scenario => scenario.capture_ton_day !== null)

  return [
    {
      id: 'rsu_baseline',
      label: 'Línea base RSU',
      passed: hasRsuBaseline,
      required: false,
      evidence: hasRsuBaseline ? 'Métrica RSU disponible con metadata mínima.' : 'Falta línea base RSU municipal; el plan puede emitirse sin cifra cerrada si existe reglamento.',
      blocks: 'Cifras de línea base y escenarios cuantitativos',
    },
    {
      id: 'local_field_study',
      label: 'Estudio local',
      passed: inputRegistry.has_local_field_study,
      required: false,
      evidence: inputRegistry.has_local_field_study ? 'Estudio local o caracterización verificada disponible.' : 'Falta estudio local; benchmark no sustituye dato municipal, pero no bloquea la emisión condicionada del plan.',
      blocks: 'Composición y claims de caracterización',
    },
    {
      id: 'buyers_prices',
      label: 'Compradores y precios',
      passed: inputRegistry.buyers_available,
      required: false,
      evidence: inputRegistry.buyers_available ? 'Catálogo/cotización integrado.' : 'Faltan compradores o cotizaciones integradas; la derrama queda como brecha o escenario no cuantificado.',
      blocks: 'Derrama económica',
    },
    {
      id: 'legal_review',
      label: 'Marco legal',
      passed: inputRegistry.legal_ready,
      required: true,
      evidence: inputRegistry.legal_ready ? 'Reglamento integrado; habilita emisión de plan/declaratoria razonable con brechas explícitas.' : 'Falta reglamento vigente; es el único documento obligatorio para emitir plan/declaratoria.',
      blocks: 'Emisión de plan/declaratoria',
    },
    {
      id: 'critical_gaps',
      label: 'Bloqueo legal mínimo',
      passed: !hasOpenReglamentoGap,
      required: false,
      evidence: hasOpenReglamentoGap ? 'La brecha crítica abierta corresponde al reglamento.' : 'No hay bloqueo legal mínimo abierto; las demás brechas condicionan alcance.',
      blocks: 'Sólo bloquea emisión si falta reglamento',
    },
    {
      id: 'claim_ledger',
      label: 'Claim ledger',
      passed: hasAffirmableClaims,
      required: false,
      evidence: hasAffirmableClaims ? 'Hay claims afirmables con fuente, fecha y método.' : 'No hay claims afirmables; el plan debe presentarse como ruta de trabajo sin afirmaciones fuertes.',
      blocks: 'Afirmaciones fuertes',
    },
    {
      id: 'scenario_set',
      label: 'Escenarios cerrados',
      passed: hasScenarioNumbers,
      required: false,
      evidence: hasScenarioNumbers ? 'Escenarios calculados como no oficiales y condicionados.' : 'Escenarios no cuantificados por evidencia insuficiente; el plan puede emitirse cualitativo y trazado.',
      blocks: 'Paquete financiero cuantitativo',
    },
  ]
}

function buildPlanEmissionStatus(
  inputRegistry: ConsultingInputRegistry,
  scenarioSet: ScenarioSet,
): PlanEmissionStatus {
  const hasScenarioNumbers = scenarioSet.scenarios.some(scenario => scenario.capture_ton_day !== null)
  if (!inputRegistry.legal_ready) {
    return {
      can_emit_plan: false,
      blocked_by_regulation: true,
      mode: 'blocked_missing_regulation',
      label: 'Bloqueado por reglamento',
      explanation: 'Sin reglamento municipal vigente integrado, la plataforma no debe emitir plan/declaratoria formal.',
      required_human_action: 'Cargar, cotejar y validar reglamento antes de emitir plan.',
    }
  }
  if (!hasScenarioNumbers) {
    return {
      can_emit_plan: true,
      blocked_by_regulation: false,
      mode: 'conditioned_with_gaps',
      label: 'Plan condicionable',
      explanation: 'Con reglamento integrado, la plataforma puede emitir plan razonable aunque existan brechas; las cifras faltantes quedan no cuantificadas.',
      required_human_action: 'Revisar brechas, límites de uso y capítulos no cuantificados antes de presentar.',
    }
  }
  return {
    can_emit_plan: true,
    blocked_by_regulation: false,
    mode: 'quantified_conditioned',
    label: 'Plan cuantificado preliminar',
    explanation: 'Con reglamento y escenarios trazables, la plataforma puede emitir plan preliminar cuantificado sujeto a revisión humana.',
    required_human_action: 'Validar supuestos, compradores, precios y límites antes de uso institucional externo.',
  }
}

export function buildConsultingPackage(input: ConsultingPackageInput): ConsultingPackage {
  const { tenantData } = input
  const rawInputRegistry = input.inputRegistry
    ?? (input.apiLayerPayloads
      ? buildConsultingInputRegistryWithApiLayers(tenantData, input.apiLayerPayloads)
      : buildConsultingInputRegistry(tenantData))
  const inputRegistry = input.buyersAvailable === undefined
    ? rawInputRegistry
    : { ...rawInputRegistry, buyers_available: input.buyersAvailable }
  const normalizedInput = { ...input, inputRegistry }
  const evidenceGaps = buildEvidenceGaps(tenantData)
  const privateMix = buildPrivateGeneratorMix(normalizedInput)
  const materialMix = buildMaterialPriceMix(normalizedInput)
  const claimLedger = tenantData.metrics.map(claimFromMetric).filter((claim): claim is ClaimLedgerEntry => Boolean(claim))
  const scenarioSet = buildScenarios(tenantData, materialMix, evidenceGaps)
  const readinessGates = buildReadinessGates(tenantData, inputRegistry, scenarioSet, claimLedger)
  const planEmission = buildPlanEmissionStatus(inputRegistry, scenarioSet)
  const hasScenarios = scenarioSet.scenarios.some(scenario => scenario.capture_ton_day !== null)
  const bibliographyTenants = input.bibliographyTenants ?? [tenantData]
  const evidenceRecommendations = buildEvidenceRecommendations(tenantData, bibliographyTenants).slice(0, 12)
  const stageEvidenceMap = buildStageEvidenceMap(tenantData, bibliographyTenants)

  return {
    tenant_id: tenantData.tenant_id,
    municipality: tenantData.municipality,
    executive_diagnosis: inputRegistry.legal_ready
      ? hasScenarios
        ? 'La plataforma puede emitir un plan razonable con reglamento integrado y escenarios preliminares condicionados a evidencia, supuestos trazados y revisión humana.'
        : 'La plataforma puede emitir un plan razonable con reglamento integrado; las cifras faltantes quedan como brechas, supuestos o capítulos no cuantificados.'
      : 'El paquete de consultoría está estructurado, pero no debe emitir plan/declaratoria mientras falte el reglamento municipal vigente.',
    evidence_gaps: evidenceGaps,
    private_generator_mix: privateMix,
    material_price_mix: materialMix,
    scenario_set: scenarioSet,
    risk_matrix: [
      { risk: 'Evidencia documental insuficiente', level: evidenceGaps.length ? 'high' : 'medium', mitigation: 'Cerrar brechas críticas antes de presentar claims cuantitativos.' },
      { risk: 'Precio de materiales no contratado', level: input.buyersAvailable ? 'medium' : 'high', mitigation: 'Validar compradores, cotizaciones y logística por material.' },
      { risk: 'Captura privada sin censo local', level: privateMix.some(item => item.share_pct === null) ? 'high' : 'medium', mitigation: 'Levantar o cargar padrón privado por categoría urbana.' },
    ],
    roadmap: [
      { phase: 'Marco legal', gate: 'Reglamento municipal vigente integrado', output: 'Habilitación de plan/declaratoria razonable' },
      { phase: 'Investigación', gate: 'Evidencia disponible clasificada por fuente, fecha, método y confianza', output: 'Mapa de brechas y claim ledger inicial' },
      { phase: 'Modelado', gate: 'Sólo calcular donde existan datos o supuestos internos trazados', output: 'Escenarios cerrados o capítulos no cuantificados' },
      { phase: 'Planeación', gate: 'Revisión humana de supuestos y brechas', output: 'Hoja de ruta y matriz de riesgos' },
      { phase: 'Decisión', gate: 'No presentar brechas como verdad municipal', output: 'Paquete preliminar para revisión institucional' },
    ],
    claim_ledger: claimLedger,
    conditional_recommendations: [
      'Priorizar padrón privado urbano antes de escalar escenarios financieros.',
      'No esperar todos los documentos para planear: con reglamento vigente, emitir plan condicionado y dejar brechas explícitas.',
      'Validar compradores y precios por material antes de comunicar derrama económica.',
    ],
    input_registry: inputRegistry,
    readiness_gates: readinessGates,
    plan_emission: planEmission,
    evidence_recommendations: evidenceRecommendations,
    stage_evidence_map: stageEvidenceMap,
  }
}
