'use client'

import { Fragment, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { compareScenarios } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { useDataPermissions } from '@/hooks/useDataPermissions'
import type { ComparadorResponse } from '@/types'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

type ScenarioRow = {
  id: string
  nombre: string
  generacion_ton_dia: number
  tasa_circularidad_pct: number
  brecha_infraestructura_ton_dia: number
  num_centros_acopio: number
  num_macrogeneradores: number
  estado_legal: string
}

const FLOW = [
  'Definir escenarios',
  'Calcular score por escenario',
  'Comparar deltas',
  'Identificar escenario óptimo',
]

function createRow(index: number): ScenarioRow {
  return {
    id: `esc-${Date.now()}-${index}`,
    nombre: `Escenario ${index + 1}`,
    generacion_ton_dia: 10,
    tasa_circularidad_pct: index === 0 ? 8 : 12,
    brecha_infraestructura_ton_dia: index === 0 ? 2 : 0,
    num_centros_acopio: index === 0 ? 0 : 1,
    num_macrogeneradores: 2,
    estado_legal: index === 0 ? 'sin_gate' : 'gate_activo',
  }
}

export function ComparadorEscenarios() {
  const municipio = useSimulatorStore(s => s.municipiosActivos[0] ?? '')
  const { canCreateScenario } = useDataPermissions()
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([createRow(0), createRow(1)])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComparadorResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const canAdd = scenarios.length < 5
  const emptyState = !loading && !result && !error

  const payload = useMemo(
    () => ({
      municipio_id: municipio,
      escenarios: scenarios.map(s => ({
        nombre: s.nombre,
        generacion_ton_dia: s.generacion_ton_dia,
        tasa_circularidad_pct: s.tasa_circularidad_pct,
        brecha_infraestructura_ton_dia: s.brecha_infraestructura_ton_dia,
        num_centros_acopio: s.num_centros_acopio,
        num_macrogeneradores: s.num_macrogeneradores,
        estado_legal: s.estado_legal,
      })),
    }),
    [municipio, scenarios],
  )

  function updateRow(id: string, patch: Partial<ScenarioRow>) {
    setScenarios(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addRow() {
    if (!canAdd) return
    setScenarios(prev => [...prev, createRow(prev.length)])
  }

  function removeRow(id: string) {
    if (scenarios.length <= 2) return
    setScenarios(prev => prev.filter(row => row.id !== id))
  }

  async function run(nextPayload: object) {
    setLoading(true)
    setError(null)
    try {
      const data = await compareScenarios(nextPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al comparar escenarios')
    } finally {
      setLoading(false)
    }
  }

  async function onCompare() {
    setLastPayload(payload)
    await run(payload)
  }

  if (!canCreateScenario) {
    return (
      <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
        <h2 className="font-serif text-[24px] text-[#1C1B18]">
          Comparador de escenarios municipales
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Acceso restringido</p>
            <p className="mt-1 text-sm text-amber-800">
              No tienes permisos para crear o modificar escenarios. Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h2 className="font-serif text-[24px] text-[#1C1B18]">
        Comparador de escenarios municipales · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h2>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {FLOW.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mb-6 space-y-2 rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Escenarios</p>
          <button
            type="button"
            onClick={addRow}
            disabled={!canAdd}
            className="rounded border border-[#DAD5CA] bg-white px-3 py-1 text-[11px] disabled:opacity-50"
          >
            Agregar escenario
          </button>
        </div>
        <div className="space-y-2">
          {scenarios.map(row => (
            <div key={row.id} className="grid grid-cols-1 lg:grid-cols-7 gap-2 rounded border border-[#E8E4DC] bg-white p-2">
              <input
                type="text"
                value={row.nombre}
                onChange={e => updateRow(row.id, { nombre: e.target.value })}
                className="rounded border border-[#E8E4DC] px-2 py-1 text-[12px]"
                placeholder="Nombre"
              />
              <Numeric label="t/día" value={row.generacion_ton_dia} onChange={v => updateRow(row.id, { generacion_ton_dia: v })} />
              <Numeric label="Tasa %" value={row.tasa_circularidad_pct} onChange={v => updateRow(row.id, { tasa_circularidad_pct: v })} />
              <Numeric
                label="Brecha t/día"
                value={row.brecha_infraestructura_ton_dia}
                onChange={v => updateRow(row.id, { brecha_infraestructura_ton_dia: v })}
              />
              <Numeric label="Centros" value={row.num_centros_acopio} onChange={v => updateRow(row.id, { num_centros_acopio: Math.max(0, Math.round(v)) })} />
              <select
                value={row.estado_legal}
                onChange={e => updateRow(row.id, { estado_legal: e.target.value })}
                className="rounded border border-[#E8E4DC] px-2 py-1 text-[12px]"
              >
                <option value="sin_gate">Fuente en revisión</option>
                <option value="gate_activo">Alcance revisado</option>
                <option value="sancion_propuesta">Sanción propuesta</option>
              </select>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={scenarios.length <= 2}
                className="rounded border border-[#E8E4DC] px-2 py-1 text-[12px] text-[#6B6760] disabled:opacity-40"
                aria-label={`Eliminar ${row.nombre}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onCompare}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Comparando escenarios...' : 'Comparar escenarios'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 bg-[#E8E4DC] rounded w-4/5" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-2/3" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {emptyState && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Agrega al menos 2 escenarios para iniciar la comparación.
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
          <div className="overflow-x-auto rounded-lg border border-[#E8E4DC]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#FAF8F4]">
                <tr>
                  <Th>Escenario</Th>
                  <Th>Score</Th>
                  <Th>Tasa %</Th>
                  <Th>Brecha t/día</Th>
                  <Th>Alcance legal</Th>
                  <Th>Delta Score vs Base</Th>
                </tr>
              </thead>
              <tbody>
                {result.escenarios.map(esc => (
                  <tr key={esc.nombre} className={esc.es_ganador ? 'bg-[#EAF8E3]' : 'bg-white'}>
                    <Td>
                      {esc.nombre}{' '}
                      {esc.es_ganador && (
                        <span className="ml-1 rounded-full bg-[#2D7A0A] px-2 py-0.5 text-[10px] text-white">Ganador</span>
                      )}
                    </Td>
                    <Td>{esc.score_circularidad.toFixed(1)}</Td>
                    <Td>{esc.tasa_circularidad_pct.toFixed(1)}</Td>
                    <Td>{esc.brecha_ton_dia.toFixed(1)}</Td>
                    <Td>{legalScopeLabel(esc.kpi_resumen.legal ?? 'sin_gate')}</Td>
                    <Td>{(esc.diferencia_vs_base.score ?? 0).toFixed(1)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-[#FAF8F4] p-4 font-serif text-[15px] text-[#1C1B18]">
            {result.resumen_comparativo}
          </div>

          {(() => {
            const ganador = result.escenarios.find(e => e.es_ganador) ?? result.escenarios[0]
            const base = result.escenarios[0]
            const delta = ganador?.diferencia_vs_base?.score ?? 0
            return ganador && base ? (
              <NarrativeBridge
                variant={delta > 0 ? 'result' : 'bridge'}
                summary={delta > 0
                  ? `El escenario "${ganador.nombre}" supera al base ("${base.nombre}") por ${delta.toFixed(1)} puntos de score y mueve la tasa de circularidad de ${base.tasa_circularidad_pct.toFixed(1)}% a ${ganador.tasa_circularidad_pct.toFixed(1)}%. Es la opción a recomendar formalmente.`
                  : `Los escenarios analizados están dentro de un margen estrecho (Δ ≤ ${Math.abs(delta).toFixed(1)} pts). Antes de elegir, revisa alcance legal y brecha de infraestructura.`}
                evidence={[
                  { label: 'Ganador', value: ganador.nombre },
                  { label: 'Score', value: ganador.score_circularidad.toFixed(1) },
                  { label: 'Tasa', value: `${ganador.tasa_circularidad_pct.toFixed(1)}%` },
                  { label: 'Δ vs base', value: delta.toFixed(1) },
                ]}
                source={{ fuente: 'Comparador ALQUIMIA', incertidumbre: 'Score depende de calidad de inputs municipales.' }}
                nextStep={{ label: 'Documenta el escenario ganador en exportables' }}
              />
            ) : null
          })()}

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

function Numeric({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <input
      aria-label={label}
      type="number"
      min={0}
      step={0.1}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="rounded border border-[#E8E4DC] px-2 py-1 text-[12px]"
      placeholder={label}
    />
  )
}

function legalScopeLabel(value: string): string {
  switch (value) {
    case 'gate_activo':
      return 'Alcance revisado'
    case 'sancion_propuesta':
      return 'Sanción propuesta'
    case 'sin_gate':
      return 'Fuente en revisión'
    default:
      return value
  }
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">{children}</th>
}

function Td({ children }: { children: ReactNode }) {
  return <td className="border-t border-[#F0EDE5] px-3 py-2 text-[#1C1B18]">{children}</td>
}
