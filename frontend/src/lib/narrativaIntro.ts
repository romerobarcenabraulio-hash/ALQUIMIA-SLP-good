/**
 * Q-018 · Narrativa introductoria ciudadana.
 *
 * getNarrativaIntro genera un texto breve, personalizado y no técnico
 * que describe el contexto RSU del municipio/ZM activo.
 *
 * REGLAS (Auditor):
 * - Solo usa los parámetros recibidos — nunca calcula magnitudes propias
 *   (CO₂, árboles, % captura) ni las presenta como hechos.
 * - Si se necesitan KPIs adicionales (CO₂e evitada, empleo), deben venir
 *   como argumentos ya calculados por el motor del simulador.
 * - Máximo 3 frases, lenguaje ciudadano sin siglas técnicas.
 * - Varía el tono por escenario, nunca el dato numérico.
 * - Disclaimer "ilustrativo" cuando el origen es estimado.
 */

/** Gentilicios conocidos por ID de municipio/ZM (catálogo estático). */
const GENTILICIOS: Record<string, string> = {
  SLP: 'potosinos',
  MTY: 'regiomontanos',
  QRO: 'queretanos',
  slp: 'potosinos',
  sol: 'soledenses',
  csp: 'cerreños',
  vip: 'villenses',
  mty: 'regiomontanos',
  spg: 'sampetreños',
  snl: 'nicolaítas',
  gua: 'guadalupenses',
  apo: 'apodaquenses',
  sca: 'santacatarinenses',
  gar: 'garcianos',
  esc: 'escobedenses',
  jua: 'juarenses',
  qro: 'queretanos',
  cor: 'corregidorenses',
  mar: 'marquesanos',
  hui: 'huimilpenses',
}

function fmtNum(n: number): string {
  return n.toLocaleString('es-MX')
}

/**
 * Genera la narrativa introductoria ciudadana.
 * Solo inserta los datos exactos que recibe — no calcula porcentajes
 * ni equivalencias ambientales propias.
 *
 * @param municipioId     - ID del municipio/ZM ('slp', 'SLP', 'mty'…)
 * @param municipioNombre - Nombre legible del municipio/ZM
 * @param poblacion       - Habitantes totales (fuente: store/INEGI)
 * @param rsuDia          - Toneladas RSU por día (fuente: catálogo municipal / API)
 * @param escenario       - Nombre del preset de trayectoria activo
 * @param esEstimado      - true si los datos provienen de estimación (no INEGI oficial)
 */
export function getNarrativaIntro(
  municipioId: string,
  municipioNombre: string,
  poblacion: number,
  rsuDia: number,
  escenario: string,
  esEstimado = false,
): string {
  if (!municipioNombre || poblacion <= 0 || rsuDia <= 0) return ''

  const gentilicio = GENTILICIOS[municipioId] ?? `habitantes de ${municipioNombre}`
  const disclaimer = esEstimado ? ' (datos estimados, no oficiales)' : ''
  const rsuRedondeado = fmtNum(Math.round(rsuDia))
  const pobRedondeado = fmtNum(poblacion)

  const cierreIlustrativo =
    ' Las cifras de impacto (económico o ambiental) salen solo del tablero del simulador, no de este texto.'

  if (escenario === 'Conservador' || escenario === 'Plan SLP Original') {
    return (
      `Los ${pobRedondeado} ${gentilicio} generan ${rsuRedondeado} t de residuos cada día${disclaimer}. ` +
      `En un escenario de ritmo gradual, el simulador explora —solo como ilustración— cómo podría ` +
      `evolucionar ese flujo con separación en cinco fracciones.${cierreIlustrativo}`
    )
  }

  if (escenario === 'Acelerado') {
    return (
      `${municipioNombre} genera ${rsuRedondeado} t de residuos al día${disclaimer}. ` +
      `En el escenario acelerado el modelo ilustra posibles cambios de ritmo e inversión; ` +
      `no afirma resultados municipales sin correr el escenario completo.${cierreIlustrativo}`
    )
  }

  // Realista / Agresivo (default)
  return (
    `${municipioNombre} genera ${rsuRedondeado} t de residuos cada día${disclaimer}. ` +
    `El simulador contrasta escenarios de separación para esos mismos datos de entrada; ` +
    `lo demás son proyecciones del modelo, no hechos externos.${cierreIlustrativo}`
  )
}
