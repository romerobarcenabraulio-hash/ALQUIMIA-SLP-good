/**
 * Motor de Recomendación ALQUIMIA — "Cotización Óptima por Municipio"
 *
 * Dado el estado actual del simulador (municipio seleccionado, metas de
 * captura, precios de materiales) produce la `CotizacionRecomendada`:
 * la combinación de Fase, mix de CAs y recicladoras que maximiza la
 * viabilidad financiera dado el perfil específico del municipio.
 *
 * Lógica de selección:
 *   1. Calcular ton/día a capturar con la meta de captación del año 3.
 *   2. Seleccionar la Fase ALQUIMIA cuya capacidad sea ≥ la meta
 *      (primer paso), con una "ventana de seguridad" del 20 % (no
 *      sobredimensionar).
 *   3. Para las recicladoras: activar sólo los giros cuya TIR sea ≥ 0
 *      Y que correspondan a fracciones significativas (≥ umbral) del RSU.
 *   4. Calcular score de viabilidad (0–100) ponderando TIR, payback,
 *      DSCR y cobertura de la meta.
 *   5. Emitir un objeto `CotizacionRecomendada` con todo lo necesario
 *      para guardarlo en BD, mostrarlo en UI y reproducirlo auditablemente.
 *
 * Fuentes de datos:
 *   - FASES_INVERSION, CAPEX_CA, OPEX_CA, RECICLADORAS → capexOpexData.ts
 *   - COMPOSICION_RSU_DETALLE → constants.ts
 *
 * Toda modificación debe incluir justificación y fecha en el commit.
 */

import {
  FASES_INVERSION,
  CAPEX_CA,
  OPEX_CA,
  RECICLADORAS,
  type GiroRecicladora,
  type FaseInversion,
} from '@/lib/capexOpexData'
import { COMPOSICION_RSU_DETALLE } from '@/lib/constants'
import type { SimulatorState, ResultadosCalculados, TamañoCA } from '@/types'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface RecicladoraRecomendada {
  giro: GiroRecicladora
  nombre: string
  justificacion: string
  capexMXN: number
  opexMesMXN: number
  tirPct: number
  paybackMeses: number
  empleos: number
}

export interface MixCAs {
  P: number
  M: number
  G: number
}

export interface ResumenFinanciero {
  /** CAPEX total CAs + recicladoras (MXN) */
  capexTotalMXN: number
  /** OPEX mensual total en régimen (año 3) */
  opexMesMXN: number
  /** EBITDA mensual proyectado año 3 */
  ebitdaMesMXN: number
  /** Empleos directos totales */
  empleosDirectos: number
  /** CO₂e evitadas/año (ton) — del ResultadosCalculados del simulador */
  co2eAnualTon: number
  /** TIR estimada del sistema (promedio ponderado CAs + recicladoras más rentables) */
  tirEstimadaPct: number
  /** Payback simple estimado (meses) */
  paybackMeses: number
}

export interface JustificacionCotizacion {
  /** Descripción concisa del razonamiento de la recomendación */
  textoEjecutivo: string
  /** Factores positivos que apoyan la inversión */
  factoresFavorables: string[]
  /** Restricciones o riesgos detectados */
  restricciones: string[]
  /** Supuestos clave utilizados */
  supuestosClave: string[]
}

/**
 * La cotización recomendada completa. Se guarda como JSON en BD y se
 * muestra en el módulo de exportación del simulador.
 */
export interface CotizacionRecomendada {
  /** UUID único generado en el cliente; usado como idempotency key al guardar */
  id: string
  version: number
  generadoEn: string  // ISO 8601
  generadoPor: 'sistema' | 'agente' | 'consultor'

  // ── Inputs del municipio ────────────────────────────────────────────────────
  municipioId: string
  municipioNombre: string
  zm: string
  poblacion: number
  rsuTotalTonDia: number
  pctCapturaMeta: number  // año 3, 0–100
  tonCapturaMeta: number  // = rsuTotalTonDia × pctCapturaMeta / 100
  horizonteAnos: number
  precios: SimulatorState['precios']

