/**
 * Baselines fiscales y sociales por entidad federativa.
 * Fuentes: CONEVAL Medición de Pobreza 2022, SHCP/ICSH (referencia ilustrativa).
 */

export type EntidadKey = 'San Luis Potosí' | 'Nuevo León' | 'Querétaro'

export interface StateFiscalBaseline {
  entidad: EntidadKey
  entidadGeoCode: string
  deudaPublicaEstatalMxn: number
  pobrezaPctEstado: number
  pobTotalEstado: number
  lineaPobrezaUrbanaAnualMxn: number
  tasaDeudaConvencional: number
  tasaDeudaVerde: number
  vintageLabel: string
  sourceId: string
}

export interface MunicipioSocialBaseline {
  entidad: EntidadKey
  municipioGeoCode: string
  municipioLabel: string
  pobrezaPctMunicipio: number
  pobTotalMunicipio: number
  pobPobrezaMunicipio: number
}

export const STATE_FISCAL_BASELINES: Record<EntidadKey, StateFiscalBaseline> = {
  'San Luis Potosí': {
    entidad: 'San Luis Potosí',
    entidadGeoCode: '24',
    deudaPublicaEstatalMxn: 18_500_000_000,
    pobrezaPctEstado: 32.4,
    pobTotalEstado: 2_822_255,
    lineaPobrezaUrbanaAnualMxn: 19_240,
    tasaDeudaConvencional: 0.105,
    tasaDeudaVerde: 0.075,
    vintageLabel: 'CONEVAL 2022 · SHCP referencia 2025',
    sourceId: 'coneval_2022_shcp_proxy',
  },
  'Nuevo León': {
    entidad: 'Nuevo León',
    entidadGeoCode: '19',
    deudaPublicaEstatalMxn: 42_000_000_000,
    pobrezaPctEstado: 13.1,
    pobTotalEstado: 5_784_442,
    lineaPobrezaUrbanaAnualMxn: 21_100,
    tasaDeudaConvencional: 0.098,
    tasaDeudaVerde: 0.068,
    vintageLabel: 'CONEVAL 2022 · SHCP referencia 2025',
    sourceId: 'coneval_2022_shcp_proxy',
  },
  'Querétaro': {
    entidad: 'Querétaro',
    entidadGeoCode: '22',
    deudaPublicaEstatalMxn: 12_800_000_000,
    pobrezaPctEstado: 18.6,
    pobTotalEstado: 2_368_467,
    lineaPobrezaUrbanaAnualMxn: 20_500,
    tasaDeudaConvencional: 0.102,
    tasaDeudaVerde: 0.072,
    vintageLabel: 'CONEVAL 2022 · SHCP referencia 2025',
    sourceId: 'coneval_2022_shcp_proxy',
  },
}

export const MUNICIPIO_SOCIAL_BASELINES: MunicipioSocialBaseline[] = [
  {
    entidad: 'San Luis Potosí',
    municipioGeoCode: '24028',
    municipioLabel: 'San Luis Potosí, SLP',
    pobrezaPctMunicipio: 28.5,
    pobTotalMunicipio: 912_871,
    pobPobrezaMunicipio: 260_168,
  },
  {
    entidad: 'Nuevo León',
    municipioGeoCode: '19039',
    municipioLabel: 'Monterrey, NL',
    pobrezaPctMunicipio: 11.2,
    pobTotalMunicipio: 1_135_512,
    pobPobrezaMunicipio: 127_177,
  },
  {
    entidad: 'Querétaro',
    municipioGeoCode: '22014',
    municipioLabel: 'Querétaro, QRO',
    pobrezaPctMunicipio: 15.8,
    pobTotalMunicipio: 1_049_777,
    pobPobrezaMunicipio: 165_865,
  },
]

export function getStateBaseline(estado: string): StateFiscalBaseline {
  return STATE_FISCAL_BASELINES[estado as EntidadKey] ?? STATE_FISCAL_BASELINES['San Luis Potosí']
}

export function getMunicipioBaseline(geoCode: string | undefined, estado: string): MunicipioSocialBaseline {
  const found = MUNICIPIO_SOCIAL_BASELINES.find(m => m.municipioGeoCode === geoCode)
  if (found) return found
  const st = getStateBaseline(estado)
  return {
    entidad: st.entidad,
    municipioGeoCode: geoCode ?? '—',
    municipioLabel: 'Municipio seleccionado',
    pobrezaPctMunicipio: st.pobrezaPctEstado,
    pobTotalMunicipio: Math.round(st.pobTotalEstado * 0.35),
    pobPobrezaMunicipio: Math.round(st.pobTotalEstado * 0.35 * (st.pobrezaPctEstado / 100)),
  }
}
