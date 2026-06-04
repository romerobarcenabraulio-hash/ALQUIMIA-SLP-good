'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Criterio {
  codigo: string
  descripcion: string
  requerimiento: string
  cumple: boolean
  evidencia?: string
  peso: number
  comentario?: string
}

interface CreditLine {
  linea: string
  monto_maximo_mdp: number
  tasa_referencia_pct: number
  plazo_anos: number
  descripcion: string
}

interface ReadinessReport {
  tenant_id: string
  score_total: number
  nivel: string
  criterios: Criterio[]
  brechas: string[]
  fortalezas: string[]
  lineas_aplicables: CreditLine[]
  recomendacion_siguiente_paso: string
}

const NIVEL_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  no_elegible: { label: 'No elegible',   color: 'text-[#C0392B]', bg: 'bg-[#FBEAEA]', border: 'border-red-200' },
  con_brechas: { label: 'Con brechas',   color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]', border: 'border-[#F6C84B]/40' },
  elegible:    { label: 'Elegible',      color: 'text-[#1A5FA8]', bg: 'bg-[#E8F0FB]', border: 'border-[#A8C4E8]' },
  listo:       { label: 'Listo',         color: 'text-[#2D5409]', bg: 'bg-[#EAF3DE]', border: 'border-[#C9DDB1]' },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function BANOBRASContent() {
  const [report, setReport] = useState<ReadinessReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tenantId = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_id') || 'demo'
    : 'demo'

  async function evaluate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/banobras/evaluar`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({
          tenant_id: tenantId,
          simulation_state: {},
          gates_completed: 0,
          auditor_score: 0,
          esg_generated: false,
          reglamento_uploaded: false,
          partner_links_active: 0,
        }),
      })
      if (!res.ok) throw new Error('Error en evaluación')
      setReport(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { evaluate() }, [tenantId])

  const nivel = report ? NIVEL_CFG[report.nivel] ?? NIVEL_CFG.con_brechas : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub/partners" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Elegibilidad BANOBRAS</h1>
          <p className="text-[13px] text-[#6B6760]">Crédito verde municipal — evaluación de readiness</p>
        </div>
        <button
          onClick={evaluate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:border-[#3B6D11] hover:text-[#3B6D11] transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-[#FBEAEA] px-4 py-3 text-[12px] text-[#7B1F1F]">{error}</div>
      )}

      {loading && !report ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-[#3B6D11]" /></div>
      ) : report && nivel ? (
        <div className="space-y-5">
          {/* Score banner */}
          <div className={`rounded-[12px] border p-5 ${nivel.border} ${nivel.bg}`}>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-[40px] font-bold ${nivel.color}`}>{report.score_total}</p>
                <p className={`text-[10px] font-semibold ${nivel.color}`}>/100</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[16px] font-bold ${nivel.color}`}>{nivel.label}</p>
                <p className="text-[12px] text-[#6B6760] mt-1 leading-snug">{report.recomendacion_siguiente_paso}</p>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-4 h-2 rounded-full bg-white/60">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${report.score_total}%`, background: nivel.color.replace('text-', '') }}
              />
            </div>
          </div>

          {/* Criteria grid */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#6B6760] mb-3">Criterios de evaluación</h2>
            <div className="space-y-2">
              {report.criterios.map(c => (
                <div key={c.codigo} className="flex items-start gap-3 rounded-[8px] border border-[#F0EDE5] bg-[#FAFAF8] px-3 py-2.5">
                  <span className={`mt-0.5 shrink-0 ${c.cumple ? 'text-[#3B6D11]' : 'text-[#C0392B]'}`}>
                    {c.cumple ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#A8A49C]">{c.codigo}</span>
                      <p className="text-[12px] font-semibold text-[#1C1B18]">{c.descripcion}</p>
                      <span className="ml-auto text-[10px] text-[#A8A49C]">{Math.round(c.peso * 100)}%</span>
                    </div>
                    {c.evidencia && <p className="text-[10px] text-[#6B6760] mt-0.5">{c.evidencia}</p>}
                    {c.comentario && <p className="text-[10px] text-[#D4881E] mt-0.5">→ {c.comentario}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit lines */}
          {report.lineas_aplicables.length > 0 && (
            <div className="rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#2D5409] mb-3">Líneas de crédito aplicables</h2>
              <div className="space-y-3">
                {report.lineas_aplicables.map(l => (
                  <div key={l.linea} className="rounded-[8px] border border-[#C9DDB1] bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-bold text-[#1C1B18]">{l.linea}</p>
                        <p className="text-[11px] text-[#6B6760] mt-0.5">{l.descripcion}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-[#3B6D11]">Hasta ${l.monto_maximo_mdp}M</p>
                        <p className="text-[10px] text-[#8E8980]">{l.tasa_referencia_pct}% · {l.plazo_anos} años</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brechas */}
          {report.brechas.length > 0 && (
            <div className="rounded-[10px] border border-[#F6C84B]/40 bg-[#FEF7E7] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A4F08] mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> Brechas a cerrar
              </p>
              <ul className="space-y-1">
                {report.brechas.map((b, i) => (
                  <li key={i} className="text-[11px] text-[#8A4F08]">· {b}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-[#A8A49C]">
            Evaluación BANOBRAS · Sprint 46-48 · ALQUIMIA no garantiza aprobación — requiere verificación con asesor BANOBRAS.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default function BANOBRASPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={24} className="animate-spin text-[#3B6D11]" /></div>}>
        <BANOBRASContent />
      </Suspense>
    </AppShell>
  )
}
