'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Info, Lock, RefreshCw, Truck } from 'lucide-react'
import { buildPerOperationsPlan } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { PerOperationsPlan, PerPlanRequest } from '@/types'
import { EditorialTimeline, type TimelineMilestone } from '@/components/simulator/EditorialTimeline'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

const SOURCE = {
  source_id: 'alquimia-12-3-per-ui',
  name: 'Plan PER mensual desde simulador',
  organization: 'ALQUIMIA',
  source_type: 'propuesta_operativa_estimada',
  confidence: 0.61,
  explanation: 'Rutas y bitacora inicial declaradas para explicar presion, estado y respuesta mensual.',
}

function monthId() {
  return new Date().toISOString().slice(0, 7)
}

export function OperacionPERBitacora() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const [plan, setPlan] = useState<PerOperationsPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedDemo, setBlockedDemo] = useState(false)
  const municipio = municipiosActivos[0] ?? ''

  const payload: PerPlanRequest = useMemo(() => ({
    city_id: zmActiva,
    periodo_mes: monthId(),
    routes: [
      {
        route_id: 'ruta-per-1',
        municipio_id: municipio,
        zona_id: 'Z1',
        colonias: ['Colonia piloto propuesta', 'Centro de barrio'],
        frecuencia: 'Lunes, miercoles y viernes',
        frecuencia_por_semana: 3,
        camion_unidad: 'Unidad RSU-01',
        responsable: blockedDemo ? '' : 'Coordinacion operativa municipal',
        ventana_temporal: '07:00-12:00',
        estado_operativo: 'programada',
      },
    ],
    log_events: [
      {
        fecha: `${monthId()}-01`,
        event_type: 'evidencia_ruta',
        municipio_id: municipio,
        route_or_zone_id: 'Z1',
        actor_responsable: blockedDemo ? '' : 'Coordinacion operativa municipal',
        accion_siguiente: 'Revisar consistencia de recorrido al cierre semanal.',
        evidencia: blockedDemo ? [] : [
          {
            evidence_id: 'ev-per-ui-1',
            evidence_type: 'registro_operativo',
            description: 'Programacion de ruta y responsable capturados desde simulador.',
            captured_at: new Date().toISOString(),
            captured_by: 'simulador',
            source: 'ui_operacion_per',
          },
        ],
      },
    ],
    source: SOURCE,
  }), [blockedDemo, municipio, zmActiva])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    buildPerOperationsPlan(payload)
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
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">S12.3 — Operación PER y bitácora</p>
        <h2 className="mt-2 font-serif text-[24px] text-[#1C1B18]">Operación mensual por ruta</h2>
        <ScopeAnclaKicker className="mt-2" />
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
          PER explica presión, estado y respuesta de rutas RSU municipales con bitácora y evidencia operativa.
        </p>
      </div>

      <details className="rounded-[8px] border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-[#1C1B18]">
          Bitácora operativa municipal · ejercicios para capacitación
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A857C]">
          Para mesas de coordinación: evidencia cómo el registro municipal exige responsable asignado y constancia mínima en la bitácora antes de cerrar la ruta del mes,
          sin alterar los datos operativos ya capturados en el simulador.
        </p>
        <label className="mt-3 flex items-start gap-2 text-[12px] text-[#6B6760]">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={blockedDemo}
            onChange={event => setBlockedDemo(event.target.checked)}
          />
          <span>
            Ejercitar registro con responsable vacío y sin constancias en bitácora (respuesta institucional para capacitación).
          </span>
        </label>
      </details>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !plan && <EmptyState />}
      {!loading && !error && plan?.status === 'blocked' && <BlockedState plan={plan} />}
      {!loading && !error && plan && plan.status !== 'blocked' && <PlanState plan={plan} />}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
      Construyendo rutas PER y bitácora mensual.
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Selecciona municipio activo para preparar rutas y bitácora.
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

