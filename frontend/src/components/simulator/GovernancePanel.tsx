'use client'

import { Fragment, useMemo, useState } from 'react'
import { evaluateGovernance } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { GovernanceResponse, RiesgoIdentificado } from '@/types'

const FLOW = ['Inputs del sistema', 'Métricas de calidad', 'Evaluación DoD', 'Score de gobernanza']

export function GovernancePanel() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipio = municipiosActivos[0] ?? ''

  const [totalTestsPassing, setTotalTestsPassing] = useState(646)
  const [coberturaModulos, setCoberturaModulos] = useState(9)
  const [tscClean, setTscClean] = useState(true)
  const [hasRateLimiting, setHasRateLimiting] = useState(true)
  const [hasSecurityHeaders, setHasSecurityHeaders] = useState(true)
  const [hasHealthEndpoint, setHasHealthEndpoint] = useState(true)
  const [hasAccessControl, setHasAccessControl] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GovernanceResponse | null>(null)

  const isEmpty = !loading && !error && !result

  const scoreClass = useMemo(() => {
    const score = result?.score_gobernanza ?? 0
    if (score >= 85) return 'text-[#2D7A0A]'
    if (score >= 60) return 'text-[#C47E00]'
    return 'text-[#B3261E]'
  }, [result])

  const statusClass = useMemo(() => {
    const status = result?.status
    if (status === 'aprobado') return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    if (status === 'observaciones') return 'bg-amber-50 border-amber-200 text-amber-900'
    return 'bg-red-50 border-red-200 text-red-900'
  }, [result])

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        municipio_id: municipio,
        total_tests_passing: totalTestsPassing,
        tsc_clean: tscClean,
        has_rate_limiting: hasRateLimiting,
        has_security_headers: hasSecurityHeaders,
        has_health_endpoint: hasHealthEndpoint,
        has_access_control: hasAccessControl,
        cobertura_modulos: coberturaModulos,
      }
      const data = await evaluateGovernance(payload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al evaluar gobernanza')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Panel de gobernanza y calidad · <span className="text-[14px] text-[#6B6860]">interno</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {FLOW.map((node, i, arr) => (
          <Fragment key={node}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{node}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <NumberField label="Tests backend passing" value={totalTestsPassing} onChange={setTotalTestsPassing} min={0} />
        <NumberField label="Cobertura de módulos con tests" value={coberturaModulos} onChange={setCoberturaModulos} min={0} max={20} />
        <CheckField label="TypeScript limpio (tsc --noEmit)" checked={tscClean} onChange={setTscClean} />
        <CheckField label="Rate limiting activo" checked={hasRateLimiting} onChange={setHasRateLimiting} />
        <CheckField label="Headers de seguridad activos" checked={hasSecurityHeaders} onChange={setHasSecurityHeaders} />
        <CheckField label="Health endpoint operativo" checked={hasHealthEndpoint} onChange={setHasHealthEndpoint} />
        <CheckField label="Control de acceso activo" checked={hasAccessControl} onChange={setHasAccessControl} />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Evaluando gobernanza...' : 'Evaluar gobernanza'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 w-2/3 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Ingresa los parámetros del sistema para evaluar la gobernanza.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p className="font-semibold">Incidencia operativa</p>
          <p>{error}</p>
        </div>
      )}

      {result?.status === 'bloqueado' && result.blockers.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[12px] text-amber-900">
          {result.blockers.map(blocker => <p key={blocker}>{blocker}</p>)}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-5 text-center">
            <p className="text-[12px] text-[#6B6760]">Score de gobernanza</p>
            <p className={`font-serif text-[48px] leading-none ${scoreClass}`}>{result.score_gobernanza.toFixed(0)}</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] ${statusClass}`}>
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.metricas.map(metric => (
              <div key={metric.nombre} className="rounded-lg border border-[#E8E4DC] bg-white p-3">
                <p className="text-[12px] font-semibold text-[#1C1B18]">{metric.nombre}</p>
                <p className="mt-1 text-[13px] text-[#6B6760]">
                  {metric.valor_actual.toFixed(1)} {metric.unidad} / umbral {metric.umbral_minimo}
                </p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${metric.cumple ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
                  {metric.cumple ? 'Cumple' : 'No cumple'}
                </span>
                <p className="mt-2 text-[11px] text-[#8B877F]">Fuente: {metric.fuente}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-[16px] text-[#1C1B18] mb-3">Riesgos mapeados</h3>
            {result.riesgos.map(risk => <RiskRow key={risk.id} risk={risk} />)}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-[16px] text-[#1C1B18] mb-3">Checklist Definition of Done</h3>
            {result.dod.map(item => (
              <div key={item.criterio} className="rounded-lg border border-[#E8E4DC] bg-white p-3">
                <p className="text-[13px] text-[#1C1B18]">
                  {item.cumplido ? '✅' : '❌'} {item.criterio}
                </p>
                <p className="mt-1 text-[11px] text-[#8B877F]">{item.evidencia}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-[12px] text-[#1C1B18]">
            {result.resumen}
          </div>
        </div>
      )}
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max?: number
}) {
  return (
    <label className="text-[13px] text-[#6B6860] mb-1">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2"
      />
    </label>
  )
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2 text-[13px] text-[#1C1B18]">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function RiskRow({ risk }: { risk: RiesgoIdentificado }) {
  const levelLabel = risk.nivel === 'critico' ? '🔴 critico' : risk.nivel === 'alto' ? '🟠 alto' : '🟡 medio'
  const levelClass = risk.nivel === 'critico'
    ? 'border-red-200 bg-red-50 text-red-900'
    : risk.nivel === 'alto'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-yellow-200 bg-yellow-50 text-yellow-900'
  const stateClass = risk.estado === 'mitigado'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : risk.estado === 'aceptado'
      ? 'border-slate-200 bg-slate-100 text-slate-800'
      : 'border-red-200 bg-red-50 text-red-900'

  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${levelClass}`}>{levelLabel}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${stateClass}`}>{risk.estado}</span>
      </div>
      <p className="mt-2 text-[13px] font-medium text-[#1C1B18]">{risk.descripcion}</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">Mitigación: {risk.mitigacion}</p>
    </div>
  )
}