  // ── Recomendación ───────────────────────────────────────────────────────────
  faseRecomendada: number
  faseNombre: string
  mixCAs: MixCAs
  /** Capacidad instalada total de CAs en la fase (ton/día) */
  capacidadCAs: number
  /** % de cobertura de la meta: capacidadCAs / tonCapturaMeta */
  coberturaMetaPct: number
  recicladoras: RecicladoraRecomendada[]

  // ── Finanzas ────────────────────────────────────────────────────────────────
  resumen: ResumenFinanciero

  // ── Viabilidad ──────────────────────────────────────────────────────────────
  /** 0–100. ≥ 70 = viable, 50–69 = condicionada, < 50 = requiere subsidio */
  scoreViabilidad: number
  clasificacionViabilidad: 'viable' | 'condicionada' | 'requiere_subsidio'

  justificacion: JustificacionCotizacion

  /** Disclaimer obligatorio para todos los documentos públicos */
  disclaimer: string
}

// ─── Constantes internas ──────────────────────────────────────────────────────

/** TIR mínima para activar un giro de recicladora (%) */
const TIR_MINIMA_RECICLADORA = 0

/** Fracción mínima del RSU para justificar un giro (0–1) */
const UMBRAL_FRACCION_RSU: Record<GiroRecicladora, number> = {
  pet:       0.05,  // 5% plástico × 50% PET = 2.5% mínimo en RSU total
  papel:     0.08,  // 8% papel mínimo
  aluminio:  0.01,  // aluminio siempre vale la pena (alto valor)
  vidrio:    0.04,  // 4% vidrio mínimo
  organicos: 0.30,  // 30% orgánicos mínimo para biodigestor/composta
}

const DISCLAIMER =
  'Este documento es una estimación técnica-financiera generada con ' +
  'datos de acceso público (INEGI, SEMARNAT, CEMPRE, ANIPAC) y ' +
  'supuestos operativos del modelo ALQUIMIA. No constituye dictamen ' +
  'oficial, oferta contractual ni garantía de resultados. Los valores ' +
  'reales dependen de condiciones específicas del municipio, procesos ' +
  'de licitación y mercado de materiales en la fecha de ejecución.'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMixCAs(mixStr: string): MixCAs {
  // e.g. "5P+1M+0G" → {P:5, M:1, G:0}
  const match = mixStr.match(/(\d+)P\+(\d+)M\+(\d+)G/)
  if (!match) return { P: 0, M: 0, G: 0 }
  return { P: Number(match[1]), M: Number(match[2]), G: Number(match[3]) }
}

function calcCapexCAs(mix: MixCAs): number {
  return (
    mix.P * CAPEX_CA.P.totalCAPEX +
    mix.M * CAPEX_CA.M.totalCAPEX +
    mix.G * CAPEX_CA.G.totalCAPEX
  )
}

function calcOpexMesCAs(mix: MixCAs): number {
  return (
    mix.P * OPEX_CA.P.totalOPEXMes +
    mix.M * OPEX_CA.M.totalOPEXMes +
    mix.G * OPEX_CA.G.totalOPEXMes
  )
}

function calcEmpleosCAs(mix: MixCAs): number {
  // Approx: P=5, M=14, G=33 empleos (CA_CONFIG values)
  return mix.P * 5 + mix.M * 14 + mix.G * 33
}

function computeScoreViabilidad(
  tirEstimada: number,
  paybackMeses: number,
  coberturaMetaPct: number,
): number {
  // 40 pts por TIR: cada punto de TIR sobre 0% = 0.4 pts, máx 40
  const tirScore = Math.min(40, Math.max(0, tirEstimada * 0.4))
  // 30 pts por payback: ≤ 12 m = 30, ≤ 24 = 20, ≤ 48 = 10, > 48 = 0
  const paybackScore =
    paybackMeses <= 12 ? 30 :
    paybackMeses <= 24 ? 20 :
    paybackMeses <= 48 ? 10 : 0
  // 30 pts por cobertura de la meta: cobertura 100%+ = 30, 80% = 24, 60% = 18
  const cobScore = Math.min(30, Math.max(0, (coberturaMetaPct / 100) * 30))
  return Math.round(tirScore + paybackScore + cobScore)
}

/**
 * Selecciona los giros de recicladoras apropiados para el perfil RSU
 * y los precios actuales del mercado.
 */
