import {
  TENANT_DIAGNOSTIC_FIXTURES,
  documentLabel,
  tenantDiagnosticDataFor,
  type DocumentGap,
  type TenantDiagnosticData,
  type TenantReceivedDocument,
} from '@/lib/tenantDiagnosticData'

const MODULE_ID_ALIASES: Record<string, string[]> = {
  M00B: ['antecedentes_municipales', 'city_baseline'],
  M01: ['city_baseline'],
  M02: ['social_diagnostico'],
  M03B: ['marco_legal'],
  M06: ['infraestructura'],
  M07: ['organigrama'],
  M08: ['logistica'],
  M09: ['costos_programa', 'escenarios_financieros'],
  M13: ['escenarios_financieros', 'market_readiness'],
  M15: ['expediente_cabildo'],
}

export function moduleMatches(gapModuleId: string, activeModuleId: string | null): boolean {
  if (!activeModuleId) return false
  return gapModuleId === activeModuleId || (MODULE_ID_ALIASES[gapModuleId] ?? []).includes(activeModuleId)
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

type ArchiveState = {
  documentsByTenant: Record<string, TenantReceivedDocument[]>
  gapOverridesByTenant: Record<string, Record<string, Partial<DocumentGap>>>
}

const archiveState = globalThis as typeof globalThis & { __alquimiaDocumentArchive?: ArchiveState }

function state(): ArchiveState {
  archiveState.__alquimiaDocumentArchive ??= { documentsByTenant: {}, gapOverridesByTenant: {} }
  return archiveState.__alquimiaDocumentArchive
}

type DocumentClassification = {
  document_type: string
  module_id: string
  confidence: TenantReceivedDocument['classification_confidence']
}

export function classifyDocumentByFilename(filename: string): DocumentClassification {
  const normalized = filename.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (normalized.includes('reglamento')) return { document_type: 'reglamento_limpia', module_id: 'M03B', confidence: 'suggested_by_filename' }
  if (normalized.includes('presupuesto') || normalized.includes('egresos')) return { document_type: 'presupuesto_egresos', module_id: 'M09', confidence: 'suggested_by_filename' }
  if (normalized.includes('organigrama')) return { document_type: 'organigrama', module_id: 'M07', confidence: 'suggested_by_filename' }
  if (normalized.includes('desarrollo') || normalized.includes('pmd')) return { document_type: 'plan_desarrollo', module_id: 'M00B', confidence: 'suggested_by_filename' }
  if (normalized.includes('cuenta')) return { document_type: 'cuenta_publica', module_id: 'M09', confidence: 'suggested_by_filename' }
  if (normalized.includes('cabildo') || normalized.includes('acuerdo')) return { document_type: 'acuerdo_cabildo', module_id: 'M15', confidence: 'suggested_by_filename' }
  if (normalized.includes('cuarteo') || normalized.includes('caracterizacion')) return { document_type: 'estudio_cuarteo', module_id: 'M01', confidence: 'suggested_by_filename' }
  if (normalized.includes('rutas')) return { document_type: 'estudio_rutas', module_id: 'M08', confidence: 'suggested_by_filename' }
  if (normalized.includes('pepenador')) return { document_type: 'censo_pepenadores', module_id: 'M02', confidence: 'suggested_by_filename' }
  if (normalized.includes('infraestructura')) return { document_type: 'auditoria_infraestructura', module_id: 'M06', confidence: 'suggested_by_filename' }
  if (
    normalized.includes('comprador')
    || normalized.includes('buyer')
    || (normalized.includes('catalogo') && (normalized.includes('centro') || normalized.includes('acopio') || normalized.includes('material')))
  ) return { document_type: 'catalogo_compradores', module_id: 'M13', confidence: 'suggested_by_filename' }
  if (normalized.includes('cotizacion') || normalized.includes('precio') || normalized.includes('materiales')) return { document_type: 'cotizacion_materiales', module_id: 'M13', confidence: 'suggested_by_filename' }
  return { document_type: 'documento_soporte', module_id: 'M01', confidence: 'low' }
}

export function validateArchiveFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) return 'Tipo de archivo no permitido. Sube PDF, DOCX, XLSX, JPG o PNG.'
  if (file.size > MAX_DOCUMENT_BYTES) return 'Archivo demasiado grande. El máximo permitido es 25 MB.'
  return null
}

