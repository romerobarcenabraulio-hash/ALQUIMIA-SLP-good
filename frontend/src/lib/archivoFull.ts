import {
  classifyDocumentByFilename,
  getTenantArchiveData,
  registerTenantDocument,
} from '@/lib/documentArchiveStore'
import type { DocumentGap, TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'
import { buildConsultingPackage, renderableClaims } from '@/lib/consultingPackageEngine'
import { CONSULTING_API_LAYER_CONTRACTS } from '@/lib/consultingApiLayerContracts'
import { buildTemplateReadiness } from '@/lib/alquimiaTemplates'
import { buildChicagoBibliography, formatChicagoCitationSource } from '@/lib/citations'
import JSZip from 'jszip'

export const DOCUMENT_MENTION_PATTERNS: Array<{ document_type: string; pattern: RegExp }> = [
  { document_type: 'reglamento_limpia', pattern: /reglamento\s+(de|sobre|para)\s+(limpia|aseo|residuos|gesti[oó]n integral)/gi },
  { document_type: 'plan_desarrollo', pattern: /plan\s+(municipal|estatal)\s+de\s+desarrollo/gi },
  { document_type: 'presupuesto_egresos', pattern: /presupuesto\s+de\s+egresos/gi },
  { document_type: 'cuenta_publica', pattern: /cuenta\s+p[úu]blica/gi },
  { document_type: 'organigrama', pattern: /organigrama|manual\s+de\s+organizaci[oó]n/gi },
  { document_type: 'acuerdo_cabildo', pattern: /acuerdo\s+de\s+cabildo|acta\s+de\s+cabildo/gi },
  { document_type: 'estudio_cuarteo', pattern: /estudio\s+de\s+cuarteo|caracterizaci[oó]n\s+de\s+residuos/gi },
  { document_type: 'estudio_rutas', pattern: /estudio\s+de\s+rutas|rutas\s+de\s+recolecci[oó]n/gi },
  { document_type: 'censo_pepenadores', pattern: /censo\s+de\s+pepenadores|padr[oó]n\s+de\s+recicladores/gi },
  { document_type: 'auditoria_infraestructura', pattern: /auditor[ií]a\s+de\s+infraestructura|inventario\s+de\s+infraestructura/gi },
  { document_type: 'catalogo_compradores', pattern: /cat[aá]logo\s+de\s+compradores|compradores\s+de\s+materiales|centros\s+de\s+acopio/gi },
  { document_type: 'cotizacion_materiales', pattern: /cotizaci[oó]n\s+de\s+materiales|precios\s+de\s+materiales|precio\s+ponderado/gi },
]

export interface DetectedDocumentMention {
  document_type: string
  matched_text: string
  classification: ReturnType<typeof classifyDocumentByFilename>
}

export interface CitationUrlCheck {
  url: string
  status: 'accessible' | 'inaccessible' | 'probable_scan_too_large' | 'timeout' | 'invalid_url'
  http_status?: number
  content_type?: string | null
  content_length?: number | null
}

export interface StructuredExtraction {
  field_id: string
  value: string
  extraction_method: 'regex' | 'not_extractable' | 'llm_guarded'
  literal_citation: string
  validation_status: 'auto_integrated' | 'not_extractable' | 'rejected'
}

export interface InboundAttachmentPayload {
  Name: string
  ContentType: string
  Content: string
}

export interface InboundEmailPayload {
  From: string
  TextBody?: string
  Attachments?: InboundAttachmentPayload[]
}

export interface DocumentProcessingResult {
  filename: string
  document_type: string
  module_id: string
  text_method: 'native_pdf' | 'docx_xml' | 'xlsx_xml' | 'image_manual_required' | 'unsupported'
  extracted_text: string
  extractions: StructuredExtraction[]
  validation_status: 'auto_integrated' | 'not_extractable' | 'rejected'
  llm_processed: false
  llm_processing_cost_usd: 0
}

export interface DigestOutboxEntry {
  id: string
  tenant_id: string
  subject: string
  body: string
  created_at: string
  sending_status: 'queued_for_provider' | 'preview_only'
}

const archivoRuntime = globalThis as typeof globalThis & {
  __alquimiaDigestOutbox?: DigestOutboxEntry[]
  __alquimiaDocumentProcessing?: Record<string, DocumentProcessingResult[]>
}

function digestOutbox(): DigestOutboxEntry[] {
  archivoRuntime.__alquimiaDigestOutbox ??= []
  return archivoRuntime.__alquimiaDigestOutbox
}

function processingLog(): Record<string, DocumentProcessingResult[]> {
  archivoRuntime.__alquimiaDocumentProcessing ??= {}
  return archivoRuntime.__alquimiaDocumentProcessing
}

export function detectDocumentMentions(text: string): DetectedDocumentMention[] {
  return DOCUMENT_MENTION_PATTERNS.flatMap(({ document_type, pattern }) => {
    pattern.lastIndex = 0
    return [...text.matchAll(pattern)].map(match => ({
      document_type,
      matched_text: match[0],
      classification: classifyDocumentByFilename(`${document_type}.pdf`),
    }))
  })
}

export async function checkCitationUrl(url: string, timeoutMs = 2500): Promise<CitationUrlCheck> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { url, status: 'invalid_url' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(parsed, { method: 'HEAD', signal: controller.signal })
    const contentType = response.headers.get('content-type')
    const contentLength = Number(response.headers.get('content-length') ?? 0) || null
    if (!response.ok) {
      return { url, status: 'inaccessible', http_status: response.status, content_type: contentType, content_length: contentLength }
    }
    if (contentType?.includes('pdf') && contentLength && contentLength > 50 * 1024 * 1024) {
      return { url, status: 'probable_scan_too_large', http_status: response.status, content_type: contentType, content_length: contentLength }
    }
    return { url, status: 'accessible', http_status: response.status, content_type: contentType, content_length: contentLength }
  } catch {
    return { url, status: 'timeout' }
  } finally {
    clearTimeout(timeout)
  }
}