function seleccionarRecicladoras(
  precios: SimulatorState['precios'],
): RecicladoraRecomendada[] {
  const rsuComp = COMPOSICION_RSU_DETALLE
  const resultado: RecicladoraRecomendada[] = []

  // Fracción de cada giro en el RSU total
  const fraccionPET      = rsuComp.plastico.pct * rsuComp.plastico.petPct      // ~6.5%
  const fraccionPapel    = rsuComp.papel.pct                                    // 12%
  const fraccionAluminio = rsuComp.metales.pct * rsuComp.metales.aluminioPct    // ~2.1%
  const fraccionVidrio   = rsuComp.vidrio.pct                                   // 4%
  const fraccionOrganico = rsuComp.organico.pct                                 // 52%

  const giros: Array<{
    giro: GiroRecicladora
    fraccion: number
    precioClave: number
    umbralPrecio: number
  }> = [
    { giro: 'pet',       fraccion: fraccionPET,      precioClave: precios.pet,      umbralPrecio: 4.0 },
    { giro: 'papel',     fraccion: fraccionPapel,    precioClave: precios.papel,    umbralPrecio: 2.0 },
    { giro: 'aluminio',  fraccion: fraccionAluminio, precioClave: precios.aluminio, umbralPrecio: 12.0 },
    { giro: 'vidrio',    fraccion: fraccionVidrio,   precioClave: precios.vidrio,   umbralPrecio: 1.5 },
    { giro: 'organicos', fraccion: fraccionOrganico, precioClave: precios.organico, umbralPrecio: 0.25 },
  ]

  for (const g of giros) {
    const rec = RECICLADORAS[g.giro]
    const cumpleFraccion   = g.fraccion >= UMBRAL_FRACCION_RSU[g.giro]
    const cumpleTIR        = rec.tirProyecto >= TIR_MINIMA_RECICLADORA
    const cumplePrecio     = g.precioClave >= g.umbralPrecio

    if (!cumpleFraccion || !cumpleTIR || !cumplePrecio) continue

    const justificacionPartes: string[] = []
    justificacionPartes.push(`RSU ${(g.fraccion * 100).toFixed(1)}% → ${(g.fraccion * rec.opex.cmvCompraMPMes > 0 ? 'con CMV' : 'sin CMV')}`)
    if (rec.tirProyecto > 0) justificacionPartes.push(`TIR ${rec.tirProyecto}%`)
    justificacionPartes.push(`precio actual $${g.precioClave.toFixed(2)}/kg`)

    resultado.push({
      giro: g.giro,
      nombre: rec.nombre,
      justificacion: justificacionPartes.join(', '),
      capexMXN: rec.capex.totalCAPEX,
      opexMesMXN: rec.opexMes,
      tirPct: rec.tirProyecto,
      paybackMeses: rec.paybackMeses,
      empleos: rec.empleosPorPlanta,
    })
  }

  return resultado
}

// ─── Motor principal ──────────────────────────────────────────────────────────

/**
 * Genera la cotización recomendada para el municipio activo en el store.
 * Se llama desde el store tras calcular() o al abrir ScenariosExport.
 */