function withOverrides(gap: DocumentGap, tenantId: string): DocumentGap {
  return { ...gap, ...state().gapOverridesByTenant[tenantId]?.[gap.id] }
}

export function getTenantArchiveData(tenantId: string): TenantDiagnosticData {
  const base = tenantDiagnosticDataFor(tenantId)
  const documents = [
    ...base.tenant_documents,
    ...(state().documentsByTenant[tenantId] ?? []),
  ]
  const document_gaps = base.document_gaps.map(gap => withOverrides(gap, tenantId))
  const document_index = base.document_index.map(slot => {
    const hasPendingGap = document_gaps.some(gap => gap.status === 'pending' && !gap.marked_not_applicable)
    const hasReceived = documents.length > 0
    return {
      ...slot,
      documentary_status: hasReceived ? 'complete' : hasPendingGap ? 'pending_document' : 'complete',
    } satisfies typeof slot
  })
  return { ...base, document_index, document_gaps, tenant_documents: documents }
}

export async function registerTenantDocument(
  tenantId: string,
  file: File,
  uploadedByUserId = 'mvp_user',
  suggestedClassification?: Partial<Pick<DocumentClassification, 'document_type' | 'module_id'>>,
) {
  const validationError = validateArchiveFile(file)
  if (validationError) throw new Error(validationError)
  const filenameClassification = classifyDocumentByFilename(file.name)
  const classification: DocumentClassification = {
    document_type: suggestedClassification?.document_type ?? filenameClassification.document_type,
    module_id: suggestedClassification?.module_id ?? filenameClassification.module_id,
    confidence: suggestedClassification?.document_type || suggestedClassification?.module_id ? 'manual' : filenameClassification.confidence,
  }
  const now = new Date().toISOString()
  const document: TenantReceivedDocument = {
    id: `doc-${tenantId}-${Date.now()}`,
    tenant_id: tenantId,
    uploaded_by_user_id: uploadedByUserId,
    module_id: classification.module_id,
    document_type: classification.document_type,
    original_filename: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    storage_path_or_url: `mvp-memory://${tenantId}/${encodeURIComponent(file.name)}`,
    upload_status: 'integrated',
    classification_confidence: classification.confidence,
    uploaded_at: now,
    processed_at: now,
  }
  state().documentsByTenant[tenantId] = [...(state().documentsByTenant[tenantId] ?? []), document]

  const baseGaps = TENANT_DIAGNOSTIC_FIXTURES[tenantId]?.document_gaps ?? []
  const matchingGap = baseGaps.find(gap => gap.document_type === classification.document_type || gap.module_id === classification.module_id)
  if (matchingGap) {
    state().gapOverridesByTenant[tenantId] ??= {}
    state().gapOverridesByTenant[tenantId][matchingGap.id] = {
      status: 'integrated',
      fulfilled_by_document_id: document.id,
      updated_at: now,
    }
  }
  return { document, suggested_label: documentLabel(document.document_type) }
}

export function markGapNotApplicable(tenantId: string, gapId: string) {
  const base = tenantDiagnosticDataFor(tenantId)
  const gap = base.document_gaps.find(item => item.id === gapId)
  if (!gap) throw new Error('Brecha documental no encontrada')
  const now = new Date().toISOString()
  state().gapOverridesByTenant[tenantId] ??= {}
  state().gapOverridesByTenant[tenantId][gapId] = {
    status: 'not_applicable',
    marked_not_applicable: true,
    updated_at: now,
  }
  return { ...gap, ...state().gapOverridesByTenant[tenantId][gapId] }
}