export function extractStructuredFields(text: string): StructuredExtraction[] {
  const extractions: StructuredExtraction[] = []
  const articleRegex = /Art[íi]culo\s+(\d+)[.\-\s]+([\s\S]{20,220}?)(?=Art[íi]culo|\n\s*\n|$)/gi
  const amountRegex = /\$\s?([\d,]+(?:\.\d{2})?)\s*(MXN|pesos|mxn)?/gi
  const dateRegex = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi

  for (const match of text.matchAll(articleRegex)) {
    extractions.push({
      field_id: `articulo_${match[1]}`,
      value: match[2].trim(),
      extraction_method: 'regex',
      literal_citation: match[0].trim(),
      validation_status: 'auto_integrated',
    })
  }
  for (const match of text.matchAll(amountRegex)) {
    extractions.push({
      field_id: 'monto_detectado',
      value: match[0].trim(),
      extraction_method: 'regex',
      literal_citation: match[0].trim(),
      validation_status: 'auto_integrated',
    })
  }
  for (const match of text.matchAll(dateRegex)) {
    extractions.push({
      field_id: 'fecha_detectada',
      value: match[0].trim(),
      extraction_method: 'regex',
      literal_citation: match[0].trim(),
      validation_status: 'auto_integrated',
    })
  }
  return extractions
}

export function validateLiteralCitation(sourceText: string, literalCitation: string): boolean {
  return Boolean(literalCitation.trim()) && sourceText.includes(literalCitation.trim())
}

export function validateLlmExtraction(sourceText: string, extraction: StructuredExtraction): StructuredExtraction {
  if (extraction.extraction_method !== 'llm_guarded') return extraction
  if (!validateLiteralCitation(sourceText, extraction.literal_citation)) {
    return { ...extraction, validation_status: 'rejected' }
  }
  return { ...extraction, validation_status: 'auto_integrated' }
}

export function calculateValidationPercentage(data: TenantDiagnosticData): number {
  const total = Math.max(data.metrics.length, 1)
  const validated = data.metrics.filter(metric => metric.status === 'verificado' && metric.confidence !== 'critical_gap').length
  return Math.round((validated / total) * 100)
}

export function calculateDigestDocCount(digestCount: number): number {
  const digestNumber = digestCount + 1
  if (digestNumber <= 2) return 3
  if (digestNumber <= 4) return 5
  return 8
}

export function buildWeeklyDigest(data: TenantDiagnosticData, digestCount = 0) {
  const pending = data.document_gaps
    .filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
    .slice(0, calculateDigestDocCount(digestCount))
  const pct = calculateValidationPercentage(data)

  return {
    subject: `Documentos pendientes para tu diagnóstico de ${data.municipality}`,
    body: [
      `Tu diagnóstico está en ${pct}% validado.`,
      '',
      'Documentos pendientes:',
      ...pending.map((gap, index) => `${index + 1}. ${gap.label} · ${gap.reason}`),
      '',
      'Si alguno no aplica, responde con "[número] no aplica" y se conservará la trazabilidad sin volver a solicitarlo.',
    ].join('\n'),
    pending_gaps: pending,
    validation_pct: pct,
  }
}

