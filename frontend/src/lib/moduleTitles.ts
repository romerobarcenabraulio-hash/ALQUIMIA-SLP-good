export const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  guia_circularidad: { title: 'Guía de circularidad', subtitle: 'Inicio · M00' },
  antecedentes_municipales: { title: 'Antecedentes municipales', subtitle: 'Contexto institucional · M00B' },
  city_baseline: { title: 'Diagnóstico de residuos sólidos', subtitle: 'Línea base · M01' },
  social_diagnostico: { title: 'Diagnóstico social y autoridad', subtitle: 'Actores y aceptación · M02' },
  capacidad_institucional: { title: 'Capacidad institucional', subtitle: 'Gobernanza operativa · M03' },
  marco_legal: { title: 'Marco legal y reglamento', subtitle: 'Reforma normativa · M03B' },
  costo_omision: { title: 'Costo de no actuar', subtitle: 'Riesgo económico · M04' },
  infraestructura: { title: 'Infraestructura operativa', subtitle: 'Capacidad física · M06' },
  organigrama: { title: 'Organigrama operativo', subtitle: 'Responsables humanos · M07' },
  logistica: { title: 'Rutas y logística', subtitle: 'Operación territorial · M08' },
  costos_programa: { title: 'Costos del programa', subtitle: 'CAPEX y OPEX · M09' },
  escenarios_financieros: { title: 'Escenarios financieros', subtitle: 'Evaluación financiera · M13' },
  riesgos_modelo: { title: 'Riesgos de implementación', subtitle: 'Control institucional · M14' },
  expediente_cabildo: { title: 'Expediente documental', subtitle: 'Borrador trazable · M15' },
  risk_dashboard: { title: 'Monitoreo de riesgos', subtitle: 'Seguimiento operativo · M21' },
}

export function moduleTitle(moduleId: string, fallback: string): string {
  return MODULE_TITLES[moduleId]?.title ?? fallback
}

export function moduleSubtitle(moduleId: string, fallback?: string | null): string {
  return MODULE_TITLES[moduleId]?.subtitle ?? fallback ?? 'Disponible'
}
