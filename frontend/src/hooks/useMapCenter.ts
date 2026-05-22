'use client'

import { useEffect, useState } from 'react'
import { apiFetch, getApiUrl } from '@/lib/api'

export type MapCenter = { lat: number; lon: number }

/** Fallback EPSG:4326 — solo si geocoding no responde. */
const FALLBACK_CENTERS: Record<string, MapCenter> = {
  MTY: { lat: 25.67, lon: -100.31 },
  QRO: { lat: 20.59, lon: -100.39 },
  SLP: { lat: 22.15, lon: -100.98 },
}

export type MapCenterSource = 'geocoding' | 'fallback' | null

/**
 * Centro de mapa dinámico para cualquier municipio/ZM.
 * Usa Google Geocoding API; fallback a coordenadas conocidas si falla.
 */
export function useMapCenter(zmActiva: string, cityName?: string | null) {
  const [center, setCenter] = useState<MapCenter | null>(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<MapCenterSource>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const query = cityName?.trim()
      ? `${cityName.trim()}, México`
      : `${zmActiva}, México`

    apiFetch(`${getApiUrl()}/api/v1/google/geocoding/forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: query, region: 'mx' }),
    })
      .then(async res => {
        if (!res.ok) throw new Error('geocoding failed')
        const d = (await res.json()) as { lat?: number; lon?: number }
        if (!cancelled && d.lat != null && d.lon != null) {
          setCenter({ lat: d.lat, lon: d.lon })
          setSource('geocoding')
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fb = FALLBACK_CENTERS[zmActiva.toUpperCase()] ?? FALLBACK_CENTERS.SLP
          setCenter(fb)
          setSource('fallback')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [zmActiva, cityName])

  return { center, loading, source }
}
