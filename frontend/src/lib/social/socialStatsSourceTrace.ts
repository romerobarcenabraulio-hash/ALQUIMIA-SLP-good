/**
 * Trazabilidad obligatoria: todo número sociodemográfico en capa social debe enlazar
 * a fila/pestaña documentada en `fuentes de calculo/` (u homólogo maestro).
 *
 * Criterio: `sourceSpreadsheetTab` o `excelRowHint` no vacío, más `geoLevel` y `vintageLabel`.
 * Ver `SOURCE_TRACE.md` para procedimiento human-in-the-loop.
 */
import type { OfficialStatSlice, SocialStatsBundle } from '@/types/socialOfficialStats'
import { SOCIAL_STATS_INDICATOR_ORDER } from '@/data/socialStats/embeddedBundle'

/** Indicadores cuyas filas en el bundle exportado a UI deben pasar validación de traza. */
export const SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS: readonly string[] = [
  ...SOCIAL_STATS_INDICATOR_ORDER,
  'dem_pea_ref',
]

/** Devuelve claves faltantes o inválidas (vacío = OK para capa social). */
export function validateCapaSocialSliceTrace(slice: OfficialStatSlice): string[] {
  const missing: string[] = []
  if (!slice.geoLevel) missing.push('geoLevel')
  if (!slice.vintageLabel?.trim()) missing.push('vintageLabel')
  const tab = slice.sourceSpreadsheetTab?.trim()
  const hint = slice.excelRowHint?.trim()
  if (!tab && !hint) missing.push('sourceSpreadsheetTab|excelRowHint')
  return missing
}

export function assertCapaSocialSlicesInBundleTraceable(bundle: SocialStatsBundle): void {
  const publicIds = new Set(SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS)
  for (const slice of bundle.slices) {
    if (!publicIds.has(slice.indicatorId)) continue
    const bad = validateCapaSocialSliceTrace(slice)
    if (bad.length > 0) {
      throw new Error(
        `[${slice.indicatorId} · geo ${slice.geoCode ?? '—'}] trazabilidad incompleta: falta ${bad.join(', ')}`,
      )
    }
  }
}
