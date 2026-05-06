'use client'

import { Fragment, useMemo, useState } from 'react'
import { getDashboardSummary } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { AvisoMunicipioAncla } from '@/components/simulator/AvisoMunicipioAncla'
import type { DashboardResponse, KPIIndicador } from '@/types'

const STEPS = ['Datos de entrada', 'Cálculo de score', 'KPIs por área', 'Alertas y próximas acciones']

export function DashboardKPIs() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipio = municipiosActivos[0] ?? ''

  const [generacionTonDia, setGeneracionTonDia] = useState(10)
  const [tasaActual, setTasaActual] = useState(8)
  const [brechaInfra, setBrechaInfra] = useState(2)
  const [numMacro, setNumMacro] = useState(3)
  const [numCentros, setNumCentros] = useState(1)
  const [estadoLegal, setEstadoLegal] = useState('sin_gate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DashboardResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const isEmpty = !loading && !error && !result

  async function run(payload: object) {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummary(payload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al calcular dashboard municipal')
    } finally {
      setLoading(false)
    }
  }

  async function handleCalculate() {
    const payload = {
      municipio_id: municipio,
      generacion_ton_dia: generacionTonDia,
      tasa_circularidad_actual_pct: tasaActual,
      brecha_infraestructura_ton_dia: brechaInfra,
      num_macrogeneradores: numMacro,
      num_centros_acopio: numCentros,
      estado_legal: estadoLegal,
      corrientes_criticas: ['organico'],
    }
    setLastPayload(payload)
    await run(payload)
  }

  const scoreColor = useMemo(() => {
    const score = result?.resumen.score_circularidad ?? 0
    if (score >= 70) return 'text-[#2D7A0A]'
    if (score >= 40) return 'text-[#C47E00]'
    return 'text-[#B3261E]'
  }, [result])

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Panel de indicadores municipales · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h1>

      <AvisoMunicipioAncla ids={municipiosActivos} />

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {STEPS.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-2">
        <Field label="Generación t/día" value={generacionTonDia} onChange={setGeneracionTonDia} />
        <Field label="Tasa circularidad %" value={tasaActual} onChange={setTasaActual} />
        <Field label="Brecha infraestructura t/día" value={brechaInfra} onChange={setBrechaInfra} />
        <Field label="No. macrogeneradores" value={numMacro} onChange={setNumMacro} />
        <Field label="No. centros acopio" value={numCentros} onChange={setNumCentros} />
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

      <button
        type="button"
        onClick={handleCalculate}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Calculando dashboard...' : 'Calcular dashboard'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 bg-[#E8E4DC] rounded w-3/4" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-1/2" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Ingresa los datos del municipio para calcular el dashboard.
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

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-5 text-center">
            <p className="text-[12px] text-[#6B6760]">Score de circularidad municipal</p>
            <p className={`font-serif text-[48px] leading-none ${scoreColor}`}>
              {result.resumen.score_circularidad.toFixed(0)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip label="Residuos" value={`${result.resumen.total_residuos_ton_dia} t/día`} />
            <Chip label="Tasa circularidad" value={`${result.resumen.tasa_circularidad_pct}%`} />
            <Chip label="Brecha infra" value={`${result.resumen.brecha_infraestructura_ton_dia} t/día`} />
            <Chip label="Macrogeneradores" value={`${result.resumen.num_macrogeneradores}`} />
            <Chip label="Centros acopio" value={`${result.resumen.num_centros_acopio}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.kpis.map(kpi => <KPICard key={kpi.clave} kpi={kpi} />)}
          </div>

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => <p key={w}>{w}</p>)}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
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
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : kpi.tendencia === 'estable'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : 'bg-red-50 text-red-900 border-red-200'
  const progress = kpi.meta_90_dias > 0 ? Math.min(100, (kpi.valor_actual / kpi.meta_90_dias) * 100) : 0
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3">
      <p className="text-[12px] font-semibold text-[#1C1B18]">{kpi.titulo}</p>
      <p className="mt-1 text-[24px] font-bold text-[#1C1B18]">
        {kpi.valor_actual.toFixed(1)} <span className="text-[12px] font-normal text-[#6B6760]">{kpi.unidad}</span>
      </p>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${trendColor}`}>
        {kpi.tendencia}
      </span>
      <div className="mt-2 h-2 rounded bg-[#F0EDE5]">
        <div className="h-2 rounded bg-[#3B6D11]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-[#6B6860]">{kpi.formula}</p>
      {kpi.alerta && <p className="mt-1 text-[11px] text-[#B3261E]">{kpi.alerta}</p>}
    </div>
  )
}
