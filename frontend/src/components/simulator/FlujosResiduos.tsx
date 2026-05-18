'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { COMPOSICION_RSU_DETALLE } from '@/lib/constants'
import { diagnosisWasteFlows } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { DiagnosticoCircularidadResponse } from '@/types'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { FlujosSankey, type SankeyLink, type SankeyNode } from '@/components/simulator/FlujosSankey'
import { ParamsLockedNotice } from '@/components/simulator/ParamsLockedNotice'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

const STEPS = [
  'RSU generado',
  'Corrientes por tipo',
  'Destino actual',
  'Captura RSU',
  'Circularidad real',
]

function mixDesdePlanGlobal(): Record<string, number> {
  const d = COMPOSICION_RSU_DETALLE
  return {
    organico: d.organico.pct,
    papel: d.papel.pct,
    plastico: d.plastico.pct,
    vidrio: d.vidrio.pct,
    metal: d.metales.pct,
    otro: d.otros.pct,
  }
}

export function FlujosResiduos() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const resultados = useSimulatorStore(s => s.resultados)
  const macroImpactSummary = useSimulatorStore(s => s.macroImpactSummary)
  const municipioId = municipiosActivos[0] ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosticoCircularidadResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const tasaRecuperacion = Math.min(99, Math.max(0, circularityBaseline?.current_circularity_pct ?? 18))

  const payload = useMemo(() => {
    if (!municipioId || !resultados) return null
    return {
      municipio_id: municipioId,
      generacion_total_ton_dia: resultados.rsuTotalTonDia,
      mix_corrientes: mixDesdePlanGlobal(),
      infraestructura_actual: ['centro_pequeno'],
      tasa_recuperacion_actual_pct: tasaRecuperacion,
    }
  }, [municipioId, resultados, tasaRecuperacion])

  const payloadKey = useMemo(() => (payload ? JSON.stringify(payload) : ''), [payload])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    if (!payload) return
    let active = true
    setLoading(true)
    setLastPayload(payload)
    void diagnosisWasteFlows(payload)
      .then(data => {
        if (!active) return
        setResult(data)
        setError(null)
      })
      .catch(e => {
        if (!active) return
        setResult(null)
        setError(e instanceof Error ? e.message : 'Incidencia operativa en diagnóstico de flujos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [payloadKey])

  async function retry() {
    if (!lastPayload) return
    setLoading(true)
    setError(null)
    try {
      const data = await diagnosisWasteFlows(lastPayload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa en diagnóstico de flujos')
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !loading && !error && !result && payload === null

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h2 className="font-serif text-[24px] text-[#1C1B18]">
        Flujos de residuos y cierre de ciclo · <span className="text-[14px] text-[#6B6760]">propuesta</span>
      </h2>
      <ScopeAnclaKicker className="mt-2" />

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {STEPS.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <ParamsLockedNotice />
      {macroImpactSummary?.warnings?.length ? (
        <p className="text-[11px] text-[#8A857C]">
          Contexto macros: <span className="font-medium text-[#6B6760]">{macroImpactSummary.generators_count}</span>{' '}
          generadores modelados para la misma ZM.
        </p>
      ) : null}

      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 w-3/4 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Cuando existan resultados del simulador principal, aquí aparecerá el diagnóstico con la generación RSU global y la
          composición fija ALQUIMIA.
        </div>
      )}

      {error && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p>{error}</p>
          {lastPayload && (
            <button
              type="button"
              onClick={() => void retry()}
              className="rounded-lg border border-red-300 bg-white px-3 py-1 text-[12px]"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {result?.status === 'blocked' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[12px] text-amber-900">
          <p className="font-semibold">Diagnóstico bloqueado</p>
          {result.blockers.map(b => (
            <p key={b}>{b}</p>
          ))}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Chip title="% Circularidad real actual" value={`${result.tasa_circularidad_actual_pct.toFixed(2)}%`} />
            <Chip title="% Circularidad real potencial" value={`${result.tasa_circularidad_potencial_pct.toFixed(2)}%`} />
            <Chip
              title="Oportunidad MXN/año"
              value={`$${result.brecha.oportunidad_ingreso_estimado_mxn.toLocaleString('es-MX')}`}
            />
          </div>
          <p className="text-[11px] text-[#6B6760]">
            Definiciones: <strong className="text-[#1C1B18]">% RSU capturado</strong> = RSU capturado valorizable / RSU generado total.{' '}
            <strong className="text-[#1C1B18]">% Circularidad real</strong> = RSU valorizado real / RSU generado total.
          </p>

          <FlujosSankey title="Diagnóstico de flujos · Sankey" nodes={buildDiagnosticoNodes(result)} links={buildDiagnosticoLinks(result)} />

          <NarrativeBridge
            kicker="S22 · Lectura del diagnóstico"
            variant={result.brecha.porcentaje_recuperable_no_capturado > 30 ? 'warning' : 'result'}
            summary={`La circularidad real estimada hoy es ${result.tasa_circularidad_actual_pct.toFixed(1)}% y el potencial técnico llega a ${result.tasa_circularidad_potencial_pct.toFixed(1)}%. Las pérdidas recuperables suman ${result.brecha.toneladas_recuperables_perdidas.toFixed(1)} t/día y representan una oportunidad anual de $${result.brecha.oportunidad_ingreso_estimado_mxn.toLocaleString('es-MX')} MXN.`}
            evidence={[
              { label: 'Circularidad real actual', value: `${result.tasa_circularidad_actual_pct.toFixed(1)}%` },
              { label: 'Circularidad real potencial', value: `${result.tasa_circularidad_potencial_pct.toFixed(1)}%` },
              { label: 'Recuperable perdido', value: `${result.brecha.toneladas_recuperables_perdidas.toFixed(1)} t/día` },
              { label: 'Oportunidad', value: `$${(result.brecha.oportunidad_ingreso_estimado_mxn / 1_000_000).toFixed(1)} M MXN/año` },
            ]}
            source={{ fuente: result.brecha.fuente_factor, unidad: 't/día · MXN/año', incertidumbre: '±30% en recuperables perdidos.' }}
            nextStep={{ label: 'Activa las acciones prioritarias' }}
          />

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#1C1B18]">Flujos por corriente</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#E8E4DC] text-[#6B6760]">
                    <th className="py-2 text-left">Corriente</th>
                    <th className="py-2 text-left">t/día</th>
                    <th className="py-2 text-left">Destino</th>
                    <th className="py-2 text-left">Recuperable</th>
                    <th className="py-2 text-left">Advertencia</th>
                  </tr>
                </thead>
                <tbody>
                  {result.flujos.map(f => (
                    <tr
                      key={`${f.nombre}-${f.destino}`}
                      className={`border-b border-[#F0EDE5] ${
                        f.destino === 'disposicion_irregular'
                          ? 'bg-amber-50'
                          : f.es_recuperable
                            ? 'bg-emerald-50'
                            : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-2">{f.nombre}</td>
                      <td className="py-2">{f.toneladas_dia.toFixed(3)}</td>
                      <td className="py-2">{f.destino}</td>
                      <td className="py-2">{f.es_recuperable ? 'Sí' : 'No'}</td>
                      <td className="py-2">{f.advertencia ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-[#DAD3C7] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#1C1B18]">Brecha de recuperación</p>
            <p className="mt-1 text-[12px] text-[#6B6760]">
              Recuperables perdidos: {result.brecha.toneladas_recuperables_perdidas.toFixed(3)} ton/día · No capturado:{' '}
              {result.brecha.porcentaje_recuperable_no_capturado.toFixed(2)}%
            </p>
            <div className="mt-2 rounded border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-[12px] text-[#6B6760]">
              <p className="font-semibold text-[#1C1B18]">Trazabilidad del cálculo</p>
              <p>Fórmula: {result.brecha.formula}</p>
              <p>Fuente: {result.brecha.fuente_factor}</p>
              <p>Incertidumbre: usar ±30% sobre toneladas recuperables perdidas.</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#1C1B18]">Acciones prioritarias</p>
            <ul className="mt-2 space-y-1 text-[12px] text-[#6B6760]">
              {result.acciones_prioritarias.map(action => (
                <li key={action}>• {action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function Chip({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <p className="text-[11px] text-[#6B6760]">{title}</p>
      <p className="text-[14px] font-semibold text-[#1C1B18]">{value}</p>
    </div>
  )
}

function buildDiagnosticoNodes(result: DiagnosticoCircularidadResponse): SankeyNode[] {
  const corrientes = Array.from(new Set(result.flujos.map(f => f.nombre)))
  const destinos = Array.from(new Set(result.flujos.map(f => f.destino)))
  return [
    { id: 'rsu', name: 'RSU generado' },
    ...corrientes.map(c => ({ id: `c:${c}`, name: c })),
    ...destinos.map(d => ({ id: `d:${d}`, name: d.replace(/_/g, ' ') })),
  ]
}

function buildDiagnosticoLinks(result: DiagnosticoCircularidadResponse): SankeyLink[] {
  const corrientesTotales = new Map<string, number>()
  for (const f of result.flujos) {
    corrientesTotales.set(f.nombre, (corrientesTotales.get(f.nombre) ?? 0) + f.toneladas_dia)
  }
  const links: SankeyLink[] = []
  for (const [c, total] of corrientesTotales.entries()) {
    if (total > 0) links.push({ source: 'rsu', target: `c:${c}`, value: total })
  }
  for (const f of result.flujos) {
    if (f.toneladas_dia > 0) {
      links.push({ source: `c:${f.nombre}`, target: `d:${f.destino}`, value: f.toneladas_dia })
    }
  }
  return links
}
