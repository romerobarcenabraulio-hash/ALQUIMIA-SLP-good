import type { SocialRiskMatrixItem } from '@/data/socialRiskMatrixContent'
import type { SocialAssumptionLogEntry } from '@/types/socialAssumptionsLog'
import type { SocialBacklogElementoMinimo } from '@/types/socialBacklogHandoff'

function anchorRiesgo(id: string, moduleAnchor: string): string {
  return `module_id:${moduleAnchor} | testid:social-context-risk-card | data-risk-id:${id}`
}

function anchorSupuesto(entryId: string, moduleAnchor: string): string {
  return `module_id:${moduleAnchor} | testid:social-context-assumption-row | data-entry-id:${entryId}`
}

/**
 * Construye el conjunto mínimo de elementos backlog a partir del contenido estático de riesgo
 * y de la bitácora append-only ya persistida en el navegador del usuario.
 */
export function buildSocialBacklogElements(
  risks: readonly SocialRiskMatrixItem[],
  assumptions: readonly SocialAssumptionLogEntry[],
  moduleAnchor: string,
): SocialBacklogElementoMinimo[] {
  const fromRisks: SocialBacklogElementoMinimo[] = risks.map(r => ({
    titulo: r.titulo,
    origen_capa: 'riesgo',
    severidad_interna: r.severidad_interna,
    responsable_propuesto_opcional: '',
    enlace_interno_anchor: anchorRiesgo(r.id, moduleAnchor),
  }))

  const fromAssumptions: SocialBacklogElementoMinimo[] = assumptions.map(a => ({
    titulo: a.texto.length > 120 ? `${a.texto.slice(0, 117)}…` : a.texto,
    origen_capa: 'supuesto',
    severidad_interna: 'bajo',
    responsable_propuesto_opcional: '',
    enlace_interno_anchor: anchorSupuesto(a.id, moduleAnchor),
  }))

  return [...fromRisks, ...fromAssumptions]
}
