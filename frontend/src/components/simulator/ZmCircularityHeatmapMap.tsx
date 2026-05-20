'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import type { CircularityHeatmapResponse } from '@/types'
import { getCircularityHeatmap } from '@/lib/api'

type HeatMode = 'actual' | 'projected'

// ── ZM center coordinates (INEGI MGN 2022) for map initial viewport ───────────
const ZM_CENTERS: Record<string, [number, number]> = {
  SLP: [-100.9747, 22.1512],
  MTY: [-100.3161, 25.6866],
  QRO: [-100.3899, 20.5888],
  GDL: [-103.3496, 20.6597],
}

const ZM_ZOOM: Record<string, number> = {
  SLP: 9.5, MTY: 9.5, QRO: 9.5, GDL: 9.5,
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function boundsFromFc(fc: CircularityHeatmapResponse['geojson']): mapboxgl.LngLatBounds {
  const b = new mapboxgl.LngLatBounds()
  for (const f of fc.features) {
    const g = f.geometry as { type: string; coordinates: number[][][] }
    if (g?.type !== 'Polygon' || !g.coordinates?.[0]) continue
    for (const pt of g.coordinates[0]) b.extend([pt[0], pt[1]])
  }
  return b
}

function fillColorExpr(mode: HeatMode): object {
  const prop = mode === 'actual' ? 'circularity_actual_pct' : 'circularity_projected_pct'
  return [
    'interpolate', ['linear'], ['get', prop],
    18, '#f7fcf0',
    32, '#ccebc5',
    48, '#7fbc41',
    72, '#2d8f47',
    92, '#0d5c27',
  ]
}

export default function ZmCircularityHeatmapMap({ zmId }: { zmId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const [payload, setPayload] = useState<CircularityHeatmapResponse | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode,    setMode]    = useState<HeatMode>('actual')
  const modeRef = useRef(mode)
  const token   = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? ''

  useEffect(() => { modeRef.current = mode }, [mode])

  // Live data fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPayload(null)
    setError(null)
    ;(async () => {
      try {
        const data = await getCircularityHeatmap(zmId)
        if (!cancelled) setPayload(data)
      } catch {
        if (!cancelled) setError('Servidor no disponible — mostrando mapa base de referencia.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [zmId])

  // Map initialization — always render the basemap regardless of backend state.
  // When payload arrives with features, add the data layers.
  useEffect(() => {
    if (!containerRef.current || !token) return

    mapboxgl.accessToken = token

    const center: [number, number] = ZM_CENTERS[zmId] ?? [-100.92, 22.14]
    const zoom = ZM_ZOOM[zmId] ?? 9

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
    })
    mapRef.current = map

    const hasFeatures = payload && payload.feature_count > 0

    if (hasFeatures && payload) {
      map.on('load', () => {
        const b = boundsFromFc(payload.geojson)
        if (!b.isEmpty()) map.fitBounds(b, { padding: 48, maxZoom: 11 })

        map.addSource('circularity-heatmap', {
          type: 'geojson',
          data: payload.geojson as FeatureCollection,
        })
        map.addLayer({
          id: 'circularity-fill',
          type: 'fill',
          source: 'circularity-heatmap',
          paint: {
            'fill-color': fillColorExpr(modeRef.current) as mapboxgl.ExpressionSpecification,
            'fill-opacity': 0.82,
          },
        })
        map.addLayer({
          id: 'circularity-outline',
          type: 'line',
          source: 'circularity-heatmap',
          paint: {
            'line-color': '#1C1B18',
            'line-width': 0.35,
            'line-opacity': 0.45,
          },
        })

        map.on('click', 'circularity-fill', e => {
          const feat = e.features?.[0]
          if (!feat?.properties) return
          const p   = feat.properties as Record<string, unknown>
          const mun = escHtml(String(p.nombre_municipio ?? ''))
          const cve = escHtml(String(p.cve_geoestadistica_proxy ?? ''))
          const act  = Number(p.circularity_actual_pct ?? 0)
          const proj = Number(p.circularity_projected_pct ?? 0)
          const html = `
            <div style="font-family:system-ui,sans-serif;max-width:260px;font-size:12px;color:#1C1B18;">
              <div style="font-weight:600;margin-bottom:4px;">${mun}</div>
              <div style="font-size:10px;color:#6B6760;font-family:monospace;">${cve}</div>
              <div style="margin-top:8px;"><strong>Actual (sim.)</strong> ${act.toFixed(1)}%</div>
              <div><strong>Proyectado (sim.)</strong> ${proj.toFixed(1)}%</div>
              <div style="margin-top:8px;font-size:10px;color:#8A857C;">Rejilla educativa; no AGEB INEGI oficial.</div>
            </div>`
          new mapboxgl.Popup({ maxWidth: '280px' }).setLngLat(e.lngLat).setHTML(html).addTo(map)
        })

        map.on('mouseenter', 'circularity-fill', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'circularity-fill', () => { map.getCanvas().style.cursor = '' })
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  // Re-initialize when payload (real data) arrives
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, token, zmId])

  // Mode toggle — update paint property without reinitializing
  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    if (!map.getLayer('circularity-fill')) return
    map.setPaintProperty('circularity-fill', 'fill-color', fillColorExpr(mode) as mapboxgl.ExpressionSpecification)
  }, [mode])

  const sampleRows = useMemo(() => {
    if (!payload?.geojson?.features?.length) return []
    return payload.geojson.features.slice(0, 12)
  }, [payload])

  const hasFeatures   = payload && payload.feature_count > 0
  const isFallbackMap = !hasFeatures // basemap only, no data layers

  if (!token) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-950">
        Para ver el mapa Mapbox define <code className="font-mono text-[11px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> en el frontend y reinicia el servidor.
      </div>
    )
  }

  return (
    <section
      className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-3"
      aria-labelledby="circularity-map-title"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">Mapa calor circularidad · ZM {zmId}</p>
        <h3 id="circularity-map-title" className="mt-1 font-serif text-[22px] text-[#1C1B18]">
          Circularidad modelada por zona geoestadística (proxy) · ZM {zmId}
        </h3>
        <p className="mt-1 text-[12px] text-[#6B6760] max-w-3xl leading-relaxed">
          {hasFeatures
            ? <>Comparación <strong>actual vs proyectado</strong> sobre <strong>{payload!.feature_count}</strong> celdas proxy. Ámbito <strong>{payload!.jurisdiction_scope}</strong>.</>
            : 'Vista de referencia geográfica. Los datos de circularidad se cargarán cuando el servidor responda.'
          }
        </p>
      </div>

      {/* Status banners */}
      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#A8A49C] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D4881E] animate-pulse" />
          Conectando con el servidor para datos de circularidad de ZM {zmId}…
        </div>
      )}
      {!loading && isFallbackMap && (
        <div className="rounded-[8px] border border-[#F5D98A] bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#6B4800]">
          {error ?? `No hay datos de circularidad para ZM ${zmId}.`} El mapa muestra la vista de referencia geográfica.
        </div>
      )}
      {hasFeatures && (
        <div className="rounded-[10px] border border-[#D4881E]/35 bg-[#FEF7E7] px-3 py-2 text-[11px] leading-relaxed text-[#6B6760]">
          <strong className="text-[#1C1B18]">Simulación — geometría proxy pendiente MGN INEGI.</strong> {payload!.disclaimer}
        </div>
      )}

      {hasFeatures && payload && (
        <>
          <p className="text-[11px] text-[#8A857C]">{payload.geometry_note}</p>
          <p className="text-[11px] text-[#8A857C]">{payload.methodology_summary}</p>
        </>
      )}

      {/* Mode toggle — only when data is available */}
      {hasFeatures && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-[#6B6760]">Capa temática:</span>
          <div className="inline-flex rounded-full border border-[#E8E4DC] bg-white p-0.5">
            {(['actual', 'projected'] as HeatMode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  mode === m ? 'bg-[#1F3B06] text-white' : 'text-[#6B6760] hover:bg-[#FAF8F4]'
                }`}>
                {m === 'actual' ? 'Actual (sim.)' : 'Proyectado (sim.)'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#8A857C]">Tonos más oscuros ≈ mayor % circularidad modelado (no medición).</span>
        </div>
      )}

      {/* Map canvas — ALWAYS rendered when token is present */}
      <div
        ref={containerRef}
        className="h-[440px] w-full rounded-[12px] overflow-hidden border border-[#E8E4DC]"
      />

      {/* Fallback table when no data layers */}
      {!loading && sampleRows.length > 0 && (
        <div className="overflow-x-auto border border-[#F0EDE5] rounded-lg max-h-[220px] overflow-y-auto mt-2">
          <table className="w-full text-xs">
            <thead className="bg-[#FAF8F4] text-[#8A857C] sticky top-0">
              <tr>
                <th className="text-left py-2 px-2">Municipio</th>
                <th className="text-left py-2 px-2">CVE proxy</th>
                <th className="text-right py-2 px-2">Actual %</th>
                <th className="text-right py-2 px-2">Proyectado %</th>
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, i) => {
                const p = row.properties as Record<string, unknown>
                return (
                  <tr key={`${String(p.cve_geoestadistica_proxy)}-${i}`} className="border-t border-[#F0EDE5]">
                    <td className="py-2 px-2 font-medium text-[#1C1B18]">{String(p.nombre_municipio ?? '')}</td>
                    <td className="py-2 px-2 font-mono text-[10px] text-[#6B6760]">{String(p.cve_geoestadistica_proxy ?? '')}</td>
                    <td className="py-2 px-2 text-right font-mono">{Number(p.circularity_actual_pct ?? 0).toFixed(1)}</td>
                    <td className="py-2 px-2 text-right font-mono">{Number(p.circularity_projected_pct ?? 0).toFixed(1)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-[#A8A49C] px-2 py-1">Muestra 12 de {payload?.feature_count} · interactúa con el mapa para más detalle.</p>
        </div>
      )}

      {hasFeatures && payload && (
        <p className="text-[10px] text-[#A8A49C] font-mono">
          Época catálogo: {payload.catalog_simulation_epoch} · geometry_source: {payload.geometry_source}
          {payload.version_mgn ? ` · MGN ${payload.version_mgn}` : ''}
        </p>
      )}
    </section>
  )
}
