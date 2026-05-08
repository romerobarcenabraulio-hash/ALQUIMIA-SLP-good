import type { PreciosMaterial, TipoVivienda } from '@/types'

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

const PRICE_SOURCE_NOTES: Record<keyof PreciosMaterial, { base: number; note: string }> = {
  pet: {
    base: 5.50,
    note: 'Base SLP: Capitulo San Luis tabla de valorizacion y Recicladoras_por_Giro.xlsx; actualizar con cotizacion de comprador ancla.',
  },
  hdpe: {
    base: 8.50,
    note: 'Parametro de sensibilidad del modelo; no hay fuente documental cerrada en Capitulo SLP para HDPE separado.',
  },
  papel: {
    base: 2.50,
    note: 'Base SLP: Capitulo San Luis y Recicladoras_por_Giro.xlsx; comprador/capacidad papel-carton requiere validacion local.',
  },
  vidrio: {
    base: 2.30,
    note: 'Base Capitulo SLP $2.30/kg; anexos de recicladoras traen valores distintos, por eso requiere conciliacion y cotizacion local.',
  },
  aluminio: {
    base: 15.10,
    note: 'Base Capitulo SLP y hoja Aluminio de Recicladoras_por_Giro.xlsx; validar contra fundidora o comprador ancla.',
  },
  organico: {
    base: 0.30,
    note: 'Escenario conservador del simulador; el capitulo documenta composta a granel como mercado local por confirmar.',
  },
}

export function describeMaterialPriceReference(
  material: keyof PreciosMaterial,
  value: number,
): string {
  const source = PRICE_SOURCE_NOTES[material]
  const tolerance = Math.max(0.35, source.base * 0.18)
  if (Math.abs(value - source.base) <= tolerance) {
    return `${source.note} No es cotizacion live ni precio oficial.`
  }
  return `Precio manual del escenario. ${source.note} Documentar cotizacion local antes de presupuesto.`
}
