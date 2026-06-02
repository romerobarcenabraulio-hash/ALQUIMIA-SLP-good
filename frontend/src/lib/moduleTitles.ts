export const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  guia_circularidad: { title: 'Cómo leer la consultoría', subtitle: 'Guía metodológica · M00' },
  antecedentes_municipales: { title: 'Antecedentes municipales', subtitle: 'Contexto institucional · M00B' },
  city_baseline: { title: 'Línea base RSU', subtitle: 'Generación, composición y destino · M01' },
  social_diagnostico: { title: 'Mapa social y privado urbano', subtitle: 'Actores, ciudadanía y captura privada · M02' },
  capacidad_institucional: { title: 'Capacidad institucional', subtitle: 'Gobernanza operativa · M03' },
  marco_legal: { title: 'Marco legal municipal', subtitle: 'Reglamento, brechas y propuesta · M03B' },
  costo_omision: { title: 'Costo de no actuar', subtitle: 'Riesgo económico · M04' },
  roadmap_implementacion: { title: 'Hoja de ruta', subtitle: 'Fases, gates humanos y dependencias · M05' },
  infraestructura: { title: 'Infraestructura operativa', subtitle: 'Capacidad física · M06' },
  organigrama: { title: 'Organigrama operativo', subtitle: 'Responsables humanos · M07' },
  logistica: { title: 'Rutas y logística', subtitle: 'Operación territorial · M08' },
  costos_programa: { title: 'Costos del programa', subtitle: 'CAPEX y OPEX · M09' },
  mercado_materiales: { title: 'Mercado de materiales', subtitle: 'Compradores y precios · M10' },
  esquema_concesion: { title: 'Modelo operativo y concesión', subtitle: 'Vehículo institucional · M11' },
  arbol_financiamiento: { title: 'Árbol de financiamiento', subtitle: 'Ruta financiera · M12' },
  escenarios_financieros: { title: 'Escenarios financieros', subtitle: 'Captura, costos y sensibilidad · M13' },
  riesgos_modelo: { title: 'Riesgos de implementación', subtitle: 'Control institucional · M14' },
  expediente_cabildo: { title: 'Expediente documental', subtitle: 'Borrador trazable · M15' },
  inspeccion: { title: 'Inspección y cumplimiento', subtitle: 'Ejecución regulatoria · M16' },
  monitoreo_operativo: { title: 'Monitoreo proyectado vs real', subtitle: 'Deltas operativos · M17' },
  doble_materialidad: { title: 'Doble materialidad', subtitle: 'Impacto y reporte · M18' },
  trazabilidad: { title: 'Trazabilidad de evidencia', subtitle: 'Click-to-source · M19' },
  evm_dashboard: { title: 'Control presupuestal', subtitle: 'EVM y conciliación · M20' },
  risk_dashboard: { title: 'Monitoreo de riesgos', subtitle: 'Seguimiento operativo · M21' },
}

export function moduleTitle(moduleId: string, fallback: string): string {
  return MODULE_TITLES[moduleId]?.title ?? fallback
}

export function moduleSubtitle(moduleId: string, fallback?: string | null): string {
  return MODULE_TITLES[moduleId]?.subtitle ?? fallback ?? 'Disponible'
}
