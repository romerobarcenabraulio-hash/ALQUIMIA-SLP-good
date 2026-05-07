'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { getDashboardSummary } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { AvisoMunicipioAncla } from '@/components/simulator/AvisoMunicipioAncla'
import { ParamsLockedNotice } from '@/components/simulator/ParamsLockedNotice'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import type { CircularityBaseline, DashboardResponse, KPIIndicador } from '@/types'
import { COMPOSICION_RSU } from '@/lib/constants'

const STEPS = ['Datos de entrada', 'Cálculo de score', 'KPIs por área', 'Alertas y próximas acciones']

function deriveCorrientesCriticas(baseline: CircularityBaseline | null | undefined): string[] | null {
  if (!baseline || baseline.rsu_total_ton_day_est <= 0) return null
  const t = baseline.rsu_total_ton_day_est
  let best: { k: string; mass: number } | null = null
  for (const [k, frac] of Object.entries(COMPOSICION_RSU)) {
    const mass = t * frac
    if (!best || mass > best.mass) best = { k, mass }
  }
  return best ? [best.k] : null
}

export function DashboardKPIs() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipio = municipiosActivos[0] ?? ''
  const resultados = useSimulatorStore(s => s.resultados)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const baselinePct = circularityBaseline?.current_circularity_pct
  const genCount = useSimulatorStore(s => s.macroImpactSummary?.generators_count ?? 0)
  const mixCAs = useSimulatorStore(s => s.mixCAs)
  const gatesAprobados = useSimulatorStore(s => s.gatesAprobados)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DashboardResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const payload = useMemo(() => {
    if (!municipio || !resultados) return null
    const tasa = baselinePct ?? 8
    const breach = Math.max(0.01, Number((resultados.rsuTotalTonDia * 0.08).toFixed(3)))
    const numCentros = Math.max(1, mixCAs.P + mixCAs.M + mixCAs.G)
    const estadoLegal = gatesAprobados.some(Boolean) ? 'gate_activo' : 'sin_gate'
    return {
      municipio_id: municipio,
      generacion_ton_dia: resultados.rsuTotalTonDia,
      tasa_circularidad_actual_pct: tasa,
      brecha_infraestructura_ton_dia: breach,
      num_macrogeneradores: genCount,
      num_centros_acopio: numCentros,
      estado_legal: estadoLegal,
      corrientes_criticas: deriveCorrientesCriticas(circularityBaseline) ?? ['organico'],
    }
  }, [municipio, resultados, baselinePct, genCount, mixCAs, gatesAprobados, circularityBaseline])

  const payloadKey = useMemo(() => (payload ? JSON.stringify(payload) : ''), [payload])

  useEffect(() => {
    setResult(null)
    setError(null)
    if (!payload) return
    let active = true
    setLoading(true)
    setLastPayload(payload)
    void getDashboardSummary(payload)
      .then(data => {
        if (!active) return
        setResult(data)
        setError(null)
      })
      .catch(e => {
        if (!active) return
        setResult(null)
        setError(e instanceof Error ? e.message : 'Incidencia operativa al calcular dashboard municipal')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [payloadKey])

  async function retry() {
    if (!lastPayload) return
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummary(lastPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al calcular dashboard municipal')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = useMemo(() => {
    const score = result?.resumen.score_circularidad ?? 0
    if (score >= 70) return 'text-[#2D7A0A]'
    if (score >= 40) return 'text-[#C47E00]'
    return 'text-[#B3261E]'
  }, [result])

  const isEmpty = !loading && !error && !result && payload === null

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Panel de indicadores municipales · <span className="text-[14px] text-[#6B6760]">propuesta</span>
      </h1>

      <ScopeAnclaKicker className="mt-2" />
      <AvisoMunicipioAncla ids={municipiosActivos} />

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {STEPS.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <ParamsLockedNotice />

      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 w-3/4 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Los KPIs aparecerán cuando el simulador principal tenga resultados y línea base.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p>{error}</p>
          {lastPayload && (
            <button
              type="button"
              onClick={() => void retry()}
              className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-[12px]"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {result?.status === 'blocked' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[12px] text-amber-900">
          {result.blockers.map(b => (
            <p key={b}>{b}</p>
          ))}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-5 text-center">
            <p className="text-[12px] text-[#6B6760]">Score compuesto de circularidad municipal</p>
            <p className={`font-serif text-[48px] leading-none ${scoreColor}`}>
              {result.resumen.score_circularidad.toFixed(0)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip label="Residuos" value={`${result.resumen.total_residuos_ton_dia} t/día`} />
            <Chip label="Circularidad real est." value={`${result.resumen.tasa_circularidad_pct}%`} />
            <Chip label="Brecha infra" value={`${result.resumen.brecha_infraestructura_ton_dia} t/día`} />
            <Chip label="Macrogeneradores" value={`${result.resumen.num_macrogeneradores}`} />
            <Chip label="Centros acopio" value={`${result.resumen.num_centros_acopio}`} />
          </div>
          <p className="text-[11px] text-[#6B6760]">
            Términos: % RSU capturado y % circularidad real no son equivalentes; este panel muestra la circularidad real estimada por el servicio municipal.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {result.kpis.map(kpi => (
              <KPICard key={kpi.clave} kpi={kpi} />
            ))}
          </div>

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-1 text-[12px] text-[#6B6760]">
      {label}: {value}
    </span>
  )
}

function KPICard({ kpi }: { kpi: KPIIndicador }) {
  const trendColor =
    kpi.tendencia === 'mejora'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : kpi.tendencia === 'estable'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-900'
  const progress = kpi.meta_90_dias > 0 ? Math.min(100, (kpi.valor_actual / kpi.meta_90_dias) * 100) : 0
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3">
      <p className="text-[12px] font-semibold text-[#1C1B18]">{kpi.titulo}</p>
      <p className="mt-1 text-[24px] font-bold text-[#1C1B18]">
        {kpi.valor_actual.toFixed(1)} <span className="text-[12px] font-normal text-[#6B6760]">{kpi.unidad}</span>
      </p>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${trendColor}`}>{kpi.tendencia}</span>
      <div className="mt-2 h-2 rounded bg-[#F0EDE5]">
        <div className="h-2 rounded bg-[#3B6D11]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-[#6B6760]">{kpi.formula}</p>
      {kpi.alerta && <p className="mt-1 text-[11px] text-[#B3261E]">{kpi.alerta}</p>}
    </div>
  )
}
