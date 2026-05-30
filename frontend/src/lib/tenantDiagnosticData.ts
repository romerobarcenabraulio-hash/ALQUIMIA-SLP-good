export type MetricConfidence =
  | 'verified_official'
  | 'verified_secondary'
  | 'inferred_medium'
  | 'inferred_low'
  | 'pending_validation'
  | 'critical_gap'

export interface TenantMetric {
  id: string
  label: string
  value: string | number | null
  unit: string
  source: string
  source_date: string
  method: string
  confidence: MetricConfidence
  territorial_scope: 'municipio' | 'zm' | 'estado' | 'nacional'
  status: 'verificado' | 'inferido' | 'pendiente' | 'brecha_critica'
}

export interface TenantDocumentSlot {
  id: string
  title: string
  required: boolean
  status: 'ready' | 'partial' | 'critical_gap'
  documentary_status?: 'complete' | 'pending_document' | 'received_pending_validation' | 'not_applicable'
}

export type DocumentGapStatus =
  | 'pending'
  | 'received'
  | 'processing'
  | 'integrated'
  | 'rejected'
  | 'not_applicable'

export interface DocumentGap {
  id: string
  tenant_id: string
  module_id: string
  document_type: string
  label: string
  reason: string
  detection_method: 'initial_inference' | 'manual_review' | 'filename_classification'
  status: DocumentGapStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  marked_not_applicable: boolean
  created_at: string
  updated_at: string
  fulfilled_by_document_id?: string
}

export interface TenantReceivedDocument {
  id: string
  tenant_id: string
  uploaded_by_user_id: string
  module_id: string
  document_type: string
  original_filename: string
  mime_type: string
  file_size_bytes: number
  storage_path: string
  upload_status: 'received' | 'processing' | 'integrated' | 'rejected'
  classification_confidence: 'suggested_by_filename' | 'manual' | 'low'
  uploaded_at: string
  processed_at: string | null
}

export interface TenantDiagnosticData {
  tenant_id: string
  municipality: string
  state: string
  status: 'preliminary' | 'preliminary_ready' | 'preparing' | 'official'
  version: number
  generated_at: string
  metrics: TenantMetric[]
  document_index: TenantDocumentSlot[]
  document_gaps: DocumentGap[]
  tenant_documents: TenantReceivedDocument[]
}

export const STANDARD_CITY_DOCUMENT_INDEX: TenantDocumentSlot[] = [
  { id: '01_method_statement', title: 'Resumen metodológico', required: true, status: 'ready' },
  { id: '02_waste_baseline', title: 'Diagnóstico de residuos sólidos', required: true, status: 'ready' },
  { id: '03_field_studies', title: 'Estado de estudios de campo', required: true, status: 'partial' },
  { id: '04_financial_scenarios', title: 'Escenarios financieros preliminares', required: true, status: 'partial' },
  { id: '05_risk_register', title: 'Riesgos y brechas críticas', required: true, status: 'ready' },
  { id: '06_next_steps', title: 'Próximos pasos y validación humana', required: true, status: 'ready' },
]

const today = '2026-05-29'

const documentLabels: Record<string, string> = {
  reglamento_limpia: 'Reglamento de limpia o gestión integral de residuos',
  presupuesto_egresos: 'Presupuesto de egresos municipal',
  organigrama_servicios: 'Organigrama de servicios públicos',
  plan_municipal_desarrollo: 'Plan Municipal de Desarrollo',
  cuenta_publica: 'Cuenta pública municipal',
  padron_vehicular: 'Padrón vehicular operativo',
  acuerdo_cabildo: 'Acuerdo de Cabildo relacionado',
}

export function documentLabel(documentType: string): string {
  return documentLabels[documentType] ?? documentType.replaceAll('_', ' ')
}

function gap(
  tenantId: string,
  moduleId: string,
  documentType: string,
  reason: string,
  priority: DocumentGap['priority'] = 'high',
): DocumentGap {
  return {
    id: `${tenantId}-${moduleId}-${documentType}`,
    tenant_id: tenantId,
    module_id: moduleId,
    document_type: documentType,
    label: documentLabel(documentType),
    reason,
    detection_method: 'initial_inference',
    status: 'pending',
    priority,
    marked_not_applicable: false,
    created_at: today,
    updated_at: today,
  }
}

