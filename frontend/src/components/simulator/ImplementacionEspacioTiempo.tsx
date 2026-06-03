'use client'

import { useEffect, useMemo, useState, startTransition } from 'react'
import { AlertTriangle, CalendarDays, Calculator, Info, Lock, RefreshCw } from 'lucide-react'
import { buildTerritorialPlan } from '@/lib/api'
import {
  getHitosForZm,
  HORIZONTE_DIAS_MESES_36,
  kpisAcumulados,
} from '@/data/hitosTimeline'
import { pertExpectedDays } from '@/lib/pertUtils'
import { CA_CONFIG } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { TerritorialImplementationPlan, TerritorialPlanRequest } from '@/types'
import { cn } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { Conclusion, EditorialCallout, MarginalNote, SectionLabel } from '@/components/editorial'

const SOURCE = {
  source_id: 'alquimia-12-2-territorial-ui',
  name: 'Modelo ALQUIMIA de implementacion territorial',
  organization: 'ALQUIMIA',
  source_type: 'propuesta_tecnica_no_oficial',
  confidence: 0.58,
  explanation: 'Calendario propuesto con colonias piloto no oficiales; requiere validacion local.',
}

/** Evita crash en UI si el backend omite listas esperadas. */
function normalizeTerritorialPlanResponse(raw: TerritorialImplementationPlan): TerritorialImplementationPlan {
  return {
    ...raw,
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    zones: Array.isArray(raw.zones) ? raw.zones : [],
    blockers: Array.isArray(raw.blockers) ? raw.blockers : [],
    calculation_annex: Array.isArray(raw.calculation_annex) ? raw.calculation_annex : [],
  }
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
  const [territorialFetchTick, setTerritorialFetchTick] = useState(0)

  const availableCapacity = useMemo(() => (
    mixCAs.P * CA_CONFIG.P.capTonDia +
    mixCAs.M * CA_CONFIG.M.capTonDia +
    mixCAs.G * CA_CONFIG.G.capTonDia
  ), [mixCAs.P, mixCAs.M, mixCAs.G])

  const normalizedHorizon = horizonte <= 3 ? 3 : horizonte <= 5 ? 5 : 7
  const targetCapture = pctCapturaPorAño[Math.max(0, normalizedHorizon - 1)] ?? pctCapturaPorAño[pctCapturaPorAño.length - 1] ?? 70

  /** Evita bucles de fetch cuando el store entrega nuevas referencias de objeto con los mismos números. */
  const municipiosKey = useMemo(() => municipiosActivos.join('|'), [municipiosActivos])
  const baselineCapture = circularityBaseline?.current_circularity_pct ?? 0
  const baselineRsuEst = circularityBaseline?.rsu_total_ton_day_est ?? 0
  const rsuFromMotor = resultados?.rsuTotalTonDia

  const payload: TerritorialPlanRequest = useMemo(() => ({
    city_id: zmActiva,
    municipios: blockedDemo ? [] : municipiosActivos,
    horizon_years: normalizedHorizon,
    start_month: mesInicio,
    current_capture_pct: baselineCapture,
    target_capture_pct: targetCapture,
    rsu_total_ton_day: rsuFromMotor ?? baselineRsuEst,
    available_capacity_ton_day: availableCapacity,
    source: SOURCE,
  }), [
    availableCapacity,
    baselineCapture,
    baselineRsuEst,
    blockedDemo,
    mesInicio,
    municipiosKey,
    normalizedHorizon,
    rsuFromMotor,
    targetCapture,
    zmActiva,
  ])

  const canFetchTerritorialPlan =
    blockedDemo || (municipiosActivos.length > 0 && (rsuFromMotor ?? baselineRsuEst) > 0)

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload])

  useEffect(() => {
    if (territorialFetchTick === 0) return
    let cancelled = false
    if (!canFetchTerritorialPlan) {
      setPlan(null)
      setError(null)
      setLoading(false)
      return () => {
        cancelled = true
      }
    }
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    buildTerritorialPlan(payload)
      .then(data => {
        if (!cancelled) setPlan(normalizeTerritorialPlanResponse(data))
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
    return () => {
      cancelled = true
    }
  }, [territorialFetchTick, payloadKey, canFetchTerritorialPlan, payload])

  const empleoBasePert = resultados?.empleosTotalesDirectos ?? 0

  // Carga oleadas al entrar si hay municipio + RSU (evita pantalla vacía hasta pulsar botón)
  useEffect(() => {
    if (territorialFetchTick > 0 || !canFetchTerritorialPlan) return
    setTerritorialFetchTick(1)
  }, [canFetchTerritorialPlan, territorialFetchTick])

  return (
    <section className="space-y-5">
      <div>
        <h2 className="mt-2 font-serif text-[24px] text-[#1C1B18]">Ruta territorial por oleadas</h2>
        <Conclusion as="div" className="mt-2 text-[15px] md:text-[16px]">
          Convierte el horizonte en zonas, municipios, colonias piloto propuestas, trimestres y metas parciales para RSU municipal.
        </Conclusion>
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
          Sala de comando y mesa técnica · sin carácter oficial de planeación
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A857C]">
          Para talleres institucionales: ilustra la respuesta del planificador cuando la solicitud al modelo territorial no incluye municipios del conjunto activo en pantalla,
          sin alterar la selección ni las fuentes ya cargadas en el simulador.
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

      <TimelineHitosEspacioTiempo empleoBase={empleoBasePert} zmId={zmActiva} horizonteAnios={horizonte} />

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <SectionLabel>Oleadas territoriales (servicio)</SectionLabel>
        <MarginalNote className="mt-1 max-w-none">
          Complementa el PERT de arriba con zonas y colonias piloto desde el API. El cálculo no se dispara solo al abrir el módulo: usa el
          botón para evitar saturar la pestaña. Si el servicio no responde, el PERT y las gráficas siguen disponibles en la otra pestaña.
        </MarginalNote>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canFetchTerritorialPlan || loading}
            onClick={() => setTerritorialFetchTick(t => t + 1)}
            className="rounded-[8px] border border-[#3B6D11]/50 bg-white px-3 py-2 text-[12px] font-medium text-[#23470A] hover:bg-[#EAF3DE] disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="territorial-plan-fetch"
          >
            {loading ? 'Calculando oleadas…' : 'Calcular oleadas territoriales'}
          </button>
          {territorialFetchTick > 0 && plan && !loading && !error && (
            <span className="text-[11px] text-[#6B6760]">Última respuesta del servicio cargada.</span>
          )}
        </div>
        {!canFetchTerritorialPlan && !blockedDemo && (
          <EditorialCallout tone="caution" className="mt-3 pt-3">
            Selecciona al menos un municipio activo y asegura RSU modelado &gt; 0 para calcular oleadas territoriales.
          </EditorialCallout>
        )}
        {loading && (
          <div className="mt-3">
            <LoadingState />
          </div>
        )}
        {error && (
          <div className="mt-3 space-y-3">
            <ErrorState message={error} />
            <NarrativeBridge
              variant="warning"
              audience="functionary"
              kicker="Territorial · error de cómputo"
              summary={`No se obtuvo plan para ${zmActiva} con horizonte ${normalizedHorizon} años, meta de captura objetivo ${targetCapture}% y ${municipiosActivos.length} municipio(s) en la solicitud${blockedDemo ? ' (ejercicio sin municipios en la solicitud)' : ''}. El servicio respondió: ${error}`}
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
          </div>
        )}
        {!loading && !error && canFetchTerritorialPlan && !plan && (
          <div className="mt-3">
            <EmptyState />
          </div>
        )}
        {!loading && !error && plan?.status === 'blocked' && (
          <div className="mt-3 space-y-3">
            <BlockedState plan={plan} />
            <NarrativeBridge
              variant="warning"
              audience="functionary"
              kicker="Territorial · bloqueo"
              summary={`La ruta para ${zmActiva} quedó bloqueada (${(plan.blockers ?? []).length} restricción(es)). Capacidad declarada de centros: ${availableCapacity.toFixed(1)} ton/día; municipios activos en el modelo: ${municipiosActivos.length}. Siguiente paso sugerido: ${plan.next_action}`}
              evidence={[
                { label: 'Bloqueos', value: String((plan.blockers ?? []).length) },
                { label: 'Meta captura', value: `${targetCapture}%` },
                { label: 'Horizonte', value: `${normalizedHorizon} años` },
              ]}
              nextStep={{
                label: 'Seguir la acción del plan',
                helper: plan.next_action,
              }}
            />
          </div>
        )}
        {!loading && !error && plan && plan.status !== 'blocked' && (
          <div className="mt-3 space-y-3">
            <PlanState plan={plan} />
            <NarrativeBridge
              variant="result"
              audience="functionary"
              kicker="Territorial · lectura institucional"
              summary={`${zmActiva}: ${(plan.zones ?? []).length} oleada(s) territorial(es), capacidad instalada modelada ${availableCapacity.toFixed(1)} ton/día y captura objetivo ${targetCapture}%. ${plan.decision_help_text} ${(plan.warnings ?? []).length ? `Advertencias activas: ${(plan.warnings ?? []).length}.` : ''}`}
              evidence={(plan.zones ?? [])[0]
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
          </div>
        )}
      </div>
    </section>
  )
}

