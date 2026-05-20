'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { RsuFootprintMapResponse } from '@/types'
import { getRsuFootprintMap } from '@/lib/api'

// ── Static fallback ───────────────────────────────────────────────────────────
// Geographic reference only (cabeceras municipales, EPSG:4326).
// All RSU values are 0 — shown as min-size circles until the API responds.
// Coordinates: INEGI Marco Geoestadístico Nacional 2022 (centros de poblado).
const STATIC_FALLBACK: RsuFootprintMapResponse = {
  feature_count: 9,
  features: [
    { municipio_id: 'slp_slp',  nombre: 'San Luis Potosí',         zm_id: 'SLP', estado: 'San Luis Potosí', lat: 22.1512,  lng: -100.9747, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'slp_sol',  nombre: 'Soledad de Graciano S.',  zm_id: 'SLP', estado: 'San Luis Potosí', lat: 22.1792,  lng: -100.9356, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'mty_mty',  nombre: 'Monterrey',               zm_id: 'MTY', estado: 'Nuevo León',      lat: 25.6866,  lng: -100.3161, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'mty_gdp',  nombre: 'Guadalupe',               zm_id: 'MTY', estado: 'Nuevo León',      lat: 25.6747,  lng: -100.2570, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'mty_sng',  nombre: 'San Nicolás de los Garza',zm_id: 'MTY', estado: 'Nuevo León',      lat: 25.7456,  lng: -100.3024, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'mty_apk',  nombre: 'Apodaca',                 zm_id: 'MTY', estado: 'Nuevo León',      lat: 25.7822,  lng: -100.1877, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'qro_qro',  nombre: 'Querétaro',               zm_id: 'QRO', estado: 'Querétaro',       lat: 20.5888,  lng: -100.3899, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'qro_cor',  nombre: 'Corregidora',             zm_id: 'QRO', estado: 'Querétaro',       lat: 20.5317,  lng: -100.4393, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
    { municipio_id: 'qro_mar',  nombre: 'El Marqués',              zm_id: 'QRO', estado: 'Querétaro',       lat: 20.6047,  lng: -100.3108, poblacion: 0, gen_per_capita_kg_dia: 0, rsu_ton_dia: 1, co2e_disposal_ton_dia: 0 },
  ],
  disclaimer: 'Vista de referencia geográfica — posicionamiento de cabeceras municipales. Los valores de RSU se cargarán cuando el servidor esté disponible.',
  methodology_summary: 'Coordenadas de referencia INEGI MGN 2022 (cabeceras). Datos de generación RSU en espera del backend.',
  catalog_simulation_epoch: 'fallback-estático',
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function zmBadgeColor(zm: string): string {
  switch (zm) {
    case 'SLP': return '#3B6D11'
    case 'QRO': return '#1A5FA8'
    case 'MTY': return '#D4881E'
    default:    return '#6B6760'
  }
}

export default function MexicoRsuFootprintMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const [payload, setPayload] = useState<RsuFootprintMapResponse | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? ''

  // Live data fetch — silently falls back to STATIC_FALLBACK on error
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getRsuFootprintMap()
        if (!cancelled) setPayload(data)
      } catch {
        if (!cancelled) setError('Servidor no disponible — mostrando referencia geográfica estática.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Effective data: real payload when available, otherwise static fallback
  // Map always initializes — even on backend timeout/error.
  const displayPayload = payload ?? STATIC_FALLBACK
  const isFallback     = payload === null

  useEffect(() => {
    if (!containerRef.current || !token) return

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
      features: displayPayload.features.map(f => ({
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
          is_fallback: isFallback,
        },
      })),
    }

    map.on('load', () => {
      map.addSource('rsu-footprint', { type: 'geojson', data: fc })

      map.addLayer({
        id: 'rsu-footprint-circles',
        type: 'circle',
        source: 'rsu-footprint',
        paint: {
          'circle-radius': isFallback
            ? 9 // fixed size for fallback (no data to interpolate)
            : [
                'interpolate', ['linear'], ['get', 'rsu_ton_dia'],
                50, 7, 400, 14, 1200, 28,
              ],
          'circle-color': [
            'match', ['get', 'zm_id'],
            'SLP', '#3B6D11',
            'QRO', '#1A5FA8',
            'MTY', '#D4881E',
            '#8A857C',
          ],
          'circle-opacity': isFallback ? 0.45 : 0.72,
          'circle-stroke-width': 1.2,
          'circle-stroke-color': '#1C1B18',
        },
      })

      const bounds = new mapboxgl.LngLatBounds()
      displayPayload.features.forEach(f => bounds.extend([f.lng, f.lat]))
      map.fitBounds(bounds, { padding: 56, maxZoom: 7 })

      map.on('click', 'rsu-footprint-circles', e => {
        const feat = e.features?.[0]
        if (!feat?.properties) return
        const p = feat.properties as Record<string, unknown>
        const nombre = escHtml(String(p.nombre ?? ''))
        const zm     = String(p.zm_id ?? '')
        const isFb   = Boolean(p.is_fallback)
        const pop    = Number(p.poblacion ?? 0)
        const gen    = Number(p.gen_per_capita_kg_dia ?? 0)
        const rsu    = Number(p.rsu_ton_dia ?? 0)
        const co2    = Number(p.co2e_disposal_ton_dia ?? 0)

        const html = isFb
          ? `<div style="font-family:system-ui,sans-serif;max-width:240px;font-size:12px;color:#1C1B18;">
               <div style="font-weight:600;margin-bottom:6px;">${nombre}</div>
               <div style="color:#6B6760;">ZM ${zm}</div>
               <div style="margin-top:8px;font-size:11px;color:#D4881E;">Datos de generación RSU en espera del servidor.</div>
             </div>`
          : `<div style="font-family:system-ui,sans-serif;max-width:240px;font-size:12px;color:#1C1B18;">
               <div style="font-weight:600;margin-bottom:6px;">${nombre}</div>
               <div style="color:#6B6760;">ZM ${zm} · población ~${pop.toLocaleString('es-MX')}</div>
               <div style="margin-top:8px;"><strong>Gen. aprox.</strong> ${gen.toFixed(2)} kg/hab/día</div>
               <div><strong>RSU ~</strong> ${rsu.toLocaleString('es-MX', { maximumFractionDigits: 1 })} t/día</div>
               <div><strong>Huella disposición ~</strong> ${co2.toLocaleString('es-MX', { maximumFractionDigits: 3 })} t CO₂e/día</div>
               <div style="margin-top:8px;font-size:10px;color:#8A857C;">Orden de magnitud educativa; no inventario oficial.</div>
             </div>`

        new mapboxgl.Popup({ maxWidth: '280px' }).setLngLat(e.lngLat).setHTML(html).addTo(map)
      })

      map.on('mouseenter', 'rsu-footprint-circles', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'rsu-footprint-circles', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  // Re-initialize when real payload arrives (replaces fallback)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, token])

  // When no token: always show fallback table (no Mapbox)
  if (!token) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-950">
        Para ver el mapa interactivo define <code className="font-mono text-[11px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> en el entorno y reinicia el servidor.
      </div>
    )
  }

  return (
    <section className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-3" aria-labelledby="rsu-map-title">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">Mapa interactivo · piloto nacional</p>
        <h3 id="rsu-map-title" className="mt-1 font-serif text-[22px] text-[#1C1B18]">
          Generación RSU y huella (aprox.) por ciudad en catálogo
        </h3>
        <p className="mt-1 text-[12px] text-[#6B6760] max-w-3xl leading-relaxed">
          {isFallback
            ? 'Referencia geográfica de las ZMs en catálogo. Los datos de generación RSU se cargarán cuando el servidor responda.'
            : <>Visualización de los <strong>{displayPayload.feature_count}</strong> municipios sembrados hoy (ZM San Luis Potosí, Querétaro y Monterrey).</>
          }
        </p>
      </div>

      {/* Status banners */}
      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#A8A49C] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D4881E] animate-pulse" />
          Conectando con el servidor para datos de generación RSU…
        </div>
      )}
      {!loading && isFallback && (
        <div className="rounded-[8px] border border-[#F5D98A] bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#6B4800]">
          {error ?? 'Servidor no disponible.'} Los puntos muestran la ubicación geográfica de referencia — sin datos de volumen.
        </div>
      )}
      {!isFallback && (
        <div className="rounded-[10px] border border-[#D4881E]/35 bg-[#FEF7E7] px-3 py-2 text-[11px] leading-relaxed text-[#6B6760]">
          <strong className="text-[#1C1B18]">Simulación — no es censo ni GEI oficial.</strong>{' '}
          {displayPayload.disclaimer}
        </div>
      )}

      {!isFallback && (
        <p className="text-[11px] text-[#8A857C]">{displayPayload.methodology_summary}</p>
      )}

      <div className="flex flex-wrap gap-4 text-[11px] text-[#6B6760]">
        {(['SLP','QRO','MTY'] as const).map(zm => (
          <span key={zm} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: zmBadgeColor(zm) }} /> ZM {zm}
          </span>
        ))}
        <span className="text-[#8A857C]">
          {isFallback ? 'Círculos = ubicación de cabecera (tamaño uniforme).' : 'Tamaño del círculo ≈ volumen RSU diario (t/día).'}
        </span>
      </div>

      {/* Map canvas — always rendered when token is present */}
      <div ref={containerRef} className="h-[420px] w-full rounded-[12px] overflow-hidden border border-[#E8E4DC]" />

      <p className="text-[10px] text-[#A8A49C] font-mono">Época catálogo: {displayPayload.catalog_simulation_epoch}</p>
    </section>
  )
}
