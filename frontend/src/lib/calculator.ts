import type { SimulatorState, ResultadosCalculados, AñoResultados, SnapshotDatos, TipoVivienda, RiskScores, MonteCarloPercentiles } from '@/types'
import {
  COMPOSICION_RSU_DETALLE, OPEX_PARAMS, MODELO_PARAMS,
  MULTIPLICADORES, FACTORES_EMISION, CA_CONFIG, ESTACIONALIDAD,
  ZMS,
} from './constants'
import { resolveSimulationGeography } from './zmPopulationScale'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundUp(v: number) { return Math.ceil(v) }
function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max) }

function getZM(zmId: string) {
  return ZMS.find(z => z.id === zmId) ?? ZMS[0]
}

// ─── Motor principal ─────────────────────────────────────────────────────────

/** Misma geografía y generación RSU; captura 0% y sin centros de acopio → contrafactual “sin programa”. */
export function calcularEscenarioSinPrograma(state: SimulatorState): ResultadosCalculados {
  const ceros = Array.from({ length: Math.max(1, state.horizonte) }, () => 0)
  return calcular({
    ...state,
    pctCapturaPorAño: ceros,
    mixCAs: { P: 0, M: 0, G: 0 },
  })
}

export function calcular(state: SimulatorState): ResultadosCalculados {
  const zm = getZM(state.zmActiva)
  const snapshot = (state as SimulatorState & { snapshotDatos?: SnapshotDatos | null }).snapshotDatos

  const { popActiva: popActivaBase, vivActivas } = resolveSimulationGeography({
    ...state,
    snapshotDatos: snapshot,
  })
  const popActiva = state.ocupantesPorViviendaEscenario
    ? vivActivas * state.ocupantesPorViviendaEscenario
    : popActivaBase

  const genKgDia = state.genPercapita || zm.genKgDia

  // RSU total (baseline, mes inicio estacionalidad)
  const factorEst = 1 + ESTACIONALIDAD[clamp(state.mesInicio - 1, 0, 11)]
  const rsuBaseTonDia = popActiva * genKgDia / 1000 * factorEst
  const viviendaFactors = {
    vertical: 1.00,
    casa: 0.95,
    residencial: 1.15,
  } as const
  const condominioShare = typeof state.viviendaCondominioPct === 'number'
    ? clamp(state.viviendaCondominioPct / 100, 0, 1)
    : zm.mixVivienda.vertical
  const condoDeptShare = condominioShare * clamp((state.viviendaCondominioDepartamentoPct ?? 70) / 100, 0, 1)
  const condoHouseShare = condominioShare - condoDeptShare
  const noCondominioShare = 1 - condominioShare
  const viviendaWeights = {
    vertical: condoDeptShare * viviendaFactors.vertical,
    casa: (noCondominioShare + condoHouseShare) * viviendaFactors.casa,
    residencial: 0 * viviendaFactors.residencial,
  }
  const activeTypes: TipoVivienda[] = state.tiposVivienda.length ? state.tiposVivienda : ['vertical', 'casa', 'residencial']

  // RSU por tipo vivienda
  const rsuPorTipo = {
    vertical:    rsuBaseTonDia * viviendaWeights.vertical,
    casa:        rsuBaseTonDia * viviendaWeights.casa,
    residencial: rsuBaseTonDia * viviendaWeights.residencial,
  }
  const rsuTotalTonDia = activeTypes.reduce((s, tipo) => s + (rsuPorTipo[tipo] ?? 0), 0)

  // ─── Series anuales ───────────────────────────────────────────────────────
  const serieAnual: AñoResultados[] = []
  let capexAcum = 0
  let fcfAcum   = 0

  // CAPEX basureros (one-time año 0)
  const activeSet = new Set(activeTypes)
  const capexBasureros = vivActivas * OPEX_PARAMS.pctVivReqBasurero * (
    (activeSet.has('vertical') ? zm.mixVivienda.vertical * OPEX_PARAMS.costoBasureroVertical : 0) +
    (activeSet.has('casa') ? zm.mixVivienda.casa * OPEX_PARAMS.costoBasureroCasa : 0) +
    (activeSet.has('residencial') ? zm.mixVivienda.residencial * OPEX_PARAMS.costoBasureroResidencial : 0)
  )
  const capexComSocial = state.costoComSocial * state.horizonte

  for (let año = 1; año <= state.horizonte; año++) {
    const pctCaptura = (state.pctCapturaPorAño[año - 1] ?? 100) / 100
    const rampaCAs   = año === 1 ? MODELO_PARAMS.rampaCAs.año1 : año === 2 ? MODELO_PARAMS.rampaCAs.año2 : MODELO_PARAMS.rampaCAs.año3plus
    const capturaMaterial = (mat: keyof typeof state.precios) =>
      clamp((state.capturaPctPorMaterial?.[mat] ?? pctCaptura * 100) / 100, 0, 1)
    const mermaMaterial = (mat: keyof typeof state.precios) =>
      1 - clamp((state.mermaPctPorMaterial?.[mat] ?? state.mermaLogPct) / 100, 0, 0.95)
    const capturaPlastico = (capturaMaterial('pet') + capturaMaterial('hdpe')) / 2
    const mermaPlastico = (mermaMaterial('pet') + mermaMaterial('hdpe')) / 2

    // Volumen capturable por material (t/día)
    const volOrg  = rsuTotalTonDia * COMPOSICION_RSU_DETALLE.organico.pct * capturaMaterial('organico') * mermaMaterial('organico') * (1 - (state.rechazoPorMat.organico ?? 5) / 100)
    const volPap  = rsuTotalTonDia * COMPOSICION_RSU_DETALLE.papel.pct * capturaMaterial('papel') * mermaMaterial('papel') * (1 - (state.rechazoPorMat.papel ?? 8) / 100)
    const volPlas = rsuTotalTonDia * COMPOSICION_RSU_DETALLE.plastico.pct * capturaPlastico * mermaPlastico * (1 - (state.rechazoPorMat.plastico ?? 10) / 100)
    const volVid  = rsuTotalTonDia * COMPOSICION_RSU_DETALLE.vidrio.pct * capturaMaterial('vidrio') * mermaMaterial('vidrio') * (1 - (state.rechazoPorMat.vidrio ?? 8) / 100)
    const volMet  = rsuTotalTonDia * COMPOSICION_RSU_DETALLE.metales.pct * capturaMaterial('aluminio') * mermaMaterial('aluminio') * (1 - (state.rechazoPorMat.aluminio ?? 5) / 100)
    const volOtros= rsuTotalTonDia * COMPOSICION_RSU_DETALLE.otros.pct * pctCaptura * (1 - state.mermaLogPct / 100)

    const volTonDia = {
      organico:  volOrg,
      papel:     volPap,
      plastico:  volPlas,
      vidrio:    volVid,
      aluminio:  volMet * COMPOSICION_RSU_DETALLE.metales.aluminioPct,
      otros:     volOtros,
    }

    // Ingresos anuales (300 días operativos)
    const d = MODELO_PARAMS.diasOperativos
    const p = state.precios
    const ingresos =
      volPlas * COMPOSICION_RSU_DETALLE.plastico.petPct * p.pet * d * 1000 +
      volPlas * (1 - COMPOSICION_RSU_DETALLE.plastico.petPct) * p.hdpe * d * 1000 +
      volPap  * p.papel  * d * 1000 +
      volVid  * p.vidrio * d * 1000 +
      volMet  * COMPOSICION_RSU_DETALLE.metales.aluminioPct * p.aluminio * d * 1000 +
      volOrg  * COMPOSICION_RSU_DETALLE.organico.composta * p.organico * d * 1000

    // CAPEX este año (CAs en proporción a tasa de captura)
    const caP = state.mixCAs.P ?? 0; const caM = state.mixCAs.M ?? 0; const caG = state.mixCAs.G ?? 0
    const capexCAsAño = año === 1
      ? (caP * CA_CONFIG.P.capexMXN + caM * CA_CONFIG.M.capexMXN + caG * CA_CONFIG.G.capexMXN)
      : 0

    // OPEX anual CAs
    const opexCAs = (
      caP * CA_CONFIG.P.opexMesMXN + caM * CA_CONFIG.M.opexMesMXN + caG * CA_CONFIG.G.opexMesMXN
    ) * 12

    // OPEX logística (camiones)
    const volTotalTonDia = Object.values(volTonDia).reduce((s, v) => s + v, 0)
    const camionesReq   = roundUp(volTotalTonDia / state.capCamionTon / 2)
    const opexLogistica = camionesReq * (
      OPEX_PARAMS.dieselLKm * OPEX_PARAMS.precioDiesel * 30 * 2 * 15 +
      OPEX_PARAMS.mantenimientoCamion
    ) * 12

    const opexCom = estado1Aprobado(state) ? state.costoComSocial : 0

    const opexTotal = opexCAs + opexLogistica + opexCom

    const capexAño = año === 1 ? capexCAsAño + capexBasureros + capexComSocial : capexCAsAño
    capexAcum += capexAño

    // EBITDA
    const ebitda = ingresos - opexTotal

    // FCF (simplificado: EBITDA - CAPEX - impuestos)
    const ebt  = ebitda - capexAño * 0.15 // depreciación estimada
    const fcf  = ebitda - capexAño - Math.max(0, ebt * MODELO_PARAMS.isr)
    fcfAcum += fcf

    // Empleos directos
    const empCAs = caP * CA_CONFIG.P.empleos + caM * CA_CONFIG.M.empleos + caG * CA_CONFIG.G.empleos

    // CO₂e evitadas
    // co2eOrg: volOrg (t/día) × fracción biodigestor × CH4 generado × densidad × GWP × días → t CO2e/año
    const co2eOrg  = volOrg * COMPOSICION_RSU_DETALLE.organico.biodigestor * MODELO_PARAMS.factorCH4 * 0.0007168 * MODELO_PARAMS.gwpCH4 * d
    // co2eRec: factores en kg CO2e/kg = t CO2e/t — NO multiplica × 1000 (ya todo en toneladas)
    const co2eRec  = (
      volPap  * FACTORES_EMISION.papel    +
      volPlas * FACTORES_EMISION.plastico +
      volVid  * FACTORES_EMISION.vidrio   +
      volMet  * COMPOSICION_RSU_DETALLE.metales.aluminioPct * FACTORES_EMISION.aluminio
    ) * d  // resultado en t CO2e/año

    serieAnual.push({
      año, pctCaptura: pctCaptura * 100,
      volTonDia,
      ingresos, capex: capexAño, opex: opexTotal,
      ebitda, fcf, fcfAcumulado: fcfAcum,
      empleosDirectos: empCAs,
      co2e: co2eOrg + co2eRec,
    })
  }

  // ─── Totales ──────────────────────────────────────────────────────────────
  const últimoAño       = serieAnual[serieAnual.length - 1]
  const ingresosBrutos  = serieAnual.reduce((s, a) => s + a.ingresos, 0)
  const capexTotal      = serieAnual.reduce((s, a) => s + a.capex, 0)
  const opexAnual       = últimoAño?.opex ?? 0
  const ebitda          = serieAnual.reduce((s, a) => s + a.ebitda, 0)
  const margenEbitda    = ingresosBrutos > 0 ? ebitda / ingresosBrutos : 0

  // VPN (WACC)
  const vpn = serieAnual.reduce((s, a, i) =>
    s + a.fcf / Math.pow(1 + state.wacc / 100, i + 1), -capexTotal)

  // TIR (bisección simple)
  const tir = calcTIR(serieAnual.map(a => a.fcf), capexTotal)

  // Payback simple
  const paybackMeses = capexTotal > 0 && ebitda > 0
    ? capexTotal / (ebitda / state.horizonte / 12) : 999

  // Empleos
  const caP = state.mixCAs.P ?? 0; const caM = state.mixCAs.M ?? 0; const caG = state.mixCAs.G ?? 0
  const empleosDirectosCAs = caP * CA_CONFIG.P.empleos + caM * CA_CONFIG.M.empleos + caG * CA_CONFIG.G.empleos
  const empleosIndirectos  = empleosDirectosCAs * 2.5
  const pepenadoresForm =
    (zm.pepenadoresActivos ?? 0) * 0.35 * (popActiva / Math.max(zm.totalPop, 1))

  // Ambiental
  const volTotalDia  = últimoAño
    ? Object.values(últimoAño.volTonDia).reduce((s, v) => s + v, 0) : 0
  // co2eEvitadas: acumulado horizonte (t CO2e); co2eAnual: solo el último año
  const co2eEvitadasHorizonte = serieAnual.reduce((s, a) => s + a.co2e, 0)
  const co2eEvitadasAnual     = últimoAño?.co2e ?? 0
  const kwhBiogas    = (últimoAño?.volTonDia.organico ?? 0) *
    COMPOSICION_RSU_DETALLE.organico.biodigestor * 0.65 * 2.2 * MODELO_PARAMS.diasOperativos * 1000

  // Carbono
  const precCarb = state.precioCarbonoEsc === 'sce' ? MULTIPLICADORES.carbonCredSCEUSD
    : state.precioCarbonoEsc === 'eu' ? MULTIPLICADORES.carbonCredEUUSD
    : MULTIPLICADORES.carbonCredVolUSD
  const ingresoCarbono = co2eEvitadasHorizonte * precCarb * state.tipoCambio

  // Ahorro disposición (volDesviado = t totales en todo el horizonte)
  const volDesviado    = serieAnual.reduce((s, a) =>
    s + Object.values(a.volTonDia).reduce((sv, v) => sv + v, 0) * MODELO_PARAMS.diasOperativos, 0)
  const costoDisposicionPorTon = typeof state.costoDisposicionPorTon === 'number'
    ? Math.max(0, state.costoDisposicionPorTon)
    : 320
  const ahorroDisp     = state.costoDisposicionActivo === false ? 0 : volDesviado * costoDisposicionPorTon

  // Extensión vida relleno (Bug 2 fix):
  // ratio = t/día desviadas en año final / t/día totales generadas → × 10 → capped 15 años
  const extensionRellenoAnios = rsuTotalTonDia > 0
    ? Math.min(15, Math.round(volTotalDia / rsuTotalTonDia * 10 * 10) / 10)
    : 0

  // Salud
  const pm25Evit      = volDesviado * 0.0043
  const casosIRA      = pm25Evit * 847
  const casosDengue   = (últimoAño?.volTonDia.organico ?? 0) * 0.003 * MODELO_PARAMS.diasOperativos
  const ahorroSalud   = casosIRA * 450 + casosDengue * 8200 + popActiva * 145 * 0.20

  // Derrama
  const derremaTotal  = ingresosBrutos * 1.4 + ingresoCarbono + kwhBiogas * 0.001 + ahorroDisp + ahorroSalud

  // Score político (heurística)
  const scorePolitico = Math.min(100, Math.round(
    (state.pctCapturaPorAño[0] ?? 20) * 0.3 +
    Math.min(40, 40 - paybackMeses / 6) +
    Math.min(30, empleosDirectosCAs * 0.5)
  ))

  // ESG Score normalizado 0-100 (Bug 4 fix):
  // Antes era co2eEvitadas/1000 → daba cientos de miles de puntos
  const esgCarbonPts     = Math.min(25, co2eEvitadasAnual / 50000 * 25)   // 50K t/año = max score
  const esgEmpleosPts    = Math.min(40, empleosDirectosCAs / 300 * 40)     // 300 empleos = max score
  const esgPurezaPts     = Math.min(20, (state.pctCapturaPorAño[state.horizonte - 1] ?? 70) / 100 * 20)
  const esgGobernanzaPts = Math.min(15, (state.gatesAprobados?.filter(Boolean).length ?? 0) / 6 * 15)
  const ratingESGNorm    = Math.round(esgCarbonPts + esgEmpleosPts + esgPurezaPts + esgGobernanzaPts)

  // Volumen capturable (año final)
  const volCapturablePorMat = últimoAño?.volTonDia ?? {
    organico: 0, papel: 0, plastico: 0, vidrio: 0, aluminio: 0, otros: 0
  }
  const camiones = {
    organico: roundUp((volCapturablePorMat.organico ?? 0) / state.capCamionTon / 2),
    papel:    roundUp((volCapturablePorMat.papel ?? 0)    / state.capCamionTon / 2),
    plastico: roundUp((volCapturablePorMat.plastico ?? 0) / state.capCamionTon / 2),
    vidrio:   roundUp((volCapturablePorMat.vidrio ?? 0)   / state.capCamionTon / 2),
    aluminio: roundUp((volCapturablePorMat.aluminio ?? 0) / state.capCamionTon / 2),
    otros:    roundUp((volCapturablePorMat.otros ?? 0)    / state.capCamionTon / 2),
  }

  return {
    pobActiva: popActiva, vivActivas, rsuTotalTonDia, rsuPorTipo,
    volCapturablePorMat,
    camionesRequeridos: camiones,
    ocupacionCAs: Math.min(100, volTotalDia / Math.max(1,
      caP * CA_CONFIG.P.capTonDia + caM * CA_CONFIG.M.capTonDia + caG * CA_CONFIG.G.capTonDia
    ) * 100),
    breakEvenCAP: 1850,
    dscr: ebitda > 0 ? ebitda / Math.max(1, capexTotal * 0.1) : 0,
    serieAnual,
    ingresosBrutos, capexTotal, opexAnual, ebitda, margenEbitda,
    vpn, tir, tirEquity: tir * 1.15, moic: capexTotal > 0 ? vpn / capexTotal : 0,
    paybackMeses, paybackDescontado: paybackMeses * 1.3,
    ingresoCarbono, ingresoBiogas: kwhBiogas * OPEX_PARAMS.precioKwh, ahorroDisposicion: ahorroDisp,
    // empleosDirectosRecic: pepenadores formalizables — Anaya-Palacios (2024) estima 1 recuperador
    // por cada 2,200 hab. en México urbano (León, Gto. como referencia). ENOE T1 2024: 110-150K nacionales.
    // derramaSalarial: tabulador IMSS 2025 rama 37 (recolección y reciclaje): $14,298/mes promedio.
    empleosDirectosCAs, empleosDirectosRecic: Math.round(zm.totalPop / 2200),
    empleosTotalesDirectos: empleosDirectosCAs + Math.round(zm.totalPop / 2200),
    empleosIndirectos, pepenadoresFormalizados: pepenadoresForm,
    derramaSalarial: empleosDirectosCAs * 14298 * 12,
    // Ambiental — Bug 1 fix: separar anual (KPI principal) de horizonte (dato secundario)
    co2eEvitadasTon:          co2eEvitadasHorizonte,  // acumulado horizonte
    co2eEvitadasAnualTon:     co2eEvitadasAnual,       // año final — usar en header y S15
    co2eEvitadasHorizonteTon: co2eEvitadasHorizonte,   // alias explícito
    pm25EvitadoTon: pm25Evit, kwhBiogas,
    // Bug 2 fix: extensión relleno basada en ratio de desvío actual, capped en 15 años
    extensionRelleno: extensionRellenoAnios,
    casosIRAEvitados: casosIRA, casosDengueEvitados: casosDengue, avadEvitados: casosIRA * 0.006 + casosDengue * 0.003,
    ahorroSalud,
    cadenaProveedores: ingresosBrutos * MULTIPLICADORES.cadenaProveedores,
    revenueFiscal: ingresosBrutos * MULTIPLICADORES.revenueFiscal,
    valorPropiedad: ingresosBrutos * MULTIPLICADORES.valorPropiedad,
    inversionPrivada: ingresosBrutos * MULTIPLICADORES.inversionPrivada,
    derremaTotal, scorePolitico,
    // Bug 4 fix: ESG score normalizado 0-100, no co2eEvitadas/1000
    ratingESGDelta: ratingESGNorm,
  }
}

