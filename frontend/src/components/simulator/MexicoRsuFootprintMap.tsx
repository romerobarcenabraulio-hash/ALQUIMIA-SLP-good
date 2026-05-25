'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RsuFootprintMapResponse } from '@/types'
import { getRsuFootprintMap } from '@/lib/api'
import { GoogleMapCanvas } from '@/components/maps/GoogleMapCanvas'
import { getGoogleMapsApiKey, GOOGLE_MAPS_MISSING_MSG } from '@/lib/googleMaps'

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
  const [payload, setPayload] = useState<RsuFootprintMapResponse | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const token = getGoogleMapsApiKey()

  // Live data fetch — silently falls back to STATIC_FALLBACK on error
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getRsuFootprintMap()
        if (!cancelled) setPayload(data)
      } catch {
        if (!cancelled) setError('Datos en preparación.')
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

  const markers = useMemo(
    () => displayPayload.features.map(f => ({
      id: f.municipio_id,
      lat: f.lat,
      lon: f.lng,
      title: `${f.nombre} · ZM ${f.zm_id}`,
      color: zmBadgeColor(f.zm_id),
    })),
    [displayPayload.features],
  )

  if (!token) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-950">
        {GOOGLE_MAPS_MISSING_MSG}
      </div>
    )
  }

  return (
    <section className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-3" aria-labelledby="rsu-map-title">
      <div>
        <p id="rsu-map-title" className="text-[13px] font-semibold text-[#1C1B18]">
          Huella RSU · catálogo piloto
        </p>
        {!isFallback && (
          <p className="mt-0.5 text-[11px] text-[#6B6760]">
            {displayPayload.feature_count} municipios (SLP, QRO, MTY)
          </p>
        )}
      </div>

      {/* Status banners */}
      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#A8A49C] animate-pulse">
          …
        </div>
      )}
      {!loading && isFallback && (
        <div className="rounded-[8px] border border-[#F5D98A] bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#6B4800]">
          Vista de referencia geográfica — volúmenes RSU pendientes de carga.
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

      <GoogleMapCanvas center={{ lat: 23, lon: -102 }} zoom={5} markers={markers} height={420} />

      <p className="text-[10px] text-[#A8A49C] font-mono">Época catálogo: {displayPayload.catalog_simulation_epoch}</p>
    </section>
  )
}