export function generarCotizacion(
  state: SimulatorState,
  resultados: ResultadosCalculados,
): CotizacionRecomendada {
  // ── 1. Parámetros del municipio ──────────────────────────────────────────────
  const municipioId   = state.seleccionMunicipioCatalog?.claveInegi ?? state.zmActiva
  const municipioNom  = state.seleccionMunicipioCatalog?.nombre ?? state.zmActiva
  const zm            = state.zmActiva
  const poblacion     = resultados.pobActiva
  const rsuTotalTonDia = resultados.rsuTotalTonDia
  const pctCapturaMeta = (state.pctCapturaPorAño[2] ?? state.pctCapturaPorAño.at(-1) ?? 40) * 100
  const tonCapturaMeta = rsuTotalTonDia * (pctCapturaMeta / 100)
  const horizonteAnos = state.horizonte

  // ── 2. Selección de Fase ─────────────────────────────────────────────────────
  // Seleccionar la primera fase que cubra la meta. Si la meta supera
  // la capacidad de la fase 6, usar fase 6 e indicar el gap.
  const VENTANA_SOBREDIM = 1.20  // No más de 20% sobre la meta
  let faseSeleccionada: FaseInversion = FASES_INVERSION[FASES_INVERSION.length - 1]

  for (const fase of FASES_INVERSION) {
    if (fase.capTonDia >= tonCapturaMeta) {
      // Verificar que no sobredimensione por más del 20% respecto a la siguiente fase inferior
      faseSeleccionada = fase
      break
    }
  }

  const mixCAs = parseMixCAs(faseSeleccionada.mixCAs)
  const capacidadCAs = faseSeleccionada.capTonDia
  const coberturaMetaPct = tonCapturaMeta > 0
    ? Math.min(150, (capacidadCAs / tonCapturaMeta) * 100)
    : 100

  // ── 3. Recicladoras ──────────────────────────────────────────────────────────
  // Solo aplican en fases 4+ (cuando hay volumen suficiente para una recicladora)
  const recicladoras = faseSeleccionada.fase >= 4
    ? seleccionarRecicladoras(state.precios)
    : []

  // ── 4. Resumen financiero ────────────────────────────────────────────────────
  const capexCAs       = calcCapexCAs(mixCAs)
  const capexRecic     = recicladoras.reduce((s, r) => s + r.capexMXN, 0)
  const capexTotalMXN  = capexCAs + capexRecic

  const opexCAs        = calcOpexMesCAs(mixCAs)
  const opexRecic      = recicladoras.reduce((s, r) => s + r.opexMesMXN, 0)
  const opexMesMXN     = opexCAs + opexRecic

  const empCAs         = calcEmpleosCAs(mixCAs)
  const empRecic       = recicladoras.reduce((s, r) => s + r.empleos, 0)
  const empleosDirectos = empCAs + empRecic

  // EBITDA: usar el de la fase si hay recicladoras, sino escalar CA_CONFIG
  const ebitdaMesMXN = faseSeleccionada.ebitdaMesSistema > 0
    ? faseSeleccionada.ebitdaMesSistema
    : resultados.ebitda / (horizonteAnos * 12)

  // TIR estimada: promedio ponderado por CAPEX de CAs rentables + recicladoras
  const tirCAs = 80  // promedio CAs (CA_CONFIG: P=109, M=155, G=130)
  const tirRecic = recicladoras.length > 0
    ? recicladoras.reduce((s, r) => s + Math.max(0, r.tirPct), 0) / recicladoras.length
    : 0
  const tirEstimadaPct = capexTotalMXN > 0
    ? ((tirCAs * capexCAs + tirRecic * capexRecic) / capexTotalMXN)
    : tirCAs

  // Payback estimado: CAPEX / EBITDA_mes
  const paybackMeses = ebitdaMesMXN > 0
    ? Math.round(capexTotalMXN / ebitdaMesMXN)
    : 999

  // ── 5. Score de viabilidad ───────────────────────────────────────────────────
  const scoreViabilidad = computeScoreViabilidad(tirEstimadaPct, paybackMeses, coberturaMetaPct)
  const clasificacionViabilidad: CotizacionRecomendada['clasificacionViabilidad'] =
    scoreViabilidad >= 70 ? 'viable' :
    scoreViabilidad >= 50 ? 'condicionada' : 'requiere_subsidio'

  // ── 6. Justificación ejecutiva ───────────────────────────────────────────────
  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)} M`
  const factoresFavorables: string[] = []
  const restricciones: string[] = []

  if (resultados.tir > 15) factoresFavorables.push(`TIR del simulador (${resultados.tir.toFixed(1)}%) por encima del WACC`)
  if (resultados.co2eEvitadasAnualTon > 500) factoresFavorables.push(`Reducción de ${resultados.co2eEvitadasAnualTon.toFixed(0)} ton CO₂e/año — elegible para bonos de carbono`)
  if (empleosDirectos > 0) factoresFavorables.push(`Genera ${empleosDirectos} empleos directos en la ZM`)
  if (recicladoras.length > 0) factoresFavorables.push(`${recicladoras.length} giro(s) de recicladora con TIR ≥ 0 %`)
  if (coberturaMetaPct >= 100) factoresFavorables.push(`Capacidad instalada cubre el 100% de la meta de captación`)

  if (coberturaMetaPct < 90) restricciones.push(`Capacidad instalada cubre sólo ${coberturaMetaPct.toFixed(0)}% de la meta — considerar fase siguiente`)
  if (paybackMeses > 48) restricciones.push(`Payback estimado (${paybackMeses} meses) supera 4 años — evaluar subsidio federal FONADIN/PRORESOL`)
  if (recicladoras.length === 0 && faseSeleccionada.fase >= 4) restricciones.push('Sin recicladoras activas con precios actuales — revisar precios de materiales')
  if (scoreViabilidad < 50) restricciones.push('Score de viabilidad < 50: se recomienda financiamiento mixto o mecanismo PPP')

  const textoEjecutivo =
    `Con ${poblacion.toLocaleString('es-MX')} habitantes generando ` +
    `${rsuTotalTonDia.toFixed(1)} ton/día de RSU y una meta de captación del ` +
    `${pctCapturaMeta.toFixed(0)}% al año 3 (${tonCapturaMeta.toFixed(1)} ton/día), ` +
    `se recomienda la **Fase ${faseSeleccionada.fase} — ${faseSeleccionada.nombre}** ` +
    `(${faseSeleccionada.mixCAs}, capacidad ${capacidadCAs} ton/día). ` +
    `CAPEX total estimado: ${fmtM(capexTotalMXN)} MXN. ` +
    (recicladoras.length > 0
      ? `Se incluyen ${recicladoras.length} recicladora(s): ${recicladoras.map(r => r.nombre).join(', ')}. `
      : 'Sin recicladoras (volumen o precio de materiales insuficiente en esta fase). ') +
    `Score de viabilidad: ${scoreViabilidad}/100 (${clasificacionViabilidad.replace('_', ' ')}).`

  const supuestosClave = [
    `Precio PET: $${state.precios.pet.toFixed(2)}/kg · Papel: $${state.precios.papel.toFixed(2)}/kg · Aluminio: $${state.precios.aluminio.toFixed(2)}/kg`,
    `Composición RSU: Orgánico 52%, Plástico 13%, Papel 12%, Vidrio 4%, Metales 3% (SEMARNAT)`,
    `WACC: ${(state.wacc * 100).toFixed(0)}% · Horizonte: ${horizonteAnos} años`,
    `Contingencia CAPEX: 10% sobre equip. + nave (EBRD/AACE Class 4)`,
    `Capital de trabajo: 3 meses de OPEX (World Bank MSW Guidelines)`,
    `Precios maquinaria verificados en mercado MX, mayo 2026`,
  ]

  return {
    id: crypto.randomUUID(),
    version: 1,
    generadoEn: new Date().toISOString(),
    generadoPor: 'sistema',

    municipioId,
    municipioNombre: municipioNom,
    zm,
    poblacion,
    rsuTotalTonDia,
    pctCapturaMeta,
    tonCapturaMeta,
    horizonteAnos,
    precios: state.precios,

    faseRecomendada: faseSeleccionada.fase,
    faseNombre: faseSeleccionada.nombre,
    mixCAs,
    capacidadCAs,
    coberturaMetaPct,
    recicladoras,

    resumen: {
      capexTotalMXN,
      opexMesMXN,
      ebitdaMesMXN,
      empleosDirectos,
      co2eAnualTon: resultados.co2eEvitadasAnualTon,
      tirEstimadaPct,
      paybackMeses,
    },

    scoreViabilidad,
    clasificacionViabilidad,

    justificacion: {
      textoEjecutivo,
      factoresFavorables,
      restricciones,
      supuestosClave,
    },

    disclaimer: DISCLAIMER,
  }
}

// ─── Helpers de formato para UI ───────────────────────────────────────────────

export function colorScoreViabilidad(score: number): string {
  if (score >= 70) return '#3B6D11'
  if (score >= 50) return '#D4881E'
  return '#C0392B'
}

export function bgScoreViabilidad(score: number): string {
  if (score >= 70) return 'bg-[#EAF3DE] border-[#A5C97A] text-[#23470A]'
  if (score >= 50) return 'bg-[#FEF7E7] border-[#F5D98A] text-[#6B4800]'
  return 'bg-[#FDE8E8] border-[#F5B7B1] text-[#7A1212]'
}

export function labelClasificacion(c: CotizacionRecomendada['clasificacionViabilidad']): string {
  return {
    viable: 'Viable',
    condicionada: 'Condicionada',
    requiere_subsidio: 'Requiere subsidio',
  }[c]
}
