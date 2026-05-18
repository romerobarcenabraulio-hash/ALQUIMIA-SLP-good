'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getCentrosAcopio, type CentroAcopio } from '@/lib/api'
import { cn } from '@/lib/utils'
import { RefreshCw, AlertTriangle, MapPin, Building2, Recycle, Filter } from 'lucide-react'

const MATERIAL_LABELS: Record<string, string> = {
  pet: 'PET',
  hdpe: 'HDPE',
  carton: 'Cartón',
  papel: 'Papel',
  vidrio: 'Vidrio',
  aluminio: 'Aluminio',
  acero: 'Acero',
  organico: 'Orgánico',
  tetrapak: 'Tetra Pak',
  electronico: 'Electrónico',
  baterias: 'Baterías',
  aceite: 'Aceite',
  textil: 'Textil',
  otro: 'Otro',
}

const TIPO_COLORS: Record<string, string> = {
  centro_municipal:   '#3B6D11',
  empresa_recicladora: '#1A5FA8',
  punto_verde:        '#2D9E4A',
  chatarreria:        '#D4881E',
  banco_de_residuos:  '#7B3FA8',
  otro:               '#8A857C',
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function CentrosAcopioMap() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const token    = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '').trim()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)

  const [centros, setCentros]         = useState<CentroAcopio[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [selectedMat, setSelectedMat] = useState<string>('all')
  const [selected, setSelected]       = useState<CentroAcopio | null>(null)

  // Fetch centros
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCentrosAcopio({ zm: zmActiva ?? 'SLP' })
      .then(data => { if (!cancelled) setCentros(data.centros) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando centros') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [zmActiva])

  // Filter
  const filtered = selectedMat === 'all'
    ? centros
    : centros.filter(c => c.materiales.includes(selectedMat))

  // Unique materials for filter
  const allMaterials = Array.from(new Set(centros.flatMap(c => c.materiales))).sort()

  // Build/update map
  useEffect(() => {
    if (!filtered.length || !containerRef.current || !token) return

    mapboxgl.accessToken = token

    // Remove old map
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const centerCoord: [number, number] = zmActiva === 'MTY'
      ? [-100.31, 25.67]
      : zmActiva === 'QRO'
      ? [-100.39, 20.59]
      : [-100.98, 22.15]

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: centerCoord,
      zoom: 11,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: filtered
          .filter(c => c.lat != null && c.lon != null)
          .map(c => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.lon!, c.lat!] },
            properties: {
              centro_id:   c.centro_id,
              nombre:      c.nombre,
              tipo:        c.tipo,
              direccion:   c.direccion,
              municipio:   c.municipio,
              materiales:  c.materiales.join(', '),
              verificado:  c.verificado,
              score:       c.score_confianza,
              horario:     c.horario ?? '—',
              telefono:    c.telefono ?? '—',
              acepta_empresa: c.acepta_empresa,
              color:       TIPO_COLORS[c.tipo] ?? '#8A857C',
            },
          })),
      }

      map.addSource('centros', { type: 'geojson', data: fc })

      // Outer ring for verified centers
      map.addLayer({
        id: 'centros-verified-ring',
        type: 'circle',
        source: 'centros',
        filter: ['==', ['get', 'verificado'], true],
        paint: {
          'circle-radius': 14,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.15,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'color'],
        },
      })

      map.addLayer({
        id: 'centros-circles',
        type: 'circle',
        source: 'centros',
        paint: {
          'circle-radius': 9,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#1C1B18',
        },
      })

      map.addLayer({
        id: 'centros-labels',
        type: 'symbol',
        source: 'centros',
        layout: {
          'text-field': ['get', 'nombre'],
          'text-size': 10,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#1C1B18',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
        },
      })

      // Fit bounds
      if (filtered.filter(c => c.lat != null).length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        filtered
          .filter(c => c.lat != null && c.lon != null)
          .forEach(c => bounds.extend([c.lon!, c.lat!]))
        map.fitBounds(bounds, { padding: 50, maxZoom: 13 })
      }

      map.on('click', 'centros-circles', e => {
        const feat = e.features?.[0]
        if (!feat?.properties) return
        const p = feat.properties as Record<string, string | boolean | number>
        const found = filtered.find(c => c.centro_id === p.centro_id)
        if (found) setSelected(found)
      })
      map.on('mouseenter', 'centros-circles', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'centros-circles', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, token])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-[#F6FAEF] px-4 py-6 text-[12px] text-[#5A6347]">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando centros de acopio para {zmActiva ?? 'ZM'}…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* KPI bar */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5">
          <span className="font-bold text-[#23470A]">{centros.length}</span>
          <span className="ml-1 text-[#6B6760]">centros en {zmActiva}</span>
        </div>
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5">
          <span className="font-bold text-[#23470A]">{centros.filter(c => c.verificado).length}</span>
          <span className="ml-1 text-[#6B6760]">verificados</span>
        </div>
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5">
          <span className="font-bold text-[#23470A]">{centros.filter(c => c.acepta_empresa).length}</span>
          <span className="ml-1 text-[#6B6760]">aceptan empresa</span>
        </div>
      </div>

      {/* Material filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3 w-3 text-[#8A857C]" />
        <button
          onClick={() => setSelectedMat('all')}
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
            selectedMat === 'all'
              ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
              : 'border-[#E8E4DC] text-[#6B6760] hover:bg-[#EAF3DE]',
          )}
        >
          Todos
        </button>
        {allMaterials.map(mat => (
          <button
            key={mat}
            onClick={() => setSelectedMat(mat === selectedMat ? 'all' : mat)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
              selectedMat === mat
                ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                : 'border-[#E8E4DC] text-[#6B6760] hover:bg-[#EAF3DE]',
            )}
          >
            {MATERIAL_LABELS[mat] ?? mat}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* Map */}
        <div
          className="relative min-h-[320px] overflow-hidden rounded-[12px] border border-[#E8E4DC]"
          style={{ height: 360 }}
        >
          {!token && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8F6F1]">
              <p className="text-center text-[12px] text-[#8A857C]">
                Configura NEXT_PUBLIC_MAPBOX_TOKEN<br />para ver el mapa interactivo
              </p>
            </div>
          )}
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {/* Sidebar: selected card OR list */}
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 360 }}>
          {selected ? (
            <CentroCard centro={selected} onClose={() => setSelected(null)} />
          ) : (
            filtered.map(c => (
              <button
                key={c.centro_id}
                onClick={() => setSelected(c)}
                className="w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-left hover:border-[#3B6D11]/40 hover:bg-[#F6FAEF] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin
                    className="h-3 w-3 shrink-0"
                    style={{ color: TIPO_COLORS[c.tipo] ?? '#8A857C' }}
                  />
                  <span className="truncate text-[11px] font-medium text-[#1C1B18]">{c.nombre}</span>
                  {c.verificado && (
                    <span className="ml-auto shrink-0 rounded-full bg-[#EAF3DE] px-1.5 py-0.5 text-[9px] font-bold text-[#23470A]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {c.materiales.slice(0, 4).map(m => (
                    <span key={m} className="rounded bg-[#F0EDE8] px-1 py-0.5 text-[9px] text-[#6B6760]">
                      {MATERIAL_LABELS[m] ?? m}
                    </span>
                  ))}
                  {c.materiales.length > 4 && (
                    <span className="text-[9px] text-[#8A857C]">+{c.materiales.length - 4}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#8A857C]">
        Fuentes: DENUE INEGI · Google Places · registro usuario · ÁGORA GOV ALQUIMIA
      </p>
    </div>
  )
}

function CentroCard({ centro: c, onClose }: { centro: CentroAcopio; onClose: () => void }) {
  return (
    <div className="rounded-[10px] border border-[#3B6D11]/30 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-[#1C1B18]">{c.nombre}</p>
          <p className="text-[10px] text-[#8A857C]">{c.tipo.replace(/_/g, ' ')}</p>
        </div>
        <button onClick={onClose} className="text-[11px] text-[#8A857C] hover:text-[#1C1B18]">✕</button>
      </div>

      <div className="space-y-1 text-[11px] text-[#5A6347]">
        <p className="flex gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{c.direccion}</p>
        {c.telefono && <p>📞 {c.telefono}</p>}
        {c.horario && <p>🕐 {c.horario}</p>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {c.acepta_publico && (
          <span className="rounded bg-[#EAF3DE] px-1.5 py-0.5 text-[9px] font-medium text-[#23470A]">
            Público ✓
          </span>
        )}
        {c.acepta_empresa && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-800">
            Empresa ✓
          </span>
        )}
        {c.verificado && (
          <span className="rounded bg-[#EAF3DE] px-1.5 py-0.5 text-[9px] font-bold text-[#23470A]">
            Verificado ✓
          </span>
        )}
      </div>

      {/* Materiales con precio */}
      <div className="mt-2">
        <p className="mb-1 text-[10px] font-semibold text-[#6B6760]">Materiales aceptados</p>
        <div className="flex flex-wrap gap-1">
          {c.materiales.map(m => {
            const precio = c.precio_compra?.[m]
            return (
              <div key={m} className="rounded border border-[#E8E4DC] bg-[#FAFAF8] px-1.5 py-0.5 text-[9px]">
                <span className="font-medium text-[#1C1B18]">{MATERIAL_LABELS[m] ?? m}</span>
                {precio != null && (
                  <span className="ml-1 text-[#3B6D11]">${precio}/kg</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[9px] text-[#8A857C]">
        Fuente: {c.fuente} · score {(c.score_confianza * 100).toFixed(0)}%
      </p>
    </div>
  )
}
