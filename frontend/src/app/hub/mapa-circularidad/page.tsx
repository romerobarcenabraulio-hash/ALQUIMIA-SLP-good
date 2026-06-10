'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, MapPin, RefreshCw, Info,
  Recycle, Building2, Trash2, TrendingUp
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GoogleMapCanvas, type MapMarker, type MapPolyline } from '@/components/maps/GoogleMapCanvas'
import { getApiUrl } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CentroAcopio {
  id: string
  nombre: string
  tipo: string
  municipio: string
  estado: string
  lat: number | null
  lon: number | null
  materiales: string[]
  precio_compra: Record<string, number>
  acepta_publico: boolean
}

interface CentroListResponse {
  total: number
  items: CentroAcopio[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_COLOR: Record<string, string> = {
  recicladora:   '#3B6D11',
  comprador:     '#1A5FA8',
  centro_acopio: '#D4881E',
  disposicion:   '#C0392B',
  otro:          '#6B6760',
}

const TIPO_LABEL: Record<string, string> = {
  recicladora:   'Recicladora',
  comprador:     'Comprador ancla',
  centro_acopio: 'Centro de acopio',
  disposicion:   'Disposición final',
  otro:          'Otro',
}

// Default center: San Luis Potosí city
const SLP_CENTER = { lat: 22.1565, lon: -100.9855 }

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] text-[#3D3A35]">{label}</span>
      {count > 0 && (
        <span className="ml-auto text-[10px] font-bold text-[#6B6760]">{count}</span>
      )}
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function CentroDetail({ centro, onClose }: { centro: CentroAcopio; onClose: () => void }) {
  const color = TIPO_COLOR[centro.tipo] ?? '#6B6760'
  const materiales = centro.materiales ?? []
  const precios = Object.entries(centro.precio_compra ?? {})

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#F0EDE5]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
          <p className="text-[13px] font-semibold text-[#1C1B18] leading-tight">{centro.nombre}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#A8A49C] hover:text-[#1C1B18] text-[16px] leading-none font-light"
        >
          ×
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: color }}
          >
            {TIPO_LABEL[centro.tipo] ?? centro.tipo}
          </span>
          {centro.acepta_publico && (
            <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-semibold text-[#2D5409]">
              Acepta público
            </span>
          )}
        </div>

        <p className="text-[11px] text-[#6B6760]">
          {centro.municipio}, {centro.estado}
        </p>

        {materiales.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8980] mb-1">Materiales</p>
            <div className="flex flex-wrap gap-1">
              {materiales.slice(0, 6).map(m => (
                <span key={m} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] text-[#3D3A35]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {precios.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8980] mb-1">Precios de compra</p>
            <div className="space-y-0.5">
              {precios.slice(0, 4).map(([mat, precio]) => (
                <div key={mat} className="flex justify-between text-[11px]">
                  <span className="text-[#6B6760] capitalize">{mat}</span>
                  <span className="font-mono font-bold text-[#3B6D11]">
                    ${Number(precio).toLocaleString('es-MX')}/ton
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ items }: { items: CentroAcopio[] }) {
  const byTipo = items.reduce<Record<string, number>>((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    { key: 'recicladora',   icon: <Recycle size={14} />,   label: 'Recicladoras' },
    { key: 'comprador',     icon: <TrendingUp size={14} />, label: 'Compradores' },
    { key: 'centro_acopio', icon: <MapPin size={14} />,     label: 'Centros acopio' },
    { key: 'disposicion',   icon: <Trash2 size={14} />,     label: 'Disposición' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(s => (
        <div key={s.key} className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5" style={{ color: TIPO_COLOR[s.key] }}>
            {s.icon}
            <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
          </div>
          <p className="text-[22px] font-bold text-[#1C1B18]">{byTipo[s.key] ?? 0}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function MapaContent() {
  const [items, setItems] = useState<CentroAcopio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<CentroAcopio | null>(null)
  const [filterTipos, setFilterTipos] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetch(`${getApiUrl()}/api/v1/centros-acopio/?limit=200`)
      .then(r => r.json())
      .then((d: CentroListResponse | CentroAcopio[]) => {
        const list = Array.isArray(d) ? d : (d.items ?? [])
        setItems(list.filter(c => c.lat && c.lon))
      })
      .catch(() => setError('No se pudo cargar el mapa. Verifica la conexión.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const visibleItems = filterTipos.size === 0
    ? items
    : items.filter(c => filterTipos.has(c.tipo))

  const markers: MapMarker[] = visibleItems.map(c => ({
    id: c.id,
    lat: c.lat!,
    lon: c.lon!,
    title: c.nombre,
    color: TIPO_COLOR[c.tipo] ?? '#6B6760',
    onClick: () => setSelected(c),
  }))

  // Simple flow lines: connect each collection center to the nearest disposicion site
  const disposiciones = visibleItems.filter(c => c.tipo === 'disposicion')
  const origenItems = visibleItems.filter(c => c.tipo === 'centro_acopio')
  const polylines: MapPolyline[] = origenItems.flatMap((origen, i) => {
    if (!disposiciones.length || !origen.lat || !origen.lon) return []
    const dest = disposiciones.reduce((best, d) => {
      if (!d.lat || !d.lon) return best
      const dist = Math.hypot((d.lat - origen.lat!), (d.lon - origen.lon!))
      const bestDist = best && best.lat && best.lon
        ? Math.hypot((best.lat - origen.lat!), (best.lon - origen.lon!))
        : Infinity
      return dist < bestDist ? d : best
    }, disposiciones[0])
    if (!dest?.lat || !dest?.lon) return []
    return [{
      id: `flow-${i}`,
      path: [
        { lat: origen.lat!, lon: origen.lon! },
        { lat: dest.lat!, lon: dest.lon! },
      ],
      color: '#D4881E',
      strokeWeight: 1,
    }]
  })

  function toggleTipo(tipo: string) {
    setFilterTipos(prev => {
      const next = new Set(prev)
      if (next.has(tipo)) next.delete(tipo)
      else next.add(tipo)
      return next
    })
  }

  const tipoGroups = Object.entries(TIPO_LABEL).map(([tipo, label]) => ({
    tipo, label,
    count: items.filter(c => c.tipo === tipo).length,
  })).filter(g => g.count > 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/hub"
          className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Mapa de Circularidad</h1>
          <p className="text-[13px] text-[#6B6760]">Centros de acopio, recicladoras y flujos RSU en la zona metropolitana</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:border-[#3B6D11] hover:text-[#3B6D11] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="mb-4">
          <StatsBar items={items} />
        </div>
      )}

      {/* Filter chips */}
      {tipoGroups.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tipoGroups.map(g => {
            const active = filterTipos.has(g.tipo)
            return (
              <button
                key={g.tipo}
                onClick={() => toggleTipo(g.tipo)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-current text-white'
                    : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1]'
                }`}
                style={active ? { background: TIPO_COLOR[g.tipo], borderColor: TIPO_COLOR[g.tipo] } : {}}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: active ? 'white' : TIPO_COLOR[g.tipo] }}
                />
                {g.label}
                <span className={`ml-0.5 ${active ? 'text-white/80' : 'text-[#A8A49C]'}`}>{g.count}</span>
              </button>
            )
          })}
          {filterTipos.size > 0 && (
            <button
              onClick={() => setFilterTipos(new Set())}
              className="rounded-full border border-[#E8E4DC] bg-white px-3 py-1 text-[11px] text-[#A8A49C] hover:text-[#C0392B] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Map + sidebar */}
      <div className="flex gap-4">
        {/* Map */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="rounded-[12px] border border-red-200 bg-[#FBEAEA] px-4 py-8 text-center">
              <p className="text-[12px] text-[#7B1F1F]">{error}</p>
            </div>
          ) : loading ? (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white flex items-center justify-center" style={{ height: 440 }}>
              <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
            </div>
          ) : (
            <div className="rounded-[12px] border border-[#E8E4DC] overflow-hidden">
              <GoogleMapCanvas
                center={SLP_CENTER}
                zoom={10}
                markers={markers}
                polylines={polylines}
                height={440}
              />
            </div>
          )}

          {/* Map legend */}
          {!loading && !error && items.length > 0 && (
            <div className="mt-3 rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={11} className="text-[#A8A49C]" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8980]">Leyenda</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                {Object.entries(TIPO_LABEL).map(([tipo, label]) => {
                  const count = items.filter(c => c.tipo === tipo).length
                  return (
                    <LegendDot key={tipo} color={TIPO_COLOR[tipo]} label={label} count={count} />
                  )
                })}
              </div>
              {origenItems.length > 0 && disposiciones.length > 0 && (
                <div className="mt-2 flex items-center gap-2 border-t border-[#F0EDE5] pt-2">
                  <span className="h-0.5 w-6 bg-[#D4881E] opacity-60" />
                  <span className="text-[10px] text-[#8E8980]">Flujo RSU estimado (acopio → disposición)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 shrink-0">
            <CentroDetail centro={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="mt-4 rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
          <Building2 size={20} className="mx-auto mb-2 text-[#A8A49C]" />
          <p className="text-[13px] text-[#8E8980] mb-3">No hay centros de acopio georeferenciados aún.</p>
          <p className="text-[11px] text-[#A8A49C]">
            Usa el panel de administración para sincronizar con DENUE o Google Places.
          </p>
        </div>
      )}

      {/* Footnote */}
      {!loading && !error && items.length > 0 && (
        <p className="mt-4 text-[10px] text-[#A8A49C]">
          {items.length} instalaciones georreferenciadas · Flujos calculados con heurística de cercanía ·
          Sprint 35 — datos DENUE/Google Places vía ALQUIMIA
        </p>
      )}
    </div>
  )
}

export default function MapaCircularidadPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <MapaContent />
      </Suspense>
    </AppShell>
  )
}