// ─── TIR por bisección ────────────────────────────────────────────────────────
function calcTIR(flujos: number[], capex: number, maxIter = 200): number {
  let lo = -0.99, hi = 10.0
  for (let i = 0; i < maxIter; i++) {
    const mid  = (lo + hi) / 2
    const npv  = flujos.reduce((s, f, t) => s + f / Math.pow(1 + mid, t + 1), -capex)
    if (Math.abs(npv) < 1) return mid * 100
    if (npv > 0) lo = mid; else hi = mid
  }
  return ((lo + hi) / 2) * 100
}

// ─── Distribución triangular ──────────────────────────────────────────────────
/**
 * Muestrea un valor de la distribución triangular(min, moda, max).
 * Ref: Al-Salem et al. (2024) — "Risk Assessment of Waste Recycling Projects Using Monte Carlo
 * Simulation", Sustainability 16(3):1127. DOI: 10.3390/su16031127.
 */
function triangularSample(lo: number, mode: number, hi: number): number {
  const u = Math.random()
  const fc = (mode - lo) / (hi - lo)
  if (u <= fc) return lo + Math.sqrt(u * (hi - lo) * (mode - lo))
  return hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode))
}

// ─── Monte Carlo triangular (2 000 sim) ───────────────────────────────────────
/**
 * Devuelve percentiles P10/P50/P90 de TIR y BCR en P50.
 * Parámetros triangulares:
 *   - Precios: (−30%, base, +30%) por material — rango documentado mercado secundario MX 2020-2024.
 *   - Tasa captura: (−40%, base, +20%) — sesgo pesimista documentado en programas LATAM 2015-2023.
 *   - Merma logística: (−25%, base, +25%) — rango bibliográfico SLP 2021.
 * Fuente: Saez & Urdaneta (2014), Bing et al. (2016) — factores de perturbación.
 */
