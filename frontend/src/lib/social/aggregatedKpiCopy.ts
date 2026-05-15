/**
 * KPIs cuantitativos agregados o derivados (PR3+) — copy y pies sin equiparar a dictámenes.
 * Auditoría ALQUIMIA: lectura permitida vs inferencia prohibida; pie máx. 45 palabras.
 */

/**
 * Antes del valor en tarjeta (Auditoría: lectura cautelar antes del KPI numérico en el mismo bloque).
 * No sustituye el pie `buildOfficialNumericVisualizationFooter`; refuerza orden de lectura.
 */
export const OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER =
  'Lectura de referencia agregada (no dictamen ni obligación). Ámbito, corte y unidad en etiquetas y pie inferior.'

/** KPI agregado permitido: resume tabulado declarado sin afirmar causa, obligación ni resultado futuro. */
export const AGGREGATED_KPI_ALLOWED_ONE_LINER =
  'KPI agregado permitido: número que resume un corte o derivación explícita (unidad, ámbito geo, vintage, fórmula) sin afirmar causa, obligación, riesgo social real ni resultado futuro más allá de lo que el dato soporta.'

/** Inferencia prohibida en copy: pasar de la cifra a explicar el mundo sin estudio competente acotado al mismo ámbito y vintage. */
export const INFERENCE_PROHIBITED_ONE_LINER =
  'Inferencia prohibida en copy: cualquier “por eso”, ranking social, percentil sin muestra, o prescripción normativa-operativa inferida solo del tabulado.'

/** Criterio único: cuándo mostrar dato grueso / intervalo en lugar de decimal falso (texto para QA y tooltips). */
export const COARSE_OR_INTERVAL_CRITERION =
  'Si el valor depende de agregación con denominador pequeño, celda censurada, imputación, proyección o remuestreo no puntual documentado por la fuente, no se muestra precisión decimal fingida: se usa entero, redondeo explícito, símbolo ≈, intervalo o se omite hasta completar trazabilidad.'

/** Cinco errores típicos de redacción — veto en copy público (referencia para revisores). */
export const AGGREGATED_KPI_COPY_VETO_EXAMPLES: readonly string[] = [
  '“Percentil X” sin declarar muestra, universo, edición del índice y misma unidad geográfica que el percentil.',
  '“Marginalización baja = menor riesgo social” (o el inverso como certeza).',
  '“La tasa subió; por eso deben intensificar sanciones/campañas/inversión” sin acto o estudio competente.',
  'Comparación “vs media nacional” u otro municipio sin misma definición operativa, unidad, vintage y ámbito en ambos lados.',
  'Muchos decimales en tasas o agregados grandes (falsa exactitud que sugiere certidumbre no respaldada).',
]

function wordCountEs(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function shortenGeoForFooter(geoLabel: string, geoLevel: string, geoCode?: string): string {
  const t = geoLabel.trim()
  if (t.length <= 72) return t
  const code = geoCode ? ` · código ${geoCode}` : ''
  return `${geoLevel}${code}`.trim()
}

/**
 * Pie obligatorio por visualización numérica oficial (máx. 45 palabras).
 * Incluye unidad, ámbito, corte y límites de interpretación.
 */
export function buildOfficialNumericVisualizationFooter(params: {
  unit: string
  geoLabel: string
  geoLevel: string
  geoCode?: string
  vintageLabel: string
}): string {
  const ambito = shortenGeoForFooter(params.geoLabel, params.geoLevel, params.geoCode)
  const pie =
    `Unidad: ${params.unit}. Ámbito: ${ambito}. Corte: ${params.vintageLabel}. ` +
    'Agregado de referencia; no dictamen ni obligación; sin causalidad ni ranking social desde esta cifra; no sustituye evidencia local ni trámite al caso.'
  if (wordCountEs(pie) <= 45) return pie
  const short =
    `Unidad: ${params.unit}. Ámbito: ${params.geoLevel}${params.geoCode ? ` ${params.geoCode}` : ''}. Corte: ${params.vintageLabel}. ` +
    'Agregado de referencia; no dictamen; sin causalidad ni ranking; no sustituye evidencia local.'
  if (wordCountEs(short) <= 45) return short
  return (
    `Unidad: ${params.unit}. Ámbito: ${params.geoLevel}. Corte: ${params.vintageLabel}. ` +
    'Referencia agregada; no dictamen; no prescripción.'
  )
}

const COUNT_UNIT = /^(habitantes|hab\.?|personas?|viviendas?|hogares?)$/i
const YEAR_UNIT = /^años?$/i
const PCT_UNIT = /^(%|pp|p\.p\.|por\s*ciento)$/i

export type OfficialStatValueFormat = {
  display: string
  /** Nota breve cuando se evita decimal falso. */
  precisionNote: string | null
}

/**
 * Formato de valor para tarjeta PR3: evita falsos decimales en conteos y agregados grandes.
 */
export function formatOfficialStatValueForDisplay(slice: {
  value: number
  unit: string
  caveat?: string
}): OfficialStatValueFormat {
  const u = slice.unit.trim()
  const caveatLower = (slice.caveat ?? '').toLowerCase()
  const needsCoarse = /ilustrativ|demo|provisional|subconjunto|estim|aprox|sensibilidad/i.test(caveatLower)

  if (COUNT_UNIT.test(u) || YEAR_UNIT.test(u)) {
    const n = Math.round(slice.value)
    return {
      display: new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n),
      precisionNote: needsCoarse ? 'Dato mostrado en enteros (sin decimales artificiales).' : null,
    }
  }

  if (PCT_UNIT.test(u)) {
    const decimals = slice.value >= 10 || needsCoarse ? 0 : 1
    return {
      display: new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(slice.value),
      precisionNote:
        needsCoarse || decimals === 0
          ? 'Porcentaje sin precisión decimal fingida cuando el tabulado no la respalda.'
          : null,
    }
  }

  const isInt = Math.abs(slice.value - Math.round(slice.value)) < 1e-9
  if (isInt) {
    return {
      display: new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Math.round(slice.value)),
      precisionNote: needsCoarse ? 'Valor entero; evitar decimales espurios.' : null,
    }
  }

  return {
    display: new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(slice.value),
    precisionNote: needsCoarse ? 'Máximo un decimal; evitar falsa exactitud.' : null,
  }
}
