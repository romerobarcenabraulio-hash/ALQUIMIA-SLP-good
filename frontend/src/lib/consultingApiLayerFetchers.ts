import {
  CONSULTING_API_LAYER_CONTRACTS,
  type ConsultingApiLayerContract,
} from '@/lib/consultingApiLayerContracts'
import type { ConsultingApiLayerPayload } from '@/lib/consultingApiLayerAdapters'
import type { ConsultingInputLayer } from '@/lib/consultingInputRegistry'
import type { TenantMetric } from '@/lib/tenantDiagnosticData'

export interface ConsultingApiRequestContext {
  tenantId: string
  municipioId: string
  municipioNombre?: string
  claveInegi?: string
  zm?: string
  sourceDate: string
}

export interface ConsultingApiFetchOptions {
  baseUrl?: string
  fetcher?: typeof fetch
  layers?: ConsultingInputLayer[]
}

function fillEndpoint(endpoint: string, context: ConsultingApiRequestContext): string {
  return endpoint
    .replace('{tenant_id}', encodeURIComponent(context.tenantId))
    .replace('{municipio_id}', encodeURIComponent(context.municipioId))
    .replace('{zm}', encodeURIComponent(context.zm ?? ''))
}

function appendParams(url: URL, params: Record<string, string | boolean | undefined>) {
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
}

export function buildConsultingApiLayerUrl(
  contract: ConsultingApiLayerContract,
  context: ConsultingApiRequestContext,
  baseUrl = 'http://localhost:8000',
): string {
  const url = new URL(fillEndpoint(contract.endpoint, context), baseUrl)

  if (contract.layer === 'centros_acopio') {
    appendParams(url, {
      municipio: context.municipioNombre,
      clave_inegi: context.claveInegi,
      verificado_only: true,
    })
  }
  if (contract.layer === 'macros') appendParams(url, { municipio: context.municipioNombre })
  if (contract.layer === 'market') appendParams(url, { zm: context.zm })

  return url.toString()
}

function confidenceFromPayload(layer: ConsultingInputLayer, payload: unknown): ConsultingApiLayerPayload['confidence'] {
  if (!payload) return 'blocked'
  if (layer === 'standards' && typeof payload === 'object' && payload !== null && 'score_global' in payload) return 'medium'
  if (Array.isArray(payload)) return payload.length > 0 ? 'medium' : 'blocked'
  if (typeof payload === 'object') return 'medium'
  return 'low'
}

function territorialScopeForLayer(layer: ConsultingInputLayer): TenantMetric['territorial_scope'] {
  return layer === 'data' || layer === 'market' ? 'zm' : 'municipio'
}

function hasUsablePayload(payload: unknown): boolean {
  if (Array.isArray(payload)) return payload.length > 0
  if (payload && typeof payload === 'object' && 'total' in payload) return Number((payload as { total?: unknown }).total ?? 0) > 0
  return Boolean(payload)
}

export async function fetchConsultingApiLayerPayload(
  contract: ConsultingApiLayerContract,
  context: ConsultingApiRequestContext,
  options: ConsultingApiFetchOptions = {},
): Promise<ConsultingApiLayerPayload> {
  const request = options.fetcher ?? fetch
  const url = buildConsultingApiLayerUrl(contract, context, options.baseUrl)
  let response: Response
  let payload: unknown = null
  try {
    response = await request(url, { method: contract.method })
    payload = response.ok ? await response.json() : null
  } catch (error) {
    return {
      layer: contract.layer,
      available: false,
      label: contract.capability,
      source: `${contract.method} ${contract.endpoint}`,
      source_date: context.sourceDate,
      method: `API existente no disponible para esta capa; ${error instanceof Error ? error.message : 'fetch fallido'}.`,
      territorial_scope: territorialScopeForLayer(contract.layer),
      confidence: 'blocked',
      payload: null,
    }
  }
  const available = response.ok && hasUsablePayload(payload)

  return {
    layer: contract.layer,
    available,
    label: contract.capability,
    source: `${contract.method} ${contract.endpoint}`,
    source_date: context.sourceDate,
    method: response.ok
      ? 'Respuesta de API existente normalizada para registro consultivo; requiere revisión humana para afirmaciones cliente.'
      : `API existente no disponible para esta capa; HTTP ${response.status}.`,
    territorial_scope: territorialScopeForLayer(contract.layer),
    confidence: available ? confidenceFromPayload(contract.layer, payload) : 'blocked',
    blocks: available ? [] : undefined,
    payload,
  }
}

export async function fetchConsultingApiLayerPayloads(
  context: ConsultingApiRequestContext,
  options: ConsultingApiFetchOptions = {},
): Promise<ConsultingApiLayerPayload[]> {
  const layerSet = new Set(options.layers ?? CONSULTING_API_LAYER_CONTRACTS.map(contract => contract.layer))
  const contracts = CONSULTING_API_LAYER_CONTRACTS.filter(contract => layerSet.has(contract.layer))
  return Promise.all(contracts.map(contract => fetchConsultingApiLayerPayload(contract, context, options)))
}
