/** Últimas N entradas de bitácora incluidas en export PR5 (preview estático). */
export const SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N = 20

/**
 * Preview / export visibles salvo ambiente ciudadano u op-out explícito.
 * `NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN=1|true` u `NEXT_PUBLIC_CITIZEN_UI=1|true` oculta acciones.
 */
export function isSocialContextExportUiEnabled(): boolean {
  const h = process.env.NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN?.trim().toLowerCase()
  if (h === '1' || h === 'true' || h === 'yes') return false
  const c = process.env.NEXT_PUBLIC_CITIZEN_UI?.trim().toLowerCase()
  if (c === '1' || c === 'true' || c === 'yes') return false
  return true
}
