'use client'

import { useState } from 'react'
import type { DecisionExplanation } from '@/types'
import { createReasoningGraph, explainReasoning } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ReasoningGraphCanvas } from '@/components/simulator/ReasoningGraphCanvas'

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { maximumFractionDigits: 1 })
}

export default function ReasoningGraphPanel() {
  const state = useSimulatorStore()
  const graph = useSimulatorStore(s => s.reasoningGraph)
  const setReasoningGraph = useSimulatorStore(s => s.setReasoningGraph)
  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuildGraph(pregunta = 'Por que cambio este numero?') {
    if (!state.resultados) return
    setLoading(true)
    setError(null)
    try {
      const resultados = {
        rsu_total_ton_dia: state.resultados.rsuTotalTonDia,
        co2e_evitadas_anual: state.resultados.co2eEvitadasAnualTon,
        co2e_evitadas_horizonte: state.resultados.co2eEvitadasHorizonteTon,
        ocupacion_cas: state.resultados.ocupacionCAs,
        camiones_requeridos: state.resultados.camionesRequeridos,
        ingresos_brutos: state.resultados.ingresosBrutos,
        ebitda: state.resultados.ebitda,
        vpn: state.resultados.vpn,
        tir: state.resultados.tir,
      }
      const built = await createReasoningGraph({
        zm: state.zmActiva,
        municipios: state.municipiosActivos,
        scenario: {
          zm_activa: state.zmActiva,
          municipios_activos: state.municipiosActivos,
          horizonte: state.horizonte,
          gen_percapita: state.genPercapita,
          precios: state.precios,
          mix_cas: state.mixCAs,
        },
        resultados,
        data_provenance: state.snapshotDatos,
        market_summary: state.marketSummary,
        macro_impact_summary: state.macroImpactSummary,
      })
      setReasoningGraph(built)
      const exp = await explainReasoning(built, pregunta)
      setExplanation(exp)
    } catch {
      setError(
        'Incidencia operativa al construir el grafo causal. Reintenta o revisa conexión con la API.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">
            S18.75 — Reasoning Graph
          </p>
          <h3 className="font-serif text-[22px] text-[#1C1B18]">Causalidad y trazabilidad</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B6760]">
            Explicaciones con nodos, formulas, fuentes y documentos afectados.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => handleBuildGraph()}
            disabled={loading || !state.resultados}
            className="shrink-0 rounded-full border border-[#3B6D11] bg-[#3B6D11] px-4 py-2 text-[12px] font-medium text-white shadow-[0_1px_0_rgba(28,27,24,0.06)] transition-colors hover:bg-[#2D7A0A] hover:border-[#2D7A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F1] disabled:opacity-50"
          >
            {loading ? 'Construyendo…' : graph ? 'Reconstruir grafo' : 'Construir grafo'}
          </button>
          {loading && state.resultados && (
            <p className="max-w-[280px] text-right text-[13px] text-[#6B6760]">
              Construyendo el grafo causal a partir de los resultados actuales…
            </p>
          )}
          {!state.resultados && !loading && (
            <p className="max-w-[280px] text-right text-[13px] text-[#6B6760]">
              Primero necesitas resultados del simulador (línea base y cálculo completos); después podrás construir el grafo.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {graph && <ReasoningGraphCanvas graph={graph} />}

      {graph && (
        <NarrativeBridge
          variant={graph.warnings.length > 0 ? 'warning' : 'result'}
          summary={`El grafo conecta ${graph.nodes.length} nodos con ${graph.edges.length} relaciones causales y reporta ${graph.warnings.length} advertencias. Cada cambio numérico se rastrea hasta su fuente y fórmula original.`}
          evidence={[
            { label: 'Nodos', value: String(graph.nodes.length) },
            { label: 'Relaciones', value: String(graph.edges.length) },
            { label: 'Advertencias', value: String(graph.warnings.length) },
            { label: 'RSU', value: state.resultados ? `${fmt(state.resultados.rsuTotalTonDia)} t/día` : '—' },
          ]}
          source={{ fuente: 'Reasoning Graph ALQUIMIA', incertidumbre: 'Calidad depende de DataProvenance y trazabilidad de cada nodo.' }}
          nextStep={{ label: 'Pregunta una causalidad específica' }}
        />
      )}

      {graph && (
        <div className="flex flex-wrap gap-2">
          {['Por que cambia RSU total?', 'Por que baja ingreso por comprador?', 'Por que cambia camionaje?', 'Por que macrogeneradores cambian ruta?'].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleBuildGraph(q)}
              className="rounded-full border border-[#E8E4DC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1C1B18] hover:border-[#3B6D11]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {explanation && (
        <div className="space-y-3 rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <div>
            <p className="text-[11px] font-medium text-[#A8A49C]">{explanation.pregunta}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#1C1B18]">{explanation.respuesta_corta}</p>
          </div>
          {explanation.calculos.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-[#6B6760]">Cálculos</p>
              <ul className="space-y-1 text-[12px] text-[#6B6760]">
                {explanation.calculos.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 text-[11px] font-medium text-[#6B6760]">Nodos usados</p>
            <p className="break-words font-mono text-[11px] text-[#1C1B18]">
              {explanation.graph_node_ids.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {state.resultados && !graph && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-3 text-[13px] text-[#6B6760]">
          RSU actual: {fmt(state.resultados.rsuTotalTonDia)} t/día. Construye el grafo para ver fuente, fórmula y decisión afectada.
        </div>
      )}
    </div>
  )
}
