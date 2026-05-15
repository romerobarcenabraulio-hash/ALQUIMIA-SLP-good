/**
 * PR5 — Handoff reproducible capa social (sin CRM propio).
 * Elemento mínimo para pegar en herramientas externas o actas internas.
 */

/** Origen lógico dentro de la capa social (sin integración Jira/email en PR5). */
export type SocialBacklogOrigenCapa = 'riesgo' | 'supuesto' | 'indicador' | 'alerta_geo'

/** Severidad operativa interna — solo texto; no es semáforo de democracia ni KPI público. */
export type SocialBacklogSeveridadInterna = 'bajo' | 'medio' | 'alto'

export interface SocialBacklogElementoMinimo {
  titulo: string
  origen_capa: SocialBacklogOrigenCapa
  severidad_interna: SocialBacklogSeveridadInterna
  /** Sugerencia opcional; puede ir vacío hasta asignación formal en otro sistema. */
  responsable_propuesto_opcional: string
  /**
   * Ancla reproducible: p. ej. `module_id:municipal_context` o testid + id técnico.
   * No URL externa obligatoria en PR5.
   */
  enlace_interno_anchor: string
}