export function enqueueWeeklyDigest(tenantId: string, digestCount = 0, providerConfigured = false): DigestOutboxEntry {
  const data = getTenantArchiveData(tenantId)
  const digest = buildWeeklyDigest(data, digestCount)
  const entry: DigestOutboxEntry = {
    id: `digest-${tenantId}-${Date.now()}`,
    tenant_id: tenantId,
    subject: digest.subject,
    body: digest.body,
    created_at: new Date().toISOString(),
    sending_status: providerConfigured ? 'queued_for_provider' : 'preview_only',
  }
  digestOutbox().push(entry)
  return entry
}

export function getDigestOutbox(tenantId?: string): DigestOutboxEntry[] {
  return tenantId ? digestOutbox().filter(entry => entry.tenant_id === tenantId) : [...digestOutbox()]
}

export function parseNotApplicableReply(body: string): number[] {
  return [...body.matchAll(/(\d+)\s+no\s+aplica/gi)].map(match => Number(match[1])).filter(Number.isFinite)
}

export function buildOperationalMetrics(data: TenantDiagnosticData) {
  const received = data.tenant_documents.length
  const integrated = data.tenant_documents.filter(document => document.upload_status === 'integrated').length
  const notApplicable = data.document_gaps.filter(gap => gap.marked_not_applicable).length
  return {
    documents_received: received,
    integration_success_rate: received ? Math.round((integrated / received) * 100) : 0,
    code_vs_llm_pct: 100,
    llm_cost_usd: 0,
    not_applicable_count: notApplicable,
    validation_pct: calculateValidationPercentage(data),
  }
}

export async function processInboundEmailForTenant(tenantId: string, payload: InboundEmailPayload) {
  const data = getTenantArchiveData(tenantId)
  const notApplicablePositions = parseNotApplicableReply(payload.TextBody ?? '')
  const pending = data.document_gaps.filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)
  const marked: DocumentGap[] = []

  for (const position of notApplicablePositions) {
    const gap = pending[position - 1]
    if (gap) marked.push(gap)
  }

  const documents = []
  const processed: DocumentProcessingResult[] = []
  for (const attachment of payload.Attachments ?? []) {
    const bytes = Uint8Array.from(Buffer.from(attachment.Content, 'base64'))
    const file = new File([bytes], attachment.Name, { type: attachment.ContentType })
    const result = await registerTenantDocument(tenantId, file, payload.From)
    documents.push(result.document)
    processed.push(await processUploadedDocument(file))
  }
  processingLog()[tenantId] = [...(processingLog()[tenantId] ?? []), ...processed]

  return {
    tenant_id: tenantId,
    documents_received: documents.length,
    documents_processed: processed.length,
    processing_results: processed,
    not_applicable_detected: marked.map(gap => gap.id),
    message: 'Correo recibido, documento integrado y extracción determinística registrada. Las cifras se usan según jerarquía de evidencia y límites de uso.',
  }
}

export function getDocumentProcessingLog(tenantId: string): DocumentProcessingResult[] {
  return processingLog()[tenantId] ?? []
}

export async function processUploadedDocument(file: File): Promise<DocumentProcessingResult> {
  const classification = classifyDocumentByFilename(file.name)
  const extracted = await extractTextFromFile(file)
  const extractions = extracted.text_method === 'image_manual_required' || !extracted.text.trim()
    ? [{
        field_id: 'document_text_not_extractable',
        value: 'Documento recibido como evidencia, pero no produjo texto extraíble en esta corrida.',
        extraction_method: 'not_extractable' as const,
        literal_citation: '',
        validation_status: 'not_extractable' as const,
      }]
    : extractStructuredFields(extracted.text)

  return {
    filename: file.name,
    document_type: classification.document_type,
    module_id: classification.module_id,
    text_method: extracted.text_method,
    extracted_text: extracted.text.slice(0, 5000),
    extractions,
    validation_status: extractions.some(item => item.validation_status === 'not_extractable')
      ? 'not_extractable'
      : 'auto_integrated',
    llm_processed: false,
    llm_processing_cost_usd: 0,
  }
}

