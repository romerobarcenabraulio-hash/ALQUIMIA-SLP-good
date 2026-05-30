export const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  guia_circularidad: { title: 'Guía de circularidad', subtitle: 'Inicio · M00' },
  city_baseline: { title: 'Diagnóstico de residuos sólidos', subtitle: 'Línea base · M01' },
  costo_omision: { title: 'Costo de no actuar', subtitle: 'Riesgo económico · M04' },
  escenarios_financieros: { title: 'Escenarios financieros', subtitle: 'Evaluación financiera · M13' },
  riesgos: { title: 'Riesgos de implementación', subtitle: 'Control institucional · M14' },
  expediente_documental: { title: 'Expediente documental', subtitle: 'Borrador trazable · M15' },
}

export function moduleTitle(moduleId: string, fallback: string): string {
  return MODULE_TITLES[moduleId]?.title ?? fallback
}

export function moduleSubtitle(moduleId: string, fallback?: string | null): string {
  return MODULE_TITLES[moduleId]?.subtitle ?? fallback ?? 'Disponible'
}
