import type { Audience, EscenarioGuardado, PropuestaSlotTupla } from '@/types'

export function propuestaSlotsVacios(): PropuestaSlotTupla {
  return [null, null, null]
}

export function normalizaPropuestaSlots(raw: unknown): PropuestaSlotTupla {
  if (!Array.isArray(raw) || raw.length !== 3) return propuestaSlotsVacios()
  return [
    (raw[0] as EscenarioGuardado | null) ?? null,
    (raw[1] as EscenarioGuardado | null) ?? null,
    (raw[2] as EscenarioGuardado | null) ?? null,
  ]
}

/** Lógica de `persist:migrate` (v2) para reutilizar en pruebas sin montar Zustand. */
export function migrateSimulatorPersistedState(
  persisted: unknown,
): Partial<{ audience: Audience | null }> & { propuestaSlots: PropuestaSlotTupla } {
  const unwrap = (): Record<string, unknown> => {
    if (!persisted || typeof persisted !== 'object')
      return { audience: null, propuestaSlots: propuestaSlotsVacios(), escenarios: [] }
    const p = persisted as { state?: unknown }
    if ('state' in p && typeof p.state === 'object' && p.state !== null)
      return p.state as Record<string, unknown>
    return persisted as Record<string, unknown>
  }
  const p = unwrap()
  const slotsRaw = normalizaPropuestaSlots(p.propuestaSlots)
  if (slotsRaw[0] ?? slotsRaw[1] ?? slotsRaw[2]) {
    const aud = ('audience' in p ? p.audience : null) as Audience | null | undefined
    return {
      ...(typeof aud !== 'undefined' ? { audience: aud } : {}),
      propuestaSlots: slotsRaw,
    }
  }
  const legacy = Array.isArray(p.escenarios) ? p.escenarios : []
  const slots: [
    EscenarioGuardado | null,
    EscenarioGuardado | null,
    EscenarioGuardado | null,
  ] = [null, null, null]
  legacy.slice(0, 3).forEach((e, i) => {
    if (e && typeof e === 'object') slots[i] = e as EscenarioGuardado
  })
  const aud = ('audience' in p ? p.audience : null) as Audience | null | undefined
  return {
    ...(typeof aud !== 'undefined' ? { audience: aud } : {}),
    propuestaSlots: slots,
  }
}
