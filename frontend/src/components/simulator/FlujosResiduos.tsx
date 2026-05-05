'use client'

import { Fragment, useMemo, useState } from 'react'
import { diagnosisWasteFlows } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { DiagnosticoCircularidadResponse } from '@/types'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { FlujosSankey, type SankeyLink, type SankeyNode } from '@/components/simulator/FlujosSankey'

const STEPS = [
  'RSU generado',
  'Corrientes por tipo',
  'Destino actual',
  'Brecha de recuperación',
  'Oportunidad circular',
]

export function FlujosResiduos() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipioId = municipiosActivos[0] ?? ''

  const [showForm] = useState(true)
  const [generacionTotal, setGeneracionTotal] = useState(10)
  const [mix, setMix] = useState({
    organico: 0.45,
    papel: 0.2,
    plastico: 0.15,
    vidrio: 0.05,
    metal: 0.05,
    otro: 0.1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosticoCircularidadResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const isEmpty = !result && !loading && !error

  const totalMix = useMemo(() => Object.values(mix).reduce((sum, v) => sum + v, 0), [mix])

  async function run(payload: object) {
    setLoading(true)
    setError(null)
    try {
      const data = await diagnosisWasteFlows(payload)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa en diagnóstico de flujos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDiagnose() {
    const payload = {
      municipio_id: municipioId,
      generacion_total_ton_dia: generacionTotal,
      mix_corrientes: mix,
      infraestructura_actual: ['centro_pequeno'],
      tasa_recuperacion_actual_pct: 18,
    }
    setLastPayload(payload)
    await run(payload)
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Flujos de residuos y cierre de ciclo · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {STEPS.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="block text-[13px] text-[#6B6860] mb-1">
              Generación total (ton/día)
              <input
                type="number"
                min={0}
                step={0.1}
                value={generacionTotal}
                onChange={e => setGeneracionTotal(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
              />
            </label>
            <div className="text-[12px] text-[#6B6760]">
              Total mix actual: {(totalMix * 100).toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(mix).map(([key, value]) => (
              <label key={key} className="block text-[13px] text-[#6B6860] mb-1">
                {key}
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={value}
                  onChange={e => setMix(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDiagnose}
            disabled={loading}
            className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Diagnóstico en curso...' : 'Generar diagnóstico de cierre de ciclo'}
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          Configura generación total y mix de corrientes para ver el diagnóstico.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800 space-y-2">
          <p>{error}</p>
          {lastPayload && (
            <button
              type="button"
              onClick={() => run(lastPayload)}
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
          {result.blockers.map(b => <p key={b}>{b}</p>)}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Chip title="Tasa actual" value={`${result.tasa_circularidad_actual_pct.toFixed(2)}%`} />
            <Chip title="Tasa potencial" value={`${result.tasa_circularidad_potencial_pct.toFixed(2)}%`} />
            <Chip title="Oportunidad MXN/año" value={`$${result.brecha.oportunidad_ingreso_estimado_mxn.toLocaleString('es-MX')}`} />
          </div>

          <FlujosSankey
            title="Diagnóstico de flujos · Sankey"
            nodes={buildDiagnosticoNodes(result)}
            links={buildDiagnosticoLinks(result)}
          />

          <NarrativeBridge
            kicker="S22 · Lectura del diagnóstico"
            variant={result.brecha.porcentaje_recuperable_no_capturado > 30 ? 'warning' : 'result'}
            summary={`Tu municipio captura hoy ${result.tasa_circularidad_actual_pct.toFixed(1)}% y podría llegar a ${result.tasa_circularidad_potencial_pct.toFixed(1)}%. Las pérdidas suman ${result.brecha.toneladas_recuperables_perdidas.toFixed(1)} t/día y representan una oportunidad anual de $${result.brecha.oportunidad_ingreso_estimado_mxn.toLocaleString('es-MX')} MXN.`}
            evidence={[
              { label: 'Tasa actual', value: `${result.tasa_circularidad_actual_pct.toFixed(1)}%` },
              { label: 'Tasa potencial', value: `${result.tasa_circularidad_potencial_pct.toFixed(1)}%` },
              { label: 'Recuperable perdido', value: `${result.brecha.toneladas_recuperables_perdidas.toFixed(1)} t/día` },
              { label: 'Oportunidad', value: `$${(result.brecha.oportunidad_ingreso_estimado_mxn / 1_000_000).toFixed(1)} M MXN/año` },
            ]}
            source={{ fuente: result.brecha.fuente_factor, unidad: 't/día · MXN/año', incertidumbre: '±30% en recuperables perdidos.' }}
            nextStep={{ label: 'Activa las acciones prioritarias' }}
          />

          {result.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              {result.advertencias.map(w => <p key={w}>{w}</p>)}
            </div>
          )}

          <div className="rounded-lg border border-[#E8E4DC] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#1C1B18]">Flujos por corriente</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#E8E4DC] text-[#6B6760]">
                    <th className="text-left py-2">Corriente</th>
                    <th className="text-left py-2">t/día</th>
                    <th className="text-left py-2">Destino</th>
                    <th className="text-left py-2">Recuperable</th>
                    <th className="text-left py-2">Advertencia</th>
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
              Recuperables perdidos: {result.brecha.toneladas_recuperables_perdidas.toFixed(3)} ton/día ·
              No capturado: {result.brecha.porcentaje_recuperable_no_capturado.toFixed(2)}%
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
