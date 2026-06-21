'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, Filter, ExternalLink, ChevronDown, ChevronUp,
  CheckCircle2, Globe, Building2, Scale, Loader2
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IniciativaRegulatorio {
  id: string
  clave: string
  titulo: string
  organismo: string
  ambito: string
  estado_mx: string | null
  resumen: string
  aplica_rsu: boolean
  aplica_rcd: boolean
  aplica_agua: boolean
  articulos_clave: string[]
  obligacion_municipal: string
  consecuencia_incumplimiento: string
  url_oficial: string | null
  vigente: boolean
  ultima_actualizacion: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const AMBITO_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  federal:                 { label: 'Federal',               color: 'text-[#1A5FA8]', bg: 'bg-[#E8F0FB]', icon: <Scale size={11} /> },
  estatal:                 { label: 'Estatal',               color: 'text-[#8B5A00]', bg: 'bg-[#FEF7E7]', icon: <Building2 size={11} /> },
  norma_tecnica:           { label: 'Norma Técnica',         color: 'text-[#2D5409]', bg: 'bg-[#EAF3DE]', icon: <CheckCircle2 size={11} /> },
  estandar_internacional:  { label: 'Estándar Internacional',color: 'text-[#5B2C8A]', bg: 'bg-[#F3EDFB]', icon: <Globe size={11} /> },
}