export function monteCarloTriangular(state: SimulatorState, n = 2000): MonteCarloPercentiles {
  const tirs: number[] = []

  for (let i = 0; i < n; i++) {
    const precioFactor = triangularSample(0.70, 1.00, 1.30)
    const pct0 = state.pctCapturaPorAño[0] ?? 20
    const pctFactor = triangularSample(0.60, 1.00, 1.20)
    const mermaFactor = triangularSample(0.75, 1.00, 1.25)

    const perturbed: SimulatorState = {
      ...state,
      precios: {
        pet:      clamp(state.precios.pet      * precioFactor, 0.5, 50),
        hdpe:     clamp(state.precios.hdpe     * precioFactor, 0.5, 50),
        papel:    clamp(state.precios.papel    * precioFactor, 0.3, 20),
        vidrio:   clamp(state.precios.vidrio   * precioFactor, 0.1, 10),
        aluminio: clamp(state.precios.aluminio * precioFactor, 5,  300),
        organico: clamp(state.precios.organico * precioFactor, 0.1, 10),
      },
      pctCapturaPorAño: state.pctCapturaPorAño.map(p =>
        clamp(p * (pctFactor * pct0 / Math.max(0.01, pct0)), 1, 100)
      ),
      mermaLogPct: clamp(state.mermaLogPct * mermaFactor, 2, 40),
    }
    tirs.push(calcular(perturbed).tir)
  }

  tirs.sort((a, b) => a - b)
  const p10 = tirs[Math.floor(n * 0.10)] ?? 0
  const p50 = tirs[Math.floor(n * 0.50)] ?? 0
  const p90 = tirs[Math.floor(n * 0.90)] ?? 0

  const base = calcular(state)
  const bcr_p50 = base.capexTotal > 0
    ? (base.ingresosBrutos + base.ahorroDisposicion) / base.capexTotal
    : 0

  return { p10, p50, p90, bcr_p50 }
}

