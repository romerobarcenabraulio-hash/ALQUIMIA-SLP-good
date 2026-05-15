/**
 * PR3 — Indicadores sociodemográficos oficiales (subconjunto) desde dataset estático o remoto read-only.
 * Fuera de PR3: edición de valores, gráficos interactivos pesados, escritura backend (ver `pr3OutOfScopeCopy`).
 */

/** Niveles que el Navigator distingue; no mezclar números sin etiqueta explícita. */
export type OfficialStatGeoLevel = 'municipio' | 'entidad_federativa' | 'zm_estadistica'

export interface OfficialStatSlice {
  indicatorId: string
  label: string
  value: number
  unit: string
  geoLevel: OfficialStatGeoLevel
  /** CVE INEGI municipio (5 dígitos) o código entidad (2) o id ZM simulador, según geoLevel. */
  geoCode?: string
  geoLabel: string
  vintageLabel: string
  sourceId: string
  sourceUrl?: string
  caveat?: string
  /**
   * Pestaña/hoja del libro en `fuentes de calculo/` (u homólogo) para auditoría humana.
   * En capa social: exigido `sourceSpreadsheetTab` o `excelRowHint` no vacío (validación en tests).
   */
  sourceSpreadsheetTab?: string
  /** Pista de fila/columna/CVE o sección README del maestro. */
  excelRowHint?: string
  /** SHA del commit de extract/validación (opcional). */
  lastExtractedGitShaOpcional?: string
}

export interface SocialStatsBundle {
  buildId: string
  slices: OfficialStatSlice[]
}

export type ResolvedOfficialStat =
  | {
      availability: 'disponible_ambito_solicitado'
      slice: OfficialStatSlice
    }
  | {
      availability: 'disponible_otro_ambito'
      slice: OfficialStatSlice
    }
  | {
      availability: 'no_disponible'
      slice: null
    }
