import {
  consultingApiContractForLayer,
  type ConsultingApiLayerContract,
} from '@/lib/consultingApiLayerContracts'
import {
  buildConsultingInputRegistry,
  type ConsultingInputLayer,
  type ConsultingInputRegistry,
  type ConsultingInputSource,
} from '@/lib/consultingInputRegistry'
import type { TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'

export interface ConsultingApiLayerPayload {
  layer: ConsultingInputLayer
  available: boolean
  label?: string
  source?: string
  source_date?: string
  method?: string
  territorial_scope?: TenantMetric['territorial_scope']
  confidence?: ConsultingInputSource['confidence']
  blocks?: string[]
  payload?: unknown
}

export interface ConsultingApiLayerAdapterResult {
  source: ConsultingInputSource
  contract: ConsultingApiLayerContract
  payload: unknown
}

function blocksForLayer(layer: ConsultingInputLayer): string[] {
  if (layer === 'market') return ['precio ponderado', 'derrama económica']
  if (layer === 'legal') return ['propuesta legal defendible', 'paquete de decisión']
  if (layer === 'operations') return ['logística', 'optimización operativa']
  if (layer === 'centros_acopio') return ['capacidad de acopio', 'readiness operativo']
  if (layer === 'macros') return ['captura privada', 'riesgo de implementación']
  if (layer === 'standards') return ['readiness técnico', 'cumplimiento verificable']
  if (layer === 'documents') return ['claim ledger', 'gates documentales']
  return ['claim afirmable', 'escenario cuantitativo']
}

function missingRequiredMetadata(payload: ConsultingApiLayerPayload): string[] {
  const fields: Array<[string, unknown]> = [
    ['source', payload.source],
    ['source_date', payload.source_date],
    ['method', payload.method],
    ['territorial_scope', payload.territorial_scope],
    ['confidence', payload.confidence],
  ]
  return fields.filter(([, value]) => !value).map(([key]) => key)
}

export function adaptConsultingApiLayerPayload(payload: ConsultingApiLayerPayload): ConsultingApiLayerAdapterResult {
  const contract = consultingApiContractForLayer(payload.layer)
  const missing = missingRequiredMetadata(payload)
  const status = payload.available && missing.length === 0 ? 'available' : payload.available ? 'gap' : 'blocked'
  const method = missing.length > 0
    ? `${payload.method ?? 'Payload recibido.'} Metadata incompleta: ${missing.join(', ')}.`
    : payload.method

  const source: ConsultingInputSource = {
    layer: payload.layer,
    label: payload.label ?? contract.capability,
    status,
    source: payload.source ?? `Sin fuente integrada para ${contract.endpoint}`,
    source_date: payload.source_date ?? 'sin_fecha',
    method: method ?? 'Payload recibido sin evidencia utilizable.',
    territorial_scope: payload.territorial_scope ?? 'municipio',
    confidence: status === 'available' ? payload.confidence ?? 'low' : status === 'gap' ? 'low' : 'blocked',
    blocks: status === 'available' ? [] : payload.blocks ?? blocksForLayer(payload.layer),
  }

  return { source, contract, payload: payload.payload }
}

export function mergeApiLayerSourcesIntoRegistry(
  baseRegistry: ConsultingInputRegistry,
  adapterResults: ConsultingApiLayerAdapterResult[],
): ConsultingInputRegistry {
  const apiSources = adapterResults.map(result => result.source)
  const sources = [...baseRegistry.sources, ...apiSources]
  const sourceReady = (layer: ConsultingInputLayer) =>
    sources.some(source => source.layer === layer && source.status === 'available')
  const municipalSourceReady = (layer: ConsultingInputLayer) =>
    sources.some(source => source.layer === layer && source.status === 'available' && source.territorial_scope === 'municipio')

  return {
    sources,
    buyers_available: baseRegistry.buyers_available || sourceReady('market') || sourceReady('centros_acopio'),
    legal_ready: baseRegistry.legal_ready || municipalSourceReady('legal'),
    operations_ready: baseRegistry.operations_ready || municipalSourceReady('operations'),
    private_inventory_ready: baseRegistry.private_inventory_ready || sourceReady('macros') || sourceReady('centros_acopio'),
    has_local_field_study: baseRegistry.has_local_field_study || sources.some(source =>
      source.layer === 'data'
      && source.status === 'available'
      && source.territorial_scope === 'municipio'
      && /cuarteo|caracterizaci[oó]n|field/i.test(source.label),
    ),
  }
}

export function buildConsultingInputRegistryWithApiLayers(
  tenantData: TenantDiagnosticData,
  payloads: ConsultingApiLayerPayload[],
): ConsultingInputRegistry {
  const baseRegistry = buildConsultingInputRegistry(tenantData)
  const adapted = payloads.map(adaptConsultingApiLayerPayload)
  return mergeApiLayerSourcesIntoRegistry(baseRegistry, adapted)
}
