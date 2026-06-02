import type {
  OfficialStatSlice,
  ResolvedOfficialStat,
  SocialStatsBundle,
} from '@/types/socialOfficialStats'

function firstMatch(
  slices: OfficialStatSlice[],
  indicatorId: string,
  predicate: (s: OfficialStatSlice) => boolean,
): OfficialStatSlice | null {
  return slices.find(s => s.indicatorId === indicatorId && predicate(s)) ?? null
}

export type StatResolutionContext = {
  /** CVE municipio INEGI (5 dígitos) o null si no aplica. */
  municipioCve: string | null
  /** Id ZM estadística (p. ej. MTY). */
  zmSimulatorId: string | null
}

function entidadCveFromMunicipioCve(mun: string): string | null {
  const d = mun.replace(/\D/g, '')
  if (d.length >= 5) return d.slice(0, 2)
  if (d.length === 2) return d
  return null
}

/**
 * Resuelve un indicador con prioridad municipio → entidad (derivada del CVE) → ZM.
 * No mezcla números: si el valor es de otro ámbito, `availability === 'disponible_otro_ambito'`.
 */
export function resolveOfficialStat(
  bundle: SocialStatsBundle,
  indicatorId: string,
  ctx: StatResolutionContext,
): ResolvedOfficialStat {
  const { slices } = bundle
  const { municipioCve, zmSimulatorId } = ctx

  if (municipioCve) {
    const mun = firstMatch(
      slices,
      indicatorId,
      s => s.geoLevel === 'municipio' && s.geoCode === municipioCve,
    )
    if (mun) return { availability: 'disponible_ambito_solicitado', slice: mun }
  }

  const ent = municipioCve ? entidadCveFromMunicipioCve(municipioCve) : null
  if (ent) {
    const entSlice = firstMatch(
      slices,
      indicatorId,
      s => s.geoLevel === 'entidad_federativa' && s.geoCode === ent,
    )
    if (entSlice) return { availability: 'disponible_otro_ambito', slice: entSlice }
  }

  if (zmSimulatorId) {
    const zmSlice = firstMatch(
      slices,
      indicatorId,
      s => s.geoLevel === 'zm_estadistica' && s.geoCode === zmSimulatorId,
    )
    if (zmSlice) return { availability: 'disponible_otro_ambito', slice: zmSlice }
  }

  return { availability: 'no_disponible', slice: null }
}
