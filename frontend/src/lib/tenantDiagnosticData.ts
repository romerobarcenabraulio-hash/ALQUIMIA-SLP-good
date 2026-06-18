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
  consulted_at?: string
  method: string
  confidence: MetricConfidence
  territorial_scope: 'municipio' | 'zm' | 'estado' | 'nacional'
  status: 'verificado' | 'inferido' | 'pendiente' | 'brecha_critica'
  citation_id?: string
  field_id?: string
  derived_from?: string[]
  formula?: string
  validation_status?: 'validated_human' | 'pending_human_validation' | 'blocked_by_gap'
}

export interface TenantDocumentSlot {
  id: string
  title: string
  required: boolean
  status: 'ready' | 'partial' | 'critical_gap'
  documentary_status?: 'complete' | 'pending_document' | 'not_applicable'
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
  municipio_id?: string
  clave_inegi?: string
  zm?: string
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

const DEMO_DOCUMENT_INDEX: TenantDocumentSlot[] = STANDARD_CITY_DOCUMENT_INDEX.map(slot => ({
  ...slot,
  status: slot.id === '03_field_studies' || slot.id === '04_financial_scenarios' ? 'partial' : 'ready',
}))

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
  demo_sandbox_gap: {
    id: 'demo_sandbox_gap',
    institution: 'ALQUIMIA',
    title: 'Sandbox founder sin datos cargados',
    parent_document: 'Registro interno de demostracion',
    year_or_date: today,
    consulted_at: today,
  },
  inegi_slp_censo_2020: {
    id: 'inegi_slp_censo_2020',
    institution: 'Instituto Nacional de Estadistica y Geografia',
    title: 'Principales resultados del Censo de Poblacion y Vivienda 2020. San Luis Potosi',
    parent_document: 'Censo de Poblacion y Vivienda 2020',
    year_or_date: '2020',
    url: 'https://www.inegi.org.mx/contenidos/productos/prod_serv/contenidos/espanol/bvinegi/productos/nueva_estruc/702825198305.pdf',
    consulted_at: '2026-06-02',
  },
  semarnat_dbgir_2020: {
    id: 'semarnat_dbgir_2020',
    institution: 'Secretaria de Medio Ambiente y Recursos Naturales',
    title: 'Diagnostico Basico para la Gestion Integral de los Residuos 2020',
    year_or_date: '2020',
    url: 'https://www.gob.mx/semarnat/prensa/presenta-semarnat-el-diagnostico-basico-para-la-gestion-integral-de-residuos-2020',
    consulted_at: '2026-06-02',
  },
  slp_material_price_research: {
    id: 'slp_material_price_research',
    institution: 'ALQUIMIA',
    title: 'Investigacion_Precios_RSU_SLP.xlsx',
    parent_document: 'Matriz de trazabilidad documental de precios y compradores',
    year_or_date: '2026',
    consulted_at: '2026-06-02',
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
  catalogo_compradores: 'Catálogo de compradores y centros de acopio',
  cotizacion_materiales: 'Cotización vigente de materiales reciclables',
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
  catalogo_compradores: 'M13',
  cotizacion_materiales: 'M13',
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
      documentType === 'reglamento_limpia' ? 'critical' : documentType.startsWith('estudio_') ? 'high' : 'high',
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
  'municipio-demo': {
    tenant_id: 'municipio-demo',
    municipality: 'San Luis Potosí',
    state: 'San Luis Potosí',
    status: 'preliminary_ready',
    version: 1,
    generated_at: today,
    metrics: [
      {
        id: 'population_total',
        label: 'Población municipal',
        value: 911908,
        unit: 'hab.',
        source: 'INEGI, Censo de Población y Vivienda 2020',
        source_date: '2020',
        consulted_at: '2026-06-02',
        method: 'Dato investigado municipal; no usa ZM como sustituto.',
        confidence: 'verified_secondary',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'inegi_slp_censo_2020',
        field_id: 'poblacion_total',
        validation_status: 'pending_human_validation',
      },
      {
        id: 'rsu_generation',
        label: 'Generación RSU calculada',
        value: 860.8,
        unit: 't/día',
        source: 'INEGI 2020 + SEMARNAT DBGIR 2020',
        source_date: '2020',
        consulted_at: '2026-06-02',
        method: 'Calculado como población municipal INEGI 2020 × 0.944 kg/hab/día SEMARNAT; no es aforo municipal ni estudio local.',
        formula: '911,908 hab × 0.944 kg/hab/día ÷ 1,000',
        derived_from: ['poblacion_total', 'semarnat_generacion_per_capita_rsu_2020'],
        confidence: 'inferred_medium',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'semarnat_dbgir_2020',
        field_id: 'generacion_rsu_calculada',
        validation_status: 'pending_human_validation',
      },
      {
        id: 'field_characterization',
        label: 'Caracterización física local',
        value: null,
        unit: '',
        source: 'Sin estudio local cargado',
        source_date: today,
        method: 'Brecha crítica; el benchmark no sustituye estudio local',
        confidence: 'critical_gap',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'demo_sandbox_gap',
        validation_status: 'blocked_by_gap',
      },
      {
        id: 'material_price_mix',
        label: 'Mix de precios de materiales',
        value: 'PET, HDPE, cartón, vidrio, aluminio y orgánico',
        unit: '',
        source: 'Investigacion_Precios_RSU_SLP.xlsx + matriz documental de compradores',
        source_date: '2026',
        consulted_at: '2026-06-02',
        method: 'Precio ponderado por escenario: distribución de calidad, merma, logística y castigo; no precio oficial ni cotización contractual.',
        confidence: 'inferred_medium',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'slp_material_price_research',
        field_id: 'material_price_mix',
        validation_status: 'pending_human_validation',
      },
      {
        id: 'routes_time_study',
        label: 'Estudio de rutas y tiempos',
        value: null,
        unit: '',
        source: 'Sin documento cargado',
        source_date: today,
        method: 'Brecha crítica para navegación de estructura; no hay dato operativo',
        confidence: 'critical_gap',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'demo_sandbox_gap',
        validation_status: 'blocked_by_gap',
      },
      {
        id: 'psp_acceptance',
        label: 'Aceptación a pago por servicio',
        value: null,
        unit: '',
        source: 'Sin estudio PSP cargado',
        source_date: today,
        method: 'Brecha crítica; no se infiere disposición de pago',
        confidence: 'critical_gap',
        territorial_scope: 'municipio',
        status: 'brecha_critica',
        citation_id: 'demo_sandbox_gap',
        validation_status: 'blocked_by_gap',
      },
    ],
    document_index: DEMO_DOCUMENT_INDEX,
    document_gaps: requiredDocumentGapsForTenant('municipio-demo', [
      'plan_desarrollo',
      'reglamento_limpia',
      'organigrama',
      'presupuesto_egresos',
      'cuenta_publica',
      'estudio_cuarteo',
      'estudio_rutas',
      'censo_pepenadores',
      'auditoria_infraestructura',
      'acuerdo_cabildo',
    ], {
      plan_desarrollo: 'Demo bibliográfico: falta PMD integrado para narrativa institucional completa.',
      reglamento_limpia: 'Demo bibliográfico: falta reglamento vigente integrado; es el único bloqueo formal para emitir plan/declaratoria.',
      organigrama: 'Demo bibliográfico: falta organigrama para asignar responsables humanos.',
      presupuesto_egresos: 'Demo bibliográfico: falta presupuesto; condiciona escenarios financieros, no bloquea diagnóstico.',
      cuenta_publica: 'Demo bibliográfico: falta cuenta pública para cotejo presupuestal.',
      estudio_cuarteo: 'Demo bibliográfico: falta estudio local de cuarteo; la composición no se afirma como municipal.',
      estudio_rutas: 'Demo bibliográfico: falta estudio de rutas y tiempos; no se optimizan rutas como verdad local.',
      censo_pepenadores: 'Demo bibliográfico: falta censo social; no se infiere población informal.',
      auditoria_infraestructura: 'Demo bibliográfico: falta inventario físico validable.',
      acuerdo_cabildo: 'Demo bibliográfico: falta acuerdo o minuta para expediente institucional.',
    }),
    tenant_documents: [
      {
        id: 'doc-municipio-demo-price-research',
        tenant_id: 'municipio-demo',
        uploaded_by_user_id: 'founder',
        module_id: 'M13',
        document_type: 'catalogo_compradores',
        original_filename: 'Investigacion_Precios_RSU_SLP.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_size_bytes: 128000,
        storage_path_or_url: 'mvp-memory://municipio-demo/Investigacion_Precios_RSU_SLP.xlsx',
        upload_status: 'integrated',
        classification_confidence: 'manual',
        uploaded_at: today,
        processed_at: today,
      },
    ],
  },
  'complete-city': {
    tenant_id: 'complete-city',
    municipio_id: 'slp',
    clave_inegi: '24028',
    zm: 'SLP',
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
    municipio_id: 'slp',
    clave_inegi: '24028',
    zm: 'SLP',
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
    municipio_id: 'slp',
    clave_inegi: '24028',
    zm: 'SLP',
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

export interface TenantMunicipalContextOverride {
  municipio_id?: string | null
  clave_inegi?: string | null
  zm?: string | null
  municipality?: string | null
  state?: string | null
}

export function withTenantMunicipalContext(
  data: TenantDiagnosticData,
  context: TenantMunicipalContextOverride,
): TenantDiagnosticData {
  return {
    ...data,
    municipio_id: context.municipio_id?.trim() || data.municipio_id,
    clave_inegi: context.clave_inegi?.trim() || data.clave_inegi,
    zm: context.zm?.trim().toUpperCase() || data.zm,
    municipality: context.municipality?.trim() || data.municipality,
    state: context.state?.trim() || data.state,
  }
}
