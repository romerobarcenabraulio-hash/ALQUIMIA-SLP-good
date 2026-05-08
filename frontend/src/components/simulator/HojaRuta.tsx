'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { generateRoadmap } from '@/lib/api'
import { COMPOSICION_RSU_DETALLE } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { AccionEjecutiva, RoadmapMunicipalResponse } from '@/types'
import { ParamsLockedNotice } from '@/components/simulator/ParamsLockedNotice'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

const CAUSAL = [
  'Diagnóstico integral',
  'Priorización de brechas',
  'Acciones 30 días',
  'Acciones 60/90 días',
  'KPIs de cierre',
]

/** Corrientes con participación notable respecto al mix del plan global. */
function corrientesCriticasDesdePlan(): string[] {
  const pairs: [string, number][] = [
    ['organico', COMPOSICION_RSU_DETALLE.organico.pct],
    ['papel', COMPOSICION_RSU_DETALLE.papel.pct],
    ['plastico', COMPOSICION_RSU_DETALLE.plastico.pct],
    ['vidrio', COMPOSICION_RSU_DETALLE.vidrio.pct],
    ['metal', COMPOSICION_RSU_DETALLE.metales.pct],
  ]
  const notable = pairs.filter(([, pct]) => pct >= 10).map(([k]) => k)
  if (notable.length > 0) return notable
  const sorted = [...pairs].sort((a, b) => b[1] - a[1])
  return sorted[0] ? [sorted[0][0]] : ['organico']
}

export function HojaRuta() {
  const municipio = useSimulatorStore(s => s.municipiosActivos[0] ?? '')
  const resultados = useSimulatorStore(s => s.resultados)
  const baselinePct = useSimulatorStore(s => s.circularityBaseline?.current_circularity_pct)
  const genCount = useSimulatorStore(s => s.macroImpactSummary?.generators_count ?? 0)
  const gatesAprobados = useSimulatorStore(s => s.gatesAprobados)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RoadmapMunicipalResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const payload = useMemo(() => {
    if (!municipio || !resultados) return null
    const tasa = baselinePct ?? 8
    const gen = resultados.rsuTotalTonDia
    const brecha = Math.max(0.01, Number((gen * 0.08).toFixed(3)))
    const estadoLegal = gatesAprobados.some(Boolean) ? 'gate_activo' : 'sin_gate'
    return {
      municipio_id: municipio,
      generacion_ton_dia: gen,
      tasa_circularidad_actual_pct: tasa,
      brecha_infraestructura_ton_dia: brecha,
      tiene_macrogeneradores: genCount > 0,
      tiene_residuos_regulados: false,
      corrientes_criticas: corrientesCriticasDesdePlan(),
      estado_legal: estadoLegal,
    }
  }, [municipio, resultados, baselinePct, genCount, gatesAprobados])

  const payloadKey = useMemo(() => (payload ? JSON.stringify(payload) : ''), [payload])

  useEffect(() => {
    setResult(null)
    setError(null)
    if (!payload) return
    let active = true
    setLoading(true)
    setLastPayload(payload)
    void generateRoadmap(payload)
      .then(data => {
        if (!active) return
        setResult(data)
        setError(null)
      })
      .catch(e => {
        if (!active) return
        setResult(null)
        setError(e instanceof Error ? e.message : 'Incidencia operativa al generar hoja de ruta')
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
      const data = await generateRoadmap(lastPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al generar hoja de ruta')
    } finally {
      setLoading(false)
    }
  }

  const byHorizon = useMemo(() => {
    const acc = result?.acciones ?? []
    return {
      dias_30: acc.filter(a => a.horizonte === '30_dias'),
      dias_60: acc.filter(a => a.horizonte === '60_dias'),
      dias_90: acc.filter(a => a.horizonte === '90_dias'),
    }
  }, [result])

  const isEmpty = !loading && !error && !result && payload === null

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Hoja de ruta ejecutiva municipal · <span className="text-[14px] text-[#6B6860]">propuesta</span>
      </h1>
      <ScopeAnclaKicker className="mt-2" />

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {CAUSAL.map((step, i, arr) => (
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
              <div className="h-3 w-2/3 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          La hoja de ruta aparecerá cuando el simulador principal tenga resultados.
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
          <p className="font-semibold">Roadmap pendiente de insumos</p>
          {result.blockers.map(b => (
            <p key={b}>{b}</p>
          ))}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
            <p className="font-serif text-[16px] text-[#1C1B18]">{result.resumen_ejecutivo}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(result.kpi_meta_90_dias).map(([k, v]) => (
              <span
                key={k}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] text-emerald-900"
              >
                {k}: {v}
              </span>
            ))}
          </div>

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TimelineColumn title="30 días" actions={byHorizon.dias_30} />
            <TimelineColumn title="60 días" actions={byHorizon.dias_60} />
            <TimelineColumn title="90 días" actions={byHorizon.dias_90} />
          </div>
        </div>
      )}
    </section>
  )
}

function TimelineColumn({ title, actions }: { title: string; actions: AccionEjecutiva[] }) {
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3">
      <p className="text-[13px] font-semibold text-[#1C1B18]">{title}</p>
      <div className="mt-2 space-y-2">
        {actions.map((a, idx) => (
          <div key={`${a.titulo}-${idx}`} className="rounded-lg border border-[#F0EDE5] bg-[#FAF8F4] p-3 text-[12px]">
            <PriorityBadge priority={a.prioridad} />
            <p className="mt-1 font-bold text-[#1C1B18]">{a.titulo}</p>
            <p className="mt-1 text-[#6B6760]">{a.descripcion}</p>
            <p className="mt-1 italic text-[#6B6760]">{a.responsable_sugerido}</p>
            <p className="mt-1 text-[#1C1B18]">◉ KPI: {a.kpi_exito}</p>
            <p className="mt-1 text-[11px] text-[#6B6860]">Fuente: {a.fuente_diagnostico}</p>
            {typeof a.costo_estimado_mxn === 'number' && (
              <p className="mt-1 text-[11px] text-[#6B6860]">
                Costo estimado: ${a.costo_estimado_mxn.toLocaleString('es-MX')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === 'critica'
      ? 'border-red-200 bg-red-50 text-red-800'
      : priority === 'alta'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-gray-200 bg-gray-100 text-gray-700'
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {priority}
    </span>
  )
}
