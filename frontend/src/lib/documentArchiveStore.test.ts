import { describe, expect, it } from 'vitest'
import {
  classifyDocumentByFilename,
  getTenantArchiveData,
  markGapNotApplicable,
  registerTenantDocument,
  validateArchiveFile,
  MAX_DOCUMENT_BYTES,
} from '@/lib/documentArchiveStore'

describe('documentArchiveStore · ARCHIVO MVP embebido', () => {
  it('crea gaps documentales por tenant y conserva índice común', () => {
    const complete = getTenantArchiveData('complete-city')
    const partial = getTenantArchiveData('partial-city')
    const gap = getTenantArchiveData('gap-city')

    expect(complete.document_index).toHaveLength(partial.document_index.length)
    expect(gap.document_index).toHaveLength(partial.document_index.length)
    expect(partial.document_gaps.some(item => item.status === 'pending')).toBe(true)
    expect(gap.document_index.every(item => item.documentary_status === 'pending_document')).toBe(true)
  })

  it('clasifica filename sin usar nombres internos cliente-facing', () => {
    expect(classifyDocumentByFilename('Reglamento de limpia 2025.pdf')).toMatchObject({
      document_type: 'reglamento_limpia',
      module_id: 'marco_legal',
    })
    expect(classifyDocumentByFilename('presupuesto-egresos.xlsx')).toMatchObject({
      document_type: 'presupuesto_egresos',
      module_id: 'escenarios_financieros',
    })
  })

  it('acepta PDF válido, registra documento y mantiene pendiente de validación', async () => {
    const file = new File(['%PDF-1.4'], 'reglamento_limpia.pdf', { type: 'application/pdf' })
    const result = await registerTenantDocument('partial-city', file, 'user-test')
    const data = getTenantArchiveData('partial-city')

    expect(result.document.upload_status).toBe('received')
    expect(data.tenant_documents.some(document => document.original_filename === 'reglamento_limpia.pdf')).toBe(true)
    expect(data.document_gaps.some(gap => gap.status === 'received' && gap.fulfilled_by_document_id)).toBe(true)
  })

  it('rechaza tipo no permitido y archivo demasiado grande', () => {
    const script = new File(['alert(1)'], 'malware.js', { type: 'text/javascript' })
    expect(validateArchiveFile(script)).toMatch(/Tipo de archivo/)

    const huge = new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], 'grande.pdf', { type: 'application/pdf' })
    expect(validateArchiveFile(huge)).toMatch(/demasiado grande/)
  })

  it('marca no aplica sin borrar trazabilidad', () => {
    const data = getTenantArchiveData('gap-city')
    const target = data.document_gaps[0]
    const updated = markGapNotApplicable('gap-city', target.id)

    expect(updated.status).toBe('not_applicable')
    expect(updated.marked_not_applicable).toBe(true)
    expect(getTenantArchiveData('gap-city').document_gaps.some(gap => gap.id === target.id)).toBe(true)
  })
})
