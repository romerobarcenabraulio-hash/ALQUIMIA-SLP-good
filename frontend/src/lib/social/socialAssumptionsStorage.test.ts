import { describe, expect, it } from 'vitest'
import {
  SOCIAL_ASSUMPTIONS_KEY_V1,
  appendAssumptionEntry,
  loadAssumptionsState,
  saveAssumptionsState,
} from '@/lib/social/socialAssumptionsStorage'
import type { SocialAssumptionsStateV1 } from '@/types/socialAssumptionsLog'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: k => m.get(k) ?? null,
    key: i => Array.from(m.keys())[i] ?? null,
    removeItem: k => {
      m.delete(k)
    },
    setItem: (k, v) => {
      m.set(k, v)
    },
  }
}

describe('socialAssumptionsStorage · PR2', () => {
  it('append-only guarda en clave v1 con prefijo alquimia.social.', () => {
    const s = memoryStorage()
    appendAssumptionEntry(s, { texto: '  Supuesto A  ', origen: '  taller  ', manual: true })
    const raw = s.getItem(SOCIAL_ASSUMPTIONS_KEY_V1)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as SocialAssumptionsStateV1
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].texto).toBe('Supuesto A')
    expect(parsed.entries[0].origen).toBe('taller')
    expect(parsed.entries[0].manual).toBe(true)
    expect(SOCIAL_ASSUMPTIONS_KEY_V1.startsWith('alquimia.social.')).toBe(true)
  })

  it('no añade fila con texto vacío', () => {
    const s = memoryStorage()
    appendAssumptionEntry(s, { texto: '   ', manual: true })
    expect(loadAssumptionsState(s).entries).toHaveLength(0)
  })

  it('migración no destructiva desde legacy array', () => {
    const s = memoryStorage()
    const legacy: SocialAssumptionsStateV1 = {
      schemaVersion: 1,
      entries: [
        {
          id: 'legacy-1',
          texto: 'desde legacy',
          timestamp: '2020-01-01T00:00:00.000Z',
          manual: false,
        },
      ],
    }
    s.setItem('alquimia.social.assumptionsLog', JSON.stringify(legacy.entries))
    const loaded = loadAssumptionsState(s)
    expect(loaded.entries).toHaveLength(1)
    expect(loaded.entries[0].texto).toBe('desde legacy')
    expect(s.getItem(SOCIAL_ASSUMPTIONS_KEY_V1)).toBeTruthy()
    expect(s.getItem('alquimia.social.assumptionsLog')).toBeTruthy()
  })

  it('prioriza v1 si ya existe', () => {
    const s = memoryStorage()
    saveAssumptionsState(s, {
      schemaVersion: 1,
      entries: [{ id: 'v1', texto: 'en v1', timestamp: 't', manual: true }],
    })
    s.setItem('alquimia.social.assumptionsLog', JSON.stringify([{ id: 'leg', texto: 'other', timestamp: 't', manual: true }]))
    const loaded = loadAssumptionsState(s)
    expect(loaded.entries).toHaveLength(1)
    expect(loaded.entries[0].id).toBe('v1')
  })
})
