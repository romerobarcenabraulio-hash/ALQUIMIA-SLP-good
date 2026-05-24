/**
 * Mapa de módulos visibles por audiencia.
 * Funcionario: 35 módulos + M00 guía en 4 capítulos (ver chapterConfig.ts).
 */

import type { Audience } from '@/types'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

export const AUDIENCE_MODULES: Record<Audience, ReadonlyArray<string>> = {
  citizen: [
    'city_baseline',
    'marco_legal',
    'citizen_inputs',
    'impact_finance',
  ],
  functionary: [
    'guia_circularidad',
    ...FUNCTIONARY_MODULE_ORDER,
  ],
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
