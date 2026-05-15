import type { OfficialStatSlice, SocialStatsBundle } from '@/types/socialOfficialStats'

/** Identificador de extracto correlacionado con `slices-${SOCIAL_STATS_BUILD_ID}.json` y CHANGELOG en `fuentes de calculo/`. */
export const SOCIAL_STATS_BUILD_ID = '20260507a'

/** Nombre del JSON bajo `public/data/social-stats/` y parámetro `[filename]` del Route Handler (fuente única anti-drift). */
export const SOCIAL_STATS_SLICES_FILENAME = `slices-${SOCIAL_STATS_BUILD_ID}.json`

/** Ruta estable consumida por `socialStatsBundleCache` y servida por `app/data/social-stats/[filename]/route.ts`. */
export const SOCIAL_STATS_PUBLIC_REL_PATH = `/data/social-stats/${SOCIAL_STATS_SLICES_FILENAME}`

/** Nombre lógico de pestaña/hoja hasta consolidar .xlsx único en `fuentes de calculo/` (ver SOURCE_TRACE.md). */
const SOCIAL_TRACE_TAB = 'MAESTRO_Demografia_CAPA_SOCIAL_v0'

function withCalcTrace(params: {
  indicatorId: string
  geoCode?: string
  base: Omit<OfficialStatSlice, 'sourceSpreadsheetTab' | 'excelRowHint' | 'lastExtractedGitShaOpcional'>
}): OfficialStatSlice {
  const g = params.geoCode ?? '—'
  return {
    ...params.base,
    sourceSpreadsheetTab: SOCIAL_TRACE_TAB,
    excelRowHint: `fuentes de calculo/README.md; SOURCE_TRACE.md; indicatorId=${params.indicatorId}; clave_geo=${g}; buildId=${SOCIAL_STATS_BUILD_ID}`,
  }
}

/**
 * Misma forma que el JSON público bajo `public/data/social-stats/` (mismo `buildId` que `SOCIAL_STATS_BUILD_ID`; embebido para fallback
 * si el fetch inicial falla o en entornos sin red).
 */
export const SOCIAL_STATS_BUNDLE_EMBEDDED: SocialStatsBundle = {
  buildId: SOCIAL_STATS_BUILD_ID,
  slices: [
    withCalcTrace({
      indicatorId: 'dem_pob_ref_mun',
      geoCode: '24028',
      base: {
        indicatorId: 'dem_pob_ref_mun',
        label: 'Población total (referencia ilustrativa)',
        value: 912_871,
        unit: 'habitantes',
        geoLevel: 'municipio',
        geoCode: '24028',
        geoLabel: 'San Luis Potosí, SLP · municipio 24028',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
        caveat: 'Valor ilustrativo para desarrollo; no es cifra oficial del INEGI en esta entrega.',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pob_ref_mun',
      geoCode: '19021',
      base: {
        indicatorId: 'dem_pob_ref_mun',
        label: 'Población total (referencia ilustrativa)',
        value: 163_148,
        unit: 'habitantes',
        geoLevel: 'municipio',
        geoCode: '19021',
        geoLabel: 'San Pedro Garza García, NL · municipio 19021',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pob_ref_mun',
      geoCode: '24',
      base: {
        indicatorId: 'dem_pob_ref_mun',
        label: 'Población total (referencia ilustrativa — ámbito estatal)',
        value: 1_249_009,
        unit: 'habitantes',
        geoLevel: 'entidad_federativa',
        geoCode: '24',
        geoLabel: 'San Luis Potosí · entidad federativa 24',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pob_ref_mun',
      geoCode: 'MTY',
      base: {
        indicatorId: 'dem_pob_ref_mun',
        label: 'Población total (referencia ilustrativa — ZM)',
        value: 5_341_171,
        unit: 'habitantes',
        geoLevel: 'zm_estadistica',
        geoCode: 'MTY',
        geoLabel: 'ZM Monterrey · marco estadístico MTY',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pea_ref',
      geoCode: '24028',
      base: {
        indicatorId: 'dem_pea_ref',
        label: 'PEA — población en condición de ser económicamente activa (referencia ilustrativa)',
        value: 450_000,
        unit: 'habitantes',
        geoLevel: 'municipio',
        geoCode: '24028',
        geoLabel: 'San Luis Potosí, SLP · municipio 24028',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
        caveat: 'Subconjunto ilustrativo para lectura PR4; no es tabulado oficial del INEGI en esta entrega.',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pea_ref',
      geoCode: '19021',
      base: {
        indicatorId: 'dem_pea_ref',
        label: 'PEA — población en condición de ser económicamente activa (referencia ilustrativa)',
        value: 80_000,
        unit: 'habitantes',
        geoLevel: 'municipio',
        geoCode: '19021',
        geoLabel: 'San Pedro Garza García, NL · municipio 19021',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pea_ref',
      geoCode: '24',
      base: {
        indicatorId: 'dem_pea_ref',
        label: 'PEA — referencia ilustrativa (ámbito estatal)',
        value: 612_000,
        unit: 'habitantes',
        geoLevel: 'entidad_federativa',
        geoCode: '24',
        geoLabel: 'San Luis Potosí · entidad federativa 24',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_pea_ref',
      geoCode: 'MTY',
      base: {
        indicatorId: 'dem_pea_ref',
        label: 'PEA — referencia ilustrativa (ZM)',
        value: 2_850_000,
        unit: 'habitantes',
        geoLevel: 'zm_estadistica',
        geoCode: 'MTY',
        geoLabel: 'ZM Monterrey · marco estadístico MTY',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
      },
    }),
    withCalcTrace({
      indicatorId: 'dem_edad_mediana_ref',
      geoCode: '19',
      base: {
        indicatorId: 'dem_edad_mediana_ref',
        label: 'Edad mediana (referencia ilustrativa)',
        value: 32,
        unit: 'años',
        geoLevel: 'entidad_federativa',
        geoCode: '19',
        geoLabel: 'Nuevo León · entidad federativa 19',
        vintageLabel: '2020 · demo estática',
        sourceId: 'demo_bundle_pr3',
        sourceUrl: 'https://www.inegi.org.mx/',
      },
    }),
  ],
}

/** Catálogo fijo de indicadores expuestos en PR3 (subset). */
export const SOCIAL_STATS_INDICATOR_ORDER: readonly string[] = [
  'dem_pob_ref_mun',
  'dem_edad_mediana_ref',
]

/** Re-export para correlación README / JSON público. */
export const SOCIAL_STATS_EMBEDDED_TRACE_TAB = SOCIAL_TRACE_TAB
