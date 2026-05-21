'use client'

/**
 * CircularidadRoadmapMap — Mapa de avance del programa de circularidad por fase.
 *
 * Muestra una coropleta de las colonias/zonas piloto coloreada según la fase
 * del plan Gantt activo. Un slider temporal permite ver cómo avanza la cobertura
 * año a año a lo largo del horizonte.
 *
 * DISCLAIMER PROXY: Los polígonos son una rejilla proxy — no son AGEBs oficiales
 * del INEGI MGN. Se muestra un badge visible con esta aclaración en todo momento.
 *
 * Fuente de geometría: API /national/circularity-heatmap/{zm_id}
 * Fuente de fases: store simulatorStore (pctCapturaPorAño + horizonte)
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { AlertTriangle, MapPin } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getCircularityHeatmap } from '@/lib/api'
import type { CircularityHeatmapResponse } from '@/types'
import { cn } from '@/lib/utils'

// ─── Colores por fase ─────────────────────────────────────────────────────────

const FASE_COLORS = [
  '#E8F5E9',  // Sin iniciar
  '#A5D6A7',  // Diagnóstico
  '#66BB6A',  // Diseño
  '#43A047',  // Instalación
  '#2E7D32',  // Operación piloto
  '#1B5E20',  // Escala plena
] as const

const FASE_LABELS = [
  'Sin iniciar',
  'Diagnóstico',
  'Diseño',
  'Instalación',
  'Operación piloto',
  'Escala plena',
] as const

/** Dado un porcentaje de captura, determina la fase (0–5). */
function faseDesdeCaptura(pct: number): number {
  if (pct === 0) return 0
  if (pct < 10) return 1
  if (pct < 25) return 2
  if (pct < 45) return 3
  if (pct < 65) return 4
  return 5
}

/** Genera el color de relleno para la expresión Mapbox según el año del slider. */
function buildFillExpr(zmFeatures: CircularityHeatmapResponse['geojson']['features'], añoIdx: number, pctCaptura: number) {
  // En una rejilla proxy, asignamos fases de manera determinística por zona
  // La zona "piloto" (índice 0-3) avanza más rápido según el año.
  return ['match',
    ['get', 'cve_geoestadistica_proxy'],
    ...zmFeatures.flatMap((f, i) => {
      const props = f.properties ?? {}
      const cve = props['cve_geoestadistica_proxy'] ?? `Z${i}`
      // Zonas más centrales (índice menor) arrancan antes
      const adelanto = Math.max(0, 3 - Math.floor(i / 3))
      const pctLocal = Math.max(0, Math.min(100, pctCaptura * (1 + adelanto * 0.15) - i * 2))
      const fase = faseDesdeCaptura(pctLocal)
      return [cve, FASE_COLORS[fase]]
    }),
    '#F5F5F5',
  ]
}

// ─── MapSourceBadge (disclaimer proxy) ───────────────────────────────────────

