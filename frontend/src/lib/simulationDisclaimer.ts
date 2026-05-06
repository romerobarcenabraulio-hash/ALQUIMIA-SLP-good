/**
 * Textos únicos para banner de simulación y exportación (Navigator: UI ≠ oficialidad ≠ capa MGN).
 *
 * NOTA LEGAL (CLC · Q-010 · 2026-05-06): estos textos son la capa de disclaimer de la plataforma.
 * No constituyen términos de uso ni aviso de privacidad; esos instrumentos son documentos separados
 * pendientes de elaboración antes del release público. Ver bitácora BITACORA_AUDITORIA_PLANEACION.md.
 */

export const SIMULATION_BANNER_TITLE = 'Simulación — no oficial'

export const SIMULATION_BANNER_BODY =
  'ALQUIMIA muestra esta experiencia como simulación: no sustituye dictamen jurídico ni resolución administrativa ni dato estadístico oficial. Obligaciones, reglamentos y sanciones se evalúan por municipio; la zona metropolitana coordina territorio pero no reemplaza al ayuntamiento. Los vínculos a fuentes locales y cualquier "verificado" en app requieren validación institucional. El campo catalog_simulation_epoch del API marca la época semilla del catálogo hasta anclaje CVE/MGN (Navigator).'

/** Una línea para pie de página / portada de exportación prevista. */
export const EXPORT_SIMULATION_FOOTER_LINE =
  'Simulación ALQUIMIA — no constituye dictamen ni documento oficial; validar siempre con autoridad competente y fuentes publicadas.'

/** Teaser para selector ciudad (API + banner superiores llevan el párrafo completo). */
export const SIMULATION_CONTEXT_TEASER =
  'Simulación sin dictamen oficial. Sanciones y reglamento se evalúan por municipio; la ZM coordina territorio.'

/**
 * Texto de confirmación para el modal / paso previo al botón "Genera mi plan".
 * Debe mostrarse en un modal de aceptación explícita antes de lanzar el pipeline ÁGORA.
 * El usuario debe marcar "Entendido" o "Acepto" antes de continuar.
 */
export const GENERA_PLAN_MODAL_DISCLAIMER =
  'Los documentos que se generarán a continuación son borradores de simulación producidos automáticamente. ' +
  'No constituyen dictamen jurídico, acto de autoridad, propuesta de ley oficial ni asesoría legal certificada. ' +
  'Las proyecciones financieras y normativas son estimaciones del modelo basadas en los parámetros ingresados; ' +
  'no garantizan resultados ni sustituyen estudios técnicos, dictámenes de abogado o resoluciones de autoridad competente. ' +
  'Antes de presentar cualquier documento generado ante un cabildo, autoridad o contraparte, debe ser revisado ' +
  'por profesionistas con cédula vigente en la materia. Al continuar, confirmas que entiendes el alcance de esta simulación.'

/**
 * Encabezado de portada para documentos ÁGORA exportados.
 * Usar en la primera página de cualquier PDF o descarga generada por el pipeline.
 */
export const AGORA_EXPORT_COVER_DISCLAIMER =
  '⚠️ BORRADOR — SIMULACIÓN ALQUIMIA · NO OFICIAL\n\n' +
  'Este documento fue generado automáticamente como insumo de análisis y planeación municipal. ' +
  'No constituye dictamen jurídico, acto de autoridad, resolución administrativa, propuesta de ley ' +
  'oficial ni asesoría legal certificada. Las cifras, proyecciones y referencias normativas son ' +
  'estimaciones del modelo; no sustituyen estudios oficiales ni instrumentos jurídicos firmados. ' +
  'Requiere revisión por profesionista con cédula vigente antes de cualquier uso oficial. ' +
  '— ALQUIMIA · Plataforma de Simulación de Circularidad Municipal'

/**
 * Nota de pie para documentos exportados (versión corta).
 * Complementa EXPORT_SIMULATION_FOOTER_LINE en documentos de múltiples páginas.
 */
export const EXPORT_LIABILITY_WAIVER =
  'ALQUIMIA no asume responsabilidad por decisiones de política pública, contrataciones, sanciones ' +
  'ni reformas reglamentarias adoptadas con base en los resultados de esta simulación. ' +
  'Los datos de INEGI y reglamentos municipales referenciados se reproducen como marco informativo; ' +
  'su uso específico requiere verificación en fuente oficial.'
