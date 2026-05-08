/**
 * Posición PERT de hitos y agregación de KPI sobre el tiempo.
 */

import type { Hito, KpisAcumulados } from '@/data/hitosTimeline'

/** PERT tiempo esperado (días) desde día 0. */
export function pertExpectedDays(hito: Hito): number {
  const { optimistic_dias: o, most_likely_dias: m, pessimistic_dias: p } = hito.pert
  return (o + 4 * m + p) / 6
}

/**
 * Fracción 0–1 sobre el horizonte: posición del hito (esperanza PERT).
 * Misma referencia temporal que `kpisAcumulados` (umbral `pertExpectedDays(h) <= dia_actual`).
 */
export function hitoPosition(hito: Hito, horizonte_dias: number): number {
  if (horizonte_dias <= 0) return 0
  const t = pertExpectedDays(hito)
  return Math.min(1, Math.max(0, t / horizonte_dias))
}

/**
 * Banda horizontal [min, max] como fracción del horizonte (optimista / pesimista).
 */
export function hitoBand(hito: Hito, horizonte_dias: number): [number, number] {
  if (horizonte_dias <= 0) return [0, 0]
  const lo = Math.min(1, Math.max(0, hito.pert.optimistic_dias / horizonte_dias))
  const hi = Math.min(1, Math.max(0, hito.pert.pessimistic_dias / horizonte_dias))
  return lo <= hi ? [lo, hi] : [hi, lo]
}

/**
 * Considera aplicados todos los hitos cuyo día PERT esperado ≤ día actual.
 */
export function kpisAcumulados(hitos: Hito[], dia_actual: number, empleo_base: number): KpisAcumulados {
  let emp = Math.max(0, empleo_base)
  let pep = 0
  let cap_pts = 0
  let co2 = 0

  const d = Math.max(0, dia_actual)

  for (const h of hitos) {
    if (pertExpectedDays(h) <= d) {
      emp += h.kpis.empleos_delta
      pep += h.kpis.pepenadores_delta
      cap_pts += h.kpis.captura_pct_pts
      co2 += h.kpis.co2e_evitado_ton_delta
    }
  }

  return {
    empleos: emp,
    pepenadores: pep,
    captura_pct: Math.min(100, Math.round(cap_pts * 10) / 10),
    co2e_evitado_ton: Math.round(co2 * 10) / 10,
  }
}
