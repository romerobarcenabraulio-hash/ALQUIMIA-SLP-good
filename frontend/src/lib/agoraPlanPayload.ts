import { getZmRecord, resolveSimulationGeography } from '@/lib/zmPopulationScale'
import type { ResultadosCalculados, SeleccionMunicipioCatalog, SimulatorState, SnapshotDatos } from '@/types'
import { SIMULATOR_STATE_DEFAULT } from '@/store/simulatorStore'

/** Cuerpo alineado a `backend/app/agora/schemas.py` PlanRequest. */
export type EscenarioPlan = 'conservador' | 'moderado' | 'acelerado'

export interface AgoraPlanGenerateBody {
  municipio: string
  estado: string
  poblacion: number
  generacion_rsu_dia: number
  ingreso_estimado_anual_mxn: number
  escenario: EscenarioPlan
  sector_pack_id: string
}

export function mapPresetToEscenario(preset: string): EscenarioPlan {
  if (preset === 'Conservador') return 'conservador'
  if (preset === 'Agresivo' || preset === 'Acelerado') return 'acelerado'
  return 'moderado'
}

function resolveMunicipioNombre(
  catalog: SeleccionMunicipioCatalog | null,
  zmActiva: string,
): string {
  if (catalog?.nombre) return catalog.nombre
  const zm = getZmRecord(zmActiva)
  return zm.nombre.replace(/^ZM\s+/i, '').trim()
}

function resolveEstadoNombre(
  catalog: SeleccionMunicipioCatalog | null,
  zmActiva: string,
): string {
  if (catalog?.estadoNombre) return catalog.estadoNombre
  return getZmRecord(zmActiva).estado
}

/**
 * Une simulador (ZM, trayectoria, snapshot) + resultados del motor para solicitar ZIP la plataforma.
 */
export function buildAgoraPlanPayload(
  zmActiva: string,
  municipiosActivos: string[],
  horizonte: number,
  presetTrayectoria: string,
  snapshotDatos: SnapshotDatos | null,
  resultados: ResultadosCalculados,
  seleccionMunicipioCatalog: SeleccionMunicipioCatalog | null = null,
): AgoraPlanGenerateBody {
  const state: SimulatorState & { snapshotDatos?: SnapshotDatos | null } = {
    ...SIMULATOR_STATE_DEFAULT,
    zmActiva,
    municipiosActivos,
    horizonte,
    presetTrayectoria,
    snapshotDatos: snapshotDatos ?? undefined,
    seleccionMunicipioCatalog: seleccionMunicipioCatalog ?? null,
  }
  const geo = resolveSimulationGeography(state)
  const ingresoAnual = resultados.ingresosBrutos / Math.max(1, horizonte)
  return {
    municipio: resolveMunicipioNombre(seleccionMunicipioCatalog, zmActiva),
    estado: resolveEstadoNombre(seleccionMunicipioCatalog, zmActiva),
    poblacion: Math.round(geo.popActiva),
    generacion_rsu_dia: resultados.rsuTotalTonDia,
    ingreso_estimado_anual_mxn: ingresoAnual,
    escenario: mapPresetToEscenario(presetTrayectoria),
    sector_pack_id: 'politica_publica_rsu_mx_v1',
  }
}
