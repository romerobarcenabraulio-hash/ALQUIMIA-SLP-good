import type { ConsultingInputLayer } from '@/lib/consultingInputRegistry'

export type ConsultingApiMethod = 'GET' | 'POST'

export interface ConsultingApiLayerContract {
  layer: ConsultingInputLayer
  capability: string
  method: ConsultingApiMethod
  endpoint: string
  requiredFor: string[]
  officiality: 'source_input' | 'calculation_input' | 'review_input'
  clientExposure: 'claim_ledger_only' | 'gap_or_summary_only' | 'internal_only'
}

export const CONSULTING_API_LAYER_CONTRACTS: ConsultingApiLayerContract[] = [
  {
    layer: 'national',
    capability: 'Perfil territorial y separación municipio/ZM',
    method: 'GET',
    endpoint: '/national/municipios/{municipio_id}/profile',
    requiredFor: ['M00B', 'M01'],
    officiality: 'source_input',
    clientExposure: 'claim_ledger_only',
  },
  {
    layer: 'data',
    capability: 'KPIs con procedencia y estado de confianza',
    method: 'GET',
    endpoint: '/data/{zm}/snapshot',
    requiredFor: ['M00B', 'M01', 'M04'],
    officiality: 'source_input',
    clientExposure: 'claim_ledger_only',
  },
  {
    layer: 'centros_acopio',
    capability: 'Compradores, centros y cobertura operativa',
    method: 'GET',
    endpoint: '/api/v1/centros-acopio/',
    requiredFor: ['M02', 'M13'],
    officiality: 'review_input',
    clientExposure: 'gap_or_summary_only',
  },
  {
    layer: 'macros',
    capability: 'Macrogeneradores y captura privada urbana',
    method: 'GET',
    endpoint: '/macros/generators',
    requiredFor: ['M02', 'M13'],
    officiality: 'calculation_input',
    clientExposure: 'gap_or_summary_only',
  },
  {
    layer: 'market',
    capability: 'Precios, compradores y colocación por material',
    method: 'GET',
    endpoint: '/market/buyers',
    requiredFor: ['M13'],
    officiality: 'calculation_input',
    clientExposure: 'claim_ledger_only',
  },
  {
    layer: 'legal',
    capability: 'Reglamento, fuente legal y revisión normativa municipal',
    method: 'GET',
    endpoint: '/legal/{municipio_id}/source-manifest',
    requiredFor: ['M03B', 'M15'],
    officiality: 'review_input',
    clientExposure: 'claim_ledger_only',
  },
  {
    layer: 'operations',
    capability: 'Rutas, logística y operación de campo',
    method: 'GET',
    endpoint: '/operations/summary/{municipio_id}',
    requiredFor: ['M08', 'M14'],
    officiality: 'calculation_input',
    clientExposure: 'gap_or_summary_only',
  },
  {
    layer: 'standards',
    capability: 'Readiness técnico y cumplimiento verificable',
    method: 'GET',
    endpoint: '/api/v1/standards/readiness/{municipio_id}',
    requiredFor: ['M14', 'M15'],
    officiality: 'review_input',
    clientExposure: 'claim_ledger_only',
  },
  {
    layer: 'documents',
    capability: 'Archivo documental del tenant y estado de integración',
    method: 'GET',
    endpoint: '/api/tenants/{tenant_id}/documents',
    requiredFor: ['M00', 'M00B', 'M01', 'M02', 'M03B', 'M13', 'M14', 'M15'],
    officiality: 'review_input',
    clientExposure: 'claim_ledger_only',
  },
]

export function consultingApiContractForLayer(layer: ConsultingInputLayer): ConsultingApiLayerContract {
  const contract = CONSULTING_API_LAYER_CONTRACTS.find(item => item.layer === layer)
  if (!contract) throw new Error(`Capa consultiva sin contrato API: ${layer}`)
  return contract
}

export function consultingApiContractsByLayer(): Record<ConsultingInputLayer, ConsultingApiLayerContract> {
  return CONSULTING_API_LAYER_CONTRACTS.reduce((acc, contract) => {
    acc[contract.layer] = contract
    return acc
  }, {} as Record<ConsultingInputLayer, ConsultingApiLayerContract>)
}
