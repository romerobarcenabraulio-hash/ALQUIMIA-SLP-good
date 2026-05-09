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
  // Funcionario — sala de mando institucional.
  functionary: [
    'city_baseline',
    'municipal_context',
    'future_goals',
    'infrastructure_operations',
    'inspeccion_predios',
    'scenarios_export',
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