/** @deprecated Usar monteCarloTriangular() — distribución gaussiana reemplazada. */
export function monteCarlo(state: SimulatorState, n = 2000): number[] {
  const { p10, p50, p90 } = monteCarloTriangular(state, n)
  return [p10, p50, p90]
}

// ─── Motor de Riesgo ─────────────────────────────────────────────────────────
/**
 * Calcula scores de riesgo (0–100) por dimensión desde datos del simulador.
 *
 * Fuentes:
 * - R_mercado: SEMARNAT Evaluaciones de Programas RSU 2019-2024 (varianza colocación);
 *   función: (1 − tasa_captura) × vol_anual × precio_prom × k_normalización.
 * - R_regulatorio: LGPGIR DOF 2022 + conteo de vacíos jurídicos del módulo M02;
 *   función: (vacíos / 20) × 60, capped 0–100.
 * - R_operativo: mezcla de CAs instalados vs. tasa captura objetivo;
 *   cero CAs + tasa alta = máximo riesgo operativo.
 * - R_político: null — datos de percepción ciudadana requieren backend Proyecto Vivo.
 * - Score total: ponderado 33/44/23 (excluido R_político; su 10% redistribuido).
 *
 * @param vaciosJuridicos — número de vacíos legales del módulo M02; default 10 si no disponible.
 */
