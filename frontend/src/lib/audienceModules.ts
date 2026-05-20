/**
 * Fase 22.2 — Mapa de módulos visibles por audiencia.
 *
 * Cada audiencia ve un subconjunto fijo de `module_id` definidos por el
 * backend en city_plan/organization. La poda se aplica en frontend para
 * conseguir ≥60% de UI oculta por audiencia (sin tocar contratos backend).
 *
 * Si en una fase futura se introduce backend audience-aware (ver 22.6),
 * el server filtrará primero y este mapa actuará como red de seguridad.
 */

import type { Audience } from '@/types'

export const AUDIENCE_MODULES: Record<Audience, ReadonlyArray<string>> = {
  // Ciudadano — educación y contexto. Sin operaciones ni finanzas duras.
  citizen: [
    'city_baseline',
    'municipal_context',
    'citizen_inputs',
    'impact_finance', // se simplifica a Ambiental + Multiplicadores en page.tsx
  ],
  // Funcionario — journey narrativo en 4 capítulos con guía introductoria obligatoria.
  // M00 Guía → Cap 1 Diagnóstico: M01-M03 | Cap 2 Planificación: M04-M08
  // Cap 3 Modelo: M09-M11  | Cap 4 Control: M12-M15
  functionary: [
    // Guía de lectura — Steps for Circularity (obligatorio, pre-capítulo)
    'guia_circularidad',
    // Cap 1 — Diagnóstico Base: ¿Qué tenemos y dónde estamos?
    'city_baseline',        // M01 Línea base territorial y RSU
    'social_study',         // M02 Diagnóstico social y aceptación ciudadana
    'municipal_context',    // M03 Marco legal y brechas normativas
    // Cap 2 — Planificación Estratégica: ¿Qué necesitamos construir?
    'future_goals',              // M04 Metas y trayectorias de captura
    'infrastructure_operations', // M05 Infraestructura y centros de acopio
    'logistica_operativa',       // M06 Logística, rutas y diseño de piloto
    'costos_programa',           // M07 Tabla maestra CAPEX/OPEX
    'market_traceability',       // M08 Mercado de materiales y compradores
    // Cap 3 — Diseño del Modelo: ¿Quién paga, quién opera, es viable?
    'esquema_concesion',   // M09 Esquema de concesión y árbol de decisión
    'scenarios_export',    // M10 Escenarios financieros y exportación
    'risk_trends',         // M11 Riesgos del modelo completo
    // Cap 4 — Ejecución y Control: ¿Cómo arrancamos y cómo medimos?
    'inspeccion_predios',  // M12 Inspección y cumplimiento
    'monitoreo_real',      // M13 Monitoreo proyectado vs. real
    'doble_materialidad',  // M14 Doble materialidad y reporte ESG
    'source_traceability', // M15 Trazabilidad de fuentes y fórmulas
  ],
  // Empresario — perfil organización + trazabilidad + reporte.
  entrepreneur: [
    'organization_profile',
    'containers_provider',
    'market_traceability',
    'organization_report',
  ],
}

export function isModuleVisibleFor(audience: Audience | null, moduleId: string): boolean {
  if (!audience) return false
  return AUDIENCE_MODULES[audience].includes(moduleId)
}
