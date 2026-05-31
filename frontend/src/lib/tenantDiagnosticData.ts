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
  citation_id?: string
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
  storage_path_or_url: string
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

export interface CitationRecord {
  id: string
  institution: string
  title: string
  parent_document?: string
  year_or_date: string
  url?: string
  consulted_at: string
}

export const CITATION_REGISTRY: Record<string, CitationRecord> = {
  public_municipal_preliminary: {
    id: 'public_municipal_preliminary',
    institution: 'Fuente publica municipal o estatal disponible',
    title: 'Cotejo documental preliminar para diagnostico de residuos',
    parent_document: 'Expediente inicial ALQUIMIA',
    year_or_date: today,
    consulted_at: today,
  },
  local_field_study_gap: {
    id: 'local_field_study_gap',
    institution: 'Municipio solicitante',
    title: 'Estudio local NMX-AA-015-1985 no cargado',
    parent_document: 'Registro de brecha critica',
    year_or_date: today,
    consulted_at: today,
  },
  municipal_operations_report: {
    id: 'municipal_operations_report',
    institution: 'Reporte operativo municipal provisto',
    title: 'Cobertura de recoleccion reportada',
    parent_document: 'Documentacion preliminar del tenant',
    year_or_date: today,
    consulted_at: today,
  },
  missing_routes_study: {
    id: 'missing_routes_study',
    institution: 'Municipio solicitante',
    title: 'Estudio de rutas y tiempos no provisto',
    parent_document: 'Registro de brecha critica',
    year_or_date: today,
    consulted_at: today,
  },
  missing_psp_study: {
    id: 'missing_psp_study',
    institution: 'Municipio solicitante',
    title: 'Estudio PSP no disponible',
    parent_document: 'Registro de brecha critica',
    year_or_date: today,
    consulted_at: today,
  },
}

const documentLabels: Record<string, string> = {
  reglamento_limpia: 'Reglamento de limpia o gestión integral de residuos',
  plan_desarrollo: 'Plan Municipal de Desarrollo',
  presupuesto_egresos: 'Presupuesto de egresos municipal',
  organigrama: 'Organigrama de servicios públicos',
  cuenta_publica: 'Cuenta pública municipal',
  acuerdo_cabildo: 'Acuerdo de Cabildo relacionado',
  estudio_cuarteo: 'Estudio de cuarteo y caracterización',
  estudio_rutas: 'Estudio de rutas y tiempos',
  censo_pepenadores: 'Censo de pepenadores y trabajadores informales',
  auditoria_infraestructura: 'Auditoría de infraestructura existente',
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

const DOCUMENT_TYPE_MODULE: Record<string, string> = {
  reglamento_limpia: 'M03B',
  plan_desarrollo: 'M00B',
  presupuesto_egresos: 'M09',
  organigrama: 'M07',
  cuenta_publica: 'M09',
  acuerdo_cabildo: 'M15',
  estudio_cuarteo: 'M01',
  estudio_rutas: 'M08',
  censo_pepenadores: 'M02',
  auditoria_infraestructura: 'M06',
}

export function requiredDocumentGapsForTenant(
  tenantId: string,
  missingDocumentTypes: string[],
  reasonByType: Partial<Record<string, string>> = {},
): DocumentGap[] {
  return missingDocumentTypes.map(documentType =>
    gap(
      tenantId,
      DOCUMENT_TYPE_MODULE[documentType] ?? 'M01',
      documentType,
      reasonByType[documentType] ?? 'Documento requerido no disponible en fuente pública accesible.',
      documentType.startsWith('estudio_') || documentType === 'reglamento_limpia' ? 'critical' : 'high',
    ),
  )
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
    citation_id: 'public_municipal_preliminary',
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
    citation_id: 'local_field_study_gap',
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
        citation_id: 'municipal_operations_report',
      },
      commonMetrics[1],
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: requiredDocumentGapsForTenant('complete-city', ['acuerdo_cabildo'], {
      acuerdo_cabildo: 'El acuerdo de Cabildo no está cargado; se requiere para cerrar validación institucional.',
    }),
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
        citation_id: 'missing_routes_study',
      },
      commonMetrics[1],
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: requiredDocumentGapsForTenant('partial-city', ['reglamento_limpia', 'presupuesto_egresos', 'estudio_rutas', 'estudio_cuarteo'], {
      reglamento_limpia: 'No se localizó reglamento vigente en fuente pública accesible.',
      presupuesto_egresos: 'El presupuesto de egresos no está disponible con fuente suficiente para alimentar escenarios.',
      estudio_rutas: 'El estudio de rutas y tiempos no fue provisto; no se optimizan rutas como verdad local.',
      estudio_cuarteo: 'No existe estudio local de cuarteo; la composición se mantiene como brecha crítica.',
    }),
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
        citation_id: 'missing_psp_study',
      },
    ],
    document_index: STANDARD_CITY_DOCUMENT_INDEX,
    document_gaps: requiredDocumentGapsForTenant('gap-city', [
      'plan_desarrollo',
      'reglamento_limpia',
      'organigrama',
      'presupuesto_egresos',
      'cuenta_publica',
      'estudio_cuarteo',
      'censo_pepenadores',
      'auditoria_infraestructura',
    ], {
      plan_desarrollo: 'Falta antecedente municipal para contextualizar diagnóstico sin inventar narrativa.',
      reglamento_limpia: 'No hay reglamento municipal accesible; el módulo conserva brecha documental.',
      organigrama: 'No hay organigrama público suficiente para asignar responsables humanos.',
      presupuesto_egresos: 'No hay presupuesto validable para escenarios financieros defendibles.',
      cuenta_publica: 'No hay cuenta pública disponible para contraste presupuestal.',
      estudio_cuarteo: 'No existe estudio local de cuarteo; benchmark no sustituye dato local.',
      censo_pepenadores: 'No existe censo social documentado; no se infiere población informal.',
      auditoria_infraestructura: 'No hay inventario físico validable de infraestructura.',
    }),
    tenant_documents: [],
  },
}

export function tenantDiagnosticDataFor(tenantId: string): TenantDiagnosticData {
  return TENANT_DIAGNOSTIC_FIXTURES[tenantId] ?? TENANT_DIAGNOSTIC_FIXTURES['partial-city']
}