export function calcularScoresRiesgo(
  state: SimulatorState,
  resultados: ResultadosCalculados,
  vaciosJuridicos = 10,
): RiskScores {
  const pctCaptura = state.pctCapturaPorAño[0] ?? 20
  const volTonAnual = Object.values(resultados.volCapturablePorMat).reduce((s, v) => s + v, 0) * 300
  const precioPromPonderado = (state.precios.pet * 0.35 + state.precios.papel * 0.30 + state.precios.hdpe * 0.20 + state.precios.vidrio * 0.15)

  // R_mercado: mayor tasa captura = menor riesgo de colocación; volumen alto = mayor exposición a precio
  const exposicionMercado = (1 - pctCaptura / 100) * volTonAnual * precioPromPonderado * 0.35
  const r_mercado = clamp(Math.round(exposicionMercado / 5000), 0, 100)

  // R_regulatorio: a mayor número de vacíos jurídicos, mayor riesgo de bloqueo del programa
  const r_regulatorio = clamp(Math.round((vaciosJuridicos / 20) * 60), 0, 100)

  // R_operativo: sin CAs instalados y tasa alta = máximo riesgo; con CAs y tasa baja = bajo riesgo
  const caTotal = (state.mixCAs.P ?? 0) + (state.mixCAs.M ?? 0) + (state.mixCAs.G ?? 0)
  const riesgoCaptura = pctCaptura < 30 ? 60 : pctCaptura < 60 ? 35 : 15
  const riesgoCAs = caTotal === 0 ? 40 : caTotal < 3 ? 20 : 5
  const r_operativo = clamp(Math.round(riesgoCaptura + riesgoCAs), 0, 100)

  // Score total ponderado (R_político excluido; su peso redistribuido proporcionalmente)
  const score_total = Math.round(r_mercado * 0.33 + r_regulatorio * 0.44 + r_operativo * 0.23)

  return { r_mercado, r_regulatorio, r_operativo, r_politico: null, score_total }
}

