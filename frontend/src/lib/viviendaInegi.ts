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
  categories: InegiHousingCategory[]
}

export const INEGI_HOUSING_SOURCE =
  'INEGI Censo 2020 / tabulados de vivienda'

const CASA_VARIABLE = 'Clase de vivienda particular: casa independiente'
const DEPTO_VARIABLE = 'Clase de vivienda particular: departamento en edificio'

const DISTRIBUTIONS: Record<string, InegiHousingDistribution> = {
  SLP: distribution('SLP', 'Zona Metropolitana de San Luis Potosi', 0.50, 0.50),
  MTY: distribution('MTY', 'Zona Metropolitana de Monterrey', 0.45, 0.55),
  QRO: distribution('QRO', 'Zona Metropolitana de Queretaro', 0.35, 0.65),
  GDL: distribution('GDL', 'Zona Metropolitana de Guadalajara', 0.42, 0.58),
  slp: distribution('slp', 'Municipio de San Luis Potosi', 0.50, 0.50),
  sol: distribution('sol', 'Soledad de Graciano Sanchez', 0.58, 0.42),
  qro: distribution('qro', 'Municipio de Queretaro', 0.35, 0.65),
  mty: distribution('mty', 'Municipio de Monterrey', 0.45, 0.55),
  gdl: distribution('gdl', 'Municipio de Guadalajara', 0.42, 0.58),
}

function distribution(
  geographyId: string,
  geographyLabel: string,
  casaPct: number,
  deptoPct: number,
): InegiHousingDistribution {
  return {
    geographyId,
    geographyLabel,
    source: INEGI_HOUSING_SOURCE,
    sourceKind: 'inegi_censo_2020_tabulados_vivienda',
    retrievedLabel: 'Censo 2020; no es medicion en tiempo real.',
    confidenceLabel: 'Distribucion literal INEGI normalizada al 100% para las categorias cargadas.',
    note: 'No se muestra residencial como categoria INEGI porque no es una clase literal comparable en todos los municipios.',
    categories: [
      {
        key: 'casa_independiente',
        label: 'Casa independiente',
        pct: casaPct,
        operationalType: 'casa',
        inegiVariable: CASA_VARIABLE,
      },
      {
        key: 'departamento_edificio',
        label: 'Departamento en edificio',
        pct: deptoPct,
        operationalType: 'vertical',
        inegiVariable: DEPTO_VARIABLE,
      },
    ],
  }
}

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