function MapSourceBadge({ geometrySource }: { geometrySource?: string }) {
  const esProxy = !geometrySource || geometrySource.includes('proxy')
  return (
    <div className={cn(
      'absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[9px] font-semibold shadow-md',
      esProxy
        ? 'bg-amber-50 border border-amber-300 text-amber-800'
        : 'bg-white border border-[#D7E8C0] text-[#3B6D11]',
    )}>
      <AlertTriangle size={10} className={esProxy ? 'text-amber-600' : 'text-[#3B6D11]'} />
      {esProxy
        ? 'SIMULACIÓN · Geometría proxy — no AGEB INEGI'
        : 'Geometría verificada · MGN INEGI'}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  return (
    <div className="absolute top-2 right-2 z-10 bg-white/95 border border-[#E8E4DC] rounded-[8px] px-3 py-2 shadow-md">
      <p className="text-[8px] uppercase tracking-[0.07em] text-[#A8A49C] mb-1.5">Fase del programa</p>
      <div className="space-y-1">
        {FASE_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px] shrink-0" style={{ background: FASE_COLORS[i] }} />
            <span className="text-[9px] text-[#5C5740]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CircularidadRoadmapMapProps {
  className?: string
}

export function CircularidadRoadmapMap({ className = '' }: CircularidadRoadmapMapProps) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const [heatmap, setHeatmap] = useState<CircularityHeatmapResponse | null>(null)
  const [loadingMap, setLoadingMap] = useState(true)
  const [errorMap, setErrorMap] = useState<string | null>(null)
  const [añoSlider, setAñoSlider] = useState(0)   // índice 0 = año 1 del horizonte
  const [mapReady, setMapReady] = useState(false)

  // Fetch heatmap data
  useEffect(() => {
    let cancelled = false
    setLoadingMap(true)
    setErrorMap(null)
    getCircularityHeatmap(zmActiva)
      .then(data => { if (!cancelled) { setHeatmap(data); setLoadingMap(false) } })
      .catch(() => { if (!cancelled) { setErrorMap('No se pudo cargar la geometría del mapa.'); setLoadingMap(false) } })
    return () => { cancelled = true }
  }, [zmActiva])

  // Tokens Mapbox
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (token) mapboxgl.accessToken = token
  }, [])

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || !heatmap || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-100.9, 22.15],
      zoom: 10,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      const fc = heatmap.geojson as GeoJSON.FeatureCollection
      const features = fc.features ?? []

      map.addSource('circularity-roadmap', {
        type: 'geojson',
        data: fc,
      })

      map.addLayer({
        id: 'circularity-fill',
        type: 'fill',
        source: 'circularity-roadmap',
        paint: {
          'fill-color': FASE_COLORS[0],
          'fill-opacity': 0.75,
        },
      })

      map.addLayer({
        id: 'circularity-outline',
        type: 'line',
        source: 'circularity-roadmap',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 0.5,
          'line-opacity': 0.6,
        },
      })

      // Fit bounds
      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        features.forEach(f => {
          const g = f.geometry as GeoJSON.Polygon
          if (g?.type === 'Polygon') {
            g.coordinates[0]?.forEach(([lng, lat]) => bounds.extend([lng, lat]))
          }
        })
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 24, maxZoom: 13 })
      }

      // Popup
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      map.on('mousemove', 'circularity-fill', e => {
        if (!e.features?.length) return
        const props = e.features[0].properties ?? {}
        const municipio = props['municipio'] ?? 'Zona'
        const cve = props['cve_geoestadistica_proxy'] ?? '—'
        popup.setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-size:11px;padding:4px 8px;line-height:1.5">
              <strong>${municipio}</strong><br/>
              Clave proxy: ${cve}<br/>
              <em style="font-size:9px;color:#A8A49C">Geometría simulación — no AGEB INEGI</em>
            </div>
          `)
          .addTo(map)
      })
      map.on('mouseleave', 'circularity-fill', () => popup.remove())

      setMapReady(true)
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMapReady(false)
      }
    }
  }, [heatmap])

  // Update fill colors when slider or captura changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || !heatmap) return
    const map = mapRef.current
    if (!map.getLayer('circularity-fill')) return

    const features = (heatmap.geojson as GeoJSON.FeatureCollection).features ?? []
    const pct = pctCapturaPorAño[Math.min(añoSlider, pctCapturaPorAño.length - 1)] ?? 0

    // Actualizar color de cada feature según su fase en el año seleccionado
    features.forEach((f, i) => {
      const cve = (f.properties ?? {})['cve_geoestadistica_proxy'] ?? `Z${i}`
      const adelanto = Math.max(0, 3 - Math.floor(i / 3))
      const pctLocal = Math.max(0, Math.min(100, pct * (1 + adelanto * 0.15) - i * 2))
      const fase = faseDesdeCaptura(pctLocal)
      // En Mapbox la forma más eficiente es usar data-driven styling con match expression
      // Actualizamos vía setFeatureState
      if (f.id !== undefined) {
        map.setFeatureState(
          { source: 'circularity-roadmap', id: f.id },
          { fase, color: FASE_COLORS[fase] }
        )
      }
    })

    // Actualizar la expresión de color globalmente
    map.setPaintProperty('circularity-fill', 'fill-color', [
      'match',
      ['get', 'cve_geoestadistica_proxy'],
      ...features.flatMap((f, i) => {
        const cve = (f.properties ?? {})['cve_geoestadistica_proxy'] ?? `Z${i}`
        const adelanto = Math.max(0, 3 - Math.floor(i / 3))
        const pct2 = pctCapturaPorAño[Math.min(añoSlider, pctCapturaPorAño.length - 1)] ?? 0
        const pctLocal = Math.max(0, Math.min(100, pct2 * (1 + adelanto * 0.15) - i * 2))
        return [cve, FASE_COLORS[faseDesdeCaptura(pctLocal)]]
      }),
      '#F5F5F5',
    ])
  }, [añoSlider, pctCapturaPorAño, mapReady, heatmap])

  const capturaAñoActual = pctCapturaPorAño[Math.min(añoSlider, pctCapturaPorAño.length - 1)] ?? 0
  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '').trim()

  if (loadingMap) {
    return (
      <div className={cn('flex items-center justify-center bg-[#F4F2ED] rounded-[12px]', className)} style={{ minHeight: 300 }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-[12px] text-[#A8A49C]">Cargando mapa de circularidad…</p>
        </div>
      </div>
    )
  }

  if (errorMap) {
    return (
      <div className={cn('rounded-[12px] border border-amber-200 bg-amber-50 p-5 flex items-start gap-3', className)}>
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-amber-900">No se pudo cargar el mapa</p>
          <p className="text-[11px] text-amber-700 mt-1">{errorMap}</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className={cn('rounded-[12px] border border-amber-200 bg-amber-50 p-5 flex items-start gap-3', className)}>
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-amber-900">Mapa no disponible</p>
          <p className="text-[11px] text-amber-700 mt-1">
            Para ver el mapa interactivo define{' '}
            <code className="font-mono text-[11px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> en el entorno y reinicia el servidor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Slider temporal */}
      <div className="flex items-center gap-4 px-1">
        <MapPin size={13} className="text-[#3B6D11] shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-[#A8A49C]">Año del plan</span>
            <span className="font-mono font-semibold text-[#1C1B18]">
              Año {añoSlider + 1} — {capturaAñoActual.toFixed(0)}% captura
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, horizonte - 1)}
            step={1}
            value={añoSlider}
            onChange={e => setAñoSlider(Number(e.target.value))}
            className="w-full h-2 cursor-pointer accent-[#3B6D11]"
            aria-label="Año del plan"
          />
          <div className="flex justify-between text-[9px] text-[#C4C0B8] mt-0.5">
            <span>Año 1</span>
            <span>Año {horizonte}</span>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative rounded-[12px] overflow-hidden border border-[#E8E4DC]" style={{ height: 380 }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        <MapLegend />
        <MapSourceBadge geometrySource={heatmap?.geometry_source} />
      </div>

      {/* Nota metodológica */}
      <p className="text-[9px] text-[#C4C0B8] leading-relaxed px-1">
        Las zonas coloreadas muestran la fase proyectada del programa según la curva de captura del escenario activo.
        La geometría es una rejilla rectangular proxy por municipio —{' '}
        <strong>no son polígonos AGEBs oficiales del INEGI MGN</strong>. Para datos georreferenciados oficiales,
        se requiere la integración del Marco Geoestadístico Nacional (pendiente piloto SLP).
      </p>
    </div>
  )
}
