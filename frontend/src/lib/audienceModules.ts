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
  // Funcionario — journey narrativo en 4 etapas con guía introductoria obligatoria.
  // M00 Guía → Etapa 1 Diagnóstico: M01-M03 | Etapa 2 Planeación: M04-M08
  // Etapa 3 Ejecución: M09-M11  | Etapa 4 Monitoreo: M12-M13
  functionary: [
    // Guía de lectura — Steps for Circularity (obligatorio, 100% literario)
    'guia_circularidad',
    // Etapa 1 — Diagnóstico
    'city_baseline',
    'municipal_context',
    'social_study',
    // Etapa 2 — Planeación
    'future_goals',
    'infrastructure_operations',
    'logistica_operativa',
    'market_traceability',
    'risk_trends',
    // Etapa 3 — Ejecución
    'esquema_concesion',
    'scenarios_export',
    'inspeccion_predios',
    // Etapa 4 — Monitoreo y Reporte
    'doble_materialidad',
    'source_traceability',
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