const AMBITO_OPTIONS = [
  { value: '', label: 'Todos los ámbitos' },
  { value: 'federal', label: 'Federal' },
  { value: 'estatal', label: 'Estatal' },
  { value: 'norma_tecnica', label: 'Norma Técnica' },
  { value: 'estandar_internacional', label: 'Estándar Internacional' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function AmbitoPill({ ambito }: { ambito: string }) {
  const cfg = AMBITO_CFG[ambito] ?? { label: ambito, color: 'text-[#6B6760]', bg: 'bg-[#F0EDE5]', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function TagPill({ label, active }: { label: string; active: boolean }) {
  if (!active) return null
  return (
    <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-semibold text-[#2D5409]">
      {label}
    </span>
  )
}

function IniciativaCard({ ini }: { ini: IniciativaRegulatorio }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
      {/* Header */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-[#FAFAF8] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold text-[#3B6D11]">{ini.clave}</span>
            <AmbitoPill ambito={ini.ambito} />
            <TagPill label="RSU" active={ini.aplica_rsu} />
            <TagPill label="RCD" active={ini.aplica_rcd} />
            <TagPill label="Agua" active={ini.aplica_agua} />
          </div>
          <p className="text-[13px] font-semibold text-[#1C1B18] leading-snug">{ini.titulo}</p>
          <p className="mt-0.5 text-[11px] text-[#8E8980]">{ini.organismo}</p>
        </div>
        <span className="shrink-0 mt-1 text-[#A8A49C]">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#F0EDE5] px-5 py-4 space-y-4">
          {/* Resumen */}
          <p className="text-[12px] text-[#3D3A35] leading-relaxed">{ini.resumen}</p>

          {/* Artículos clave */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760] mb-1.5">Artículos clave</p>
            <div className="flex flex-wrap gap-1.5">
              {ini.articulos_clave.map(a => (
                <span key={a} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 text-[10px] font-mono text-[#3D3A35]">
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Obligación / consecuencia */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[8px] border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2D5409] mb-1">Obligación municipal</p>
              <p className="text-[11px] text-[#2D5409] leading-snug">{ini.obligacion_municipal}</p>
            </div>
            <div className="rounded-[8px] border border-[#F6C84B]/40 bg-[#FEF7E7] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A4F08] mb-1">Consecuencia de incumplimiento</p>
              <p className="text-[11px] text-[#8A4F08] leading-snug">{ini.consecuencia_incumplimiento}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[10px] text-[#A8A49C]">
              Última actualización: {ini.ultima_actualizacion}
              {ini.estado_mx && ` · ${ini.estado_mx}`}
            </p>
            {ini.url_oficial && (
              <a
                href={ini.url_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-[8px] border border-[#E8E4DC] px-3 py-1 text-[11px] text-[#3B6D11] hover:border-[#3B6D11] hover:bg-[#EAF3DE] transition-colors"
              >
                <ExternalLink size={11} />
                Texto oficial
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function CatalogoContent() {
  const [iniciativas, setIniciativas] = useState<IniciativaRegulatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [ambito, setAmbito] = useState('')
  const [soloRSU, setSoloRSU] = useState(false)
  const [soloRCD, setSoloRCD] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (ambito) params.set('ambito', ambito)
    if (soloRSU) params.set('aplica_rsu', 'true')
    if (soloRCD) params.set('aplica_rcd', 'true')
    if (q.trim()) params.set('q', q.trim())

    setLoading(true)
    fetch(`${getApiUrl()}/api/v1/catalogo-iniciativas?${params}`)
      .then(r => r.json())
      .then(d => { setIniciativas(Array.isArray(d) ? d : []); setError('') })
      .catch(() => setError('No se pudo cargar el catálogo.'))
      .finally(() => setLoading(false))
  }, [q, ambito, soloRSU, soloRCD])

  const ambitoCount = AMBITO_OPTIONS.slice(1).reduce<Record<string, number>>((acc, o) => {
    acc[o.value] = iniciativas.filter(i => i.ambito === o.value).length
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/hub"
          className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Catálogo de Iniciativas Regulatorias</h1>
          <p className="text-[13px] text-[#6B6760]">LGPGIR · NOMs · GRI · CSRD · ASF — municipios mexicanos</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AMBITO_OPTIONS.slice(1).map(o => {
          const cfg = AMBITO_CFG[o.value]
          const count = ambitoCount[o.value] ?? 0
          return (
            <button
              key={o.value}
              onClick={() => setAmbito(prev => prev === o.value ? '' : o.value)}
              className={`rounded-[12px] border px-4 py-3 text-left transition-colors ${
                ambito === o.value
                  ? `border-current ${cfg.bg} ${cfg.color}`
                  : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1] hover:bg-[#FAFAF8]'
              }`}
            >
              <p className="text-[20px] font-bold">{count}</p>
              <p className="text-[10px] font-semibold">{o.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filters bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A49C]" />
          <input
            type="text"
            placeholder="Buscar por clave, título o resumen…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full rounded-[8px] border border-[#E8E4DC] bg-white pl-8 pr-3 py-2 text-[12px] text-[#1C1B18] placeholder:text-[#A8A49C] outline-none focus:border-[#3B6D11]"
          />
        </div>

        {/* Ámbito selector */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A49C] pointer-events-none" />
          <select
            value={ambito}
            onChange={e => setAmbito(e.target.value)}
            className="appearance-none rounded-[8px] border border-[#E8E4DC] bg-white pl-8 pr-7 py-2 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11] cursor-pointer"
          >
            {AMBITO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setSoloRSU(v => !v)}
          className={`rounded-[8px] border px-3 py-2 text-[11px] font-semibold transition-colors ${
            soloRSU
              ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2D5409]'
              : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1]'
          }`}
        >
          RSU
        </button>
        <button
          onClick={() => setSoloRCD(v => !v)}
          className={`rounded-[8px] border px-3 py-2 text-[11px] font-semibold transition-colors ${
            soloRCD
              ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2D5409]'
              : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1]'
          }`}
        >
          RCD
        </button>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="mb-4 text-[11px] text-[#8E8980]">
          {iniciativas.length} iniciativa{iniciativas.length !== 1 ? 's' : ''} {q || ambito || soloRSU || soloRCD ? 'con los filtros aplicados' : 'en el catálogo'}
        </p>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
        </div>
      )}

      {error && (
        <div className="rounded-[10px] border border-red-200 bg-[#FBEAEA] px-4 py-3 text-[12px] text-[#7B1F1F]">
          {error}
        </div>
      )}

      {/* Cards */}
      {!loading && !error && (
        <div className="space-y-3">
          {iniciativas.length === 0 ? (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
              <p className="text-[13px] text-[#8E8980]">Sin resultados para los filtros seleccionados.</p>
            </div>
          ) : (
            iniciativas.map(ini => <IniciativaCard key={ini.id} ini={ini} />)
          )}
        </div>
      )}

      {/* Footnote */}
      {!loading && !error && iniciativas.length > 0 && (
        <p className="mt-6 text-[10px] text-[#A8A49C]">
          Catálogo nacional · Sprint 34 · ALQUIMIA no sustituye asesoría jurídica — requiere validación de especialista antes de presentar ante autoridades.
        </p>
      )}
    </div>
  )
}

export default function CatalogoIniciativasPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <CatalogoContent />
      </Suspense>
    </AppShell>
  )
}
