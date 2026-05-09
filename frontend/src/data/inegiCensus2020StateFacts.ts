export interface InegiCensus2020StateFact {
  stateKey: 'SLP' | 'MTY' | 'QRO' | 'GDL'
  entityCode: string
  entityName: string
  population2020: number
  occupiedDwellings2020: number
  avgOccupantsPerDwelling2020: number
  populationWorkbook: string
  dwellingsWorkbook: string
  occupantsWorkbook: string
  populationConsultedAt: string
  dwellingsConsultedAt: string
  occupantsConsultedAt: string
  sourceUrl: string
  verificationNote: string
}

export const INEGI_CENSUS_2020_SOURCE_URL =
  'https://www.inegi.org.mx/programas/ccpv/2020/'

export const INEGI_CENSUS_2020_STATE_FACTS: Record<InegiCensus2020StateFact['stateKey'], InegiCensus2020StateFact> = {
  SLP: {
    stateKey: 'SLP',
    entityCode: '24',
    entityName: 'San Luis Potosi',
    population2020: 2_822_255,
    occupiedDwellings2020: 774_658,
    avgOccupantsPerDwelling2020: 3.6,
    populationWorkbook: 'Poblacion_01.xlsx',
    dwellingsWorkbook: 'Vivienda_01.xlsx',
    occupantsWorkbook: 'Vivienda_02.xlsx',
    populationConsultedAt: '08/05/2026 16:23:37',
    dwellingsConsultedAt: '08/05/2026 16:22:43',
    occupantsConsultedAt: '08/05/2026 16:23:09',
    sourceUrl: INEGI_CENSUS_2020_SOURCE_URL,
    verificationNote:
      'Tabulados estatales descargados de INEGI. Validan poblacion, viviendas habitadas y ocupantes promedio; no incluyen clase casa/departamento por municipio.',
  },
  MTY: {
    stateKey: 'MTY',
    entityCode: '19',
    entityName: 'Nuevo Leon',
    population2020: 5_784_442,
    occupiedDwellings2020: 1_655_256,
    avgOccupantsPerDwelling2020: 3.5,
    populationWorkbook: 'Poblacion_01.xlsx',
    dwellingsWorkbook: 'Vivienda_01.xlsx',
    occupantsWorkbook: 'Vivienda_02.xlsx',
    populationConsultedAt: '08/05/2026 16:23:37',
    dwellingsConsultedAt: '08/05/2026 16:22:43',
    occupantsConsultedAt: '08/05/2026 16:23:09',
    sourceUrl: INEGI_CENSUS_2020_SOURCE_URL,
    verificationNote:
      'Tabulados estatales descargados de INEGI. Validan poblacion, viviendas habitadas y ocupantes promedio; no incluyen clase casa/departamento por municipio.',
  },
  QRO: {
    stateKey: 'QRO',
    entityCode: '22',
    entityName: 'Queretaro',
    population2020: 2_368_467,
    occupiedDwellings2020: 668_487,
    avgOccupantsPerDwelling2020: 3.5,
    populationWorkbook: 'Poblacion_01.xlsx',
    dwellingsWorkbook: 'Vivienda_01.xlsx',
    occupantsWorkbook: 'Vivienda_02.xlsx',
    populationConsultedAt: '08/05/2026 16:23:37',
    dwellingsConsultedAt: '08/05/2026 16:22:43',
    occupantsConsultedAt: '08/05/2026 16:23:09',
    sourceUrl: INEGI_CENSUS_2020_SOURCE_URL,
    verificationNote:
      'Tabulados estatales descargados de INEGI. Validan poblacion, viviendas habitadas y ocupantes promedio; no incluyen clase casa/departamento por municipio.',
  },
  GDL: {
    stateKey: 'GDL',
    entityCode: '14',
    entityName: 'Jalisco',
    population2020: 8_348_151,
    occupiedDwellings2020: 2_330_706,
    avgOccupantsPerDwelling2020: 3.6,
    populationWorkbook: 'Poblacion_01.xlsx',
    dwellingsWorkbook: 'Vivienda_01.xlsx',
    occupantsWorkbook: 'Vivienda_02.xlsx',
    populationConsultedAt: '08/05/2026 16:23:37',
    dwellingsConsultedAt: '08/05/2026 16:22:43',
    occupantsConsultedAt: '08/05/2026 16:23:09',
    sourceUrl: INEGI_CENSUS_2020_SOURCE_URL,
    verificationNote:
      'Tabulados estatales descargados de INEGI. Validan poblacion, viviendas habitadas y ocupantes promedio; no incluyen clase casa/departamento por municipio.',
  },
}
