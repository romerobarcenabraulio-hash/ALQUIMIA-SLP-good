import { describe, expect, it } from 'vitest'
import { buildConsultingInputRegistry } from '@/lib/consultingInputRegistry'
import { TENANT_DIAGNOSTIC_FIXTURES, type TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

describe('consultingInputRegistry', () => {
  it('blocks municipio-demo inputs instead of pretending API coverage exists', () => {
    const registry = buildConsultingInputRegistry(TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'])

    expect(registry.buyers_available).toBe(false)
    expect(registry.legal_ready).toBe(false)
    expect(registry.operations_ready).toBe(false)
    expect(registry.has_local_field_study).toBe(false)
    expect(registry.sources.some(source => source.status === 'blocked')).toBe(true)
  })

  it('marks integrated buyer and legal documents as available inputs', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const tenantData: TenantDiagnosticData = {
      ...base,
      tenant_documents: [
        {
          id: 'doc-buyers',
          tenant_id: base.tenant_id,
          uploaded_by_user_id: 'founder',
          module_id: 'M13',
          document_type: 'catalogo_compradores',
          original_filename: 'catalogo-compradores.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 1200,
          storage_path_or_url: '/tmp/catalogo-compradores.pdf',
          upload_status: 'integrated',
          classification_confidence: 'manual',
          uploaded_at: base.generated_at,
          processed_at: base.generated_at,
        },
        {
          id: 'doc-legal',
          tenant_id: base.tenant_id,
          uploaded_by_user_id: 'founder',
          module_id: 'M03B',
          document_type: 'reglamento_limpia',
          original_filename: 'reglamento.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 1800,
          storage_path_or_url: '/tmp/reglamento.pdf',
          upload_status: 'integrated',
          classification_confidence: 'manual',
          uploaded_at: base.generated_at,
          processed_at: base.generated_at,
        },
      ],
    }

    const registry = buildConsultingInputRegistry(tenantData)

    expect(registry.buyers_available).toBe(true)
    expect(registry.legal_ready).toBe(true)
    expect(registry.sources.find(source => source.label === 'Catálogo de compradores')?.status).toBe('available')
    expect(registry.sources.find(source => source.label === 'Reglamento municipal vigente')?.status).toBe('available')
  })

  it('keeps received market documents as gaps until human integration', () => {
    const base = TENANT_DIAGNOSTIC_FIXTURES['partial-city']
    const tenantData: TenantDiagnosticData = {
      ...base,
      tenant_documents: [
        {
          id: 'doc-received-buyers',
          tenant_id: base.tenant_id,
          uploaded_by_user_id: 'municipal-user',
          module_id: 'M13',
          document_type: 'catalogo_compradores',
          original_filename: 'catalogo-compradores.xlsx',
          mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          file_size_bytes: 1200,
          storage_path_or_url: '/tmp/catalogo-compradores.xlsx',
          upload_status: 'received',
          classification_confidence: 'suggested_by_filename',
          uploaded_at: base.generated_at,
          processed_at: null,
        },
      ],
    }

    const registry = buildConsultingInputRegistry(tenantData)
    const source = registry.sources.find(item => item.label === 'Catálogo de compradores')

    expect(registry.buyers_available).toBe(false)
    expect(source?.status).toBe('gap')
    expect(source?.method).toMatch(/no habilita afirmaciones/i)
  })
})
