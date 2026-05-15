import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import {
  SOCIAL_STATS_BUNDLE_EMBEDDED,
  SOCIAL_STATS_PUBLIC_REL_PATH,
} from '@/data/socialStats/embeddedBundle'

const STATIC_HASHED_PATH = SOCIAL_STATS_PUBLIC_REL_PATH

const STALE_MS = 60_000
/** Tras este tiempo se intenta refrescar en segundo plano. */
const SERVE_STALE_MAX_MS = 600_000

type CacheEntry = { bundle: SocialStatsBundle; fetchedAt: number }

let memoryCache: CacheEntry | null = null
let inflight: Promise<SocialStatsBundle> | null = null

export function getSocialStatsSourceMode(): 'static' | 'remote' {
  return process.env.NEXT_PUBLIC_SOCIAL_STATS_SOURCE === 'remote' ? 'remote' : 'static'
}

function remoteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SOCIAL_STATS_REMOTE_URL?.trim()
  if (!raw || !/^https?:\/\//i.test(raw)) return null
  return raw
}

function validateBundle(raw: unknown): SocialStatsBundle {
  if (!raw || typeof raw !== 'object') throw new Error('bundle invalido')
  const o = raw as Record<string, unknown>
  if (typeof o.buildId !== 'string' || !Array.isArray(o.slices)) throw new Error('bundle sin buildId/slices')
  return o as unknown as SocialStatsBundle
}

async function fetchNetworkBundle(signal?: AbortSignal): Promise<SocialStatsBundle> {
  const mode = getSocialStatsSourceMode()
  if (mode === 'remote') {
    const url = remoteUrl()
    if (url) {
      const res = await fetch(url, { signal, cache: 'no-store' })
      if (!res.ok) throw new Error(`remote ${res.status}`)
      return validateBundle(await res.json())
    }
  }
  const res = await fetch(STATIC_HASHED_PATH, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`static ${res.status}`)
  return validateBundle(await res.json())
}

/**
 * stale-while-revalidate en memoria: devuelve caché si existe; si está stale, dispara
 * refresco en background sin bloquear. Sin escritura de decisiones de usuario.
 * Fallo de red → bundle embebido (misma interfaz).
 */
export async function getSocialStatsBundleSwR(signal?: AbortSignal): Promise<SocialStatsBundle> {
  const now = Date.now()

  if (memoryCache && now - memoryCache.fetchedAt < SERVE_STALE_MAX_MS) {
    if (now - memoryCache.fetchedAt > STALE_MS) {
      if (!inflight) {
        inflight = fetchNetworkBundle(signal)
          .then(b => {
            memoryCache = { bundle: b, fetchedAt: Date.now() }
            return b
          })
          .catch(() => memoryCache!.bundle)
          .finally(() => {
            inflight = null
          })
      }
    }
    return memoryCache.bundle
  }

  if (inflight) return inflight

  try {
    const b = await fetchNetworkBundle(signal)
    memoryCache = { bundle: b, fetchedAt: now }
    return b
  } catch {
    memoryCache = { bundle: SOCIAL_STATS_BUNDLE_EMBEDDED, fetchedAt: now }
    return SOCIAL_STATS_BUNDLE_EMBEDDED
  }
}

/** Test / reset sin tocar localStorage. */
export function __resetSocialStatsMemoryCacheForTests(): void {
  memoryCache = null
  inflight = null
}