const commonMetrics: TenantMetric[] = [
  {
    id: 'rsu_generation',
    label: 'Generación RSU estimada',
    value: 420,
    unit: 't/día',
    source: 'Fuente pública municipal o estatal disponible',
    source_date: today,
    method: 'Cotejo documental preliminar; requiere validación municipal',
    confidence: 'inferred_medium',
    territorial_scope: 'municipio',
    status: 'inferido',
  },
  {
    id: 'field_characterization',
    label: 'Caracterización física local',
    value: null,
    unit: '',
    source: 'Estudio local NMX-AA-015-1985 no cargado',
    source_date: today,
    method: 'Brecha crítica; no se sustituye con benchmark',
    confidence: 'critical_gap',
    territorial_scope: 'municipio',
    status: 'brecha_critica',
  },
]

export const TENANT_DIAGNOSTIC_FIXTURES: Record<string, TenantDiagnosticData> = {
  'complete-city': {
    tenant_id: 'complete-city',
    municipality: 'Municipio con datos suficientes',
    state: 'San Luis Potosí',
    status: 'preliminary_ready',
    version: 1,
    generated_at: today,
    metrics: [
      { ...commonMetrics[0], confidence: 'verified_secondary', status: 'verificado' },
      {
        id: 'collection_coverage',
        label: 'Cobertura de recolección reportada',
        value: 91,
        unit: '%',
        source: 'Reporte operativo municipal provisto',
        source_date: today,
        method: 'Lectura documental; pendiente firma humana',
        confidence: 'verified_secondary',
        territorial_scope: 'municipio',
        status: 'verificado',
      },
      commonMetrics[1],
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: [
      gap('complete-city', 'marco_legal', 'acuerdo_cabildo', 'El acuerdo de Cabildo no está cargado; se requiere para cerrar validación institucional.', 'medium'),
    ],
    tenant_documents: [],
  },
  'partial-city': {
    tenant_id: 'partial-city',
    municipality: 'Municipio con datos parciales',
    state: 'San Luis Potosí',
    status: 'preliminary_ready',
    version: 1,
    generated_at: today,
    metrics: [
      commonMetrics[0],
      {
        id: 'routes_time_study',
        label: 'Estudio de rutas y tiempos',
        value: null,
        unit: '',
        source: 'No provisto por municipio',
        source_date: today,
        method: 'Brecha crítica para optimización operativa',
        confidence: 'critical_gap',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
      },
      commonMetrics[1],
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: [
      gap('partial-city', 'marco_legal', 'reglamento_limpia', 'No se localizó reglamento vigente en fuente pública accesible.', 'critical'),
      gap('partial-city', 'escenarios_financieros', 'presupuesto_egresos', 'El presupuesto de egresos no está disponible con fuente suficiente para alimentar escenarios.', 'high'),
    ],
    tenant_documents: [],
  },
  'gap-city': {
    tenant_id: 'gap-city',
    municipality: 'Municipio con brechas críticas',
    state: 'San Luis Potosí',
    status: 'preliminary',
    version: 1,
    generated_at: today,
    metrics: [
      { ...commonMetrics[0], value: null, confidence: 'critical_gap', status: 'brecha_critica', method: 'Sin fuente suficiente; no se estima como verdad municipal' },
      commonMetrics[1],
      {
        id: 'psp_acceptance',
        label: 'Aceptación a pago por servicio',
        value: null,
        unit: '',
        source: 'Estudio PSP no disponible',
        source_date: today,
        method: 'Brecha crítica si existe tarifa o contraprestación',
        confidence: 'critical_gap',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
      },
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: [
      gap('gap-city', 'city_baseline', 'plan_municipal_desarrollo', 'Falta antecedente municipal para contextualizar diagnóstico sin inventar narrativa.', 'critical'),
      gap('gap-city', 'marco_legal', 'reglamento_limpia', 'No hay reglamento municipal accesible; el módulo conserva brecha documental.', 'critical'),
      gap('gap-city', 'organigrama', 'organigrama_servicios', 'No hay organigrama público suficiente para asignar responsables humanos.', 'high'),
      gap('gap-city', 'escenarios_financieros', 'presupuesto_egresos', 'No hay presupuesto validable para escenarios financieros defendibles.', 'critical'),
    ],
    tenant_documents: [],
  },
}

export function tenantDiagnosticDataFor(tenantId: string): TenantDiagnosticData {
  return TENANT_DIAGNOSTIC_FIXTURES[tenantId] ?? TENANT_DIAGNOSTIC_FIXTURES['partial-city']
}
