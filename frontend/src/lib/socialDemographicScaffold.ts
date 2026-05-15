import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'

const SCREEN_ANCHOR = 'municipal_context'

/**
 * Andamiaje PR1: bloque vacío coherente con el territorio seleccionado.
 * Un solo municipio activo → `municipio_cve`; varios o ninguno → lectura ZM estadística.
 * Sin API: valores placeholder hasta contrato backend.
 */
export function buildSociodemographicScaffoldBlock(
  municipiosActivos: string[],
): SociodemographicDisplayBlock {
  const geo_scope = municipiosActivos.length === 1 ? 'municipio_cve' : 'zm_estadistica'
  return {
    geo_scope,
    dato: 'no_disponible',
    fuente_declarada: '',
    screen_anchor: SCREEN_ANCHOR,
  }
}
