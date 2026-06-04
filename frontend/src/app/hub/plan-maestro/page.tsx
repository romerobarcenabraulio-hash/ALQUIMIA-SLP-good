'use client'

/**
 * Plan Maestro — Sprint 30.
 *
 * Selects the latest simulation and generates the full consulting
 * document package: executive summary, financial model, legal reform,
 * metropolitan coordination, 90-day manual, and citizen guide.
 *
 * Each document is downloadable as PDF via GET /api/v1/reports/{id}/pdf?document_id=...
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Download, FileText, CheckCircle2, Lock, ArrowLeft,
  AlertCircle, Loader2, BarChart2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'
import { listSimulations, type SimulationMetadata } from '@/lib/simulationPersistence'
import { AuditorBadge, buildAuditorScore } from '@/components/auditor/AuditorBadge'

// ─── Document catalog ─────────────────────────────────────────────────────────

interface DocDef {
  id: string
  titulo: string
  descripcion: string
  audiencia: string
  tier_minimo: 'diagnostico' | 'implementacion' | 'operacion'
  formato: 'PDF'
}

const DOCUMENTOS: DocDef[] = [
  {
    id: '01_resumen_ejecutivo_municipal',
    titulo: 'Resumen Ejecutivo Municipal',
    descripcion: 'Síntesis ejecutiva de la situación RSU del municipio para Cabildo y presidencia.',
    audiencia: 'Cabildo · Presidencia',
    tier_minimo: 'diagnostico',
    formato: 'PDF',
  },
  {
    id: '02_modelo_tecnico_financiero',
    titulo: 'Modelo Técnico Financiero',
    descripcion: 'Escenarios de inversión, VPN, WACC y flujos financieros proyectados.',
    audiencia: 'Dirección de Finanzas',
    tier_minimo: 'diagnostico',
    formato: 'PDF',
  },
  {
    id: '03_diagnostico_reforma',
    titulo: 'Diagnóstico de Reforma Reglamentaria',
    descripcion: 'Análisis del reglamento de limpia vigente y propuesta de reforma alineada a LGPGIR.',
    audiencia: 'Secretaría Jurídica',
    tier_minimo: 'diagnostico',
    formato: 'PDF',
  },
  {
    id: '04_coordinacion_metropolitana',
    titulo: 'Coordinación Metropolitana',
    descripcion: 'Estrategia de coordinación con municipios vecinos para gestión conjunta RSU.',
    audiencia: 'Directores de área',
    tier_minimo: 'implementacion',
    formato: 'PDF',
  },
  {
    id: '05_manual_operativo_90_dias',
    titulo: 'Manual Operativo 90 días',
    descripcion: 'Guía de implementación paso a paso para el equipo municipal.',
    audiencia: 'Coordinación operativa',
    tier_minimo: 'implementacion',
    formato: 'PDF',
  },
  {
    id: '06_guia_ciudadana_separacion',
    titulo: 'Guía Ciudadana de Separación',
    descripcion: 'Material de comunicación ciudadana para programa de separación en origen.',
    audiencia: 'Ciudadanía',
    tier_minimo: 'diagnostico',
    formato: 'PDF',
  },
]

const TIER_ORDER = { diagnostico: 0, implementacion: 1, operacion: 2 }

// ─── Component ────────────────────────────────────────────────────────────────

function authHdr() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export default function PlanMaestroPage() {
  const router = useRouter()
  const [sims, setSims] = useState<SimulationMetadata[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tenantTier, setTenantTier] = useState<string>('diagnostico')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    if (!token) { router.replace('/sign-in'); return }

    Promise.all([
      listSimulations(),
      // Get tenant tier from active tenant
      (() => {
        const tid = sessionStorage.getItem('alquimia_active_tenant_id')
        if (!tid) return Promise.resolve(null)
        return fetch(`${getApiUrl()}/api/admin/tenants/${tid}`, { headers: authHdr() })
          .then(r => r.ok ? r.json() : null)
      })(),
    ]).then(([simsResult, tenantData]) => {
      const list = simsResult.simulations ?? []
      setSims(list)
      if (list.length > 0) setSelectedId(list[0].id)
      if (tenantData?.tier_comercial) setTenantTier(tenantData.tier_comercial)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [router])

  async function downloadDoc(docId: string) {
    if (!selectedId) return
    setDownloading(docId)
    setErrors(e => ({ ...e, [docId]: '' }))
    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/reports/${selectedId}/pdf?document_id=${docId}`,
        { headers: authHdr() }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error al generar PDF' }))
        throw new Error(err.detail ?? 'Error')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ALQUIMIA_${docId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErrors(prev => ({ ...prev, [docId]: e instanceof Error ? e.message : 'Error' }))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      </AppShell>
    )
  }

  const currentTierIdx = TIER_ORDER[tenantTier as keyof typeof TIER_ORDER] ?? 0

  // Simple auditor score based on sim count as proxy
  const mockAuditorScore = buildAuditorScore(sims.length > 0 ? [
    { kpi_id: 'sim', kpi_label: 'Simulación guardada', valor: selectedId, unidad: '', tipo: 'estimado', fuente_nombre: 'Simulador ALQUIMIA', confianza: 0.75 },
  ] : [])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/hub" className="rounded-lg p-1.5 text-[#6B6760] hover:bg-[#F0EDE6] hover:text-[#1C1B18] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Plan Maestro</h1>
            <p className="text-[13px] text-[#6B6760]">Paquete de documentos institucionales para Cabildo</p>
          </div>
          <AuditorBadge score={mockAuditorScore} showDetail size="sm" />
        </div>

        {/* Simulation selector */}
        {sims.length === 0 ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <BarChart2 size={20} className="mx-auto mb-2 text-amber-500" />
            <p className="text-[13px] text-amber-700">No hay simulaciones guardadas.</p>
            <p className="mt-1 text-[12px] text-amber-600">Crea y guarda al menos un escenario en el simulador.</p>
            <Link
              href="/simulator"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-[12px] font-medium text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Ir al simulador
            </Link>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B6760]">
              Simulación base para los documentos
            </label>
            <select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D8D1C4] bg-white px-3 py-2 text-[13px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
            >
              {sims.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || 'Simulación sin nombre'} · {s.municipios?.[0] ?? '—'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Document grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {DOCUMENTOS.map(doc => {
            const docTierIdx = TIER_ORDER[doc.tier_minimo]
            const locked = docTierIdx > currentTierIdx
            const isDownloading = downloading === doc.id
            const err = errors[doc.id]

            return (
              <div
                key={doc.id}
                className={`flex flex-col rounded-xl border p-4 ${
                  locked ? 'border-[#E8E4DC] bg-[#FAFAF8] opacity-60' : 'border-[#E8E4DC] bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EDE6]">
                    {locked ? <Lock size={14} className="text-[#C4BFB6]" /> : <FileText size={14} className="text-[#3B6D11]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1C1B18]">{doc.titulo}</p>
                    <p className="mt-0.5 text-[11px] text-[#6B6760]">{doc.descripcion}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[#9E9B96]">
                      {doc.audiencia}
                    </p>
                  </div>
                </div>

                {locked ? (
                  <div className="mt-3 rounded-lg bg-[#F0EDE6] px-3 py-1.5 text-center">
                    <p className="text-[10px] text-[#8E8980]">
                      Disponible en Tier {doc.tier_minimo.charAt(0).toUpperCase() + doc.tier_minimo.slice(1)}
                    </p>
                  </div>
                ) : (
                  <>
                    {err && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1">
                        <AlertCircle size={11} className="text-red-500" />
                        <p className="text-[10px] text-red-700">{err}</p>
                      </div>
                    )}
                    <button
                      onClick={() => downloadDoc(doc.id)}
                      disabled={!selectedId || !!downloading}
                      className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#3B6D11] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-50 transition-colors"
                    >
                      {isDownloading ? (
                        <><Loader2 size={13} className="animate-spin" /> Generando…</>
                      ) : (
                        <><Download size={13} /> Descargar PDF</>
                      )}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#3B6D11]" />
            <div>
              <p className="text-[12px] font-semibold text-[#1C1B18]">Filosofía cero invención</p>
              <p className="text-[11px] text-[#6B6760]">
                Todos los documentos citan su fuente por KPI. Los valores estimados llevan advertencia visible.
                Ningún número se presenta como oficial sin fuente verificable — esto es la ventaja competitiva de ALQUIMIA.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
