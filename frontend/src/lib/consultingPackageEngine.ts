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

export type ClaimSourceType = 'document' | 'api' | 'assumption' | 'model'
export type ClaimHumanStatus = 'validated_human' | 'pending_human_validation' | 'blocked_by_gap'
export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'blocked'

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
}

export interface MaterialPriceMix {
  material: string
  weighted_price_mxn_per_kg: number | null
  channels: MaterialPriceChannel[]
  rejection_pct: number
  logistics_cost_mxn_per_kg: number
  quality_penalty_mxn_per_kg: number
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

const MATERIALS = ['PET', 'HDPE', 'cartón', 'vidrio', 'aluminio', 'orgánico', 'otros']

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
        confidence: 'blocked',
        source: 'Compradores y precios no cargados',
        note: 'Sin comprador, cotización o catálogo vigente, el material no genera ingreso en el paquete cliente.',
      }
    }

    const channels: MaterialPriceChannel[] = [
      { label: 'Venta local', share_pct: 70, price_mxn_per_kg: 4.2, rationale: 'Canal de menor fricción y menor premio por calidad.' },
      { label: 'Comprador regional', share_pct: 20, price_mxn_per_kg: 5.6, rationale: 'Requiere volumen y logística consolidada.' },
      { label: 'Lote premium', share_pct: 10, price_mxn_per_kg: 6.4, rationale: 'Depende de separación limpia y comprador validado.' },
    ]
    const rejection_pct = material === 'orgánico' ? 18 : 12
    const logistics = material === 'vidrio' ? 0.75 : 0.45
    const qualityPenalty = material === 'orgánico' ? 0.35 : 0.25
    const weighted = channels.reduce((sum, channel) => sum + channel.price_mxn_per_kg * (channel.share_pct / 100), 0)
    const net = weighted * (1 - rejection_pct / 100) - logistics - qualityPenalty
    return {
      material,
      weighted_price_mxn_per_kg: Math.max(0, Number(net.toFixed(2))),
      channels,
      rejection_pct,
      logistics_cost_mxn_per_kg: logistics,
      quality_penalty_mxn_per_kg: qualityPenalty,
      confidence: 'medium',
      source: 'Escenario técnico con compradores disponibles; requiere cotización vigente para cierre comercial.',
      note: 'Precio ponderado de escenario, no precio oficial ni garantía contractual.',
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
    evidence_recommendations: evidenceRecommendations,
    stage_evidence_map: stageEvidenceMap,
  }
}
