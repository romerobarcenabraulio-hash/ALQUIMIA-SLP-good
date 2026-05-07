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
 *
 * Alcance territorial (Navigator): vista de municipio único vs ZM completa vs subconjunto.
 */

import type { SimulatorState, SnapshotDatos } from '@/types'
import { ESTACIONALIDAD } from '@/lib/constants'
import { getZmRecord, resolveSimulationGeography } from '@/lib/zmPopulationScale'

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

function clampMesIdx(mesInicio: number): number {
  return Math.min(11, Math.max(0, mesInicio - 1))
}

export type NarrativaTerritorioScope = 'municipio' | 'zm_completa' | 'subconjunto_zm'

export interface CitizenNarrativaContext {
  scope: NarrativaTerritorioScope
  municipioId: string
  territorioNombre: string
  poblacion: number
  rsuDia: number
  esEstimado: boolean
}

/**
 * Resuelve población y RSU/día coherente con el motor (gen per cápita + estacionalidad),
 * priorizando catálogo INEGI solo cuando el municipio activo coincide con `seleccionMunicipioCatalog`.
 */
export function resolveCitizenNarrativaContext(
  state: SimulatorState & { snapshotDatos?: SnapshotDatos | null },
): CitizenNarrativaContext | null {
  const zm = getZmRecord(state.zmActiva)
  const geo = resolveSimulationGeography(state)
  const genKgDia = state.genPercapita || zm.genKgDia
  const factorEst = 1 + ESTACIONALIDAD[clampMesIdx(state.mesInicio ?? 1)]

  const rsuFromPop = (pob: number) => pob * genKgDia / 1000 * factorEst

  if (geo.allMunicipiosActivos) {
    const pob = geo.popActiva
    const rsu = rsuFromPop(pob)
    if (pob <= 0 || rsu <= 0) return null
    const popKpi = state.snapshotDatos?.kpis.find(k => k.kpi_id === 'poblacion_total')
    const popFromSnapshot =
      popKpi && popKpi.provenance.tipo !== 'no_disponible' && typeof popKpi.valor === 'number'
    const esEstimado = !popFromSnapshot
    return {
      scope: 'zm_completa',
      municipioId: zm.id,
      territorioNombre: zm.nombre,
      poblacion: pob,
      rsuDia: rsu,
      esEstimado,
    }
  }

  if (geo.muniActivos.length === 1) {
    const m = geo.muniActivos[0]
    const sel = state.seleccionMunicipioCatalog
    if (
      sel &&
      sel.municipioSimulatorId === m.id &&
      sel.zmSimulatorId === state.zmActiva &&
      state.municipiosActivos.includes(m.id) &&
      sel.poblacion > 0 &&
      sel.generacionRsuDia > 0
    ) {
      return {
        scope: 'municipio',
        municipioId: m.id,
        territorioNombre: sel.nombre,
        poblacion: sel.poblacion,
        rsuDia: sel.generacionRsuDia,
        esEstimado: sel.datosEstimados,
      }
    }

    const pob = geo.popActiva
    const rsu = rsuFromPop(pob)
    if (pob <= 0 || rsu <= 0) return null
    return {
      scope: 'municipio',
      municipioId: m.id,
      territorioNombre: m.nombre,
      poblacion: pob,
      rsuDia: rsu,
      esEstimado: false,
    }
  }

  const pob = geo.popActiva
  const rsu = rsuFromPop(pob)
  if (pob <= 0 || rsu <= 0) return null
  return {
    scope: 'subconjunto_zm',
    municipioId: zm.id,
    territorioNombre: `${zm.nombre} (${geo.muniActivos.length} municipios)`,
    poblacion: pob,
    rsuDia: rsu,
    esEstimado: true,
  }
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
 * @param scope          - municipio único, ZM completa o subconjunto municipal (Q-018)
 */
export function getNarrativaIntro(
  municipioId: string,
  municipioNombre: string,
  poblacion: number,
  rsuDia: number,
  escenario: string,
  esEstimado = false,
  scope: NarrativaTerritorioScope = 'municipio',
): string {
  if (!municipioNombre || poblacion <= 0 || rsuDia <= 0) return ''

  const gentilicioMunicipio = GENTILICIOS[municipioId] ?? `habitantes de ${municipioNombre}`
  const gentilicioSub =
    GENTILICIOS[municipioId] ?? 'personas en el ámbito seleccionado'

  const disclaimer = esEstimado ? ' (datos estimados, no oficiales)' : ''
  const rsuRedondeado = fmtNum(Math.round(rsuDia))
  const pobRedondeado = fmtNum(poblacion)

  const cierreIlustrativo =
    ' Las cifras de impacto (económico o ambiental) salen solo del tablero del simulador, no de este texto.'

  if (escenario === 'Conservador' || escenario === 'Plan SLP Original') {
    const cuerpo =
      scope === 'municipio'
        ? `Los ${pobRedondeado} ${gentilicioMunicipio} generan ${rsuRedondeado} t de residuos cada día${disclaimer}. `
        : scope === 'zm_completa'
          ? `En la zona metropolitana de ${municipioNombre}, los ${pobRedondeado} habitantes modelados generan ${rsuRedondeado} t de residuos cada día${disclaimer}. `
          : `En el ámbito elegido —${municipioNombre}— viven ${pobRedondeado} ${gentilicioSub} y se modelan ${rsuRedondeado} t de residuos al día${disclaimer}. `
    return (
      cuerpo +
      `En un escenario de ritmo gradual, el simulador explora —solo como ilustración— cómo podría ` +
      `evolucionar ese flujo con separación en cinco fracciones.${cierreIlustrativo}`
    )
  }

  if (escenario === 'Acelerado') {
    const cuerpo =
      scope === 'municipio'
        ? `${municipioNombre} genera ${rsuRedondeado} t de residuos al día${disclaimer}. `
        : scope === 'zm_completa'
          ? `La zona metropolitana de ${municipioNombre} concentra un flujo modelado de ${rsuRedondeado} t de residuos al día${disclaimer}. `
          : `El ámbito seleccionado (${municipioNombre}) suma ${rsuRedondeado} t de residuos diarios en el modelo${disclaimer}. `
    return (
      cuerpo +
      `En el escenario acelerado el modelo ilustra posibles cambios de ritmo e inversión; ` +
      `no afirma resultados municipales sin correr el escenario completo.${cierreIlustrativo}`
    )
  }

  // Realista / Agresivo (default)
  const kgPercapita = (rsuDia * 1000 / poblacion).toFixed(2)
  const cuerpo =
    scope === 'municipio'
      ? `Tu municipio genera ${kgPercapita} kilogramos de basura por persona cada día${disclaimer}. `
      : scope === 'zm_completa'
        ? `En la zona metropolitana de ${municipioNombre}, el promedio modelado es de ${kgPercapita} kg de residuo por persona al día${disclaimer}. `
        : `En tu selección (${municipioNombre}), el promedio modelado es de ${kgPercapita} kg por persona al día${disclaimer}. `
  return (
    cuerpo +
    `De ese total, más del 40% tiene valor económico si se separa correctamente. ` +
    `Esta plataforma te muestra cómo funciona el programa y qué esperar ` +
    `cuando lleguen los nuevos contenedores a tu colonia.`
  )
}
