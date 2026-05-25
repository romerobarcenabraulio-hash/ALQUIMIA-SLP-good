'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CircularityHeatmapResponse } from '@/types'
import { getCircularityHeatmap } from '@/lib/api'
import { GoogleMapCanvas } from '@/components/maps/GoogleMapCanvas'
import { getGoogleMapsApiKey, GOOGLE_MAPS_MISSING_MSG } from '@/lib/googleMaps'

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

function heatColor(pct: number): string {
  if (pct <= 18) return '#f7fcf0'
  if (pct <= 32) return '#ccebc5'
  if (pct <= 48) return '#7fbc41'
  if (pct <= 72) return '#2d8f47'
  return '#0d5c27'
}

export default function ZmCircularityHeatmapMap({ zmId }: { zmId: string }) {
  const [payload, setPayload] = useState<CircularityHeatmapResponse | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode,    setMode]    = useState<HeatMode>('actual')
  const token = getGoogleMapsApiKey()

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
        if (!cancelled) setError('Datos en preparación.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [zmId])

  const mapCenter = useMemo(() => {
    const c = ZM_CENTERS[zmId] ?? [-100.92, 22.14]
    return { lat: c[1], lon: c[0] }
  }, [zmId])

  const geoJsonStyle = useMemo(() => {
    const prop = mode === 'actual' ? 'circularity_actual_pct' : 'circularity_projected_pct'
    return (feature: google.maps.Data.Feature) => {
      const pct = Number(feature.getProperty(prop) ?? 0)
      return {
        fillColor: heatColor(pct),
        fillOpacity: 0.72,
        strokeWeight: 0.5,
        strokeColor: '#1C1B18',
      }
    }
  }, [mode])

  const sampleRows = useMemo(() => {
    if (!payload?.geojson?.features?.length) return []
    return payload.geojson.features.slice(0, 12)
  }, [payload])

  const hasFeatures   = payload && payload.feature_count > 0
  const isFallbackMap = !hasFeatures

  if (!token) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-950">
        {GOOGLE_MAPS_MISSING_MSG}
      </div>
    )
  }

  return (
    <section
      className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-3"
      aria-labelledby="circularity-map-title"
    >
      <div>
        <p id="circularity-map-title" className="text-[13px] font-semibold text-[#1C1B18]">
          Circularidad modelada · ZM {zmId}
        </p>
        {hasFeatures && (
          <p className="mt-0.5 text-[11px] text-[#6B6760]">
            Actual vs proyectado · {payload!.feature_count} celdas · {payload!.jurisdiction_scope}
          </p>
        )}
      </div>

      {/* Status banners */}
      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#A8A49C] animate-pulse">
          …
        </div>
      )}
      {!loading && isFallbackMap && (
        <div className="rounded-[8px] border border-[#F5D98A] bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#6B4800]">
          Vista de referencia — datos de circularidad pendientes de carga.
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

      <GoogleMapCanvas
        center={mapCenter}
        zoom={ZM_ZOOM[zmId] ?? 9}
        geoJson={hasFeatures ? (payload!.geojson as GeoJSON.FeatureCollection) : undefined}
        geoJsonStyle={geoJsonStyle}
        height={440}
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
