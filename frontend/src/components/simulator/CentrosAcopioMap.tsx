'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getCentrosAcopio, type CentroAcopio } from '@/lib/api'
import { cn } from '@/lib/utils'
import { GoogleMapCanvas } from '@/components/maps/GoogleMapCanvas'
import { useMapCenter } from '@/hooks/useMapCenter'
import {
  buildRecyclersKpiContract,
  getRecicladorasForZm,
} from '@/lib/recicladorasCatalog'
import { RefreshCw, AlertTriangle, MapPin, Building2, Recycle, Filter, Truck } from 'lucide-react'

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
  bodega_concesionario: '#C0392B',
  patio_concesionario:  '#8B2942',
  transferencia_rs:     '#6B4FA8',
  otro:               '#8A857C',
}

const TIPO_LABELS: Record<string, string> = {
  bodega_concesionario: 'Bodega concesionario',
  patio_concesionario: 'Patio concesionario',
  transferencia_rs: 'Transferencia RS',
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function CentrosAcopioMap({ showRecicladoras = true }: { showRecicladoras?: boolean } = {}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const cityContext = useSimulatorStore(s => s.cityContext)
  const seleccionMunicipioCatalog = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const claveInegi = seleccionMunicipioCatalog?.claveInegi ?? null
  const { center: mapCenter, loading: mapCenterLoading } = useMapCenter(zmActiva, cityContext?.nombre)

  const municipioId = municipiosActivos[0] ?? null
  const recicladoras = useMemo(
    () => (showRecicladoras ? getRecicladorasForZm(zmActiva ?? 'SLP', municipioId) : []),
    [showRecicladoras, zmActiva, municipioId],
  )

  const recyclersKpi = useMemo(
    () =>
      showRecicladoras
        ? buildRecyclersKpiContract({
            zmId: zmActiva ?? 'SLP',
            municipioId,
            caAnchor: mapCenter ?? undefined,
          })
        : null,
    [showRecicladoras, zmActiva, municipioId, mapCenter],
  )

  useEffect(() => {
    if (!showRecicladoras || !recyclersKpi || typeof window === 'undefined') return
    ;(window as unknown as { __ALQUIMIA_RECYCLERS_KPI__?: typeof recyclersKpi }).__ALQUIMIA_RECYCLERS_KPI__ =
      recyclersKpi
  }, [showRecicladoras, recyclersKpi])

  const [centros, setCentros]         = useState<CentroAcopio[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [selectedMat, setSelectedMat] = useState<string>('all')
  const [selected, setSelected]       = useState<CentroAcopio | null>(null)
  const [showOperador, setShowOperador] = useState(true)

  // Fetch centros
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCentrosAcopio({
      zm: zmActiva ?? 'SLP',
      clave_inegi: claveInegi ?? undefined,
      incluir_operador: showOperador,
    })
      .then(data => { if (!cancelled) setCentros(data.centros) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando centros') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [zmActiva, claveInegi, showOperador])

  // Filter
  const filtered = selectedMat === 'all'
    ? centros
    : centros.filter(c => c.materiales.includes(selectedMat))

  // Unique materials for filter
  const allMaterials = Array.from(new Set(centros.flatMap(c => c.materiales))).sort()

  const mapMarkers = useMemo(
    () => [
      ...filtered
        .filter(c => c.lat != null && c.lon != null)
        .map(c => ({
          id: c.centro_id,
          lat: c.lat!,
          lon: c.lon!,
          title: c.nombre,
          color: TIPO_COLORS[c.tipo] ?? '#8A857C',
          onClick: () => setSelected(c),
        })),
      ...recicladoras.map(r => ({
        id: r.id,
        lat: r.lat,
        lon: r.lon,
        title: `${r.nombre} (${r.giro})`,
        color: '#1A5FA8',
        onClick: undefined,
      })),
    ],
    [filtered, recicladoras],
  )

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

  const operadorCount = centros.filter(c => c.es_operador_principal).length

  return (
    <div className="space-y-3">
      {operadorCount > 0 && (
        <div className="rounded-[8px] border border-[#F5C6CB] bg-[#FEF7F7] px-3 py-2 text-[11px] text-[#6B2727]">
          <div className="flex items-center gap-1.5 font-semibold">
            <Truck className="h-3.5 w-3.5" />
            Operador principal ({operadorCount} instalación{operadorCount !== 1 ? 'es' : ''})
          </div>
          <p className="mt-1 leading-relaxed">
            Bodega/patio del concesionario en rojo — coordenadas aproximadas hasta validación de campo.
          </p>
        </div>
      )}

      {centros.length === 0 && !loading && (
        <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[11px] text-[#6B6760]">
          Sin centros identificados para este municipio. Ejecute sync DENUE (
          <code className="text-[10px]">POST /centros-acopio/sync/denue</code>) o registre operador en{' '}
          <code className="text-[10px]">data/geo/operadores_logisticos/{claveInegi ?? 'CVE'}.json</code>.
        </div>
      )}

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
        {showRecicladoras && recyclersKpi && (
          <>
            <div className="rounded-[8px] border border-[#BDD7F5] bg-[#EBF3FB] px-3 py-1.5">
              <span className="font-bold text-[#1A5FA8]">{recyclersKpi.recicladoras_activas}</span>
              <span className="ml-1 text-[#6B6760]">recicladoras ZM</span>
            </div>
            <div className="rounded-[8px] border border-[#BDD7F5] bg-[#EBF3FB] px-3 py-1.5">
              <span className="font-bold text-[#1A5FA8]">{recyclersKpi.cobertura_giros_pct}%</span>
              <span className="ml-1 text-[#6B6760]">cobertura giros</span>
            </div>
            <div className="rounded-[8px] border border-[#BDD7F5] bg-[#EBF3FB] px-3 py-1.5">
              <span className="font-bold text-[#1A5FA8]">{recyclersKpi.distancia_promedio_km_ca_recicladora} km</span>
              <span className="ml-1 text-[#6B6760]">dist. prom. CA→recicladora</span>
            </div>
          </>
        )}
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5">
          <span className="font-bold text-[#23470A]">{centros.filter(c => c.es_operador_principal).length}</span>
          <span className="ml-1 text-[#6B6760]">operador</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[10px] text-[#6B6760] cursor-pointer">
        <input
          type="checkbox"
          checked={showOperador}
          onChange={e => setShowOperador(e.target.checked)}
          className="accent-[#C0392B]"
        />
        Mostrar bodega/patio del concesionario
      </label>

      {showRecicladoras && recicladoras.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#6B6760]">
          <Recycle className="h-3 w-3 text-[#1A5FA8]" />
          <span>Recicladoras locales ({zmActiva}) — marcadores azules en mapa</span>
          {recicladoras.map(r => (
            <span
              key={r.id}
              className="rounded-full border border-[#BDD7F5] bg-white px-2 py-0.5"
              title={r.fuente}
            >
              {r.giro}: {r.nombre}
            </span>
          ))}
        </div>
      )}

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
          {mapCenter && !mapCenterLoading ? (
            <GoogleMapCanvas
              center={mapCenter}
              zoom={11}
              markers={mapMarkers}
              height={360}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#EBF3FB]">
              <p className="text-[11px] text-[#1A5FA8]">Cargando mapa…</p>
            </div>
          )}
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
                  {c.es_operador_principal && (
                    <span className="ml-auto shrink-0 rounded-full bg-[#FDE8E8] px-1.5 py-0.5 text-[9px] font-bold text-[#B91C1C]">
                      Operador
                    </span>
                  )}
                  {!c.es_operador_principal && c.verificado && (
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
          <p className="text-[10px] text-[#8A857C]">
            {TIPO_LABELS[c.tipo] ?? c.tipo.replace(/_/g, ' ')}
            {c.operador_nombre ? ` · ${c.operador_nombre}` : ''}
          </p>
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
        {c.es_operador_principal && (
          <span className="rounded bg-[#FDE8E8] px-1.5 py-0.5 text-[9px] font-bold text-[#B91C1C]">
            Operador principal
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

      {c.notas && (
        <p className="mt-2 text-[10px] italic text-[#8A857C]">{c.notas}</p>
      )}

      <p className="mt-2 text-[9px] text-[#8A857C]">
        Fuente: {c.fuente} · score {(c.score_confianza * 100).toFixed(0)}%
      </p>
    </div>
  )
}
