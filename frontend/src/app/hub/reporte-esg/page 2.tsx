'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, AlertTriangle, CheckCircle2, MinusCircle, XCircle, BarChart2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'
import { useAlquimiaToken } from '@/lib/useAlquimiaToken'
import { listSimulations, type SimulationMetadata } from '@/lib/simulationPersistence'
import { AuditorBadge, buildAuditorScore } from '@/components/auditor/AuditorBadge'

// ─── Types (mirror backend schemas) ──────────────────────────────────────────

interface GRIIndicator {
  code: string
  titulo: string
  valor: string | null
  unidad: string
  fuente: string
  nota?: string | null
  estatus: 'disponible' | 'estimado' | 'no_disponible'
}

interface ESGSeccion {
  id: string
  titulo: string
  descripcion: string
  indicadores: GRIIndicator[]
}

interface ESGReporte {
  municipio: string
  estado: string
  periodo: string
  fecha_generacion: string
  simulation_id: string | null
  simulation_name: string | null
  secciones: ESGSeccion[]
  advertencias: string[]
  auditor_score: number
  version: string
}

// ─── Indicator status config ──────────────────────────────────────────────────

const STATUS_CFG = {
  disponible:    { icon: <CheckCircle2 size={13} className="text-[#3B6D11]" />, bg: 'bg-[#EAF3DE]', text: 'text-[#2D5409]', label: 'Disponible' },
  estimado:      { icon: <MinusCircle size={13} className="text-[#D4881E]" />,  bg: 'bg-[#FEF7E7]', text: 'text-[#8A4F08]', label: 'Estimado' },
  no_disponible: { icon: <XCircle size={13} className="text-[#C0392B]" />,      bg: 'bg-[#FBEAEA]', text: 'text-[#7B1F1F]', label: 'No disponible' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IndicatorRow({ ind }: { ind: GRIIndicator }) {
  const cfg = STATUS_CFG[ind.estatus]
  return (
    <div className="border-b border-[#F0EDE5] py-3 last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{cfg.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-[#A8A49C]">{ind.code}</span>
            <p className="text-[12px] font-semibold text-[#1C1B18]">{ind.titulo}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {ind.valor ? (
              <span className="font-mono text-[14px] font-bold text-[#1C1B18]">
                {ind.valor} <span className="text-[11px] font-normal text-[#6B6760]">{ind.unidad}</span>
              </span>
            ) : (
              <span className="text-[12px] italic text-[#A8A49C]">Sin datos</span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#8E8980]">{ind.fuente}</p>
          {ind.nota && (
            <p className="mt-0.5 text-[10px] text-[#D4881E]">⚠ {ind.nota}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SeccionCard({ seccion, letter, color }: { seccion: ESGSeccion; letter: string; color: string }) {
  const total = seccion.indicadores.length
  const disponibles = seccion.indicadores.filter(i => i.estatus === 'disponible').length
  const pct = total > 0 ? Math.round((disponibles / total) * 100) : 0

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 border-b border-[#F0EDE5] px-5 py-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold text-white"
          style={{ background: color }}
        >
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#1C1B18]">{seccion.titulo}</p>
          <p className="text-[10px] text-[#6B6760]">{seccion.descripcion}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[14px] font-bold text-[#1C1B18]">{pct}%</p>
          <p className="text-[9px] text-[#8E8980]">{disponibles}/{total} datos</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-[#F0EDE5]">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      {/* Indicators */}
      <div className="px-5">
        {seccion.indicadores.map(ind => (
          <IndicatorRow key={ind.code} ind={ind} />
        ))}
      </div>
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

const SECCION_COLORS: Record<string, string> = {
  ambiental:  '#3B6D11',
  social:     '#1A5FA8',
  gobernanza: '#8B5A00',
}
const SECCION_LETTERS: Record<string, string> = {
  ambiental: 'E', social: 'S', gobernanza: 'G',
}

function ESGContent() {
  const router = useRouter()
  const { token: bridgedToken, loading: tokenLoading } = useAlquimiaToken()
  const [sims, setSims] = useState<SimulationMetadata[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reporte, setReporte] = useState<ESGReporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function authHdr(): HeadersInit {
    const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  useEffect(() => {
    if (tokenLoading) return
    const token = bridgedToken
    if (!token) { router.replace('/sign-in'); return }

    listSimulations()
      .then(r => {
        const list = r.simulations ?? []
        setSims(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router, bridgedToken, tokenLoading])

  async function generate() {
    if (!selectedId) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/esg/${selectedId}/reporte`, { headers: authHdr() })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Error')
      setReporte(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando reporte')
    } finally {
      setGenerating(false)
    }
  }

  function exportJSON() {
    if (!reporte) return
    const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ALQUIMIA_ESG_${reporte.municipio}_${reporte.periodo.replace(' ', '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const auditorScore = reporte
    ? buildAuditorScore(
        reporte.secciones.flatMap(s => s.indicadores).map(ind => ({
          kpi_id: ind.code,
          kpi_label: ind.titulo,
          valor: ind.valor,
          unidad: ind.unidad,
          tipo: ind.estatus === 'disponible' ? 'oficial' : ind.estatus === 'estimado' ? 'estimado' : 'no_disponible',
          fuente_nombre: ind.fuente,
          confianza: ind.estatus === 'disponible' ? 0.85 : ind.estatus === 'estimado' ? 0.65 : 0,
        }))
      )
    : buildAuditorScore([])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Reporte ESG Trimestral</h1>
          <p className="text-[13px] text-[#6B6760]">GRI 306 · LGPGIR · SEMARNAT · formato ASF</p>
        </div>
        {reporte && <AuditorBadge score={auditorScore} showDetail size="sm" />}
      </div>

      {/* Simulation selector */}
      {sims.length === 0 ? (
        <div className="mb-6 rounded-[12px] border border-[#F6C84B]/40 bg-[#FEF7E7] p-5 text-center">
          <BarChart2 size={20} className="mx-auto mb-2 text-[#D4881E]" />
          <p className="text-[13px] text-[#8A4F08]">Se requiere al menos una simulación guardada.</p>
          <Link
            href="/simulator"
            className="mt-3 inline-flex items-center gap-2 rounded-[8px] bg-[#D4881E] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#8A4F08] transition-colors"
          >
            Ir al simulador
          </Link>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B6760]">
              Simulación base
            </label>
            <select
              value={selectedId ?? ''}
              onChange={e => { setSelectedId(e.target.value); setReporte(null) }}
              className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
            >
              {sims.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || 'Simulación sin nombre'} · {s.municipios?.[0] ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={!selectedId || generating}
            className="flex items-center gap-2 rounded-[8px] bg-[#3B6D11] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-50 transition-colors"
          >
            {generating ? <><Loader2 size={13} className="animate-spin" /> Generando…</> : 'Generar reporte'}
          </button>
          {reporte && (
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 rounded-[8px] border border-[#E8E4DC] px-4 py-2 text-[13px] text-[#3B3326] hover:border-[#3B6D11] transition-colors"
            >
              <Download size={13} />
              Exportar JSON
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-[#FBEAEA] px-4 py-3">
          <AlertTriangle size={14} className="shrink-0 text-[#C0392B]" />
          <p className="text-[12px] text-[#7B1F1F]">{error}</p>
        </div>
      )}

      {/* Report content */}
      {reporte && (
        <>
          {/* Meta banner */}
          <div className="mb-5 rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-[18px] font-semibold text-[#1C1B18]">{reporte.municipio}</p>
                <p className="text-[12px] text-[#6B6760]">{reporte.estado} · {reporte.periodo} · {reporte.version}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['GRI 306', 'LGPGIR', 'SEMARNAT'].map(std => (
                  <span key={std} className="rounded-full bg-[#EAF3DE] px-2.5 py-0.5 text-[10px] font-semibold text-[#2D5409]">{std}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Advertencias */}
          {reporte.advertencias.length > 0 && (
            <div className="mb-5 rounded-[10px] border border-[#F6C84B]/40 bg-[#FEF7E7] px-4 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A4F08]">Notas de calidad</p>
              <ul className="space-y-1">
                {reporte.advertencias.map((a, i) => (
                  <li key={i} className="text-[11px] text-[#8A4F08]">· {a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ESG sections */}
          <div className="space-y-4">
            {reporte.secciones.map(seccion => (
              <SeccionCard
                key={seccion.id}
                seccion={seccion}
                letter={SECCION_LETTERS[seccion.id] ?? seccion.id[0].toUpperCase()}
                color={SECCION_COLORS[seccion.id] ?? '#6B6760'}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-3">
            <p className="text-[11px] text-[#8E8980]">
              Reporte generado el {new Date(reporte.fecha_generacion).toLocaleString('es-MX')} ·
              Simulación: {reporte.simulation_name ?? reporte.simulation_id} ·
              Score AUDITOR: {reporte.auditor_score}/100 ·
              ALQUIMIA no certifica los datos — requiere validación humana antes de presentar ante autoridades.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default function ESGPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <ESGContent />
      </Suspense>
    </AppShell>
  )
}
