/**
 * PR1 — Capa social / demografía (andamiaje).
 * Sin lógica de negocio densa: contratos de declaración de alcance geográfico y estado del dato.
 *
 * Prohibido en PR1: persistencia Zustand, fetch INEGI, mapas, rankings de aceptación.
 *
 * Copy de UI (disclaimer, prohibido/permitido, checklist Legal): `frontend/src/lib/socialContextPlaceholder.ts`.
 */

/** Alcance geográfico obligatorio por bloque sociodemográfico (no mezclar unidades). */
export type SocialGeoScope = 'municipio_cve' | 'zm_estadistica'

/** Estado del dato mostrado (vacío en PR1 salvo `no_disponible` / stub). */
export type SocialDatoEstado = 'disponible' | 'proxy' | 'manual_usuario' | 'no_disponible'

/**
 * Bloque que toda superficie con dato sociodemográfico debe poder declarar en UI.
 * `fuente_declarada` puede ir vacía hasta contrato de backend / Auditor.
 */
export interface SociodemographicDisplayBlock {
  geo_scope: SocialGeoScope
  dato: SocialDatoEstado
  fuente_declarada: string
  /** Opcional: anclaje narrativo (p. ej. `municipal_context` o sub-bloque). */
  screen_anchor?: string
}

/**
 * Envoltura API futura (sin endpoint implementado en PR1).
 * El cliente solo tipa el contrato; no hay fetch ambiguo entre municipio y ZM.
 */
export interface SociodemographicContextApiEnvelope {
  version?: string
  blocks: SociodemographicDisplayBlock[]
}
