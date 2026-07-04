import type { TenantDiagnosticData, TenantMetric } from '@/lib/tenantDiagnosticData'

export type AlquimiaTemplateStage = 'universal' | 'validation' | 'planning' | 'execution' | 'transversal'

export interface AlquimiaTemplateSpec {
  id: string
  filename: string
  title: string
  stage: AlquimiaTemplateStage
  purpose: string
  variables: readonly string[]
}

export interface TemplateVariableStatus {
  variable: string
  status: 'ready' | 'pending'
  source: string
  valuePreview?: string
}

export interface TemplateReadiness {
  template: AlquimiaTemplateSpec
  readyCount: number
  totalCount: number
  pendingCount: number
  variables: TemplateVariableStatus[]
}

export const ALQUIMIA_TEMPLATE_REGISTRY: readonly AlquimiaTemplateSpec[] = [
  {
    id: 'portada_institucional',
    filename: '00_PORTADA_INSTITUCIONAL.docx',
    title: 'Portada institucional',
    stage: 'universal',
    purpose: 'Portada base para cualquier documento formal exportado al cliente.',
    variables: ['MUNICIPIO', 'ESTADO', 'CLAVE_INEGI', 'FECHA', 'PERIODO', 'PRESIDENTE_MUNICIPAL', 'SUBTITULO_DESCRIPTIVO', 'TIPO_DE_DOCUMENTO', 'VERSION'],
  },
  {
    id: 'expediente_diagnostico_cabildo',
    filename: 'V01_EXPEDIENTE_DIAGNOSTICO_CABILDO.docx',
    title: 'Expediente diagnóstico para Cabildo',
    stage: 'validation',
    purpose: 'Documento principal de validación, preparado para revisión institucional y Cabildo.',
    variables: ['MUNICIPIO', 'ESTADO', 'CLAVE_INEGI', 'FECHA', 'VERSION', 'PRESIDENTE_MUNICIPAL', 'PERIODO', 'POBLACION', 'GENERACION_TOTAL', 'GEN_PER_CAPITA', 'COBERTURA_PCT', 'COSTO_OPERATIVO_ANUAL', 'COSTO_UNITARIO', 'COSTO_10_ANOS', 'AHORRO_NETO', 'FECHA_REGLAMENTO_VIGENTE', 'FECHA_VIGENCIA', 'PCT_RSU', 'NOMBRE_SITIO_DISPOSICION', 'ANOS_REMANENTES', 'MODALIDAD_SERVICIO', 'FRECUENCIA_DIAS', 'N_VEHICULOS', 'N_LOCALIDADES', 'SECRETARIA_PADRE', 'DIRECCION_RESPONSABLE', 'PRESUPUESTO_SP', 'N_REGIDORES', 'CAPEX_CONSERVADOR', 'CAPEX_MODERADO', 'CAPEX_AMBICIOSO', 'OPEX_CONSERVADOR', 'OPEX_MODERADO', 'OPEX_AMBICIOSO', 'TIR_CONSERVADOR', 'TIR_MODERADO', 'TIR_AMBICIOSO', 'VPN_MODERADO', 'VPN_AMBICIOSO', 'PAYBACK_AMBICIOSO'],
  },
  {
    id: 'resumen_ejecutivo',
    filename: 'V02_RESUMEN_EJECUTIVO.docx',
    title: 'Resumen ejecutivo',
    stage: 'validation',
    purpose: 'Version corta para alcalde, sindico, tesorero y lectura ejecutiva.',
    variables: ['MUNICIPIO', 'ESTADO', 'FECHA', 'VERSION', 'PERIODO', 'COSTO_OPERATIVO_ANUAL', 'COSTO_10_ANOS', 'AHORRO_NETO', 'FECHA_REGLAMENTO_VIGENTE', 'N_CITAS', 'N_PAGINAS'],
  },
  {
    id: 'plan_maestro_implementacion',
    filename: 'P01_PLAN_MAESTRO_IMPLEMENTACION.docx',
    title: 'Plan maestro de implementación',
    stage: 'planning',
    purpose: 'Documento principal del tier de implementacion, con infraestructura, costos y secuencia.',
    variables: ['MUNICIPIO', 'ESTADO', 'FECHA', 'VERSION', 'PERIODO', 'FECHA_APROBACION_DIAGNOSTICO', 'FECHA_PUBLICACION_REFORMA', 'MODALIDAD_PROPUESTA', 'INVERSION_TOTAL', 'CAPEX_TOTAL', 'CAPEX_INFRA', 'CAPEX_VEHICULOS', 'CAPEX_EQUIPO', 'CAPEX_CONTINGENCIA', 'OPEX_ANUAL', 'N_CENTROS_ACOPIO', 'N_VEHICULOS_NUEVOS', 'N_PERSONAL_TOTAL', 'N_TURNOS', 'HORAS_COBERTURA'],
  },
  {
    id: 'reporte_esg_trimestral',
    filename: 'E01_REPORTE_ESG_TRIMESTRAL.docx',
    title: 'Reporte ESG trimestral',
    stage: 'execution',
    purpose: 'Reporte de ejecucion con materialidad, desempeno operativo e indicadores ESG.',
    variables: ['MUNICIPIO', 'ESTADO', 'FECHA', 'VERSION', 'TRIMESTRE', 'ANO', 'PCT_AVANCE', 'GENERACION_TRIMESTRE', 'TONELADAS_PROCESADAS', 'TASA_CAPTURA', 'CO2E_EVITADO', 'GRI_306_PCT', 'N_COLONIAS', 'N_COMERCIOS', 'N_ESCUELAS', 'N_SESIONES', 'NPS', 'N_EMPLEADOS_DIRECTOS', 'N_EMPLEADOS_INDIRECTOS', 'TASA_CUMPLIMIENTO'],
  },
  {
    id: 'memoria_tecnica_metodologica',
    filename: 'T01_MEMORIA_TECNICA_METODOLOGICA.docx',
    title: 'Memoria técnica metodológica',
    stage: 'transversal',
    purpose: 'Explica como se construyo cada cifra, fuente, formula, limite y confianza.',
    variables: ['MUNICIPIO', 'FECHA', 'VERSION', 'FECHA_REGLAMENTO', 'FECHA_UPLOAD'],
  },
  {
    id: 'bibliografia_formato_alquimia',
    filename: 'T02_BIBLIOGRAFIA_FORMATO_ALQUIMIA.docx',
    title: 'Bibliografia formato Alquimia',
    stage: 'transversal',
    purpose: 'Compila fuentes con formato Alquimia adaptado de Chicago notes-bibliography.',
    variables: ['MUNICIPIO', 'ESTADO', 'FECHA', 'TITULO_DOCUMENTO', 'INSTITUCION_EMISORA', 'FECHA_PUBLICACION', 'FECHA_UPLOAD', 'PAGINA_O_SECCION', 'TEXTO_LITERAL_ENTRE_COMILLAS'],
  },
] as const

