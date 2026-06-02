import { describe, expect, it, vi } from 'vitest'
import {
  buildOperationalMetrics,
  buildWeeklyDigest,
  calculateDigestDocCount,
  calculateValidationPercentage,
  enqueueWeeklyDigest,
  extractTextFromFile,
  checkCitationUrl,
  getDocumentProcessingLog,
  getDigestOutbox,
  detectDocumentMentions,
  extractStructuredFields,
  processUploadedDocument,
  parseNotApplicableReply,
  processInboundEmailForTenant,
  validateLlmExtraction,
  validateLiteralCitation,
  buildConsultingExportManifest,
} from './archivoFull'
import { getTenantArchiveData } from './documentArchiveStore'

describe('archivoFull deterministic components', () => {
  it('detects document mentions with deterministic patterns', () => {
    const hits = detectDocumentMentions(
      'No se localizó el Reglamento de limpia ni el Plan Municipal de Desarrollo. Falta catálogo de compradores y cotización de materiales.',
    )

    expect(hits.map(hit => hit.document_type)).toContain('reglamento_limpia')
    expect(hits.map(hit => hit.document_type)).toContain('plan_desarrollo')
    expect(hits.map(hit => hit.document_type)).toContain('catalogo_compradores')
    expect(hits.map(hit => hit.document_type)).toContain('cotizacion_materiales')
  })

  it('checks citation URLs without accepting invalid URLs', async () => {
    expect(await checkCitationUrl('not-a-url')).toMatchObject({ status: 'invalid_url' })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 404 }))
    await expect(checkCitationUrl('https://example.test/no.pdf')).resolves.toMatchObject({ status: 'inaccessible', http_status: 404 })
    fetchMock.mockRestore()
  })

  it('extracts structured fields only with literal citations', () => {
    const text = 'Artículo 7. El municipio deberá separar residuos reciclables.\nPresupuesto: $1,250,000 pesos. Fecha: 3 de enero de 2026.'
    const fields = extractStructuredFields(text)

    expect(fields.some(field => field.field_id === 'articulo_7')).toBe(true)
    expect(fields.every(field => validateLiteralCitation(text, field.literal_citation))).toBe(true)
  })

  it('builds digest progression and validation percentage', () => {
    const data = getTenantArchiveData('gap-city')

    expect(calculateDigestDocCount(0)).toBe(3)
    expect(calculateDigestDocCount(2)).toBe(5)
    expect(calculateDigestDocCount(5)).toBe(8)
    expect(calculateValidationPercentage(data)).toBeGreaterThanOrEqual(0)
    expect(buildWeeklyDigest(data).pending_gaps.length).toBeLessThanOrEqual(3)
  })

  it('parses no-aplica replies and computes operational metrics', () => {
    expect(parseNotApplicableReply('1 no aplica, 3 no aplica')).toEqual([1, 3])
    expect(buildOperationalMetrics(getTenantArchiveData('partial-city'))).toMatchObject({
      code_vs_llm_pct: 100,
      llm_cost_usd: 0,
    })
  })

  it('processes inbound attachments without validating claims automatically', async () => {
    const content = Buffer.from('%PDF-1.4 (Artículo 9. El municipio deberá separar residuos reciclables.)').toString('base64')
    const result = await processInboundEmailForTenant('gap-city', {
      From: 'funcionario@gob.mx',
      TextBody: '1 no aplica',
      Attachments: [{ Name: 'reglamento_limpia.pdf', ContentType: 'application/pdf', Content: content }],
    })

    expect(result.documents_received).toBe(1)
    expect(result.documents_processed).toBe(1)
    expect(getDocumentProcessingLog('gap-city').length).toBeGreaterThan(0)
    expect(result.message).toContain('integrado')
  })

  it('extracts basic text from PDF-like files and keeps non-extractable images non-blocking', async () => {
    const pdf = new File(['%PDF-1.4 (Artículo 12. Separar residuos en origen.)'], 'reglamento.pdf', { type: 'application/pdf' })
    const image = new File(['binary'], 'scan.png', { type: 'image/png' })

    await expect(extractTextFromFile(pdf)).resolves.toMatchObject({ text_method: 'native_pdf' })
    const processedImage = await processUploadedDocument(image)
    expect(processedImage.validation_status).toBe('not_extractable')
    expect(processedImage.llm_processed).toBe(false)
  })

  it('rejects guarded LLM extraction when literal citation is not present', () => {
    const result = validateLlmExtraction('Texto fuente real', {
      field_id: 'obligacion',
      value: 'Separación obligatoria',
      extraction_method: 'llm_guarded',
      literal_citation: 'Cita inventada',
      validation_status: 'auto_integrated',
    })

    expect(result.validation_status).toBe('rejected')
  })

  it('queues digest entries without requiring external email provider', () => {
    const before = getDigestOutbox('partial-city').length
    const entry = enqueueWeeklyDigest('partial-city')

    expect(entry.sending_status).toBe('preview_only')
    expect(getDigestOutbox('partial-city')).toHaveLength(before + 1)
  })

  it('builds consulting export manifest without turning gaps into claims', () => {
    const manifest = buildConsultingExportManifest(getTenantArchiveData('municipio-demo'))

    expect(manifest.package_type).toBe('consulting_package_rsu_gobierno')
    expect(manifest.human_review_required).toBe(false)
    expect(manifest.client_controls_enabled).toBe(false)
    expect(manifest.claim_ledger.affirmable.every(claim => (
      claim.confidence !== 'blocked'
      && !claim.claim.toLowerCase().includes('brecha crítica')
    ))).toBe(true)
    expect(manifest.claim_ledger.blocked_count).toBeGreaterThan(0)
    expect(manifest.bibliography_chicago.length).toBeGreaterThan(0)
    expect(manifest.bibliography_chicago[0]).toContain('Consultado el')
    expect(manifest.compatible_bibliography_chicago.length).toBeGreaterThan(0)
    expect(manifest.compatible_bibliography_chicago[0].citation).toContain('Consultado el')
    expect(manifest.plan_emission).toMatchObject({
      can_emit_plan: false,
      blocked_by_regulation: true,
    })
    expect(manifest.scenarios.some(scenario => scenario.capture_ton_day !== null)).toBe(true)
    expect(manifest.scenarios.every(scenario => scenario.confidence === 'low')).toBe(true)
    expect(manifest.material_price_mix.some(item => item.derived_from_field_ids.some(fieldId => (
      fieldId.startsWith('buyers_available_')
    )))).toBe(true)
    expect(manifest.material_price_mix.every(item => item.note.includes('no precio oficial'))).toBe(true)
    expect(manifest.input_registry.buyers_available).toBe(true)
    expect(manifest.api_layer_contracts.map(contract => contract.layer).sort()).toEqual([
      'centros_acopio',
      'data',
      'documents',
      'legal',
      'macros',
      'market',
      'national',
      'operations',
      'standards',
    ])
    expect(manifest.readiness_gates.some(gate => gate.id === 'critical_gaps' && !gate.passed)).toBe(true)
  })
})
