import type { TipoVivienda } from '@/types'
export { describeMaterialPriceReference } from '@/data/materialPriceResearch'

export type InegiHousingCategoryKey = 'casa_independiente' | 'departamento_edificio'

export interface InegiHousingCategory {
  key: InegiHousingCategoryKey
  label: string
  pct: number
  operationalType: TipoVivienda
  inegiVariable: string
}

export interface InegiHousingDistribution {
  geographyId: string
  geographyLabel: string
  source: string
  sourceKind: 'inegi_censo_2020_tabulados_vivienda'
  retrievedLabel: string
  confidenceLabel: string
  note: string
  statePopulation2020: number
  stateOccupiedDwellings2020: number
  stateAvgOccupants2020: number
  categories: InegiHousingCategory[]
}

export const INEGI_HOUSING_SOURCE =
  'INEGI Censo 2020 / tabulados de vivienda'

const DISTRIBUTIONS: Record<string, InegiHousingDistribution> = {
  SLP: distribution('SLP', 'San Luis Potosi (entidad federativa)', 2_822_255, 774_658, 3.6),
  MTY: distribution('MTY', 'Nuevo Leon (entidad federativa)', 5_784_442, 1_655_256, 3.5),
  QRO: distribution('QRO', 'Queretaro (entidad federativa)', 2_368_467, 668_487, 3.5),
  GDL: distribution('GDL', 'Jalisco (entidad federativa)', 8_348_151, 2_330_706, 3.6),
}

function distribution(
  geographyId: string,
  geographyLabel: string,
  statePopulation2020: number,
  stateOccupiedDwellings2020: number,
  stateAvgOccupants2020: number,
): InegiHousingDistribution {
  return {
    geographyId,
    geographyLabel,
    source: INEGI_HOUSING_SOURCE,
    sourceKind: 'inegi_censo_2020_tabulados_vivienda',
    retrievedLabel: 'Consulta INEGI 08/05/2026; tabulados por entidad federativa, no por municipio ni ZM.',
    confidenceLabel: 'Los archivos cargados validan población, viviendas habitadas y ocupantes promedio estatales. No contienen distribución casa/departamento.',
    note: 'No se muestra porcentaje de casa independiente ni departamento como dato INEGI porque Vivienda_01.xlsx y Vivienda_02.xlsx no traen clase de vivienda. Para activar esa distribución hace falta el tabulado municipal por clase de vivienda.',
    statePopulation2020,
    stateOccupiedDwellings2020,
    stateAvgOccupants2020,
    categories: [],
  }
}

export function getInegiHousingDistribution(
  zmId: string,
  municipioIds: string[],
): InegiHousingDistribution | null {
  if (municipioIds.length === 1) {
    return DISTRIBUTIONS[municipioIds[0]] ?? null
  }
  return DISTRIBUTIONS[zmId] ?? null
}

export function isInegiLiteralHousingType(tipo: TipoVivienda): boolean {
  return tipo === 'casa' || tipo === 'vertical'
}

export const INEGI_LITERAL_OPERATIONAL_TYPES: TipoVivienda[] = ['vertical', 'casa']

export function getHousingCategoryByType(
  distribution: InegiHousingDistribution | null,
  tipo: TipoVivienda,
): InegiHousingCategory | null {
  return distribution?.categories.find(c => c.operationalType === tipo) ?? null
}
