/**
 * Capa social / demografía — copy validado por Auditoría ALQUIMIA (simulador educativo).
 * Exclusivamente expositivo y heurístico; no sustituye dictamen jurídico ni estudios oficiales.
 */

/** Disclaimer de UI antes de KPIs o inferencias sociales (≤120 palabras). */
export const SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER =
  'Esta capa es exclusivamente expositiva y heurística. Presenta lecturas orientativas sobre posibles fragilidades, heterogeneidad territorial u orden de magnitud demográfico para acompañar la transición en materia de residuos; no constituye dictamen jurídico ni diagnóstico oficial, no mide ni certifica aceptación social ni consenso ciudadano, y no predice conducta electoral ni resultado de autoridades. Los indicadores pueden depender de supuestos, fuentes y recortes geográficos; toda cifra o interpretación debe cotejarse con información oficial, vigente y metodológicamente fundamentada antes de usarse en decisiones públicas, convenios o comunicación externa institucional.'

/** PROHIBIDO en copy público del simulador (lista de verificación). */
export const SOCIAL_COPY_PROHIBITED_PUBLIC: readonly string[] = [
  'Afirmar que el Cabildo u otra autoridad «aprobará», «autorizará» o «decidirá» con certeza con base solo en el simulador.',
  'Garantizar «no habrá rechazo», «no habrá conflicto» o ausencia de resistencia vecinal u organizada.',
  'Presentar porcentajes o niveles de aceptación social, apoyo o consenso como hechos medidos y definitivos sin estudio con metodología y fuente explícitas.',
  'Sustituir consulta ciudadana, participación o dictamen jurídico por la salida del módulo social o demográfico.',
  'Atribuir efectos sancionadores o coercitivos («multará», «clausurará») al simulador o a esta capa sin ordenamiento municipal cotejado y competencia acotada.',
  'Generalizar resultados del municipio activo a toda la zona metropolitana (o viceversa) para sanción, consulta o legitimación de medidas.',
  'Prometer cero riesgo reputacional o cero litigio por «más datos» o por usar el simulador.',
]

/** PERMITIDO con calificadores obligatorios (frases modelo incluidas). */
export const SOCIAL_COPY_PERMITTED_QUALIFIED: readonly string[] = [
  '«Supuesto modelo» / «escenario ilustrativo» — sin validez predictiva ni vinculación a decisión oficial.',
  '«Insumo a planeación y diálogo» — orienta preguntas y rutas de trabajo; no sustituye evidencia ni acuerdo institucional.',
  '«Indicador orientativo» o «orden de magnitud» — sujeto a fuente, vigencia y definición territorial explicitadas.',
  '«Heurística de lectura» de heterogeneidad o posibles tensiones — no certifica conflicto ni ausencia del mismo.',
  '«Coherencia exploratoria» con políticas de RSU — hipótesis de trabajo sujeta a validación competente.',
  '«Riesgo reputacional o conflictivo posible» — formulación condicional; mitigación sugerida, sin garantía de resultado.',
]

/** Revisión rápida Legal antes de merge de textos nuevos que toquen esta capa. */
export const SOCIAL_COPY_LEGAL_PRE_MERGE_CHECKLIST: readonly string[] = [
  '¿El copy evita certeza normativa, electoral y de aceptación social, y deja claro el carácter educativo y expositivo de la capa?',
  '¿El alcance territorial está explícito (municipio activo vs. zona metropolitana vs. agregados) donde pueda confundirse sanción, consulta o legitimación?',
  '¿Ninguna frase promete eliminación de conflicto, consenso futuro o sustitución de dictamen, consulta o proceso aplicable al caso?',
]

/**
 * @deprecated El disclaimer operativo es `SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER`. Se conserva el nombre
 * por imports legacy; el valor ya no es «pendiente auditoría».
 */
export const PLACEHOLDER_COPY_AUDIT_PENDING = SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER

/**
 * Si true, duplica el disclaimer en bloque mono (útil para builds de QA).
 * Por defecto false: el copy aprobado va solo en el panel estándar.
 */
export function shouldShowSocialAuditPlaceholder(): boolean {
  if (typeof process === 'undefined') return false
  return process.env.NEXT_PUBLIC_SHOW_SOCIAL_AUDIT_PLACEHOLDER === 'true'
}
