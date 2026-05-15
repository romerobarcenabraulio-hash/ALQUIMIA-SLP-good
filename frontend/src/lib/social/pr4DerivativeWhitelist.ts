/**
 * Lista blanca entregada por Auditoría ALQUIMIA para ratios permitidos.
 * Si el arreglo está vacío, no se calculan derivados en runtime (solo “no disponible”).
 */
export type AuditorWhitelistedRatio = {
  /** Identificador estable del derivado en UI y pruebas. */
  id: string
  label: string
  numeratorIndicatorId: string
  denominatorIndicatorId: string
}

export const PR4_AUDITOR_RATIO_WHITELIST: readonly AuditorWhitelistedRatio[] = [
  {
    id: 'ratio_pea_sobre_pob_mun',
    label: 'Razón ilustrativa PEA / población total (mismo ámbito territorial y vintage)',
    numeratorIndicatorId: 'dem_pea_ref',
    denominatorIndicatorId: 'dem_pob_ref_mun',
  },
]
