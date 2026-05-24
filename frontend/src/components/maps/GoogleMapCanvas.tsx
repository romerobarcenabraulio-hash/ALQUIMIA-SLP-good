'use client'

import { useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_MISSING_MSG, getGoogleMapsApiKey, loadGoogleMaps } from '@/lib/googleMaps'

export type MapMarker = {
  id: string
  lat: number
  lon: number
  title?: string
  color?: string
  onClick?: () => void
}

export type MapPolyline = {
  id: string
  path: { lat: number; lon: number }[]
  color?: string
  strokeWeight?: number
}

type Props = {
  center: { lat: number; lon: number }
  zoom?: number
  markers?: MapMarker[]
  polylines?: MapPolyline[]
  geoJson?: GeoJSON.FeatureCollection | Record<string, unknown>
  geoJsonStyle?: (feature: google.maps.Data.Feature) => google.maps.Data.StyleOptions
  className?: string
  height?: number | string
  onMapReady?: (map: google.maps.Map) => void
}

export function GoogleMapCanvas({
  center,
  zoom = 11,
  markers = [],
  polylines = [],
  geoJson,
  geoJsonStyle,
  className = '',
  height = 360,
  onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const token = getGoogleMapsApiKey()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !containerRef.current) return
    let cancelled = false

    loadGoogleMaps(['places'])
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        if (mapRef.current) {
          mapRef.current.setCenter({ lat: center.lat, lng: center.lon })
          mapRef.current.setZoom(zoom)
          return
        }
        const map = new maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lon },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })
        mapRef.current = map
        onMapReady?.(map)
      })
      .catch(e => { if (!cancelled) setErr(e instanceof Error ? e.message : 'Error mapa') })

    return () => { cancelled = true }
  }, [token, center.lat, center.lon, zoom, onMapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !token) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = markers
      .filter(m => m.lat != null && m.lon != null)
      .map(m => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: m.lat, lng: m.lon },
          title: m.title,
          icon: m.color
            ? {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: m.color,
                fillOpacity: 0.95,
                strokeColor: '#fff',
                strokeWeight: 1.5,
              }
            : undefined,
        })
        if (m.onClick) marker.addListener('click', m.onClick)
        return marker
      })
  }, [markers, token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !token) return

    polylinesRef.current.forEach(p => p.setMap(null))
    polylinesRef.current = polylines
      .filter(pl => pl.path.length >= 2)
      .map(pl => new google.maps.Polyline({
        map,
        path: pl.path.map(p => ({ lat: p.lat, lng: p.lon })),
        strokeColor: pl.color ?? '#1A5FA8',
        strokeWeight: pl.strokeWeight ?? 4,
        strokeOpacity: 0.85,
      }))
  }, [polylines, token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !geoJson) return
    map.data.forEach(f => map.data.remove(f))
    map.data.addGeoJson(geoJson as object)
    if (geoJsonStyle) {
      if (typeof geoJsonStyle === 'function') map.data.setStyle(geoJsonStyle)
      else map.data.setStyle(geoJsonStyle)
    }
  }, [geoJson, geoJsonStyle, token])

  if (!token) {
    return (
      <div className={`flex items-center justify-center bg-[#F8F6F1] text-center text-[12px] text-[#8A857C] ${className}`} style={{ height }}>
        {GOOGLE_MAPS_MISSING_MSG}
      </div>
    )
  }

  if (err) {
    return (
      <div className={`flex items-center justify-center bg-[#FEF2F2] text-[12px] text-red-700 ${className}`} style={{ height }}>
        {err}
      </div>
    )
  }

  return <div ref={containerRef} className={`h-full w-full ${className}`} style={{ height }} />
}

export function GoogleMapMissingBanner() {
  if (getGoogleMapsApiKey()) return null
  return (
    <p className="text-center text-[11px] text-[#8A857C]">{GOOGLE_MAPS_MISSING_MSG}</p>
  )
}
