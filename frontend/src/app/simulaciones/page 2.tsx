'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  Play,
  Trash2,
  Search,
  Plus,
  BarChart3,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { listSimulations, deleteSimulation, type SimulationMetadata } from '@/lib/simulationPersistence'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'name', label: 'Nombre A-Z' },
] as const

type SortOption = typeof SORT_OPTIONS[number]['value']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SimulationCard({
  sim,
  onLoad,
  onDelete,
  deleting,
}: {
  sim: SimulationMetadata
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const municipalities = sim.municipios ?? []
  return (
    <div className="group rounded-lg border border-[#E8E4DC] bg-white p-4 hover:border-[#3B6D11] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#1C1B18] truncate">{sim.name || 'Simulación sin nombre'}</h3>
          {sim.description && (
            <p className="mt-0.5 text-xs text-[#8E8980] line-clamp-2">{sim.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B6760]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDate(sim.updatedAt || sim.createdAt)}
            </span>
            {municipalities.length > 0 && (
              <span className="bg-[#EAF3DE] text-[#2F5B0D] px-2 py-0.5 rounded text-[11px]">
                {municipalities[0]}{municipalities.length > 1 ? ` +${municipalities.length - 1}` : ''}
              </span>
            )}
            {sim.horizonte && (
              <span className="bg-[#F0EDE6] px-2 py-0.5 rounded text-[11px]">
                {sim.horizonte} años
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(sim.id)}
            disabled={deleting}
            className="p-1.5 rounded text-[#8E8980] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
      <button
        onClick={() => onLoad(sim.id)}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded bg-[#3B6D11] px-3 py-2 text-xs font-medium text-white hover:bg-[#2D5409] transition-colors"
      >
        <Play size={12} />
        Continuar simulación
        <ChevronRight size={12} />
      </button>
    </div>
  )
}

export default function SimulacionesPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<SimulationMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listSimulations()
      setSimulations(result.simulations ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las simulaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleLoad = (id: string) => {
    router.push(`/simulator?simulation_id=${id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta simulación? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await deleteSimulation(id)
      setSimulations(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = simulations
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.municipios?.some(m => m.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    })

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#8E8980]">Simulador ALQUIMIA</p>
            <h1 className="font-serif text-[26px] text-[#1C1B18]">Mis simulaciones</h1>
            <p className="mt-1 text-sm text-[#6B6760]">
              {simulations.length > 0
                ? `${simulations.length} simulación${simulations.length !== 1 ? 'es' : ''} guardada${simulations.length !== 1 ? 's' : ''}`
                : 'Historial de escenarios de circularidad municipal'}
            </p>
          </div>
          <button
            onClick={() => router.push('/simulator')}
            className="flex items-center gap-2 rounded-lg bg-[#3B6D11] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2D5409] transition-colors"
          >
            <Plus size={15} />
            Nueva simulación
          </button>
        </div>

        {/* Stats bar */}
        {simulations.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Guardadas', value: simulations.length, icon: <BarChart3 size={14} /> },
              {
                label: 'Municipios distintos',
                value: new Set(simulations.flatMap(s => s.municipios ?? [])).size,
                icon: null,
              },
              {
                label: 'Horizonte promedio',
                value: simulations.length > 0
                  ? Math.round(simulations.reduce((sum, s) => sum + (s.horizonte ?? 0), 0) / simulations.length) + ' años'
                  : '—',
                icon: <Clock size={14} />,
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[#6B6760] mb-1">
                  {icon}
                  <span className="text-[10px] uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-xl font-semibold text-[#1C1B18]">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + sort */}
        {simulations.length > 0 && (
          <div className="mb-4 flex gap-2">
            <label className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8980]" />
              <input
                type="text"
                placeholder="Buscar por nombre o municipio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E8E4DC] bg-white pl-9 pr-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none"
              />
            </label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-[#E8E4DC] bg-white px-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#3B6D11]" />
            <span className="ml-3 text-sm text-[#6B6760]">Cargando simulaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D8D1C4] bg-[#FDFCFA] py-16 text-center">
            <BarChart3 size={32} className="mx-auto mb-3 text-[#D8D1C4]" />
            {search ? (
              <>
                <p className="text-sm font-medium text-[#1C1B18]">Sin resultados para "{search}"</p>
                <p className="mt-1 text-xs text-[#8E8980]">Intenta con otro término de búsqueda</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#1C1B18]">Aún no tienes simulaciones guardadas</p>
                <p className="mt-1 text-xs text-[#8E8980]">Crea tu primera simulación para explorar escenarios de circularidad</p>
                <button
                  onClick={() => router.push('/simulator')}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5409] transition-colors"
                >
                  <Plus size={14} />
                  Comenzar simulación
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(sim => (
              <SimulationCard
                key={sim.id}
                sim={sim}
                onLoad={handleLoad}
                onDelete={handleDelete}
                deleting={deletingId === sim.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