function perturbState(s: SimulatorState): SimulatorState {
  const factor = triangularSample(0.70, 1.00, 1.30)
  return {
    ...s,
    precios: {
      pet:      clamp(s.precios.pet      * factor, 0.5, 50),
      hdpe:     clamp(s.precios.hdpe     * factor, 0.5, 50),
      papel:    clamp(s.precios.papel    * factor, 0.3, 20),
      vidrio:   clamp(s.precios.vidrio   * factor, 0.1, 10),
      aluminio: clamp(s.precios.aluminio * factor, 5,  300),
      organico: clamp(s.precios.organico * factor, 0.1, 10),
    },
    pctCapturaPorAño: s.pctCapturaPorAño.map(p => clamp(p * triangularSample(0.60, 1.00, 1.20), 5, 100)),
    mermaLogPct: clamp(s.mermaLogPct * triangularSample(0.75, 1.00, 1.25), 5, 25),
  }
}

// ─── Tornado de sensibilidad ──────────────────────────────────────────────────
export function tornadoAnalysis(state: SimulatorState) {
  const base = calcular(state)
  const vars = [
    { label: 'Precio PET', key: 'precios.pet', pct: 0.20 },
    { label: 'Precio Aluminio', key: 'precios.aluminio', pct: 0.20 },
    { label: '% Captura Año 1', key: 'pctCapturaPorAño[0]', pct: 0.20 },
    { label: 'WACC', key: 'wacc', pct: 0.20 },
    { label: 'Precio Papel', key: 'precios.papel', pct: 0.20 },
    { label: 'Merma logística', key: 'mermaLogPct', pct: 0.20 },
    { label: 'Precio Vidrio', key: 'precios.vidrio', pct: 0.20 },
  ]
  return vars.map(v => {
    const plus  = applyVar(state, v.key, 1 + v.pct)
    const minus = applyVar(state, v.key, 1 - v.pct)
    return {
      label:    v.label,
      plus:     calcular(plus).vpn  - base.vpn,
      minus:    calcular(minus).vpn - base.vpn,
      range:    Math.abs(calcular(plus).vpn - calcular(minus).vpn),
    }
  }).sort((a, b) => b.range - a.range)
}