const VARIABLE_SOURCE_LABELS: Record<string, string> = {
  MUNICIPIO: 'tenant_data.municipality',
  ESTADO: 'tenant_data.state',
  CLAVE_INEGI: 'tenant_data.clave_inegi',
  FECHA: 'fecha de generacion',
  VERSION: 'tenant_data.version',
  POBLACION: 'metric field_id=poblacion_total',
  GENERACION_TOTAL: 'metric field_id=generacion_rsu_calculada',
  N_CITAS: 'metricas con citation_id',
  N_MODULOS_COMPLETOS: 'document_index listo',
  N_VALIDADO: 'metricas verificadas / total',
}

function metricByField(data: TenantDiagnosticData, fieldId: string, fallbackId?: string): TenantMetric | undefined {
  return data.metrics.find(metric => metric.field_id === fieldId || metric.id === fallbackId)
}

function preview(value: unknown, unit?: string) {
  if (value === null || value === undefined || value === '') return undefined
  return `${String(value)}${unit ? ` ${unit}` : ''}`
}

export function templateVariableStatus(variable: string, data: TenantDiagnosticData): TemplateVariableStatus {
  if (variable === 'MUNICIPIO') return { variable, status: data.municipality ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: data.municipality }
  if (variable === 'ESTADO') return { variable, status: data.state ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: data.state }
  if (variable === 'CLAVE_INEGI') return { variable, status: data.clave_inegi ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: data.clave_inegi }
  if (variable === 'FECHA') return { variable, status: 'ready', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: data.generated_at }
  if (variable === 'VERSION') return { variable, status: 'ready', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: `v${data.version}` }
  if (variable === 'POBLACION') {
    const metric = metricByField(data, 'poblacion_total', 'population_total')
    return { variable, status: metric?.value ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: preview(metric?.value, metric?.unit) }
  }
  if (variable === 'GENERACION_TOTAL') {
    const metric = metricByField(data, 'generacion_rsu_calculada', 'rsu_generation')
    return { variable, status: metric?.value ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: preview(metric?.value, metric?.unit) }
  }
  if (variable === 'N_CITAS') {
    const count = data.metrics.filter(metric => metric.citation_id).length
    return { variable, status: count > 0 ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: String(count) }
  }
  if (variable === 'N_MODULOS_COMPLETOS') {
    const ready = data.document_index.filter(slot => slot.status === 'ready').length
    return { variable, status: data.document_index.length > 0 ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: `${ready}/${data.document_index.length}` }
  }
  if (variable === 'N_VALIDADO') {
    const verified = data.metrics.filter(metric => metric.status === 'verificado').length
    const pct = data.metrics.length ? Math.round((verified / data.metrics.length) * 100) : 0
    return { variable, status: data.metrics.length ? 'ready' : 'pending', source: VARIABLE_SOURCE_LABELS[variable], valuePreview: `${pct}%` }
  }
  return {
    variable,
    status: 'pending',
    source: VARIABLE_SOURCE_LABELS[variable] ?? 'pendiente de captura, calculo o validacion founder',
  }
}

export function buildTemplateReadiness(data: TenantDiagnosticData): TemplateReadiness[] {
  return ALQUIMIA_TEMPLATE_REGISTRY.map(template => {
    const variables = template.variables.map(variable => templateVariableStatus(variable, data))
    const readyCount = variables.filter(item => item.status === 'ready').length
    return {
      template,
      readyCount,
      totalCount: variables.length,
      pendingCount: variables.length - readyCount,
      variables,
    }
  })
}
