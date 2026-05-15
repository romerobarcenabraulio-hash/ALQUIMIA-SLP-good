/**
 * Bitácora de supuestos — capa social (PR2). Append-only en UI; persistencia local/sesión.
 */

export interface SocialAssumptionLogEntry {
  id: string
  texto: string
  /** Origen opcional (p. ej. taller, minuta, «lectura interna»). */
  origen?: string
  /** Marca de tiempo local del cliente (ISO 8601). */
  timestamp: string
  /** true = capturada manualmente por el usuario en esta pantalla. */
  manual: boolean
}

export interface SocialAssumptionsStateV1 {
  schemaVersion: 1
  entries: SocialAssumptionLogEntry[]
}
