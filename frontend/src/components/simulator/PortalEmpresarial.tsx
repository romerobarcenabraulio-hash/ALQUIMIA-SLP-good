'use client'

import { Fragment, useMemo, useState } from 'react'
import { getOrganizationalAssessment } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type {
  OrganizationActivityType,
  OrganizationalCircularityRequest,
  OrganizationalCircularityResponse,
} from '@/types'

const ACTIVITY_OPTIONS: Array<{ value: OrganizationActivityType; label: string }> = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'zona_turistica', label: 'Zona turística' },
]

const CAUSAL_STEPS = [
  'Tipo de actividad',
  'Flujos RSU/no-RSU',
  'Plan de contenedores',
  'Acciones 30/60/90',
  'Proveedor / validación',
]

export function PortalEmpresarial() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipioId = municipiosActivos[0] ?? ''

  const [activityType, setActivityType] = useState<OrganizationActivityType | ''>('')
  const [organizationName, setOrganizationName] = useState('')
  const [empleados, setEmpleados] = useState(40)
  const [variables, setVariables] = useState<Record<string, string | number | boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OrganizationalCircularityResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<OrganizationalCircularityRequest | null>(null)

  const isEmpty = !activityType

  const activityFields = useMemo(() => {
    switch (activityType) {
      case 'hotel':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <NumericField label="Habitaciones" onChange={v => setVariables(p => ({ ...p, habitaciones: v }))} />
            <NumericField label="Ocupación %" onChange={v => setVariables(p => ({ ...p, ocupacion_pct: v }))} />
          </div>
        )
      case 'hospital':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <NumericField label="Camas" onChange={v => setVariables(p => ({ ...p, camas: v }))} />
            <NumericField label="Consultas día" onChange={v => setVariables(p => ({ ...p, consultas_dia: v }))} />
            <BooleanField
              label="Residuos regulados"
              onChange={v => setVariables(p => ({ ...p, tiene_residuos_regulados: v }))}
            />
          </div>
        )
      case 'empresa':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <NumericField label="Turnos" onChange={v => setVariables(p => ({ ...p, turnos: v }))} />
            <BooleanField
              label="Residuos mixtos"
              onChange={v => setVariables(p => ({ ...p, residuos_mixtos: v }))}
            />
          </div>
        )
      case 'universidad':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <NumericField label="Estudiantes" onChange={v => setVariables(p => ({ ...p, estudiantes: v }))} />
            <NumericField label="Cafeterías" onChange={v => setVariables(p => ({ ...p, cafeterias: v }))} />
          </div>
        )
      case 'zona_turistica':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <NumericField label="Visitantes día" onChange={v => setVariables(p => ({ ...p, visitantes_dia: v }))} />
            <BooleanField
              label="Temporada alta"
              onChange={v => setVariables(p => ({ ...p, temporada_alta: v }))}
            />
          </div>
        )
      default:
        return null
    }
  }, [activityType])

  async function runAssessment(payload: OrganizationalCircularityRequest) {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrganizationalAssessment(payload)
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Incidencia operativa al evaluar circularidad organizacional')
    } finally {
      setLoading(false)
    }
  }

  async function handleEvaluate() {
    if (!activityType) return
    const payload: OrganizationalCircularityRequest = {
      organization_id: `org-${Date.now()}`,
      tipo_actividad: activityType,
      municipio_id: municipioId,
      nombre: organizationName.trim() || 'Organización sin nombre',
      empleados,
      variables,
    }
    setLastPayload(payload)
    await runAssessment(payload)
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <div>
        <h1 className="font-serif text-[24px] text-[#1C1B18]">Evaluación de circularidad organizacional · propuesta</h1>
        <p className="mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-900">
          Orientación no oficial — requiere validación municipal
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
          {CAUSAL_STEPS.map((step, i, arr) => (
            <Fragment key={step}>
              <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
              {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
            </Fragment>
          ))}
        </div>
        <aside className="mt-4 rounded-[12px] border border-[#C9DDB1] bg-[#F7FAF3] px-3 py-3 text-[12px] leading-relaxed text-[#3F4D38]">
          <p className="font-medium text-[#23470A]">Reforma en modelo ALQUIMIA (predios y empresas)</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 marker:text-[#3B6D11]">
            <li>
              <strong>Predios:</strong> acopio de RSU o microrvertedero sin permiso municipal equivaldría a operación
              tipo Centro de Acopio clandestino; la propuesta normativa prevé orden de saneamiento y sanciones al titular.
            </li>
            <li>
              <strong>Empresas y grandes generadores:</strong> declaración o registro anual de corrientes y volúmenes,
              alineado al mismo tipo de información que exige el permiso de Centro de Acopio — este portal ayuda a
              dimensionar flujos; el trámite oficial sigue siendo competencia del municipio.
            </li>
          </ul>
        </aside>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {ACTIVITY_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActivityType(option.value)}
            className={`rounded-lg border px-3 py-2 text-left text-[12px] ${
              activityType === option.value
                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                : 'border-[#E8E4DC] bg-white text-[#6B6760]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={organizationName}
          onChange={e => setOrganizationName(e.target.value)}
          className="rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
          placeholder="Nombre de la organización"
        />
        <input
          type="number"
          min={1}
          value={empleados}
          onChange={e => setEmpleados(Number(e.target.value) || 0)}
          className="rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
          placeholder="Empleados"
        />
      </div>

      {activityFields}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={!activityType || loading}
          className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Evaluando...' : 'Evaluar organización'}
        </button>
        {error && lastPayload && (
          <button
            type="button"
            onClick={() => runAssessment(lastPayload)}
            className="rounded-lg border border-[#E8E4DC] px-4 py-2 text-[12px] text-[#1C1B18]"
          >
            Reintentar
          </button>
        )}
      </div>

      {loading && <LoadingState />}
      {!loading && isEmpty && <EmptyState />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && result?.status === 'blocked' && <BlockedState result={result} />}
      {!loading && result && result.status !== 'blocked' && <ReadyState result={result} />}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
          <div className="h-3 w-3/4 rounded bg-[#E8E4DC]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
          <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Selecciona tipo de organización para comenzar.
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
      {message}
    </div>
  )
}

function BlockedState({ result }: { result: OrganizationalCircularityResponse }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">Evaluación bloqueada</p>
      {result.blockers.map(b => (
        <p key={b} className="mt-1 text-[12px] text-amber-800">{b}</p>
      ))}
      <p className="mt-2 text-[12px] text-[#6B6760]">{result.next_action}</p>
    </div>
  )
}

function ReadyState({ result }: { result: OrganizationalCircularityResponse }) {
  const isWarning = result.status === 'warning' || result.warnings.length > 0
  return (
    <div className="space-y-4">
      {isWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          {result.warnings.map(w => <p key={w}>{w}</p>)}
        </div>
      )}

      {result.proveedor_ambiental_requerido && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900">
          Esta organización requiere proveedor ambiental autorizado para residuos no-RSU. ALQUIMIA no gestiona su contratación.
        </div>
      )}

      <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Flujos de residuos (RSU vs no-RSU)</p>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.waste_streams.map(stream => (
            <div
              key={`${stream.material}-${stream.es_rsu}`}
              className={`rounded-lg border p-2 text-[12px] ${
                stream.es_rsu ? 'border-emerald-200 bg-emerald-50' : 'border-amber-300 bg-amber-50'
              }`}
            >
              <p className="font-semibold text-[#1C1B18]">{stream.material}</p>
              <p>{stream.estimacion_ton_dia.toFixed(3)} ton/día · {stream.es_rsu ? 'RSU' : 'no-RSU'}</p>
              {!stream.es_rsu && <p>{stream.advertencia}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Plan de contenedores por zona interna</p>
        <div className="mt-2 space-y-2 text-[12px] text-[#6B6760]">
          {result.container_plan.map(plan => (
            <div key={`${plan.zona_interna}-${plan.tipo_contenedor}`} className="rounded border border-[#F0EDE5] p-2">
              <p className="font-semibold text-[#1C1B18]">{plan.zona_interna}</p>
              <p>{plan.tipo_contenedor} · {plan.cantidad} contenedor(es)</p>
              <p>{plan.frecuencia_recoleccion} · {plan.nota}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Acciones 30/60/90</p>
        <div className="mt-2 space-y-2 text-[12px] text-[#6B6760]">
          {result.acciones_30_60_90.map(action => (
            <div key={action.plazo} className="rounded border border-[#F0EDE5] p-2">
              <p className="font-semibold text-[#1C1B18]">{action.plazo}</p>
              <p>{action.accion}</p>
              <p>Responsable: {action.responsable}</p>
              <p>Impacto esperado: {action.impacto_esperado}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#DAD3C7] bg-white p-3 text-[12px] text-[#6B6760]">
        <p className="font-semibold text-[#1C1B18]">Cálculo de generación</p>
        <p>Fórmula: {result.calculo_generacion.formula}</p>
        <p>Fuente: {result.calculo_generacion.fuente_factor} · Unidad: {result.calculo_generacion.unidad}</p>
        <p>
          Rango de incertidumbre: {result.calculo_generacion.incertidumbre_rango[0]} a {result.calculo_generacion.incertidumbre_rango[1]} ton/día
        </p>
        <p>{result.calculo_generacion.explicacion}</p>
      </div>
    </div>
  )
}

function NumericField({ label, onChange }: { label: string; onChange: (value: number) => void }) {
  return (
    <label className="block text-[13px] text-[#6B6860] mb-1">
      {label}
      <input
        type="number"
        min={0}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
      />
    </label>
  )
}

function BooleanField({ label, onChange }: { label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-[#6B6860] mb-1">
      <input type="checkbox" onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
