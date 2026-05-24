/**
 * Tiempos de servicio logístico — exclusivamente vivienda vertical y casa.
 * Fase 0-1: estimación editable para Cabildo y concesionario.
 */

import type { TerritorialImplementationPlan, TerritorialZone, TipoVivienda } from '@/types'
import { ZMS } from '@/lib/constants'

export type HousingSegment = 'vertical' | 'casa'

export interface LogisticsTimingParams {
  minPorViviendaVertical: number
  minPorViviendaCasa: number
  minAccesoEdificio: number
  minCargaDescarga: number
  litrosPorKm: number
  litrosRalentiHora: number
  costoCombustibleLitroMxn: number
  maxMinutosTurno: number
  frecuenciaSemanalDefault: number
}

export const DEFAULT_TIMING_PARAMS: LogisticsTimingParams = {
  minPorViviendaVertical: 0.55,
  minPorViviendaCasa: 0.95,
  minAccesoEdificio: 10,
  minCargaDescarga: 6,
  litrosPorKm: 0.38,
  litrosRalentiHora: 2.8,
  costoCombustibleLitroMxn: 24.5,
  maxMinutosTurno: 480,
  frecuenciaSemanalDefault: 3,
}

export interface ColoniaStop {
  colonia: string
  municipio_id: string
  municipio_nombre: string
  segment: HousingSegment
  viviendas_estimadas: number
  min_servicio: number
  lat?: number
  lon?: number
}

export interface RouteLegSaved {
  from_label: string
  to_label: string
  distance_km: number | null
  duration_min: number | null
  encoded_polyline: string | null
}

export interface ResidentialRoutePlan {
  route_id: string
  zona_id: string
  zona_label: string
  material: string
  frecuencia_semana: number
  stops: ColoniaStop[]
  depot?: { lat: number; lon: number; label: string }
  legs: RouteLegSaved[]
  total_km: number
  total_min_viaje: number
  total_min_servicio: number
  total_min_turno: number
  litros_turno: number
  costo_combustible_turno_mxn: number
  opex_mes_mxn: number
  excede_turno: boolean
  traced: boolean
  saved_at: string | null
  source: 'google_routes' | 'draft'
}

export function municipioNombreFromId(municipioId: string, zmId: string): string {
  const zm = ZMS.find(z => z.id.toUpperCase() === zmId.toUpperCase())
  const m = zm?.municipios.find(x => x.id.toLowerCase() === municipioId.toLowerCase())
  return m?.nombre ?? municipioId.toUpperCase()
}

/** Solo vertical y casa — excluye segmento comercial residencial del modelo logístico. */
export function activeResidentialSegments(tipos: TipoVivienda[]): HousingSegment[] {
  const segs: HousingSegment[] = []
  if (tipos.includes('vertical')) segs.push('vertical')
  if (tipos.includes('casa')) segs.push('casa')
  if (segs.length === 0) return ['vertical', 'casa']
  return segs
}

export function inferSegmentForColonia(
  colonia: string,
  index: number,
  segments: HousingSegment[],
  mixVertical: number,
): HousingSegment {
  if (segments.length === 1) return segments[0]!
  const name = colonia.toLowerCase()
  if (name.includes('centro') || name.includes('histórico') || name.includes('historico')) {
    return mixVertical > 0.45 ? 'vertical' : 'casa'
  }
  return index % 2 === 0 ? segments[0]! : segments[1]!
}

export function computeMinServicioColonia(
  stop: Pick<ColoniaStop, 'segment' | 'viviendas_estimadas'>,
  params: LogisticsTimingParams,
  overrideMin?: number,
): number {
  if (overrideMin != null && overrideMin > 0) return Math.round(overrideMin * 10) / 10
  const base =
    stop.segment === 'vertical'
      ? stop.viviendas_estimadas * params.minPorViviendaVertical + params.minAccesoEdificio
      : stop.viviendas_estimadas * params.minPorViviendaCasa
  return Math.round((base + params.minCargaDescarga) * 10) / 10
}

