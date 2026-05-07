'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { evaluateAlerts } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { Alerta, AlertasResponse } from '@/types'
import { ParamsLockedNotice } from '@/components/simulator/ParamsLockedNotice'

const FLOW = [
  'Indicadores de entrada',
  'Evaluación de umbrales',
  'Clasificación por nivel',
  'Acciones sugeridas',
]

const LEVEL_ORDER = ['critica', 'alta', 'media', 'info'] as const

export function AlertasPanel() {
  const municipio = useSimulatorStore(s => s.municipiosActivos[0] ?? '')
  const resultados = useSimulatorStore(s => s.resultados)
  const baselinePct = useSimulatorStore(s => s.circularityBaseline?.current_circularity_pct)
  const genCount = useSimulatorStore(s => s.macroImpactSummary?.generators_count ?? 0)
  const gatesAprobados = useSimulatorStore(s => s.gatesAprobados)
  const scoreDatos = useSimulatorStore(s => s.snapshotDatos?.score_datos)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AlertasResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const payload = useMemo(() => {
    if (!municipio || !resultados) return null
    const tasa = baselinePct ?? 8
    const brechaInfra = Math.max(0.01, Number((resultados.rsuTotalTonDia * 0.08).toFixed(3)))
    const score = typeof scoreDatos === 'number' ? scoreDatos : 50
    const estadoLegal = gatesAprobados.some(Boolean) ? 'gate_activo' : 'sin_gate'
    const sinPadron = genCount > 0 ? 0 : 1
    return {
      municipio_id: municipio,
      tasa_circularidad_pct: tasa,
      brecha_infraestructura_ton_dia: brechaInfra,
      score_circularidad: score,
      tiene_residuos_regulados: false,
      estado_legal: estadoLegal,
      num_macrogeneradores_sin_padron: sinPadron,
    }
  }, [municipio, resultados, baselinePct, genCount, gatesAprobados, scoreDatos])

  const payloadKey = useMemo(() => (payload ? JSON.stringify(payload) : ''), [payload])

  useEffect(() => {
    setResult(null)
    setError(null)
    if (!payload) return
    let active = true
    setLoading(true)
    setLastPayload(payload)
    void evaluateAlerts(payload)
      .then(data => {
        if (!active) return
        setResult(data)
        setError(null)
      })
      .catch(e => {
        if (!active) return
        setResult(null)
        setError(e instanceof Error ? e.message : 'No fue posible evaluar alertas')
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
      const data = await evaluateAlerts(lastPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'No fue posible evaluar alertas')
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const source = result?.alertas ?? []
    return LEVEL_ORDER.map(level => ({
      level,
      items: source.filter(alerta => alerta.nivel === level),
    }))
  }, [result])

  const counts = useMemo(() => {
    const source = result?.alertas ?? []
    return {
      critica: source.filter(a => a.nivel === 'critica').length,
      alta: source.filter(a => a.nivel === 'alta').length,
      media: source.filter(a => a.nivel === 'media').length,
      info: source.filter(a => a.nivel === 'info').length,
    }
  }, [result])

  const isEmpty = !loading && !error && !result && payload === null

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Panel de alertas municipales · <span className="text-[14px] text-[#6B6760]">propuesta</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {FLOW.map((step, i, arr) => (
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
          Las alertas se generarán cuando el simulador principal tenga resultados.
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

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-[12px] text-[#6B6760]">
            <span className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-1">Crítica: {counts.critica}</span>
            <span className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-1">Alta: {counts.alta}</span>
            <span className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-1">Media: {counts.media}</span>
            <span className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-1">Info: {counts.info}</span>
          </div>

          <div className="space-y-3">
            {grouped.map(group => (
              <div key={group.level}>
                <p className="text-[13px] font-semibold capitalize text-[#1C1B18]">{group.level}</p>
                <div className="mt-2 space-y-2">
                  {group.items.map((alerta, idx) => (
                    <AlertaCard key={`${alerta.tipo}-${alerta.titulo}-${idx}`} alerta={alerta} />
                  ))}
                  {group.items.length === 0 && <p className="text-[12px] text-[#A8A49C]">Sin alertas en este nivel.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3 text-[12px] text-[#6B6760]">
      <p className="font-semibold text-[#1C1B18]">{alerta.titulo}</p>
      <p className="mt-1">{alerta.mensaje}</p>
      {alerta.accion_sugerida && <p className="mt-1 text-[#3B6D11]">→ {alerta.accion_sugerida}</p>}
    </div>
  )
}
