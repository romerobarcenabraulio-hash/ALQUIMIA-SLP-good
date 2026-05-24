/**
 * Contexto municipal para PDF ejecutivo — cada municipio es un caso distinto.
 * Ensambla árbol de decisión, grafo causal y selección INEGI para el backend.
 */
import { useSimulatorStore } from '@/store/simulatorStore'
import type { ExecutivePdfPayload } from '@/lib/api'

type PdfContextInput = ReturnType<typeof useSimulatorStore.getState>

function deriveCaminoInstitucional(st: Pick<
  PdfContextInput,
  'arbolDecisionAnswers' | 'esquemaConcesion'
>): string | null {
  const { tienepresupuesto, existeConcesionario, aceptaRenegociar } = st.arbolDecisionAnswers
  const treeComplete =
    tienepresupuesto === true ||
    (tienepresupuesto === false && existeConcesionario === false) ||
    (tienepresupuesto === false && existeConcesionario === true && aceptaRenegociar !== null)

  if (!treeComplete) return null

  if (tienepresupuesto === true) {
    return `Esquema ${st.esquemaConcesion} — operación municipal directa o APP (presupuesto propio).`
  }
  if (existeConcesionario === false) {
    return 'Esquema B — concesión nueva; operador privado financia CAPEX.'
  }
  if (aceptaRenegociar === true) {
    return 'Adendo al contrato vigente — separación diferenciada en contrato existente.'
  }
  return 'Concesión exclusiva RSU separado (condominios + comercios) — sin CAPEX municipal.'
}

export function buildExecutivePdfContext(st: PdfContextInput): ExecutivePdfPayload['contexto_municipal'] {
  const sel = st.seleccionMunicipioCatalog
  const datosEstimados =
    sel?.datosEstimados === true ||
    (st.snapshotDatos?.advertencias?.some((a: { advertencia: string }) => /estimad/i.test(a.advertencia)) ??
      false)

  return {
    municipio_id: st.municipiosActivos[0] ?? st.zmActiva,
    municipio_nombre: sel?.nombre ?? st.cityContext?.nombre ?? st.zmActiva,
    estado_nombre: sel?.estadoNombre ?? '',
    datos_estimados: datosEstimados,
    arbol_decision: {
      ...st.arbolDecisionAnswers,
      esquema_recomendado: st.esquemaConcesion,
      camino_recomendado: deriveCaminoInstitucional(st),
    },
    reasoning_graph: st.reasoningGraph
      ? {
          scenario_id: st.reasoningGraph.scenario_id,
          nodes: st.reasoningGraph.nodes.slice(0, 8),
          warnings: st.reasoningGraph.warnings,
        }
      : null,
    research_findings: st.researchFindings ?? undefined,
    implicacion_decision: deriveCaminoInstitucional(st),
  }
}
