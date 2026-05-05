'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calculator, Info, Lock, RefreshCw } from 'lucide-react'
import { calculateDomesticEducation } from '@/lib/api'
import type {
  DomesticEducationResult,
  HouseholdEducationRequest,
  HouseholdPropertyType,
} from '@/types'
import { cn } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

const PROPERTY_OPTIONS: Array<{ key: HouseholdPropertyType; label: string }> = [
  { key: 'casa', label: 'Casa' },
  { key: 'edificio', label: 'Edificio' },
  { key: 'condominio', label: 'Condominio' },
  { key: 'residencial', label: 'Residencial' },
]

const DEFAULT_SOURCE = {
  source_id: 'semarnat-dbgir-generacion-percapita-mx',
  name: 'Generacion per capita de RSU en Mexico',
  organization: 'SEMARNAT DBGIR',
  source_type: 'referencia_oficial_contextual',
  unit: 'kg/persona/dia',
  confidence: 0.72,
  explanation: 'Referencia nacional inicial; debe reemplazarse por dato municipal medido cuando exista.',
}

export function EducacionCiudadana() {
  const [propertyType, setPropertyType] = useState<HouseholdPropertyType>('casa')
  const [householdMembers, setHouseholdMembers] = useState(4)
  const [days, setDays] = useState(7)
  const [generation, setGeneration] = useState(0.94)
  const [result, setResult] = useState<DomesticEducationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedDemo, setBlockedDemo] = useState(false)

  const payload: HouseholdEducationRequest = useMemo(() => ({
    property_type: propertyType,
    household_members: blockedDemo ? null : householdMembers,
    days,
    generation_kg_per_person_day: generation,
    source: DEFAULT_SOURCE,
  }), [blockedDemo, days, generation, householdMembers, propertyType])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    calculateDomesticEducation(payload)
      .then(data => {
        if (!cancelled) setResult(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setResult(null)
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
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">S12.1 — Educación ciudadana</p>
        <h2 className="mt-2 font-serif text-[24px] text-[#1C1B18]">Calculadora doméstica de separación</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
          Estima el RSU doméstico de un hogar y traduce el resultado en contenedores y hábitos sencillos. No incluye residuos peligrosos, especiales o regulados.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {PROPERTY_OPTIONS.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPropertyType(option.key)}
            className={cn(
              'rounded-[8px] border px-3 py-3 text-left text-[12px] transition-colors',
              propertyType === option.key
                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C8C2B8]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block rounded-[8px] border border-[#E8E4DC] bg-white p-3">
          <span className="text-[11px] font-semibold text-[#1C1B18]">Personas en el hogar</span>
          <input
            type="number"
            min={1}
            max={20}
            value={householdMembers}
            onChange={event => setHouseholdMembers(Number(event.target.value))}
            className="mt-2 w-full rounded-[6px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
            disabled={blockedDemo}
          />
        </label>
        <label className="block rounded-[8px] border border-[#E8E4DC] bg-white p-3">
          <span className="text-[11px] font-semibold text-[#1C1B18]">Días a estimar</span>
          <input
            type="number"
            min={1}
            max={31}
            value={days}
            onChange={event => setDays(Number(event.target.value))}
            className="mt-2 w-full rounded-[6px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
          />
        </label>
        <label className="block rounded-[8px] border border-[#E8E4DC] bg-white p-3">
          <span className="text-[11px] font-semibold text-[#1C1B18]">kg por persona al día</span>
          <input
            type="number"
            min={0.1}
            max={3}
            step={0.01}
            value={generation}
            onChange={event => setGeneration(Number(event.target.value))}
            className="mt-2 w-full rounded-[6px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
          />
        </label>
      </div>

      <details className="rounded-[8px] border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-[#1C1B18]">
          Opciones para capacitación · no sustituyen evidencia municipal
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A857C]">
          Úsalas solo en talleres o inductores: muestran cómo el modelo exige datos completos y qué responde el sistema cuando faltan,
          sin reemplazar registro ciudadano ni medición en campo.
        </p>
        <label className="mt-3 flex items-start gap-2 text-[12px] text-[#6B6760]">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={blockedDemo}
            onChange={event => setBlockedDemo(event.target.checked)}
          />
          <span>
            Ejercitar escenario incompleto sin personas en el hogar declaradas; el servicio acota la respuesta según política municipal.
          </span>
        </label>
      </details>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState />}
      {!loading && !error && result?.status === 'blocked' && <BlockedState result={result} />}
      {!loading && !error && result && result.status !== 'blocked' && (
        <ResultState result={result} generationKgPerPersonDay={generation} />
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
      Calculando generación doméstica y recomendaciones trazables.
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Captura tipo de predio y personas para ver la guía ciudadana.
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

function BlockedState({ result }: { result: DomesticEducationResult }) {
  return (
    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">
        <Lock className="mr-2 inline h-4 w-4" />
        Calculadora bloqueada
      </p>
      <p className="mt-2 text-[13px] text-amber-900">{result.result_help_text}</p>
      {result.blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{result.next_action}</p>
    </div>
  )
}

function ResultState({ result, generationKgPerPersonDay }: { result: DomesticEducationResult; generationKgPerPersonDay: number }) {
  const total = result.total_generation_kg ?? 0
  const maxKg = Math.max(...result.categories.map(category => category.estimated_kg_period), 1)
  const topCat =
    result.categories.length > 0
      ? result.categories.reduce(
          (best, c) => (c.estimated_kg_period > best.estimated_kg_period ? c : best),
          result.categories[0],
        )
      : { label: 'Sin categorías', estimated_kg_period: 0, key: '', container_guidance: '', why_it_matters: '' }

  return (
    <div className="space-y-4">
      {result.warnings.map(warning => (
        <div key={warning} className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {warning}
        </div>
      ))}

      <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">Resultado estimado</p>
            <p className="mt-1 font-mono text-[30px] text-[#1C1B18]">{total.toFixed(1)} kg</p>
            <p className="text-[12px] text-[#6B6760]">en {result.days} días</p>
          </div>
          <div className="max-w-md rounded-[8px] bg-[#F8F6F1] px-3 py-2 text-[12px] leading-relaxed text-[#6B6760]">
            <Info className="mr-1 inline h-4 w-4" />
            {result.result_help_text}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Qué separar y dónde ponerlo</p>
        <p className="mt-1 text-[12px] text-[#6B6760]">{result.chart_help_text}</p>
        <div className="mt-4 space-y-3">
          {result.categories.map(category => (
            <div key={category.key}>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-[#1C1B18]">{category.label}</span>
                <span className="font-mono text-[#3B6D11]">{category.estimated_kg_period.toFixed(1)} kg</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[#EEE9DF]">
                <div
                  className="h-2 rounded-full bg-[#3B6D11]"
                  style={{ width: `${Math.max(4, (category.estimated_kg_period / maxKg) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[12px] text-[#6B6760]">{category.container_guidance}</p>
              <p className="mt-1 text-[11px] text-[#8A857C]">{category.why_it_matters}</p>
            </div>
          ))}
        </div>
      </div>

      {result.recommendation && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[13px] font-semibold text-[#1C1B18]">{result.recommendation.title}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">{result.recommendation.why}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Separar</p>
              <ul className="mt-1 space-y-1 text-[12px] text-[#6B6760]">
                {result.recommendation.what_to_separate.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Colocar</p>
              <ul className="mt-1 space-y-1 text-[12px] text-[#6B6760]">
                {result.recommendation.where_to_place.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-3 rounded-[6px] bg-[#F8F6F1] px-3 py-2 text-[12px] text-[#6B6760]">
            {result.recommendation.not_legal_obligation}
          </p>
        </div>
      )}

      <NarrativeBridge
        kicker="S22 · Lectura ciudadana del RSU doméstico"
        variant="result"
        summary={`Tu hogar proyectó ${total.toFixed(1)} kg en ${result.days} días (${(total / Math.max(result.days, 1)).toFixed(2)} kg/día equivalentes). La fracción dominante (${topCat.label}) concentra la mayor parte del volumen; separarla bien reduce lo que termina en disposición final y alinea tu hábito con la meta municipal de captura.`}
        evidence={[
          { label: 'Total periodo', value: `${total.toFixed(1)} kg` },
          { label: 'Días', value: String(result.days) },
          { label: 'Mayor fracción', value: `${topCat.label} · ${topCat.estimated_kg_period.toFixed(1)} kg` },
          { label: 'Supuesto base', value: `${generationKgPerPersonDay} kg/p/d` },
        ]}
        source={{
          fuente: `${DEFAULT_SOURCE.organization} — ${DEFAULT_SOURCE.name}`,
          unidad: 'kg',
          incertidumbre: 'Referencia nacional; sustituir con medición municipal cuando exista.',
        }}
        nextStep={{ label: 'Abre el anexo de cálculos trazables' }}
      />

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">
          <Calculator className="mr-2 inline h-4 w-4" />
          Anexo de cálculos
        </p>
        <div className="mt-3 space-y-3">
          {result.calculation_annex.map(item => (
            <div key={`${item.calculation_name}-${item.result}`} className="rounded-[6px] bg-[#F8F6F1] p-3 text-[12px] text-[#6B6760]">
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
