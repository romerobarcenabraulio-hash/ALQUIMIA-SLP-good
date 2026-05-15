/**
 * Marco de lectura informativa — INEGI / CONEVAL / fuentes estadísticas oficiales referenciables.
 * Auditoría ALQUIMIA: solo expositivo; no certifica cumplimiento ni sustituye estudios obligatorios.
 */

/** Título corto para `<summary>` o pie de bloque. */
export const OFFICIAL_SOURCES_READING_SUMMARY = 'Lectura de fuentes oficiales'

/**
 * Cuerpo máximo ~100 palabras (Auditoría 2026): vigencia, revisión municipal, no mandato de política.
 */
export const OFFICIAL_SOURCES_READING_BODY =
  'Las cifras que provienen de INEGI, CONEVAL u otra fuente estadística oficial se muestran solo como referencia contextual. ' +
  'Su vigencia frente a terceros no está garantizada por ALQUIMIA: pueden quedar desactualizadas por nuevos cortes, ' +
  'cambios metodológicos o revisiones del propio organismo. La revisión periódica y la decisión de usar o no cada dato ' +
  'en un acto municipal corresponden al ayuntamiento o a la autoridad competente. Un número en pantalla no constituye ' +
  'mandato de política pública, meta presupuestal ni sustituto de análisis técnico-jurídico local.'

/** Checklist de merge antes de exponer un número (UI debe cumplir o no mostrar la cifra). */
export const OFFICIAL_STAT_MERGE_CHECKLIST: readonly string[] = [
  'Etiqueta visible con la unidad geográfica exacta del tabulado (jerarquía tal como la declara la fuente: municipio, entidad, ZM estadística, nacional, etc.).',
  'Si la unidad geográfica del dato no coincide con el municipio CVE activo (o con el alcance declarado en geo_scope), el UI muestra advertencia explícita y no oculta el desajuste.',
  'Fuente referenciable: URL https o identificador de documento publicado por el organismo (sin prometer sincronización automática ni tiempo real).',
  'Vintage visible: año del corte, fecha de publicación del tabulado o leyenda de “última consulta” según lo documentado en el merge.',
  'Incertidumbre o leyenda de agregado regional / celda suprimida / dato provisional en la misma vista que el número.',
  'Magnitud y unidad de medida coherentes con el tabulado oficial (personas, hogares, %, etc.).',
]

/** Prohibido en copy cuando se citan datos INEGI/CONEVAL u homólogos. */
export const OFFICIAL_STAT_PROHIBITED_PUBLIC: readonly string[] = [
  'Presentar la descarga o consulta de datos INEGI (o de cualquier fuente estadística oficial) como certificación de cumplimiento normativo o como evidencia de inspección.',
  'Afirmar que un indicador oficial sustituye estudios de impacto social u otros estudios obligatorios por normativa sectorial aplicable, sin el estudio y la autoridad que correspondan.',
  'Inferir causalidad (“porque el tabulado dice X, el programa Y es necesario o suficiente”) solo con estadística agregada.',
  'Prometer actualización en tiempo real o vigencia permanente frente a terceros.',
]

/**
 * Formato sugerido por indicador (documentación / revisión de contenido).
 * No es un contrato de API; guía para redacción y QA.
 */
export const OFFICIAL_INDICATOR_FORMAT_SPEC =
  'nombre | fuente_corta | unidad_geo declarada | vintage (año/actualización) | incertidumbre o «agregado regional»'
