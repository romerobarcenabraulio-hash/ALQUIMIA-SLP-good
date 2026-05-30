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
  },
}

export function tenantDiagnosticDataFor(tenantId: string): TenantDiagnosticData {
  return TENANT_DIAGNOSTIC_FIXTURES[tenantId] ?? TENANT_DIAGNOSTIC_FIXTURES['partial-city']
}
