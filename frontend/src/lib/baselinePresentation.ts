import type { CircularityBaseline } from '@/types'

/** Misma condición que el gate de módulos en `app/simulator/page.tsx` — solo para presentación/UI. */
export function isCircularityBaselineReadyForUi(
  baseline: CircularityBaseline | null,
  zmActiva: string,
): boolean {
  return Boolean(
    baseline &&
      baseline.city_id === zmActiva &&
      baseline.official_status === 'estimated_not_official' &&
      baseline.provenance.fuente_nombre &&
      baseline.provenance.fuente_organismo &&
      baseline.confidence > 0,
  )
}
