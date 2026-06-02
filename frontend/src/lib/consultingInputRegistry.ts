import type { TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'

export type ConsultingInputLayer =
  | 'national'
  | 'data'
  | 'centros_acopio'
  | 'macros'
  | 'market'
  | 'legal'
  | 'operations'
  | 'standards'
  | 'documents'

export type ConsultingInputStatus = 'available' | 'gap' | 'assumption' | 'blocked'

export interface ConsultingInputSource {
  layer: ConsultingInputLayer
  label: string
  status: ConsultingInputStatus
  source: string
  source_date: string
  method: string
  territorial_scope: TenantMetric['territorial_scope']
  confidence: 'high' | 'medium' | 'low' | 'blocked'
  blocks: string[]
}

export interface ConsultingInputRegistry {
  sources: ConsultingInputSource[]
  buyers_available: boolean
  legal_ready: boolean
  operations_ready: boolean
  private_inventory_ready: boolean
  has_local_field_study: boolean
}

const DOCUMENT_TO_LAYER: Array<{
  documentType: string
  layer: ConsultingInputLayer
  label: string
  blocks: string[]
}> = [
  {
    documentType: 'reglamento_limpia',
    layer: 'legal',
    label: 'Reglamento municipal vigente',
    blocks: ['emisión de plan/declaratoria', 'propuesta legal defendible'],
  },
  {
    documentType: 'presupuesto_egresos',
    layer: 'data',
    label: 'Presupuesto de egresos',
    blocks: ['escenarios financieros', 'costo de no actuar'],
  },
  {
    documentType: 'estudio_rutas',
    layer: 'operations',
    label: 'Estudio de rutas y tiempos',
    blocks: ['logística', 'optimización operativa'],
  },
  {
    documentType: 'estudio_cuarteo',
    layer: 'data',
    label: 'Estudio local de cuarteo',
    blocks: ['composición RSU', 'escenarios cuantitativos'],
  },
  {
    documentType: 'censo_pepenadores',
    layer: 'macros',
    label: 'Censo social operativo',
    blocks: ['mapa social', 'riesgo de implementación'],
  },
  {
    documentType: 'auditoria_infraestructura',
    layer: 'centros_acopio',
    label: 'Inventario de infraestructura',
    blocks: ['capacidad de acopio', 'readiness operativo'],
  },
  {
    documentType: 'catalogo_compradores',
    layer: 'market',
    label: 'Catálogo de compradores',
    blocks: ['precio ponderado', 'derrama económica'],
  },
  {
    documentType: 'cotizacion_materiales',
    layer: 'market',
    label: 'Cotización vigente de materiales',
    blocks: ['precio ponderado', 'derrama económica'],
  },
]

function metricConfidence(metric: TenantMetric): ConsultingInputSource['confidence'] {
  if (metric.status === 'brecha_critica' || metric.confidence === 'critical_gap') return 'blocked'
  if (metric.confidence === 'verified_official' || metric.confidence === 'verified_secondary') return 'high'
  if (metric.confidence === 'inferred_medium') return 'medium'
  return 'low'
}

function statusFromMetric(metric: TenantMetric): ConsultingInputStatus {
  if (metric.status === 'brecha_critica') return 'blocked'
  if (metric.status === 'verificado') return 'available'
  if (metric.status === 'inferido') return 'assumption'
  return 'gap'
}

export function buildConsultingInputRegistry(tenantData: TenantDiagnosticData): ConsultingInputRegistry {
  const documentByType = new Map(tenantData.tenant_documents.map(document => [document.document_type, document]))
  const pendingGapTypes = new Set(
    tenantData.document_gaps
      .filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)
      .map(gap => gap.document_type),
  )

  const metricSources: ConsultingInputSource[] = tenantData.metrics.map(metric => ({
    layer: 'data',
    label: metric.label,
    status: statusFromMetric(metric),
    source: metric.source,
    source_date: metric.source_date,
    method: metric.method,
    territorial_scope: metric.territorial_scope,
    confidence: metricConfidence(metric),
    blocks: metric.status === 'brecha_critica' ? ['claim afirmable', 'escenario cuantitativo'] : [],
  }))

  const documentSources: ConsultingInputSource[] = DOCUMENT_TO_LAYER.map(contract => {
    const document = documentByType.get(contract.documentType)
    const isGap = pendingGapTypes.has(contract.documentType)
    const isIntegrated = document?.upload_status === 'integrated'
    const isReceived = document?.upload_status === 'received' || document?.upload_status === 'processing'
    const isEmissionBlocker = contract.documentType === 'reglamento_limpia'
    const hasMinimumLegalReadiness = isEmissionBlocker && !isGap
    const status: ConsultingInputStatus = isIntegrated || hasMinimumLegalReadiness
      ? 'available'
      : isReceived
        ? 'gap'
        : isGap && isEmissionBlocker
          ? 'blocked'
          : 'gap'
    return {
      layer: contract.layer,
      label: contract.label,
      status,
      source: document?.original_filename ?? (hasMinimumLegalReadiness ? 'Reglamento vigente registrado en expediente base' : isGap ? 'Documento pendiente no cargado' : 'Fuente no integrada'),
      source_date: document?.processed_at ?? document?.uploaded_at ?? tenantData.generated_at,
      method: isIntegrated
        ? 'Documento integrado al tenant; requiere revisión humana si alimenta decisión institucional.'
        : hasMinimumLegalReadiness
          ? 'Sin brecha abierta de reglamento; habilita emisión condicionada del plan con revisión humana y límites explícitos.'
        : isReceived
          ? 'Documento recibido o en proceso; no habilita afirmaciones hasta integración.'
          : isEmissionBlocker
            ? 'Brecha documental obligatoria; sin reglamento no se emite plan ni declaratoria.'
            : 'Brecha documental; no bloquea plan si existe reglamento, pero condiciona alcance, confianza o claims específicos.',
      territorial_scope: 'municipio',
      confidence: isIntegrated ? 'high' : hasMinimumLegalReadiness ? 'medium' : isReceived ? 'low' : isEmissionBlocker && isGap ? 'blocked' : 'low',
      blocks: isIntegrated || hasMinimumLegalReadiness ? [] : contract.blocks,
    }
  })

  const sources = [...metricSources, ...documentSources]
  const layerIsReady = (layer: ConsultingInputLayer) =>
    sources.some(source => source.layer === layer && source.status === 'available')
  const hasAvailableDocument = (documentType: string) =>
    documentByType.get(documentType)?.upload_status === 'integrated'

  return {
    sources,
    buyers_available: hasAvailableDocument('catalogo_compradores') || hasAvailableDocument('cotizacion_materiales'),
    legal_ready: layerIsReady('legal'),
    operations_ready: layerIsReady('operations'),
    private_inventory_ready: layerIsReady('macros') || layerIsReady('centros_acopio'),
    has_local_field_study: hasAvailableDocument('estudio_cuarteo')
      || tenantData.metrics.some(metric => metric.id === 'field_characterization' && metric.status === 'verificado'),
  }
}
