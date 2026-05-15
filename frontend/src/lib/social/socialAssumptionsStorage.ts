import type { SocialAssumptionLogEntry, SocialAssumptionsStateV1 } from '@/types/socialAssumptionsLog'

/** Prefijo de persistencia capa social (PR2). */
export const SOCIAL_STORAGE_PREFIX = 'alquimia.social.' as const

export const SOCIAL_ASSUMPTIONS_KEY_V1 = `${SOCIAL_STORAGE_PREFIX}assumptionsLog.v1` as const

/** Legacy (pre-schema): mismo prefijo, sin versión; migración no destructiva (no se borra la clave legacy). */
const SOCIAL_ASSUMPTIONS_LEGACY_KEY = `${SOCIAL_STORAGE_PREFIX}assumptionsLog` as const

function safeParseState(raw: string | null): SocialAssumptionsStateV1 | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as unknown
    if (!p || typeof p !== 'object') return null
    const o = p as Record<string, unknown>
    if (o.schemaVersion === 1 && Array.isArray(o.entries)) {
      return { schemaVersion: 1, entries: o.entries as SocialAssumptionLogEntry[] }
    }
    if (Array.isArray(p)) {
      return { schemaVersion: 1, entries: p as SocialAssumptionLogEntry[] }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function loadAssumptionsState(storage: Storage): SocialAssumptionsStateV1 {
  const v1 = safeParseState(storage.getItem(SOCIAL_ASSUMPTIONS_KEY_V1))
  if (v1) return v1

  const legacy = safeParseState(storage.getItem(SOCIAL_ASSUMPTIONS_LEGACY_KEY))
  if (legacy && legacy.entries.length > 0) {
    storage.setItem(SOCIAL_ASSUMPTIONS_KEY_V1, JSON.stringify(legacy))
    return legacy
  }

  return { schemaVersion: 1, entries: [] }
}

export function saveAssumptionsState(storage: Storage, state: SocialAssumptionsStateV1): void {
  storage.setItem(SOCIAL_ASSUMPTIONS_KEY_V1, JSON.stringify(state))
}

export function appendAssumptionEntry(
  storage: Storage,
  partial: Pick<SocialAssumptionLogEntry, 'texto' | 'origen' | 'manual'>,
): SocialAssumptionLogEntry {
  const state = loadAssumptionsState(storage)
  const entry: SocialAssumptionLogEntry = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    texto: partial.texto.trim(),
    origen: partial.origen?.trim() || undefined,
    timestamp: new Date().toISOString(),
    manual: partial.manual,
  }
  if (!entry.texto) return entry

  state.entries = [...state.entries, entry]
  saveAssumptionsState(storage, state)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('alquimia-social-assumptions-changed'))
  }
  return entry
}