export async function extractTextFromFile(file: File): Promise<{ text_method: DocumentProcessingResult['text_method']; text: string }> {
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const xml = await zip.file('word/document.xml')?.async('string')
    return { text_method: 'docx_xml', text: xml ? xmlToText(xml) : '' }
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const sharedStrings = await zip.file('xl/sharedStrings.xml')?.async('string')
    const sheets = await Promise.all(
      Object.keys(zip.files)
        .filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
        .map(name => zip.file(name)?.async('string')),
    )
    return { text_method: 'xlsx_xml', text: [sharedStrings, ...sheets].filter(Boolean).map(xml => xmlToText(xml ?? '')).join('\n') }
  }
  if (file.type === 'application/pdf') {
    const text = new TextDecoder('latin1').decode(await file.arrayBuffer())
    const candidates = [...text.matchAll(/\(([^()]{3,160})\)/g)].map(match => match[1])
    return { text_method: 'native_pdf', text: candidates.length ? candidates.join('\n') : text.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑ$.,:\-\s]/g, ' ').replace(/\s+/g, ' ').trim() }
  }
  if (file.type.startsWith('image/')) {
    return { text_method: 'image_manual_required', text: '' }
  }
  return { text_method: 'unsupported', text: '' }
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function priorityWeight(priority: DocumentGap['priority']) {
  if (priority === 'critical') return 4
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

export function missingEvidenceFields(metric: TenantMetric): string[] {
  return [
    ['source', metric.source],
    ['source_date', metric.source_date],
    ['method', metric.method],
    ['confidence', metric.confidence],
  ].filter(([, value]) => !value).map(([key]) => key)
}

export function buildConsultingExportManifest(data: TenantDiagnosticData) {
  const consultingPackage = buildConsultingPackage({
    tenantData: data,
    bibliographyTenants: Object.values(TENANT_DIAGNOSTIC_FIXTURES),
  })
  const affirmableClaims = renderableClaims(consultingPackage.claim_ledger)
  const blockedClaims = consultingPackage.claim_ledger.filter(claim => claim.confidence === 'blocked')
  const bibliographyChicago = buildChicagoBibliography(data.metrics)
  const compatibleBibliographyChicago = consultingPackage.evidence_recommendations.map(recommendation => ({
    id: recommendation.id,
    tag: recommendation.tag,
    score: recommendation.score.total,
    supported_claim: recommendation.supported_claim,
    unsupported_claim: recommendation.unsupported_claim,
    citation: formatChicagoCitationSource(recommendation.record),
  }))

  return {
    package_type: 'consulting_package_rsu_gobierno',
    tenant_id: data.tenant_id,
    municipality: data.municipality,
    state: data.state,
    generated_at: data.generated_at,
    status: data.status,
    product_positioning: 'Paquete de consultoría automatizada; no dashboard, no simulador libre, no acto de autoridad.',
    human_review_required: false,
    client_controls_enabled: consultingPackage.scenario_set.client_controls_enabled,
    founder_calibration_required: consultingPackage.scenario_set.founder_calibration_required,
    evidence_gaps: consultingPackage.evidence_gaps.map(gap => ({
      id: gap.id,
      module_id: gap.module_id,
      label: gap.label,
      reason: gap.reason,
      priority: gap.priority,
      blocks: gap.blocks,
    })),
    api_layer_contracts: CONSULTING_API_LAYER_CONTRACTS,
    input_registry: consultingPackage.input_registry,
    scenarios: consultingPackage.scenario_set.scenarios.map(scenario => ({
      id: scenario.id,
      label: scenario.label,
      capture_ton_day: scenario.capture_ton_day,
      circularity_pct: scenario.circularity_pct,
      gross_revenue_mxn_month: scenario.gross_revenue_mxn_month,
      confidence: scenario.confidence,
      blocked_by: scenario.blocked_by,
      assumptions: scenario.assumptions,
    })),
    claim_ledger: {
      affirmable_count: affirmableClaims.length,
      blocked_count: blockedClaims.length,
      affirmable: affirmableClaims,
      blocked: blockedClaims,
    },
    bibliography_chicago: bibliographyChicago,
    compatible_bibliography_chicago: compatibleBibliographyChicago,
    private_generator_mix: consultingPackage.private_generator_mix,
    material_price_mix: consultingPackage.material_price_mix,
    readiness_gates: consultingPackage.readiness_gates,
    plan_emission: consultingPackage.plan_emission,
    template_readiness: buildTemplateReadiness(data),
    bibliography_recommendations: consultingPackage.evidence_recommendations,
    stage_evidence_map: consultingPackage.stage_evidence_map,
    roadmap: consultingPackage.roadmap,
    risk_matrix: consultingPackage.risk_matrix,
    non_negotiables: [
      'Nada calculado o inferido se presenta como oficial.',
      'Benchmark no sustituye estudio local.',
      'Municipio y zona metropolitana no se mezclan.',
      'Toda afirmación fuerte requiere fuente, fecha, método, alcance, confianza y límite de uso.',
      'Si falta evidencia, se muestra brecha crítica.',
    ],
  }
}
