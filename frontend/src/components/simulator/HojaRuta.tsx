'use client'

import { Fragment, useMemo, useState } from 'react'
import { generateRoadmap } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { AccionEjecutiva, RoadmapMunicipalResponse } from '@/types'

const CAUSAL = [
  'Diagnóstico integral',
  'Priorización de brechas',
  'Acciones 30 días',
  'Acciones 60/90 días',
  'KPIs de cierre',
]

const CORRIENTES = ['organico', 'papel', 'plastico', 'vidrio', 'metal']

export function HojaRuta() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipio = municipiosActivos[0] ?? ''

  const [generacionTonDia, setGeneracionTonDia] = useState(10)
  const [tasaActual, setTasaActual] = useState(8)
  const [brechaInfra, setBrechaInfra] = useState(3)
  const [tieneMacrogeneradores, setTieneMacrogeneradores] = useState(true)
  const [tieneResiduosRegulados, setTieneResiduosRegulados] = useState(false)
  const [estadoLegal, setEstadoLegal] = useState('sin_gate')
  const [corrientesCriticas, setCorrientesCriticas] = useState<string[]>(['organico'])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RoadmapMunicipalResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const isEmpty = !loading && !error && !result

  function toggleCorriente(value: string) {
    setCorrientesCriticas(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    )
  }

  async function run(payload: object) {
    setLoading(true)
    setError(null)
    try {
      const data = await generateRoadmap(payload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al generar hoja de ruta')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    const payload = {
      municipio_id: municipio,
      generacion_ton_dia: generacionTonDia,
      tasa_circularidad_actual_pct: tasaActual,
      brecha_infraestructura_ton_dia: brechaInfra,
      tiene_macrogeneradores: tieneMacrogeneradores,
      tiene_residuos_regulados: tieneResiduosRegulados,
      corrientes_criticas: corrientesCriticas,
      estado_legal: estadoLegal,
    }
    setLastPayload(payload)
    await run(payload)
  }

  const byHorizon = useMemo(() => {
    const acc = result?.acciones ?? []
    return {
      dias_30: acc.filter(a => a.horizonte === '30_dias'),
      dias_60: acc.filter(a => a.horizonte === '60_dias'),
      dias_90: acc.filter(a => a.horizonte === '90_dias'),
    }
  }, [result])

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Hoja de ruta ejecutiva municipal · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {CAUSAL.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <FieldNumber label="Generación t/día" value={generacionTonDia} onChange={setGeneracionTonDia} />
        <FieldNumber label="Tasa circularidad actual %" value={tasaActual} onChange={setTasaActual} />
        <FieldNumber label="Brecha infraestructura t/día" value={brechaInfra} onChange={setBrechaInfra} />
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-2 text-[12px]">
        <label className="flex items-center gap-2 text-[13px] text-[#6B6860]">
          <input type="checkbox" checked={tieneMacrogeneradores} onChange={e => setTieneMacrogeneradores(e.target.checked)} />
          Tiene macrogeneradores
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#6B6860]">
          <input type="checkbox" checked={tieneResiduosRegulados} onChange={e => setTieneResiduosRegulados(e.target.checked)} />
          Tiene residuos regulados
        </label>
        <label className="text-[13px] text-[#6B6860]">
          Estado legal
          <select
            value={estadoLegal}
            onChange={e => setEstadoLegal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2"
          >
            <option value="sin_gate">Sin gate activo</option>
            <option value="gate_activo">Gate activo</option>
            <option value="sancion_propuesta">Sanción propuesta</option>
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Corrientes críticas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CORRIENTES.map(c => (
            <label key={c} className="inline-flex items-center gap-1 text-[13px] text-[#6B6860]">
              <input
                type="checkbox"
                checked={corrientesCriticas.includes(c)}
                onChange={() => toggleCorriente(c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Generando hoja de ruta...' : 'Generar hoja de ruta 30/60/90'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 bg-[#E8E4DC] rounded w-2/3" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-5/6" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Completa los diagnósticos anteriores para generar la hoja de ruta.
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
          <p className="font-semibold">Roadmap bloqueado</p>
          {result.blockers.map(b => <p key={b}>{b}</p>)}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
            <p className="font-serif text-[16px] text-[#1C1B18]">{result.resumen_ejecutivo}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(result.kpi_meta_90_dias).map(([k, v]) => (
              <span key={k} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] text-emerald-900">
                {k}: {v}
              </span>
            ))}
          </div>

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => <p key={w}>{w}</p>)}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block text-[13px] text-[#6B6860] mb-1">
      {label}
      <input
        type="number"
        min={0}
        step={0.1}
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2"
      />
    </label>
  )
}
