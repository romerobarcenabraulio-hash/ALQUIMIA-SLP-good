'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Calculator, Info, Lock, RefreshCw } from 'lucide-react'
import { buildTerritorialPlan } from '@/lib/api'
import { CA_CONFIG } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { TerritorialImplementationPlan, TerritorialPlanRequest } from '@/types'
import { cn } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

const SOURCE = {
  source_id: 'alquimia-12-2-territorial-ui',
  name: 'Modelo ALQUIMIA de implementacion territorial',
  organization: 'ALQUIMIA',
  source_type: 'propuesta_tecnica_no_oficial',
  confidence: 0.58,
  explanation: 'Calendario propuesto con colonias piloto no oficiales; requiere validacion local.',
}

export function ImplementacionEspacioTiempo() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const setHorizonte = useSimulatorStore(s => s.setHorizonte)
  const mesInicio = useSimulatorStore(s => s.mesInicio)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const resultados = useSimulatorStore(s => s.resultados)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const mixCAs = useSimulatorStore(s => s.mixCAs)
  const [plan, setPlan] = useState<TerritorialImplementationPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedDemo, setBlockedDemo] = useState(false)

  const availableCapacity = useMemo(() => (
    mixCAs.P * CA_CONFIG.P.capTonDia +
    mixCAs.M * CA_CONFIG.M.capTonDia +
    mixCAs.G * CA_CONFIG.G.capTonDia
  ), [mixCAs])

  const normalizedHorizon = horizonte <= 3 ? 3 : horizonte <= 5 ? 5 : 7
  const targetCapture = pctCapturaPorAño[Math.max(0, normalizedHorizon - 1)] ?? pctCapturaPorAño[pctCapturaPorAño.length - 1] ?? 70

  const payload: TerritorialPlanRequest = useMemo(() => ({
    city_id: zmActiva,
    municipios: blockedDemo ? [] : municipiosActivos,
    horizon_years: normalizedHorizon,
    start_month: mesInicio,
    current_capture_pct: circularityBaseline?.current_circularity_pct ?? 0,
    target_capture_pct: targetCapture,
    rsu_total_ton_day: resultados?.rsuTotalTonDia ?? circularityBaseline?.rsu_total_ton_day_est ?? 0,
    available_capacity_ton_day: availableCapacity,
    source: SOURCE,
  }), [availableCapacity, blockedDemo, circularityBaseline, mesInicio, municipiosActivos, normalizedHorizon, resultados, targetCapture, zmActiva])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    buildTerritorialPlan(payload)
      .then(data => {
        if (!cancelled) setPlan(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPlan(null)
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [payload])

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">S12.2 — Implementación espacio-tiempo</p>
        <h2 className="mt-2 font-serif text-[24px] text-[#1C1B18]">Ruta territorial por oleadas</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
          Convierte el horizonte en zonas, municipios, colonias piloto propuestas, trimestres y metas parciales para RSU municipal.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[3, 5, 7].map(years => (
          <button
            key={years}
            type="button"
            onClick={() => setHorizonte(years)}
            className={cn(
              'rounded-[8px] border px-4 py-3 text-left transition-colors',
              normalizedHorizon === years
                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C8C2B8]',
            )}
          >
            <span className="block font-mono text-[24px]">{years}</span>
            <span className="text-[12px]">años de despliegue</span>
          </button>
        ))}
      </div>

      <details className="rounded-[8px] border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-[#1C1B18]">
          Sala de comando y taller técnico · sin carácter oficial de planeación
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A857C]">
          Sirve en mesas de trabajo y capacitación: muestra cómo actúa el planificador cuando el conjunto municipal activo no se envía al modelo territorial,
          sin modificar la selección real ni las fuentes del simulador.
        </p>
        <label className="mt-3 flex items-start gap-2 text-[12px] text-[#6B6760]">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={blockedDemo}
            onChange={event => setBlockedDemo(event.target.checked)}
          />
          <span>
            Ejercitar solicitud sin municipios en el conjunto territorial enviado al modelo (respuesta acotada para capacitación).
          </span>
        </label>
      </details>

      {loading && <LoadingState />}
      {error && (
        <>
          <ErrorState message={error} />
          <NarrativeBridge
            variant="warning"
            audience="functionary"
            kicker="Territorial · error de cómputo"
            summary={`No se obtuvo plan para ${zmActiva} con horizonte ${normalizedHorizon} años, meta de captura objetivo ${targetCapture}% y ${municipiosActivos.length} municipio(s) en el envío${blockedDemo ? ' (modo capacitación sin municipios)' : ''}. El backend respondió: ${error}`}
            evidence={[
              { label: 'Capacidad CA', value: `${availableCapacity.toFixed(1)} ton/día` },
              { label: 'RSU modelo', value: `${payload.rsu_total_ton_day.toFixed(2)} ton/día` },
              { label: 'Mes inicio', value: String(mesInicio) },
            ]}
            nextStep={{
              label: 'Revisar municipios y horizonte',
              helper: 'Ajusta el conjunto municipal o desactiva el modo de capacitación sin municipios y vuelve a intentar.',
            }}
          />
        </>
      )}
      {!loading && !error && !plan && <EmptyState />}
      {!loading && !error && plan?.status === 'blocked' && (
        <>
          <BlockedState plan={plan} />
          <NarrativeBridge
            variant="warning"
            audience="functionary"
            kicker="Territorial · bloqueo"
            summary={`La ruta para ${zmActiva} quedó bloqueada (${plan.blockers.length} restricción(es)). Capacidad declarada de centros: ${availableCapacity.toFixed(1)} ton/día; municipios activos en el modelo: ${municipiosActivos.length}. Siguiente paso sugerido: ${plan.next_action}`}
            evidence={[
              { label: 'Bloqueos', value: String(plan.blockers.length) },
              { label: 'Meta captura', value: `${targetCapture}%` },
              { label: 'Horizonte', value: `${normalizedHorizon} años` },
            ]}
            nextStep={{
              label: 'Seguir la acción del plan',
              helper: plan.next_action,
            }}
          />
        </>
      )}
      {!loading && !error && plan && plan.status !== 'blocked' && (
        <>
          <PlanState plan={plan} />
          <NarrativeBridge
            variant="result"
            audience="functionary"
            kicker="Territorial · lectura institucional"
            summary={`${zmActiva}: ${plan.zones.length} oleada(s) territorial(es), capacidad instalada modelada ${availableCapacity.toFixed(1)} ton/día y captura objetivo ${targetCapture}%. ${plan.decision_help_text} ${plan.warnings.length ? `Advertencias activas: ${plan.warnings.length}.` : ''}`}
            evidence={plan.zones[0]
              ? [
                  { label: 'Zona 1 meta parcial', value: `${plan.zones[0].target_capture_pct.toFixed(1)}%` },
                  { label: 'Zona 1 ton/día', value: `${plan.zones[0].estimated_capture_ton_day.toFixed(1)} ton/día` },
                  { label: 'Oleadas', value: String(plan.zones.length) },
                  { label: 'Capacidad CA', value: `${availableCapacity.toFixed(1)} ton/día` },
                ]
              : [
                  { label: 'Oleadas', value: String(plan.zones.length) },
                  { label: 'Capacidad CA', value: `${availableCapacity.toFixed(1)} ton/día` },
                  { label: 'Meta captura', value: `${targetCapture}%` },
                ]}
            nextStep={{
              label: 'Documentar decisión en operaciones',
              helper: plan.timeline_help_text,
            }}
          />
        </>
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
      Recalculando oleadas territoriales, capacidad y metas parciales.
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Selecciona horizonte, municipios y meta para construir el calendario territorial.
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  )
}

