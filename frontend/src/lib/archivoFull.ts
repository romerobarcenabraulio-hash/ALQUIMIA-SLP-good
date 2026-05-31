import {
  classifyDocumentByFilename,
  getTenantArchiveData,
  registerTenantDocument,
} from '@/lib/documentArchiveStore'
import type { DocumentGap, TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'

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
  extraction_method: 'regex'
  literal_citation: string
  validation_status: 'pending'
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
      validation_status: 'pending',
    })
  }
  for (const match of text.matchAll(amountRegex)) {
    extractions.push({
      field_id: 'monto_detectado',
      value: match[0].trim(),
      extraction_method: 'regex',
      literal_citation: match[0].trim(),
      validation_status: 'pending',
    })
  }
  for (const match of text.matchAll(dateRegex)) {
    extractions.push({
      field_id: 'fecha_detectada',
      value: match[0].trim(),
      extraction_method: 'regex',
      literal_citation: match[0].trim(),
      validation_status: 'pending',
    })
  }
  return extractions
}

export function validateLiteralCitation(sourceText: string, literalCitation: string): boolean {
  return Boolean(literalCitation.trim()) && sourceText.includes(literalCitation.trim())
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
  for (const attachment of payload.Attachments ?? []) {
    const bytes = Uint8Array.from(Buffer.from(attachment.Content, 'base64'))
    const file = new File([bytes], attachment.Name, { type: attachment.ContentType })
    const result = await registerTenantDocument(tenantId, file, payload.From)
    documents.push(result.document)
  }

  return {
    tenant_id: tenantId,
    documents_received: documents.length,
    not_applicable_detected: marked.map(gap => gap.id),
    message: 'Correo recibido para procesamiento documental; toda extracción queda pendiente de revisión humana.',
  }
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
