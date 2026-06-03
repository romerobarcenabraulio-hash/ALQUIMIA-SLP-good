/**
 * Textos únicos para banner de simulación y exportación (Navigator: UI ≠ oficialidad ≠ capa MGN).
 *
 * NOTA LEGAL (CLC · Q-010 · 2026-05-06): estos textos son la capa de disclaimer de la plataforma.
 * No constituyen términos de uso ni aviso de privacidad; esos instrumentos son documentos separados
 * pendientes de elaboración antes del release público. Ver `planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` bajo `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/`.
 */

export const SIMULATION_BANNER_TITLE = 'Modelo técnico — no oficial'

export const SIMULATION_BANNER_BODY =
  'ALQUIMIA muestra esta experiencia como modelo técnico: no sustituye dictamen jurídico ni resolución administrativa ni dato estadístico oficial. Obligaciones, reglamentos y sanciones se evalúan por municipio; la zona metropolitana coordina territorio pero no reemplaza al ayuntamiento. Los vínculos a fuentes locales y cualquier "verificado" en app requieren validación institucional. El campo catalog_simulation_epoch del API marca la época de referencia del catálogo hasta anclaje CVE/MGN (Navigator).'

/** Una línea para pie de página / portada de exportación prevista. */
export const EXPORT_SIMULATION_FOOTER_LINE =
  'Modelo técnico ALQUIMIA — no constituye dictamen ni documento oficial; validar siempre con autoridad competente y fuentes publicadas.'

/** Teaser para selector ciudad (API + banner superiores llevan el párrafo completo). */
export const SIMULATION_CONTEXT_TEASER =
  'Modelo técnico sin dictamen oficial. Sanciones y reglamento se evalúan por municipio; la ZM coordina territorio.'

/**
 * Texto de confirmación para el modal / paso previo al botón "Genera mi plan".
 * Debe mostrarse en un modal de aceptación explícita antes de lanzar el flujo de generación documental.
 * El usuario debe marcar "Entendido" o "Acepto" antes de continuar.
 */
export const GENERA_PLAN_MODAL_DISCLAIMER =
  'Los documentos que se generarán a continuación son borradores técnicos producidos automáticamente. ' +
  'No constituyen dictamen jurídico, acto de autoridad, propuesta de ley oficial ni asesoría legal certificada. ' +
  'Las proyecciones financieras y normativas son estimaciones del modelo basadas en los parámetros ingresados; ' +
  'no garantizan resultados ni sustituyen estudios técnicos, dictámenes de abogado o resoluciones de autoridad competente. ' +
  'Antes de presentar cualquier documento generado ante un cabildo, autoridad o contraparte, debe ser revisado ' +
  'por profesionistas con cédula vigente en la materia. Al continuar, confirmas que entiendes el alcance de este modelo técnico.'

/**
 * Encabezado de portada para documentos exportados.
 * Usar en la primera página de cualquier PDF o descarga generada por el pipeline.
 */
export const TECHNICAL_EXPORT_COVER_DISCLAIMER =
  'BORRADOR TÉCNICO — PAQUETE DE CONSULTORÍA ALQUIMIA · NO OFICIAL\n\n' +
  'Este documento fue generado automáticamente como insumo de análisis y planeación municipal. ' +
  'No constituye dictamen jurídico, acto de autoridad, resolución administrativa, propuesta de ley ' +
  'oficial ni asesoría legal certificada. Las cifras, proyecciones y referencias normativas son ' +
  'estimaciones del modelo; no sustituyen estudios oficiales ni instrumentos jurídicos firmados. ' +
  'Requiere revisión por profesionista con cédula vigente antes de cualquier uso oficial. ' +
  '— ALQUIMIA · Plataforma de Consultoría de Circularidad Municipal'

/**
 * Nota de pie para documentos exportados (versión corta).
 * Complementa EXPORT_SIMULATION_FOOTER_LINE en documentos de múltiples páginas.
 */
export const EXPORT_LIABILITY_WAIVER =
  'ALQUIMIA no asume responsabilidad por decisiones de política pública, contrataciones, sanciones ' +
  'ni reformas reglamentarias adoptadas con base en los resultados de este modelo técnico. ' +
  'Los datos de INEGI y reglamentos municipales referenciados se reproducen como marco informativo; ' +
  'su uso específico requiere verificación en fuente oficial.'

export const CONSULTING_EXPORT_COVER_DISCLAIMER =
  'BORRADOR TÉCNICO · PAQUETE DE CONSULTORÍA ALQUIMIA · NO OFICIAL\n\n' +
  'Este documento fue generado automáticamente como insumo de análisis, planeación y cotejo documental municipal. ' +
  'No constituye dictamen jurídico, acto de autoridad, resolución administrativa, propuesta de ley oficial ni asesoría legal certificada. ' +
  'Las cifras, escenarios y referencias normativas se publican solo cuando existe fuente, fecha, método, alcance, confianza y revisión humana pendiente o validada. ' +
  'Cuando falta evidencia, el paquete conserva la brecha crítica y no la sustituye con benchmark.'

export const CONSULTING_EXPORT_LIABILITY_WAIVER =
  'ALQUIMIA no sustituye decisiones políticas, firma profesional, contratación pública, estudio local ni revisión jurídica competente. ' +
  'Los escenarios son herramientas de planeación condicionadas a la evidencia cargada y a revisión humana.'
