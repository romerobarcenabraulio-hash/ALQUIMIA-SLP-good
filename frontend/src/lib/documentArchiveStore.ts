import {
  TENANT_DIAGNOSTIC_FIXTURES,
  documentLabel,
  tenantDiagnosticDataFor,
  type DocumentGap,
  type TenantDiagnosticData,
  type TenantReceivedDocument,
} from '@/lib/tenantDiagnosticData'

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

export function classifyDocumentByFilename(filename: string): { document_type: string; module_id: string; confidence: TenantReceivedDocument['classification_confidence'] } {
  const normalized = filename.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (normalized.includes('reglamento')) return { document_type: 'reglamento_limpia', module_id: 'marco_legal', confidence: 'suggested_by_filename' }
  if (normalized.includes('presupuesto') || normalized.includes('egresos')) return { document_type: 'presupuesto_egresos', module_id: 'escenarios_financieros', confidence: 'suggested_by_filename' }
  if (normalized.includes('organigrama')) return { document_type: 'organigrama_servicios', module_id: 'organigrama', confidence: 'suggested_by_filename' }
  if (normalized.includes('desarrollo') || normalized.includes('pmd')) return { document_type: 'plan_municipal_desarrollo', module_id: 'city_baseline', confidence: 'suggested_by_filename' }
  if (normalized.includes('cuenta')) return { document_type: 'cuenta_publica', module_id: 'escenarios_financieros', confidence: 'suggested_by_filename' }
  if (normalized.includes('cabildo') || normalized.includes('acuerdo')) return { document_type: 'acuerdo_cabildo', module_id: 'marco_legal', confidence: 'suggested_by_filename' }
  return { document_type: 'documento_soporte', module_id: 'city_baseline', confidence: 'low' }
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
  const documents = state().documentsByTenant[tenantId] ?? []
  const document_gaps = base.document_gaps.map(gap => withOverrides(gap, tenantId))
  const document_index = base.document_index.map(slot => {
    const hasPendingGap = document_gaps.some(gap => gap.status === 'pending' && !gap.marked_not_applicable)
    const hasReceived = documents.length > 0
    return {
      ...slot,
      documentary_status: hasReceived ? 'received_pending_validation' : hasPendingGap ? 'pending_document' : 'complete',
    } satisfies typeof slot
  })
  return { ...base, document_index, document_gaps, tenant_documents: documents }
}

export async function registerTenantDocument(tenantId: string, file: File, uploadedByUserId = 'mvp_user') {
  const validationError = validateArchiveFile(file)
  if (validationError) throw new Error(validationError)
  const classification = classifyDocumentByFilename(file.name)
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
    storage_path: `mvp-memory://${tenantId}/${encodeURIComponent(file.name)}`,
    upload_status: 'received',
    classification_confidence: classification.confidence,
    uploaded_at: now,
    processed_at: null,
  }
  state().documentsByTenant[tenantId] = [...(state().documentsByTenant[tenantId] ?? []), document]

  const baseGaps = TENANT_DIAGNOSTIC_FIXTURES[tenantId]?.document_gaps ?? []
  const matchingGap = baseGaps.find(gap => gap.document_type === classification.document_type || gap.module_id === classification.module_id)
  if (matchingGap) {
    state().gapOverridesByTenant[tenantId] ??= {}
    state().gapOverridesByTenant[tenantId][matchingGap.id] = {
      status: 'received',
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
