/**
 * PR2 — notas explícitas de alcance diferido (sin implementación en este PR).
 * PR3: Integración INEGI u otras fuentes oficiales con contrato backend, SRID/unidad territorial y PROPOSE/INFORM según Navigator.
 * PR4: KPIs y agregados sociodemográficos solo con chanchado explícito de ámbito; nunca mezclar CVE municipal con agregados ZM en un solo número sin desglose.
 */
export const SOCIAL_PR2_DEFERRED_NOTES = [
  'PR3 — INEGI / registros oficiales: API, catálogos, frescura y trazabilidad; veto Navigator si mezcla unidades.',
  'PR4 — KPI agregados: contratos de agregación, etiquetas de ámbito y ausencia de «aceptación» absoluta sin estudio citado.',
] as const