function BlockedState({ plan }: { plan: TerritorialImplementationPlan }) {
  return (
    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">
        <Lock className="mr-2 inline h-4 w-4" />
        Ruta territorial bloqueada
      </p>
      {plan.blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{plan.next_action}</p>
    </div>
  )
}

function PlanState({ plan }: { plan: TerritorialImplementationPlan }) {
  return (
    <div className="space-y-4">
      {plan.warnings.map(warning => (
        <div key={warning} className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {warning}
        </div>
      ))}

      <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">Decisión que habilita</p>
            <p className="mt-1 text-[13px] font-semibold text-[#1C1B18]">{plan.decision_help_text}</p>
            <p className="mt-2 text-[12px] text-[#6B6760]">{plan.legal_scope_note}</p>
          </div>
          <div className="rounded-[8px] bg-[#F8F6F1] px-3 py-2 text-[12px] text-[#6B6760]">
            <Info className="mr-1 inline h-4 w-4" />
            {plan.timeline_help_text}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">
          <CalendarDays className="mr-2 inline h-4 w-4" />
          Timeline territorial
        </p>
        <div className="mt-4 space-y-3">
          {plan.zones.map(zone => (
            <div key={zone.zone_id} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#1C1B18]">
                    Zona {zone.zone_number}: {zone.phase_label}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B6760]">
                    Municipio: <span className="font-mono">{zone.municipio_id}</span> · {zone.start_quarter} · meses {zone.start_month}-{zone.end_month}
                  </p>
                </div>
                <div className={cn(
                  'rounded-[6px] px-2 py-1 text-[11px] font-semibold',
                  zone.status === 'condicionada' ? 'bg-amber-100 text-amber-900' : 'bg-[#EAF3DE] text-[#23470A]',
                )}>
                  {zone.status}
                </div>
              </div>
              <p className="mt-2 text-[12px] text-[#6B6760]">{zone.territorial_reason}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold text-[#1C1B18]">Colonias piloto propuestas</p>
                  <ul className="mt-1 space-y-1 text-[12px] text-[#6B6760]">
                    {zone.colonias.map(colony => (
                      <li key={`${zone.zone_id}-${colony.name}`}>
                        {colony.name} · {colony.official_status}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1C1B18]">Meta parcial</p>
                  <p className="mt-1 font-mono text-[18px] text-[#3B6D11]">
                    {zone.target_capture_pct.toFixed(1)}% · {zone.estimated_capture_ton_day.toFixed(1)} ton/día
                  </p>
                  <p className="mt-1 text-[11px] text-[#8A857C]">{zone.help_text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">
          <Calculator className="mr-2 inline h-4 w-4" />
          Anexo de cálculos
        </p>
        <div className="mt-3 space-y-3">
          {plan.calculation_annex.map(item => (
            <div key={item.calculation_name} className="rounded-[6px] bg-[#F8F6F1] p-3 text-[12px] text-[#6B6760]">
              <p className="font-semibold text-[#1C1B18]">{item.calculation_name}</p>
              <p className="mt-1">Fórmula: <span className="font-mono">{item.formula}</span></p>
              <p className="mt-1">Resultado: <span className="font-mono">{item.result.toFixed(2)} {item.unit}</span></p>
              <p className="mt-1">Fuente: {item.source.organization} — {item.source.name}</p>
              <p className="mt-1">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
