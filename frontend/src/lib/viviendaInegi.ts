import type { TipoVivienda } from '@/types'
import { INEGI_CENSUS_2020_STATE_FACTS } from '@/data/inegiCensus2020StateFacts'
import { ZMS } from '@/lib/constants'
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
  blocker: string
  nextAction: string
  entityCode: string
  statePopulation2020: number
  stateOccupiedDwellings2020: number
  stateAvgOccupants2020: number
  categories: InegiHousingCategory[]
}

export const INEGI_HOUSING_SOURCE =
  'INEGI Censo 2020 / tabulados de vivienda'

const DISTRIBUTIONS: Record<string, InegiHousingDistribution> = Object.fromEntries(
  Object.entries(INEGI_CENSUS_2020_STATE_FACTS).map(([key, fact]) => [
    key,
    {
      geographyId: key,
      geographyLabel: `${fact.entityName} (entidad federativa)`,
      entityCode: fact.entityCode,
      source: INEGI_HOUSING_SOURCE,
      sourceKind: 'inegi_censo_2020_tabulados_vivienda',
      retrievedLabel: `Consulta INEGI ${fact.dwellingsConsultedAt}; tabulados por entidad federativa, no por municipio ni ZM.`,
      confidenceLabel: 'Los archivos cargados validan población, viviendas habitadas y ocupantes promedio estatales. No contienen distribución casa/departamento.',
      blocker: 'Distribución casa/departamento por municipio no cargada desde tabulado INEGI.',
      nextAction: 'Cargar tabulado municipal de clase de vivienda antes de mostrar porcentajes oficiales por tipo habitacional.',
      note: 'No se muestra porcentaje de casa independiente ni departamento como dato INEGI porque Vivienda_01.xlsx y Vivienda_02.xlsx no traen clase de vivienda. Para activar esa distribución hace falta el tabulado municipal por clase de vivienda.',
      statePopulation2020: fact.population2020,
      stateOccupiedDwellings2020: fact.occupiedDwellings2020,
      stateAvgOccupants2020: fact.avgOccupantsPerDwelling2020,
      categories: [],
    },
  ]),
) as Record<string, InegiHousingDistribution>

export function getInegiHousingDistribution(
  zmId: string,
  municipioIds: string[],
): InegiHousingDistribution | null {
  if (municipioIds.length === 1) {
    return DISTRIBUTIONS[municipioIds[0]] ?? DISTRIBUTIONS[zmId] ?? null
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

export interface OperationalHousingSegment {
  key: TipoVivienda
  label: string
  modelSharePct: number
  factor: number
  active: boolean
  isInegiOfficialPct: false
  helper: string
}

const OPERATIONAL_LABELS: Record<TipoVivienda, string> = {
  vertical: 'Departamento en edificio',
  casa: 'Casa independiente',
  residencial: 'Residencial / administración común',
}

export function getOperationalHousingSegments(
  zmId: string,
  activeTypes: TipoVivienda[],
): OperationalHousingSegment[] {
  const zm = ZMS.find(z => z.id === zmId) ?? ZMS[0]
  const factors: Record<TipoVivienda, number> = {
    vertical: 1,
    casa: 0.95,
    residencial: 1.15,
  }
  const weights: Record<TipoVivienda, number> = {
    vertical: zm.mixVivienda.vertical * factors.vertical,
    casa: zm.mixVivienda.casa * factors.casa,
    residencial: zm.mixVivienda.residencial * factors.residencial,
  }
  const totalWeight = Math.max(0.0001, weights.vertical + weights.casa + weights.residencial)
  return (['vertical', 'casa', 'residencial'] as TipoVivienda[])
    .filter(tipo => weights[tipo] > 0)
    .map(tipo => ({
      key: tipo,
      label: OPERATIONAL_LABELS[tipo],
      modelSharePct: weights[tipo] / totalWeight * 100,
      factor: factors[tipo],
      active: activeTypes.includes(tipo),
      isInegiOfficialPct: false,
      helper: 'Peso operativo del simulador; no es porcentaje oficial INEGI.',
    }))
}
