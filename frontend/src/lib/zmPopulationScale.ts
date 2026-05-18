import type { Municipio, SimulatorState, SnapshotDatos, ZonaMetropolitana } from '@/types'
import { ZMS } from '@/lib/constants'

export function getZmRecord(zmId: string): ZonaMetropolitana {
  return ZMS.find(z => z.id === zmId) ?? ZMS[0]
}

function snapshotNumber(snapshot: SnapshotDatos | null | undefined, kpiId: string): number | null {
  const kpi = snapshot?.kpis.find(k => k.kpi_id === kpiId)
  if (!kpi || kpi.provenance.tipo === 'no_disponible') return null
  return typeof kpi.valor === 'number' ? kpi.valor : null
}

/**
 * Municipios del simulador que están en el programa (intersección con la ZM).
 * Si la selección no cruza con la ZM activa (estado inconsistente), se usa la ZM completa.
 */
export function resolveMunicipiosInPrograma(zm: ZonaMetropolitana, municipiosActivos: string[]): Municipio[] {
  const found = zm.municipios.filter(m => municipiosActivos.includes(m.id))
  if (found.length === 0) return [...zm.municipios]
  return found
}

export type ResolvedGeography = {
  muniActivos: Municipio[]
  allMunicipiosActivos: boolean
  popActiva: number
  vivActivas: number
}

/**
 * Población y viviendas activas del programa (misma lógica que el motor `calcular`).
 */
export function resolveSimulationGeography(
  state: SimulatorState & { snapshotDatos?: SnapshotDatos | null },
): ResolvedGeography {
  const zm = getZmRecord(state.zmActiva)
  const muniActivos = resolveMunicipiosInPrograma(zm, state.municipiosActivos)
  const allMunicipiosActivos = muniActivos.length === zm.municipios.length
  const snapshot = state.snapshotDatos
  const sel = state.seleccionMunicipioCatalog

  const snapshotPop = allMunicipiosActivos ? snapshotNumber(snapshot, 'poblacion_total') : null
  const snapshotViv = allMunicipiosActivos ? snapshotNumber(snapshot, 'viviendas_totales') : null
  let popActiva = snapshotPop ?? (muniActivos.reduce((s, m) => s + m.pop, 0) || zm.totalPop)
  let vivActivas = snapshotViv ?? (muniActivos.reduce((s, m) => s + m.viv, 0) || zm.totalViv)

  if (
    sel &&
    state.municipiosActivos.length === 1 &&
    state.municipiosActivos[0] === sel.municipioSimulatorId
  ) {
    popActiva = sel.poblacion
    const ref = zm.municipios.find(m => m.id === sel.municipioSimulatorId)
    const ratio = ref && ref.pop > 0 ? ref.viv / ref.pop : 0.28
    vivActivas = Math.max(1, Math.round(sel.poblacion * ratio))
  }

  return { muniActivos, allMunicipiosActivos, popActiva, vivActivas }
}

/**
 * Factor ∈ (0,1] para escalar métricas de ámbito ZM (p. ej. baseline API) al subconjunto municipal activo.
 * Denominador: población total declarada del registro ZM en constants.
 */
export function getProgramPopulationShare(zmId: string, municipiosActivos: string[]): number {
  const zm = getZmRecord(zmId)
  const muniActivos = resolveMunicipiosInPrograma(zm, municipiosActivos)
  const num = muniActivos.reduce((s, m) => s + m.pop, 0)
  const den = Math.max(1, zm.totalPop)
  return Math.min(1, Math.max(0, num / den))
}
