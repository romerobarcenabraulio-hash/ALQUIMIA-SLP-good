/**
 * CVE INEGI aproximado por id interno del simulador (cuando no hay `seleccionMunicipioCatalog`).
 * Debe alinearse con pipeline / catálogo oficial en integraciones futuras.
 */
export const SIMULATOR_MUNICIPIO_ID_TO_INEGI_CVE: Record<string, string> = {
  slp: '24028',
  sol: '24029',
  csp: '24010',
  vip: '24054',
  mty: '19039',
  spg: '19021',
  snl: '19048',
  gua: '19026',
  apo: '19006',
  sca: '19044',
  gar: '19012',
  esc: '19010',
  jua: '19031',
  qro: '22014',
  cor: '22008',
  mar: '22011',
  hui: '22009',
}

export function resolveMunicipioCveForUi(params: {
  municipioSimulatorId: string | null
  catalogClaveInegi: string | null
}): string | null {
  if (params.catalogClaveInegi?.trim()) {
    return params.catalogClaveInegi.replace(/\D/g, '').slice(0, 5) || null
  }
  if (!params.municipioSimulatorId) return null
  return SIMULATOR_MUNICIPIO_ID_TO_INEGI_CVE[params.municipioSimulatorId] ?? null
}