function applyVar(state: SimulatorState, key: string, factor: number): SimulatorState {
  const s = JSON.parse(JSON.stringify(state)) as SimulatorState
  if (key === 'precios.pet') s.precios.pet *= factor
  else if (key === 'precios.aluminio') s.precios.aluminio *= factor
  else if (key === 'precios.papel') s.precios.papel *= factor
  else if (key === 'precios.vidrio') s.precios.vidrio *= factor
  else if (key === 'pctCapturaPorAño[0]') s.pctCapturaPorAño[0] = clamp((s.pctCapturaPorAño[0] ?? 20) * factor, 1, 100)
  else if (key === 'wacc') s.wacc = clamp(s.wacc * factor, 12, 30)
  else if (key === 'mermaLogPct') s.mermaLogPct = clamp(s.mermaLogPct * factor, 5, 25)
  return s
}

function estado1Aprobado(state: SimulatorState) {
  return state.gatesAprobados?.[0] === true
}

// ─── Narrativa dinámica ───────────────────────────────────────────────────────
export function narrativaS9(state: SimulatorState, res: ResultadosCalculados): string {
  const zm    = getZM(state.zmActiva).nombre
  const año1  = state.pctCapturaPorAño[0] ?? 20
  const volDia= res.serieAnual[0]
    ? Object.values(res.serieAnual[0].volTonDia).reduce((s, v) => s + v, 0).toFixed(1)
    : '—'
  const bench = año1 >= 50 ? 'más ambiciosa que cualquier benchmark LATAM documentado'
    : año1 >= 35 ? 'similar al plan de Bogotá 2012–2015'
    : 'comparable con Buenos Aires 2018–2021'
  return `Con un plan de ${state.horizonte} año${state.horizonte > 1 ? 's' : ''} para ${zm}, el primer año se capturará el ${año1}% del RSU — ${volDia} t/día que hoy van al relleno. Esta tasa es ${bench}.`
}