const TIMELINE_FRAC_MARKS = [0, 1 / 4, 1 / 2, 3 / 4, 1] as const

function TimelineHitosEspacioTiempo({
  empleoBase,
  zmId,
  horizonteAnios,
}: {
  empleoBase: number
  zmId: string
  horizonteAnios: number
}) {
  const maxD = HORIZONTE_DIAS_MESES_36
  const [diaActual, setDiaActual] = useState(maxD / 2)
  const { hitos } = useMemo(() => getHitosForZm(zmId), [zmId])
  const [selectedId, setSelectedId] = useState<string | null>(hitos[0]?.id ?? null)

  useEffect(() => {
    setSelectedId(hitos[0]?.id ?? null)
  }, [hitos])

  const kpis = useMemo(
    () => kpisAcumulados(Math.round(diaActual), empleoBase, zmId),
    [diaActual, empleoBase, zmId],
  )

  const selected = useMemo(
    () => hitos.find(h => h.id === selectedId) ?? null,
    [hitos, selectedId],
  )

  const mesLabel = (frac: number) => {
    const m = Math.round(36 * frac)
    return m <= 0 ? 'Día 0' : `Mes ${m}`
  }

  const diaRounded = Math.round(diaActual)

  return (
    <div
      className="rounded-[8px] border border-[#E0D9CE] bg-[#FDFCF9] p-4 shadow-sm"
      data-testid="pert-hitos-timeline"
      id="pert-hitos-timeline"
    >
      <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">Línea tiempo programa (referencia)</p>
      <h3 className="mt-1 font-serif text-[17px] text-[#1C1B18]">Hitos PERT y avance acumulado</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
        Horizonte del plan en pantalla: {horizonteAnios} años. Eje Día 0 → Mes 36 (equiv. {maxD} días de referencia). Los hitos
        muestran fecha esperada; la banda pesimista/optimista queda implícita en el catálogo PERT.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,minmax(260px,32%)]">
        <div className="min-w-0 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiChip label="Empleos acum." value={`${Math.round(kpis.empleos)}`} mono />
            <KpiChip label="Pepenadores" value={`${Math.round(kpis.pepenadores)}`} mono />
            <KpiChip label="Captura Δ pts" value={`${kpis.captura_pct.toFixed(1)}%`} mono />
            <KpiChip label="CO₂e evitado" value={`${kpis.co2e_evitado_ton.toFixed(1)} t`} mono />
          </div>

          <label className="block text-[12px] font-medium text-[#1C1B18]" htmlFor="timeline-dia-slider">
            Día en el programa: <span className="font-mono text-[#23470A]">{Math.round(diaActual)}</span>
            {' '}
            <span className="font-normal text-[#8A857C]">/ {maxD}</span>
          </label>
          <input
            id="timeline-dia-slider"
            type="range"
            min={0}
            max={maxD}
            step={1}
            value={diaActual}
            onChange={e => setDiaActual(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-[#3B6D11]"
            aria-valuemin={0}
            aria-valuemax={maxD}
            aria-valuenow={Math.round(diaActual)}
          />
          <div className="mt-3 space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#E8E4DC]">
              <div
                className="h-full rounded-full bg-[#3B6D11]/45 transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, (diaActual / maxD) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#8A857C]">
              {TIMELINE_FRAC_MARKS.map((frac, idx) => (
                <span key={`lbl-${idx}`}>{mesLabel(frac)}</span>
              ))}
            </div>
            <label htmlFor="timeline-hito-select" className="block text-[12px] font-medium text-[#1C1B18]">
              Hito del programa
            </label>
            <select
              id="timeline-hito-select"
              value={selectedId ?? ''}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-[6px] border border-[#E8E4DC] bg-white px-2 py-2 text-[12px] text-[#1C1B18]"
            >
              {hitos.map(hito => {
                const tExpected = pertExpectedDays(hito)
                const alcanzadoEnModelo = tExpected <= diaRounded
                return (
                  <option key={hito.id} value={hito.id}>
                    {hito.nombre_corto} · PERT ~{tExpected.toFixed(0)}d · {alcanzadoEnModelo ? 'Modelo' : 'Pte.'}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
        <aside className="rounded-[8px] border border-[#E8E4DC] bg-white p-3 text-[12px] text-[#6B6760]">
          {selected ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A8A49C]">Hito seleccionado</p>
              <p className="mt-2 font-serif text-[15px] text-[#1C1B18]">{selected.nombre_corto}</p>
              <p className="mt-2 leading-relaxed">{selected.descripcion_ciudadano}</p>
              <p className="mt-3 text-[11px] font-semibold text-[#1C1B18]">KPIs asociados (delta del hito)</p>
              <ul className="mt-2 space-y-1 font-mono text-[11px]">
                <li>Empleos: {selected.kpis?.empleos_delta != null && selected.kpis.empleos_delta >= 0 ? '+' : ''}{selected.kpis?.empleos_delta ?? 0}</li>
                <li>Pepenadores: {selected.kpis?.pepenadores_delta != null && selected.kpis.pepenadores_delta >= 0 ? '+' : ''}{selected.kpis?.pepenadores_delta ?? 0}</li>
                <li>Captura: {selected.kpis?.captura_pct_pts != null && selected.kpis.captura_pct_pts >= 0 ? '+' : ''}{selected.kpis?.captura_pct_pts ?? 0} pts</li>
                <li>CO₂e: {selected.kpis?.co2e_evitado_ton_delta != null && selected.kpis.co2e_evitado_ton_delta >= 0 ? '+' : ''}{selected.kpis?.co2e_evitado_ton_delta ?? 0} t</li>
              </ul>
            </>
          ) : (
            <p className="text-[12px] text-[#8A857C]">Selecciona un hito en la línea de tiempo.</p>
          )}
        </aside>
      </div>

      <MarginalNote className="mt-4">
        <Info className="mr-1 inline h-3.5 w-3.5 shrink-0 align-text-bottom text-[#7B7366]" aria-hidden />
        Esta línea de tiempo es una ilustración orientativa del simulador: fechas PERT y KPI acumulados son proyecciones del modelo,
        no calendario oficial, programa de cabildo ni acto de autoridad. Los entregables municipales requieren validación local.
        Etiqueta «Modelo» en cada hito: el día del deslizador alcanzó o superó la esperanza PERT; «Pte.»: aún no entra en ese acumulado.
      </MarginalNote>
    </div>
  )
}

function KpiChip({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[6px] border border-[#E8E4DC] bg-white px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[#A8A49C]">{label}</p>
      <p className={cn('mt-0.5 text-[13px] font-semibold text-[#23470A]', mono && 'font-mono')}>{value}</p>
    </div>
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
  const blockers = Array.isArray(plan.blockers) ? plan.blockers : []
  return (
    <section className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">
        <Lock className="mr-2 inline h-4 w-4" />
        Ruta territorial bloqueada
      </p>
      {blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{plan.next_action}</p>
    </section>
  )
}

function PlanState({ plan }: { plan: TerritorialImplementationPlan }) {
  const warnings = Array.isArray(plan.warnings) ? plan.warnings : []
  const zones = Array.isArray(plan.zones) ? plan.zones : []
  const annex = Array.isArray(plan.calculation_annex) ? plan.calculation_annex : []
  return (
    <div className="space-y-4">
      {warnings.map(warning => (
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
          {zones.map(zone => (
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
                    {(zone.colonias ?? []).map(colony => (
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
          {annex.map(item => (
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
