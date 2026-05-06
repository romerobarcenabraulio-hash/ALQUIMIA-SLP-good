'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { RsuFootprintMapResponse } from '@/types'
import { getRsuFootprintMap } from '@/lib/api'

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function zmBadgeColor(zm: string): string {
  switch (zm) {
    case 'SLP':
      return '#3B6D11'
    case 'QRO':
      return '#1A5FA8'
    case 'MTY':
      return '#D4881E'
    default:
      return '#6B6760'
  }
}

export default function MexicoRsuFootprintMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [payload, setPayload] = useState<RsuFootprintMapResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? ''

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getRsuFootprintMap()
        if (!cancelled) setPayload(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando mapa RSU')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!payload || !containerRef.current || !token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-102, 23],
      zoom: 4.2,
    })
    mapRef.current = map

    const fc = {
      type: 'FeatureCollection' as const,
      features: payload.features.map(f => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [f.lng, f.lat] },
        properties: {
          municipio_id: f.municipio_id,
          nombre: f.nombre,
          zm_id: f.zm_id,
          estado: f.estado,
          poblacion: f.poblacion,
          gen_per_capita_kg_dia: f.gen_per_capita_kg_dia,
          rsu_ton_dia: f.rsu_ton_dia,
          co2e_disposal_ton_dia: f.co2e_disposal_ton_dia,
        },
      })),
    }

    map.on('load', () => {
      map.addSource('rsu-footprint', {
        type: 'geojson',
        data: fc,
      })

      map.addLayer({
        id: 'rsu-footprint-circles',
        type: 'circle',
        source: 'rsu-footprint',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'rsu_ton_dia'],
            50,
            7,
            400,
            14,
            1200,
            28,
          ],
          'circle-color': [
            'match',
            ['get', 'zm_id'],
            'SLP',
            '#3B6D11',
            'QRO',
            '#1A5FA8',
            'MTY',
            '#D4881E',
            '#8A857C',
          ],
          'circle-opacity': 0.72,
          'circle-stroke-width': 1.2,
          'circle-stroke-color': '#1C1B18',
        },
      })

      const bounds = new mapboxgl.LngLatBounds()
      payload.features.forEach(f => bounds.extend([f.lng, f.lat]))
      map.fitBounds(bounds, { padding: 56, maxZoom: 7 })

      map.on('click', 'rsu-footprint-circles', e => {
        const feat = e.features?.[0]
        if (!feat?.properties) return
        const p = feat.properties as Record<string, unknown>
        const nombre = escHtml(String(p.nombre ?? ''))
        const zm = String(p.zm_id ?? '')
        const pop = Number(p.poblacion ?? 0)
        const gen = Number(p.gen_per_capita_kg_dia ?? 0)
        const rsu = Number(p.rsu_ton_dia ?? 0)
        const co2 = Number(p.co2e_disposal_ton_dia ?? 0)
        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:240px;font-size:12px;color:#1C1B18;">
            <div style="font-weight:600;margin-bottom:6px;">${nombre}</div>
            <div style="color:#6B6760;">ZM ${zm} · población ~${pop.toLocaleString('es-MX')}</div>
            <div style="margin-top:8px;"><strong>Gen. aprox.</strong> ${gen.toFixed(2)} kg/hab/día</div>
            <div><strong>RSU ~</strong> ${rsu.toLocaleString('es-MX', { maximumFractionDigits: 1 })} t/día</div>
            <div><strong>Huella disposición ~</strong> ${co2.toLocaleString('es-MX', { maximumFractionDigits: 3 })} t CO₂e/día</div>
            <div style="margin-top:8px;font-size:10px;color:#8A857C;">Orden de magnitud educativa; no inventario oficial.</div>
          </div>`
        new mapboxgl.Popup({ maxWidth: '280px' }).setLngLat(e.lngLat).setHTML(html).addTo(map)
      })

      map.on('mouseenter', 'rsu-footprint-circles', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'rsu-footprint-circles', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [payload, token])

  if (loading) {
    return (
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-6 text-[13px] text-[#6B6760]">
        Cargando mapa RSU y huella aproximada…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
        {error}
      </div>
    )
  }

  if (!payload) return null

  return (
    <section className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-3" aria-labelledby="rsu-map-title">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">Mapa interactivo · piloto nacional</p>
        <h3 id="rsu-map-title" className="mt-1 font-serif text-[22px] text-[#1C1B18]">
          Generación RSU y huella (aprox.) por ciudad en catálogo
        </h3>
        <p className="mt-1 text-[12px] text-[#6B6760] max-w-3xl leading-relaxed">
          Visualización de los <strong>{payload.feature_count}</strong> municipios sembrados hoy (ZM San Luis Potosí,
          Querétaro y Monterrey). La expansión a más ciudades de México es incremental: mismos contratos API y fuentes
          oficiales cuando existan.
        </p>
      </div>

      <div className="rounded-[10px] border border-[#D4881E]/35 bg-[#FEF7E7] px-3 py-2 text-[11px] leading-relaxed text-[#6B6760]">
        <strong className="text-[#1C1B18]">Simulación — no es censo ni GEI oficial.</strong>{' '}
        {payload.disclaimer}
      </div>

      <p className="text-[11px] text-[#8A857C]">{payload.methodology_summary}</p>

      <div className="flex flex-wrap gap-4 text-[11px] text-[#6B6760]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: zmBadgeColor('SLP') }} /> ZM SLP
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: zmBadgeColor('QRO') }} /> ZM QRO
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: zmBadgeColor('MTY') }} /> ZM MTY
        </span>
        <span className="text-[#8A857C]">Tamaño del círculo ≈ volumen RSU diario (t/día).</span>
      </div>

      {!token ? (
        <div className="space-y-3">
          <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-950">
            Para ver el mapa interactivo Mapbox, define <code className="font-mono text-[11px]">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
            en el entorno del frontend y reinicia el servidor de desarrollo.
          </div>
          <div className="overflow-x-auto border border-[#F0EDE5] rounded-lg max-h-[280px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF8F4] text-[#8A857C] sticky top-0">
                <tr>
                  <th className="text-left py-2 px-2">Municipio</th>
                  <th className="text-right py-2 px-2">Población ~</th>
                  <th className="text-right py-2 px-2">kg/hab/día</th>
                  <th className="text-right py-2 px-2">RSU t/día ~</th>
                  <th className="text-right py-2 px-2">CO₂e t/día ~</th>
                </tr>
              </thead>
              <tbody>
                {payload.features.map(f => (
                  <tr key={f.municipio_id} className="border-t border-[#F0EDE5]">
                    <td className="py-2 px-2 font-medium text-[#1C1B18]">{f.nombre}</td>
                    <td className="py-2 px-2 text-right font-mono">{f.poblacion.toLocaleString('es-MX')}</td>
                    <td className="py-2 px-2 text-right font-mono">{f.gen_per_capita_kg_dia.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono">{f.rsu_ton_dia.toLocaleString('es-MX', { maximumFractionDigits: 1 })}</td>
                    <td className="py-2 px-2 text-right font-mono">{f.co2e_disposal_ton_dia.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="h-[420px] w-full rounded-[12px] overflow-hidden border border-[#E8E4DC]" />
      )}

      <p className="text-[10px] text-[#A8A49C] font-mono">Época catálogo: {payload.catalog_simulation_epoch}</p>
    </section>
  )
}
