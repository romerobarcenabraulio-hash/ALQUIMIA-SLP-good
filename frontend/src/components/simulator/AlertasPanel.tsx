'use client'

import { Fragment, useMemo, useState } from 'react'
import { evaluateAlerts } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { Alerta, AlertasResponse } from '@/types'

const FLOW = [
  'Indicadores de entrada',
  'Evaluación de umbrales',
  'Clasificación por nivel',
  'Acciones sugeridas',
]

const LEVEL_ORDER = ['critica', 'alta', 'media', 'info'] as const

export function AlertasPanel() {
  const municipio = useSimulatorStore(s => s.municipiosActivos[0] ?? '')
  const [tasaCircularidad, setTasaCircularidad] = useState(8)
  const [brechaInfra, setBrechaInfra] = useState(2)
  const [score, setScore] = useState(35)
  const [sinPadron, setSinPadron] = useState(0)
  const [residuosRegulados, setResiduosRegulados] = useState(false)
  const [estadoLegal, setEstadoLegal] = useState('sin_gate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AlertasResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const payload = useMemo(
    () => ({
      municipio_id: municipio,
      tasa_circularidad_pct: tasaCircularidad,
      brecha_infraestructura_ton_dia: brechaInfra,
      score_circularidad: score,
      tiene_residuos_regulados: residuosRegulados,
      estado_legal: estadoLegal,
      num_macrogeneradores_sin_padron: sinPadron,
    }),
    [municipio, tasaCircularidad, brechaInfra, score, residuosRegulados, estadoLegal, sinPadron],
  )

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

  async function run(nextPayload: object) {
    setLoading(true)
    setError(null)
    try {
      const data = await evaluateAlerts(nextPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'No fue posible evaluar alertas')
    } finally {
      setLoading(false)
    }
  }

  async function onEvaluate() {
    setLastPayload(payload)
    await run(payload)
  }

  const isEmpty = !loading && !error && !result

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Panel de alertas municipales · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {FLOW.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-2">
        <Numeric label="Tasa circularidad %" value={tasaCircularidad} onChange={setTasaCircularidad} />
        <Numeric label="Brecha infraestructura t/día" value={brechaInfra} onChange={setBrechaInfra} />
        <Numeric label="Score circularidad" value={score} onChange={setScore} />
        <Numeric
          label="Macrogeneradores sin padrón"
          value={sinPadron}
          onChange={value => setSinPadron(Math.max(0, Math.round(value)))}
        />
        <label className="flex items-center gap-2 rounded border border-[#E8E4DC] px-3 py-2 text-[13px] text-[#6B6860]">
          <input
            type="checkbox"
            checked={residuosRegulados}
            onChange={e => setResiduosRegulados(e.target.checked)}
          />
          Tiene residuos regulados
        </label>
        <label className="text-[13px] text-[#6B6860]">
          Estado legal
          <select
            value={estadoLegal}
            onChange={e => setEstadoLegal(e.target.value)}
            className="mt-1 w-full rounded border border-[#E8E4DC] px-2 py-2"
          >
            <option value="sin_gate">Sin gate activo</option>
            <option value="gate_activo">Gate activo</option>
            <option value="sancion_propuesta">Sanción propuesta</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onEvaluate}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Evaluando alertas...' : 'Evaluar alertas'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 w-4/5 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Ingresa indicadores del municipio para evaluar alertas.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p>{error}</p>
          {lastPayload && (
            <button
              type="button"
              onClick={() => run(lastPayload)}
              className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-[12px]"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {result?.status === 'blocked' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[12px] text-amber-900">
          {result.blockers.map(b => <p key={b}>{b}</p>)}
        </div>
      )}

      {result && result.status === 'ready' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <LevelChip level="critica" count={counts.critica} />
            <LevelChip level="alta" count={counts.alta} />
            <LevelChip level="media" count={counts.media} />
            <LevelChip level="info" count={counts.info} />
          </div>

          <div
            className={`rounded-lg border p-3 text-[13px] font-semibold ${
              result.total_criticas > 0
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {result.resumen}
          </div>

          <div className="space-y-2">
            {grouped.map(group =>
              group.items.map(alerta => <AlertaCard key={`${group.level}-${alerta.tipo}-${alerta.titulo}`} alerta={alerta} />),
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Numeric({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step={0.1}
      aria-label={label}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      placeholder={label}
      className="rounded border border-[#E8E4DC] px-2 py-2 text-[12px]"
    />
  )
}

function LevelChip({ level, count }: { level: string; count: number }) {
  const styles =
    level === 'critica'
      ? 'bg-red-50 border-red-200 text-red-900'
      : level === 'alta'
        ? 'bg-orange-50 border-orange-200 text-orange-900'
        : level === 'media'
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-900'
  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] ${styles}`}>
      {level}: {count}
    </span>
  )
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const icon = alerta.nivel === 'critica' ? '🔴' : alerta.nivel === 'alta' ? '🟠' : alerta.nivel === 'media' ? '🟡' : 'ℹ️'
  return (
    <article className="rounded-lg border border-[#E8E4DC] bg-white p-3">
      <p className="text-[13px] font-bold text-[#1C1B18]">
        {icon} {alerta.titulo}
      </p>
      <p className="mt-1 text-[12px] text-[#3C3A36]">{alerta.mensaje}</p>
      <span className="mt-2 inline-flex rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-2 py-0.5 text-[11px] text-[#6B6760]">
        {alerta.modulo_origen}
      </span>
      <p className="mt-2 text-[12px] italic text-[#1C1B18]">→ {alerta.accion_sugerida}</p>
    </article>
  )
}
