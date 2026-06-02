import { describe, expect, it } from 'vitest'
import {
  classifyDocumentByFilename,
  getTenantArchiveData,
  markGapNotApplicable,
  registerTenantDocument,
  validateArchiveFile,
  MAX_DOCUMENT_BYTES,
  moduleMatches,
} from '@/lib/documentArchiveStore'

describe('documentArchiveStore · ARCHIVO MVP embebido', () => {
  it('crea gaps documentales por tenant y conserva índice común', () => {
    const demo = getTenantArchiveData('municipio-demo')
    const complete = getTenantArchiveData('complete-city')
    const partial = getTenantArchiveData('partial-city')
    const gap = getTenantArchiveData('gap-city')
    const canonicalIndex = partial.document_index.map(item => ({
      id: item.id,
      title: item.title,
      required: item.required,
    }))

    expect(demo.document_index).toHaveLength(partial.document_index.length)
    expect(complete.document_index).toHaveLength(partial.document_index.length)
    expect(gap.document_index).toHaveLength(partial.document_index.length)
    for (const data of [demo, complete, partial, gap]) {
      expect(data.document_index.map(item => ({
        id: item.id,
        title: item.title,
        required: item.required,
      }))).toEqual(canonicalIndex)
    }
    expect(demo.document_gaps.length).toBeGreaterThan(partial.document_gaps.length)
    expect(partial.document_gaps.some(item => item.status === 'pending')).toBe(true)
    expect(demo.document_index.some(item => item.documentary_status === 'received_pending_validation')).toBe(true)
    expect(demo.document_gaps.some(item => item.status === 'pending')).toBe(true)
    expect(gap.document_index.every(item => item.documentary_status === 'pending_document')).toBe(true)
  })

  it('mantiene municipio-demo como demo bibliografico con calculos trazables', () => {
    const demo = getTenantArchiveData('municipio-demo')

    expect(demo.municipality).toBe('San Luis Potosí')
    expect(demo.state).toBe('San Luis Potosí')
    expect(demo.metrics.some(metric => metric.id === 'population_total' && metric.status === 'verificado')).toBe(true)
    expect(demo.metrics.some(metric => metric.id === 'rsu_generation' && metric.formula)).toBe(true)
    expect(demo.metrics.some(metric => metric.status === 'brecha_critica')).toBe(true)
    expect(demo.tenant_documents.some(document => document.document_type === 'catalogo_compradores')).toBe(true)
  })

  it('clasifica filename sin usar nombres internos cliente-facing', () => {
    expect(classifyDocumentByFilename('Reglamento de limpia 2025.pdf')).toMatchObject({
      document_type: 'reglamento_limpia',
      module_id: 'M03B',
    })
    expect(classifyDocumentByFilename('presupuesto-egresos.xlsx')).toMatchObject({
      document_type: 'presupuesto_egresos',
      module_id: 'M09',
    })
    expect(classifyDocumentByFilename('catalogo-compradores-locales.xlsx')).toMatchObject({
      document_type: 'catalogo_compradores',
      module_id: 'M13',
    })
    expect(classifyDocumentByFilename('cotizacion-precios-materiales-mayo.pdf')).toMatchObject({
      document_type: 'cotizacion_materiales',
      module_id: 'M13',
    })
    expect(classifyDocumentByFilename('catalogo-documental-general.pdf')).toMatchObject({
      document_type: 'documento_soporte',
      module_id: 'M01',
    })
    expect(moduleMatches('M03B', 'marco_legal')).toBe(true)
    expect(moduleMatches('M09', 'escenarios_financieros')).toBe(true)
    expect(moduleMatches('M13', 'market_readiness')).toBe(true)
  })

  it('acepta PDF válido, registra documento y mantiene pendiente de validación', async () => {
    const file = new File(['%PDF-1.4'], 'reglamento_limpia.pdf', { type: 'application/pdf' })
    const result = await registerTenantDocument('partial-city', file, 'user-test')
    const data = getTenantArchiveData('partial-city')

    expect(result.document.upload_status).toBe('received')
    expect(data.tenant_documents.some(document => document.original_filename === 'reglamento_limpia.pdf')).toBe(true)
    expect(data.document_gaps.some(gap => gap.status === 'received' && gap.fulfilled_by_document_id)).toBe(true)
  })

  it('recibe documentos de mercado sin convertirlos automáticamente en insumo integrado', async () => {
    const file = new File(['precio,material'], 'catalogo_compradores_2026.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const result = await registerTenantDocument('market-upload-city', file, 'user-market')
    const data = getTenantArchiveData('market-upload-city')

    expect(result.document.document_type).toBe('catalogo_compradores')
    expect(result.document.module_id).toBe('M13')
    expect(result.suggested_label).toBe('Catálogo de compradores y centros de acopio')
    expect(data.tenant_documents.some(document => (
      document.document_type === 'catalogo_compradores'
      && document.upload_status === 'received'
    ))).toBe(true)
  })

  it('respeta la clasificación sugerida por el módulo aunque el filename sea genérico', async () => {
    const file = new File(['contenido'], 'documento-general.pdf', { type: 'application/pdf' })
    const result = await registerTenantDocument('module-directed-upload-city', file, 'user-module', {
      module_id: 'M03B',
      document_type: 'reglamento_limpia',
    })

    expect(result.document.module_id).toBe('M03B')
    expect(result.document.document_type).toBe('reglamento_limpia')
    expect(result.document.classification_confidence).toBe('manual')
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