function BlockedState({ plan }: { plan: PerOperationsPlan }) {
  return (
    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">
        <Lock className="mr-2 inline h-4 w-4" />
        Bitácora municipal incompleta: falta responsable o constancia mínima en el registro
      </p>
      {plan.blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{plan.next_action}</p>
    </div>
  )
}

function PlanState({ plan }: { plan: PerOperationsPlan }) {
  return (
    <div className="space-y-4">
      {plan.warnings.map(warning => (
        <div key={warning} className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {warning}
        </div>
      ))}

      <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4">
        <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">Indicador mensual</p>
        <p className="mt-1 font-mono text-[30px] text-[#1C1B18]">{plan.monthly_visits_estimate.toFixed(1)} {plan.unit}</p>
        <p className="mt-2 text-[12px] text-[#6B6760]">
          <Info className="mr-1 inline h-4 w-4" />
          {plan.metric_help_text}
        </p>
        <p className="mt-2 text-[12px] text-[#6B6760]">{plan.per_help_text}</p>
      </div>

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">
          <Truck className="mr-2 inline h-4 w-4" />
          Rutas operativas
        </p>
        <div className="mt-3 space-y-3">
          {plan.routes.map(route => (
            <div key={route.route_id} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
              <p className="text-[12px] font-semibold text-[#1C1B18]">{route.route_id} · {route.municipio_id} · {route.zona_id}</p>
              <p className="mt-1 text-[12px] text-[#6B6760]">{route.frecuencia} · {route.camion_unidad} · {route.ventana_temporal}</p>
              <p className="mt-1 text-[12px] text-[#6B6760]">Responsable: {route.responsable}</p>
              <p className="mt-2 text-[12px] text-[#6B6760]">Colonias: {route.colonias.join(', ')}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <PerBox label="Presión" value={route.per.presion} />
                <PerBox label="Estado" value={route.per.estado} />
                <PerBox label="Respuesta" value={route.per.respuesta} />
              </div>
              <p className="mt-2 text-[11px] text-[#8A857C]">{route.per.human_explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <EditorialTimeline
        kicker="S22 · Bitácora PER"
        title="Hitos operativos del mes"
        milestones={plan.log_events.map<TimelineMilestone>(event => ({
          id: event.event_id,
          label: event.fecha,
          title: event.event_type.replace(/_/g, ' '),
          value: `${event.route_or_zone_id} · ${event.municipio_id}`,
          note: `Actor: ${event.actor_responsable || '—'} · Acción siguiente: ${event.accion_siguiente}`,
          tone: event.evidencia.length === 0 ? 'warning' : 'positive',
        }))}
      />

      <NarrativeBridge
        kicker="S22 · Lectura del PER"
        variant={plan.warnings.length > 0 ? 'warning' : 'result'}
        summary={`El plan estima ${plan.monthly_visits_estimate.toFixed(1)} ${plan.unit} mensuales con ${plan.routes.length} ruta(s) declaradas. Cada hito en la bitácora vincula evidencia operativa con la presión-estado-respuesta del PER.`}
        evidence={[
          { label: 'Visitas/mes', value: `${plan.monthly_visits_estimate.toFixed(1)} ${plan.unit}` },
          { label: 'Rutas', value: String(plan.routes.length) },
          { label: 'Eventos', value: String(plan.log_events.length) },
          { label: 'Advertencias', value: String(plan.warnings.length) },
        ]}
        source={{ fuente: 'PER ALQUIMIA', incertidumbre: 'Confianza ~0.61 mientras la bitácora no se valide en campo.' }}
        nextStep={{ label: 'Sube evidencia operativa para fortalecer la bitácora' }}
      />

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Anexo de cálculos</p>
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

function PerBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] bg-white p-2">
      <p className="text-[11px] font-semibold text-[#1C1B18]">{label}</p>
      <p className="mt-1 text-[11px] text-[#6B6760]">{value}</p>
    </div>
  )
}
