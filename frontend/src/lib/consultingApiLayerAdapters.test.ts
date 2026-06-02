import { describe, expect, it } from 'vitest'
import {
  adaptConsultingApiLayerPayload,
  buildConsultingInputRegistryWithApiLayers,
} from '@/lib/consultingApiLayerAdapters'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

describe('consultingApiLayerAdapters', () => {
  it('marks an API layer available only when traceability metadata is complete', () => {
    const result = adaptConsultingApiLayerPayload({
      layer: 'market',
      available: true,
      source: 'POST /market/place',
      source_date: '2026-05-31',
      method: 'Cálculo de colocación con compradores vigentes y revisión humana pendiente.',
      territorial_scope: 'municipio',
      confidence: 'medium',
      payload: { ingresos_ajustados_mxn: 1200 },
    })

    expect(result.contract.endpoint).toBe('/market/buyers')
    expect(result.source.status).toBe('available')
    expect(result.source.blocks).toEqual([])
  })

  it('keeps an available-looking payload as gap when metadata is missing', () => {
    const result = adaptConsultingApiLayerPayload({
      layer: 'legal',
      available: true,
      source: 'GET /legal/abc/context',
      method: 'Contexto legal municipal.',
    })

    expect(result.source.status).toBe('gap')
    expect(result.source.confidence).toBe('low')
    expect(result.source.method).toMatch(/metadata incompleta/i)
    expect(result.source.blocks).toContain('propuesta legal defendible')
  })

  it('merges real layer readiness without pretending documents were integrated', () => {
    const registry = buildConsultingInputRegistryWithApiLayers(TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'], [
      {
        layer: 'market',
        available: true,
        source: 'POST /market/place',
        source_date: '2026-05-31',
        method: 'Escenario de colocación con compradores trazables.',
        territorial_scope: 'municipio',
        confidence: 'medium',
      },
      {
        layer: 'legal',
        available: false,
        source: 'GET /legal/demo/context',
        source_date: '2026-05-31',
        method: 'Sin reglamento municipal validado.',
        territorial_scope: 'municipio',
        confidence: 'blocked',
      },
    ])

    expect(registry.buyers_available).toBe(true)
    expect(registry.legal_ready).toBe(false)
    expect(registry.sources.some(source => source.layer === 'market' && source.status === 'available')).toBe(true)
    expect(registry.sources.some(source => source.layer === 'legal' && source.status === 'blocked')).toBe(true)
  })

  it('does not treat ZM payloads as municipal readiness for legal or local field study', () => {
    const registry = buildConsultingInputRegistryWithApiLayers(TENANT_DIAGNOSTIC_FIXTURES['municipio-demo'], [
      {
        layer: 'legal',
        available: true,
        source: 'GET /legal/zm/context',
        source_date: '2026-05-31',
        method: 'Contexto metropolitano no apto para decisión municipal.',
        territorial_scope: 'zm',
        confidence: 'medium',
      },
      {
        layer: 'data',
        label: 'Caracterización RSU regional',
        available: true,
        source: 'GET /data',
        source_date: '2026-05-31',
        method: 'Benchmark regional.',
        territorial_scope: 'zm',
        confidence: 'medium',
      },
    ])

    expect(registry.legal_ready).toBe(false)
    expect(registry.has_local_field_study).toBe(false)
  })
})
