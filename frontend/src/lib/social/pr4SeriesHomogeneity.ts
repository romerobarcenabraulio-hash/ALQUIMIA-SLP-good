import type { QuantVizRow } from '@/lib/social/socialStatsQuantRows'

/** Firma del tabulado efectivo de una serie primaria con valor (Navigator / PR4). */
function primaryTabulationKey(r: Extract<QuantVizRow, { kind: 'primary' }>): string | null {
  if (r.value == null || !r.meta) return null
  const code = (r.meta.geoCode ?? '').trim()
  const vintage = r.meta.vintageLabel.trim()
  return `${r.meta.geoLevel}\u001f${vintage}\u001f${code}\u001f${r.meta.geoLabel.trim()}`
}

/**
 * Detecta si la tabla/barras PR4 agrupan series con tabulados distintos (riesgo de lectura equiparada).
 * No bloquea UI: solo alimenta copy de advertencia obligatorio Navigator.
 */
export function analyzePr4TerritorialMix(rows: QuantVizRow[]): {
  hasMixedTabulationFrames: boolean
  distinctKeys: number
} {
  const keys = new Set<string>()
  for (const r of rows) {
    if (r.kind !== 'primary') continue
    const k = primaryTabulationKey(r)
    if (k) keys.add(k)
  }
  return {
    hasMixedTabulationFrames: keys.size > 1,
    distinctKeys: keys.size,
  }
}