export function computeRouteTotals(
  stops: ColoniaStop[],
  params: LogisticsTimingParams,
  travelMin: number,
  travelKm: number,
  frecuenciaSemana: number,
) {
  const total_min_servicio = stops.reduce((s, st) => s + st.min_servicio, 0)
  const total_min_viaje = travelMin
  const total_min_turno = total_min_servicio + total_min_viaje
  const minMuertos = Math.max(0, total_min_servicio * 0.08)
  const litros_turno =
    travelKm * params.litrosPorKm + (minMuertos / 60) * params.litrosRalentiHora
  const costo_combustible_turno_mxn = litros_turno * params.costoCombustibleLitroMxn
  const opex_mes_mxn = costo_combustible_turno_mxn * frecuenciaSemana * 4.33

  return {
    total_km: Math.round(travelKm * 100) / 100,
    total_min_viaje: Math.round(total_min_viaje * 10) / 10,
    total_min_servicio: Math.round(total_min_servicio * 10) / 10,
    total_min_turno: Math.round(total_min_turno * 10) / 10,
    litros_turno: Math.round(litros_turno * 100) / 100,
    costo_combustible_turno_mxn: Math.round(costo_combustible_turno_mxn),
    opex_mes_mxn: Math.round(opex_mes_mxn),
    excede_turno: total_min_turno > params.maxMinutosTurno,
  }
}

export function buildDraftRoutesFromTerritorialPlan(params: {
  plan: TerritorialImplementationPlan
  zmId: string
  vivActivas: number
  tiposVivienda: TipoVivienda[]
  mixVerticalPct: number
  timing: LogisticsTimingParams
}): ResidentialRoutePlan[] {
  const segments = activeResidentialSegments(params.tiposVivienda)
  const routes: ResidentialRoutePlan[] = []

  for (const zone of params.plan.zones) {
    const stops = buildStopsForZone(zone, params.zmId, params.vivActivas, segments, params.mixVerticalPct, params.timing)
    if (stops.length === 0) continue

    const totals = computeRouteTotals(stops, params.timing, 0, 0, params.timing.frecuenciaSemanalDefault)

    routes.push({
      route_id: `R-${zone.zone_id}`,
      zona_id: zone.zone_id,
      zona_label: `Zona ${zone.zone_number} · ${zone.phase_label}`,
      material: 'Recolección residencial (vertical + casa)',
      frecuencia_semana: params.timing.frecuenciaSemanalDefault,
      stops,
      legs: [],
      traced: false,
      saved_at: null,
      source: 'draft',
      ...totals,
    })
  }

  return routes
}

function buildStopsForZone(
  zone: TerritorialZone,
  zmId: string,
  vivActivas: number,
  segments: HousingSegment[],
  mixVerticalPct: number,
  timing: LogisticsTimingParams,
): ColoniaStop[] {
  const colonias = zone.colonias.map(c => c.name).filter(Boolean)
  if (colonias.length === 0) return []

  const vivPorColonia = Math.max(80, Math.round(vivActivas / Math.max(colonias.length, 1)))

  return colonias.map((colonia, i) => {
    const segment = inferSegmentForColonia(colonia, i, segments, mixVerticalPct)
    const viviendas =
      segment === 'vertical'
        ? Math.round(vivPorColonia * Math.max(0.35, mixVerticalPct))
        : Math.round(vivPorColonia * Math.max(0.35, 1 - mixVerticalPct))
    const stop: ColoniaStop = {
      colonia,
      municipio_id: zone.municipio_id,
      municipio_nombre: municipioNombreFromId(zone.municipio_id, zmId),
      segment,
      viviendas_estimadas: viviendas,
      min_servicio: 0,
    }
    stop.min_servicio = computeMinServicioColonia(stop, timing)
    return stop
  })
}

export function recalculateRoutePlan(
  plan: ResidentialRoutePlan,
  params: LogisticsTimingParams,
): ResidentialRoutePlan {
  const travelKm = plan.total_km
  const travelMin = plan.total_min_viaje
  const totals = computeRouteTotals(plan.stops, params, travelMin, travelKm, plan.frecuencia_semana)
  return { ...plan, ...totals }
}
