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

type MarketReference = {
  city: string
  value: number
  source: string
}

const PRICE_REFERENCES: Record<keyof PreciosMaterial, MarketReference[]> = {
  pet: [
    { city: 'MTY', value: 4.8, source: 'referencia mercado reciclaje MTY' },
    { city: 'QRO', value: 5.5, source: 'referencia mercado reciclaje QRO' },
    { city: 'CDMX', value: 7.8, source: 'referencia mercado reciclaje CDMX' },
  ],
  hdpe: [
    { city: 'MTY', value: 7.2, source: 'referencia mercado reciclaje MTY' },
    { city: 'QRO', value: 8.5, source: 'referencia mercado reciclaje QRO' },
    { city: 'CDMX', value: 11.5, source: 'referencia mercado reciclaje CDMX' },
  ],
  papel: [
    { city: 'MTY', value: 1.8, source: 'referencia mercado reciclaje MTY' },
    { city: 'QRO', value: 2.5, source: 'referencia mercado reciclaje QRO' },
    { city: 'CDMX', value: 3.6, source: 'referencia mercado reciclaje CDMX' },
  ],
  vidrio: [
    { city: 'MTY', value: 1.4, source: 'referencia mercado reciclaje MTY' },
    { city: 'QRO', value: 2.3, source: 'referencia mercado reciclaje QRO' },
    { city: 'CDMX', value: 3.4, source: 'referencia mercado reciclaje CDMX' },
  ],
  aluminio: [
    { city: 'MTY', value: 13.0, source: 'referencia mercado reciclaje MTY' },
    { city: 'QRO', value: 15.1, source: 'referencia mercado reciclaje QRO' },
    { city: 'CDMX', value: 22.0, source: 'referencia mercado reciclaje CDMX' },
  ],
  organico: [
    { city: 'MTY', value: 0.3, source: 'referencia composta basica MTY' },
    { city: 'QRO', value: 0.6, source: 'referencia composta basica QRO' },
    { city: 'CDMX', value: 1.1, source: 'referencia composta basica CDMX' },
  ],
}

export function describeMaterialPriceReference(
  material: keyof PreciosMaterial,
  value: number,
): string {
  const references = PRICE_REFERENCES[material]
  const nearest = references.reduce((best, item) =>
    Math.abs(item.value - value) < Math.abs(best.value - value) ? item : best,
  references[0])
  const tolerance = Math.max(0.35, nearest.value * 0.18)
  if (Math.abs(nearest.value - value) <= tolerance) {
    return `Precio estimado cercano a ${nearest.city} (${nearest.source}); no es cotizacion live.`
  }
  return 'Precio manual del escenario; documentar cotizacion local antes de presupuesto.'
}
