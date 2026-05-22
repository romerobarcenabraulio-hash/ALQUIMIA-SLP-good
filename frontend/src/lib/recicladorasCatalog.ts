/**
 * Resolver de recicladoras por territorio + KPI hacia KRONOS (HERMES Parte C).
 */
import {
  GIROS_COBERTURA,
  RECICLADORAS_BY_ZM,
  type GiroReciclador,
  type RecicladoraRecord,
} from '@/data/recicladorasByZm'

export interface RecyclersKpiContract {
  timestamp: string
  zm_simulator_id: string
  municipio_id: string | null
  recicladoras_activas: number
  cobertura_giros_pct: number
  distancia_promedio_km_ca_recicladora: number
  giros_cubiertos: GiroReciclador[]
  giros_faltantes: GiroReciclador[]
  recicladoras: RecicladoraRecord[]
  fuente: 'recicladoras_by_zm'
}

const EARTH_RADIUS_KM = 6371

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Centro aproximado CA por ZM (EPSG:4326) cuando no hay coordenadas de centros. */
const ZM_CA_ANCHOR: Record<string, { lat: number; lon: number }> = {
  SLP: { lat: 22.1565, lon: -100.9855 },
  MTY: { lat: 25.6866, lon: -100.3161 },
  QRO: { lat: 20.5888, lon: -100.3899 },
  GDL: { lat: 20.6736, lon: -103.3444 },
}

export function getRecicladorasForZm(
  zmId: string,
  municipioId?: string | null,
): RecicladoraRecord[] {
  const zm = zmId.toUpperCase()
  let list = RECICLADORAS_BY_ZM.filter(r => r.zm_simulator_id.toUpperCase() === zm)
  if (municipioId) {
    const mid = municipioId.toLowerCase()
    const local = list.filter(r => r.municipio_id?.toLowerCase() === mid)
    if (local.length >= 3) list = local
  }
  return list
}

export function computeCoberturaGiros(recicladoras: RecicladoraRecord[]): {
  pct: number
  cubiertos: GiroReciclador[]
  faltantes: GiroReciclador[]
} {
  const cubiertos = GIROS_COBERTURA.filter(g => recicladoras.some(r => r.giro === g))
  const faltantes = GIROS_COBERTURA.filter(g => !cubiertos.includes(g))
  const pct = Math.round((cubiertos.length / GIROS_COBERTURA.length) * 1000) / 10
  return { pct, cubiertos, faltantes }
}

export function computeDistanciaPromedioKm(
  recicladoras: RecicladoraRecord[],
  zmId: string,
  caAnchor?: { lat: number; lon: number } | null,
): number {
  if (recicladoras.length === 0) return 0
  const anchor = caAnchor ?? ZM_CA_ANCHOR[zmId.toUpperCase()] ?? ZM_CA_ANCHOR.SLP
  const dists = recicladoras.map(r => haversineKm(anchor.lat, anchor.lon, r.lat, r.lon))
  return Math.round((dists.reduce((s, d) => s + d, 0) / dists.length) * 10) / 10
}

export function buildRecyclersKpiContract(input: {
  zmId: string
  municipioId?: string | null
  caAnchor?: { lat: number; lon: number } | null
}): RecyclersKpiContract {
  const recicladoras = getRecicladorasForZm(input.zmId, input.municipioId)
  const { pct, cubiertos, faltantes } = computeCoberturaGiros(recicladoras)
  return {
    timestamp: new Date().toISOString(),
    zm_simulator_id: input.zmId.toUpperCase(),
    municipio_id: input.municipioId ?? null,
    recicladoras_activas: recicladoras.length,
    cobertura_giros_pct: pct,
    distancia_promedio_km_ca_recicladora: computeDistanciaPromedioKm(
      recicladoras,
      input.zmId,
      input.caAnchor,
    ),
    giros_cubiertos: cubiertos,
    giros_faltantes: faltantes,
    recicladoras,
    fuente: 'recicladoras_by_zm',
  }
}

/** Convierte registro territorial a fila comprador M10. */
export function recicladoraToCompradorRow(r: RecicladoraRecord, distKm: number) {
  const estatus =
    r.estado_verificacion === 'verificado'
      ? 'Verificado (catálogo ZM)'
      : r.estado_verificacion === 'estimado_denue'
        ? 'Estimado DENUE'
        : 'Pendiente campo'
  const materialLabel: Record<GiroReciclador, string> = {
    pet: 'PET',
    papel: 'Papel / Cartón',
    vidrio: 'Vidrio',
    aluminio: 'Aluminio',
    organicos: 'Orgánicos',
  }
  const p50t = Math.round(r.precio_kg_mxn * 1000)
  return {
    material: materialLabel[r.giro],
    comprador: r.nombre,
    tipo: 'Recicladora local',
    distKm: Math.round(distKm),
    capTon: Math.round(r.capacidad_ton_dia * 300),
    p50: p50t,
    p10: Math.round(p50t * 0.85),
    p90: Math.round(p50t * 1.15),
    estatus,
    rechazo: r.estado_verificacion === 'verificado' ? 'Bajo' : 'Medio',
    calidad: r.estado_verificacion === 'verificado' ? 'estandar' : 'basica',
    fuenteApi: true,
  }
}
