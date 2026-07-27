import type { TenantMetric } from '@/lib/tenantDiagnosticData'

const MODULE_METRIC_PATTERNS: Record<string, RegExp[]> = {
  guia_circularidad: [],
  antecedentes_municipales: [/poblaci/i, /superficie/i, /localidad/i, /cabildo/i, /plan/i],
  city_baseline: [/rsu/i, /generaci/i, /caracterizaci/i, /cuarteo/i, /recolecci/i, /sitio.*disposici/i, /ruta/i],
  social_diagnostico: [/aceptaci/i, /pago/i, /pepenador/i, /actor/i, /social/i, /privad/i],
  capacidad_institucional: [/cobertura/i, /presupuesto/i, /cuenta/i, /organigrama/i, /capacidad/i],
  marco_legal: [/reglamento/i, /legal/i, /norma/i, /jur/i],
  costo_omision: [/costo/i, /omisi/i, /disposici/i, /presupuesto/i],
  escenarios_financieros: [/precio/i, /material/i, /comprador/i, /cotizaci/i, /presupuesto/i, /capex/i, /opex/i, /escenario/i],
  riesgos_modelo: [/riesgo/i, /brecha/i, /cumplimiento/i, /aceptaci/i],
  expediente_cabildo: [/cabildo/i, /claim/i, /cumplimiento/i, /reglamento/i],
  roadmap_implementacion: [/brecha/i, /cumplimiento/i, /plan/i, /roadmap/i],
  infraestructura: [/infraestructura/i, /centro/i, /cobertura/i, /capacidad/i],
  organigrama: [/organigrama/i, /responsable/i, /capacidad/i],
  logistica: [/ruta/i, /recolecci/i, /vehiculo/i, /frecuencia/i],
  costos_programa: [/costo/i, /presupuesto/i, /cuenta/i, /capex/i, /opex/i],
  mercado_materiales: [/precio/i, /material/i, /comprador/i, /cotizaci/i, /acopio/i],
  esquema_concesion: [/concesi/i, /reglamento/i, /legal/i, /riesgo/i],
  arbol_financiamiento: [/financ/i, /presupuesto/i, /cuenta/i, /fondo/i],
  inspeccion: [/inspecci/i, /cumplimiento/i, /reglamento/i],
  monitoreo_operativo: [/ruta/i, /recolecci/i, /cobertura/i, /operativ/i],
  doble_materialidad: [/impacto/i, /riesgo/i, /ambiental/i, /social/i],
  trazabilidad: [/claim/i, /fuente/i, /cita/i, /cumplimiento/i],
  evm_dashboard: [/presupuesto/i, /avance/i, /costo/i, /cuenta/i],
  risk_dashboard: [/riesgo/i, /brecha/i, /cumplimiento/i],
}

function metricText(metric: TenantMetric) {
  return [
    metric.id,
    metric.field_id,
    metric.label,
    metric.source,
    metric.method,
    metric.citation_id,
  ].filter(Boolean).join(' ')
}

export function metricsForConsultingModule(moduleId: string, metrics: TenantMetric[]): TenantMetric[] {
  const patterns = MODULE_METRIC_PATTERNS[moduleId] ?? []
  if (!patterns.length) return []
  return metrics.filter(metric => patterns.some(pattern => pattern.test(metricText(metric))))
}
