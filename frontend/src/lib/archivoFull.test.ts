import { describe, expect, it, vi } from 'vitest'
import {
  buildOperationalMetrics,
  buildWeeklyDigest,
  calculateDigestDocCount,
  calculateValidationPercentage,
  checkCitationUrl,
  detectDocumentMentions,
  extractStructuredFields,
  parseNotApplicableReply,
  processInboundEmailForTenant,
  validateLiteralCitation,
} from './archivoFull'
import { getTenantArchiveData } from './documentArchiveStore'

describe('archivoFull deterministic components', () => {
  it('detects document mentions with deterministic patterns', () => {
    const hits = detectDocumentMentions('No se localizó el Reglamento de limpia ni el Plan Municipal de Desarrollo.')

    expect(hits.map(hit => hit.document_type)).toContain('reglamento_limpia')
    expect(hits.map(hit => hit.document_type)).toContain('plan_desarrollo')
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
    const content = Buffer.from('%PDF-1.4').toString('base64')
    const result = await processInboundEmailForTenant('gap-city', {
      From: 'funcionario@gob.mx',
      TextBody: '1 no aplica',
      Attachments: [{ Name: 'reglamento_limpia.pdf', ContentType: 'application/pdf', Content: content }],
    })

    expect(result.documents_received).toBe(1)
    expect(result.message).toContain('revisión humana')
  })
})
