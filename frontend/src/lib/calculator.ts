import type { SimulatorState, ResultadosCalculados, AñoResultados, SnapshotDatos, TipoVivienda, RiskScores, MonteCarloPercentiles, EsquemaConcesion } from '@/types'
import {
  COMPOSICION_RSU_DETALLE, OPEX_PARAMS, MODELO_PARAMS,
  MULTIPLICADORES, FACTORES_EMISION, CA_CONFIG, ESTACIONALIDAD,
  ZMS, TASAS_ISN, DERECHOS_OPERACION_CA_AÑO, COMPOSTA,
  FACTORES_EMPLEO_SECTORIAL, CONCESION_DEFAULTS, MARCO_LEGAL_CONCESION,
} from './constants'
import { resolveSimulationGeography } from './zmPopulationScale'
import { OPEX_CA, ESTRUCTURA_DEUDA, RECICLADORAS, SUPUESTOS_GENERALES } from './capexOpexData'

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

  // Desglose Hemisferio 1 vs. Hemisferio 2
  // casaViaPublicaPct: % del total de viviendas no-condominio que son VP (calle pública)
  // Fuente: DONUE + INEGI Censo 2020 — fracción municipal. Default 70% como estimado nacional.
  const casaVPFrac    = clamp(((state as typeof state & { casaViaPublicaPct?: number }).casaViaPublicaPct ?? 70) / 100, 0, 1)
  const casaVPShare      = noCondominioShare * casaVPFrac          // Hemisferio 2
  const casaPrivadaShare = noCondominioShare * (1 - casaVPFrac)    // Hemisferio 1 (casas en privada/coto)

  const viviendaWeights = {
    vertical: condoDeptShare * viviendaFactors.vertical,
    casa: (casaVPShare + casaPrivadaShare + condoHouseShare) * viviendaFactors.casa,
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
    // NOTA: biogás excluido del escenario base — requiere permiso CRE autoconsumo (Res. RES/2/2016).
    // El orgánico va 100% a ruta de composta a granel.
    const d = MODELO_PARAMS.diasOperativos
    const p = state.precios
    // Composta: volOrg (t/día) × factorCompostaje × precioCompostaMXN/ton × días × 1000 kg/t
    const ingresosComposta = volOrg * COMPOSTA.factorCompostaje * COMPOSTA.precioTonMxn * d
    const ingresos =
      volPlas * COMPOSICION_RSU_DETALLE.plastico.petPct * p.pet * d * 1000 +
      volPlas * (1 - COMPOSICION_RSU_DETALLE.plastico.petPct) * p.hdpe * d * 1000 +
      volPap  * p.papel  * d * 1000 +
      volVid  * p.vidrio * d * 1000 +
      volMet  * COMPOSICION_RSU_DETALLE.metales.aluminioPct * p.aluminio * d * 1000 +
      ingresosComposta  // composta sustituye el precio p.organico anterior

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

    // OPEX educación ciudadana — proporcional a la brecha de adopción y al % de casas VP.
    // Casas VP (Hemisferio 2) requieren brigadas puerta a puerta: 3x más costoso por hogar
    // que condominio (donde se capacita al administrador). Se activa desde F1.
    // Fórmula: costo_base × hogares_vp × (1 + 2 × casaVPFrac) × factor_brecha_ipc
    // Donde factor_brecha_ipc ∈ [0.5, 1.5]: bajo IPC real → mayor esfuerzo requerido.
    const ipcReal = (state as typeof state & { indicePreparacionCiudadana?: number | null }).indicePreparacionCiudadana
    const ipcReferencia = ipcReal ?? 70   // 70 = benchmark SEMARNAT 2022 sin dato de campo
    const factorBrechaIpc = clamp(1 + (70 - ipcReferencia) / 100, 0.5, 1.5)
    const costoBaseHogarMxn = 80          // MXN/hogar/año — estimado BANOBRAS 2019
    const hogaresVP = vivActivas * casaVPShare
    const opexEducacion = año === 1
      ? hogaresVP * costoBaseHogarMxn * (1 + 2 * casaVPFrac) * factorBrechaIpc
      : hogaresVP * costoBaseHogarMxn * 0.4 * factorBrechaIpc  // mantenimiento años siguientes

    const opexTotal = opexCAs + opexLogistica + opexCom + opexEducacion

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

  // ─── Empleo recicladoras (declarado aquí para uso en modelo de concesión) ────
  const empleosRecicladoras = (['pet', 'vidrio', 'aluminio', 'organicos'] as const)
    .reduce((sum, g) => sum + RECICLADORAS[g].empleosPorPlanta, 0)

  // ─── Modelo de concesión — distribución de valor por esquema ────────────────
  const esquema: EsquemaConcesion = (state as typeof state & { esquemaConcesion?: EsquemaConcesion }).esquemaConcesion ?? 'A'
  const pctCuota = clamp(((state as typeof state & { pctCuotaConcesion?: number }).pctCuotaConcesion ?? CONCESION_DEFAULTS.pctCuotaDefault) / 100, 0.05, 0.50)
  const pctSocioPublico = clamp(((state as typeof state & { pctSocioPublico?: number }).pctSocioPublico ?? CONCESION_DEFAULTS.pctSocioPublicoDefault) / 100, 0.10, 0.90)

  // Ingreso operativo al municipio (según esquema)
  const ingresosMunicipioOperativo = (() => {
    if (esquema === 'A') return ingresosBrutos            // 100% al municipio
    if (esquema === 'B') return ingresosBrutos * pctCuota  // cuota concesión 5-15%
    if (esquema === 'C') return ingresosBrutos * pctSocioPublico // % convenido APP
    // Esquema D — fideicomiso: ingreso post-servicio de deuda
    const servicioDeudaAnual = capexTotal * CONCESION_DEFAULTS.tasaFideicomisoBanobras
    const ingresoPostDeuda = Math.max(0, ingresosBrutos - servicioDeudaAnual)
    return ingresoPostDeuda
  })()

  // Ingreso fiscal al municipio (ISN + derechos de operación — solo si hay operador privado)
  const zmEstado = getZM(state.zmActiva)?.estado ?? ''
  const tasaISN = TASAS_ISN[zmEstado] ?? TASAS_ISN['default'] ?? 0.020
  const nCAsTotal = (state.mixCAs.P ?? 0) + (state.mixCAs.M ?? 0) + (state.mixCAs.G ?? 0)
  const salarioBrutoPromAño = (esquema === 'A' ? 0 : (empleosDirectosCAs + empleosRecicladoras) * 14_298 * 12)
  const ingresoISN = esquema === 'A' ? 0 : salarioBrutoPromAño * tasaISN
  const ingresoDerechos = esquema === 'A' ? 0 : nCAsTotal * DERECHOS_OPERACION_CA_AÑO
  const ingresosMunicipioFiscal = ingresoISN + ingresoDerechos
  const ingresosMunicipioTotal = ingresosMunicipioOperativo + ingresosMunicipioFiscal

  // ─── Derrama por industria (sustituye multiplicador flat 1.4×) ───────────────
  // Reciclaje: ingresos de plástico + papel + vidrio = ya están en ingresosBrutos
  const ingresosReciclaje = serieAnual.reduce((s, a) => {
    const vt = a.volTonDia
    return s + (
      (vt.plastico ?? 0) * state.precios.pet * MODELO_PARAMS.diasOperativos * 1000 +
      (vt.papel ?? 0)    * state.precios.papel * MODELO_PARAMS.diasOperativos * 1000 +
      (vt.vidrio ?? 0)   * state.precios.vidrio * MODELO_PARAMS.diasOperativos * 1000
    )
  }, 0)

  // Acerera: volumen metálico total acumulado × precio chatarra × multiplicador CANACERO
  const volMetTotalHorizonte = serieAnual.reduce((s, a) =>
    s + (a.volTonDia.aluminio ?? 0) * MODELO_PARAMS.diasOperativos, 0)
  const ingresoAcerera = volMetTotalHorizonte * state.precios.aluminio * 1000 * 1.8  // 1.8x efecto multiplicador cadena

  // Agrícola: composta generada × precio bulk × multiplicador FIRA
  const volOrgTotalHorizonte = serieAnual.reduce((s, a) =>
    s + (a.volTonDia.organico ?? 0) * MODELO_PARAMS.diasOperativos, 0)
  const compostatTotalHorizonte = volOrgTotalHorizonte * COMPOSTA.factorCompostaje
  const ingresoAgricola = compostatTotalHorizonte * COMPOSTA.precioTonMxn * 1.3  // 1.3x insumos agro sustitutos

  const derramaIndustrialPorSector = {
    reciclaje: ingresosReciclaje,
    acerera:   ingresoAcerera,
    agricola:  ingresoAgricola,
  }

  // ─── Empleos por sector industrial ──────────────────────────────────────────
  const empleosAcerera = Math.round(volMetTotalHorizonte / 1000 * FACTORES_EMPLEO_SECTORIAL.acereroEmpPorKt)
  const hectareasCompost = compostatTotalHorizonte * COMPOSTA.haEquivalentePorTon
  const empleosAgricola = Math.round(hectareasCompost * COMPOSTA.empleosPorHa)
  const empleosPorSector = {
    centrosAcopio: empleosDirectosCAs,
    recicladoras:  empleosRecicladoras,
    acerera:       empleosAcerera,
    agricola:      empleosAgricola,
  }

  // Derrama total — ahora es la suma de las derramas sectoriales + salud + carbono + ahorro disp.
  const derremaTotal = ingresoAgricola + ingresosReciclaje + ingresoAcerera + ingresoCarbono + ahorroDisp + ahorroSalud

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

  // ─── Break-even dinámico: OPEX fijo mensual del CA-P / precio prom kg ─────
  const opexFijoCaP = OPEX_CA.P.totalOPEXMes
  const precioPromKg = (state.precios.pet * 0.35 + state.precios.papel * 0.30 + state.precios.hdpe * 0.20 + state.precios.vidrio * 0.15)
  const breakEvenKgDia = precioPromKg > 0
    ? Math.round(opexFijoCaP / precioPromKg / SUPUESTOS_GENERALES.diasOperativosMes)
    : 1850

  // ─── Payback descontado: suma FCF/(1+WACC)^t hasta cubrir CAPEX ────────────
  let paybackDesc = 999
  if (capexTotal > 0) {
    let acumDesc = 0
    for (let t = 0; t < serieAnual.length; t++) {
      acumDesc += serieAnual[t].fcf / Math.pow(1 + state.wacc / 100, t + 1)
      if (acumDesc >= capexTotal) {
        const prevAcum = t > 0
          ? acumDesc - serieAnual[t].fcf / Math.pow(1 + state.wacc / 100, t + 1)
          : 0
        const frac = (capexTotal - prevAcum) / (serieAnual[t].fcf / Math.pow(1 + state.wacc / 100, t + 1))
        paybackDesc = (t + frac) * 12
        break
      }
    }
  }

  // ─── TIR Equity (Modigliani-Miller): apalanca TIR con estructura D/E ──────
  const deudaPct = caG > 0 ? ESTRUCTURA_DEUDA.G.deudaEquity.split('/').map(Number)[0]! / 100
    : caM > 0 ? ESTRUCTURA_DEUDA.M.deudaEquity.split('/').map(Number)[0]! / 100
    : ESTRUCTURA_DEUDA.P.deudaEquity.split('/').map(Number)[0]! / 100
  const tasaDeuda = caG > 0 ? ESTRUCTURA_DEUDA.G.tasaInteres
    : caM > 0 ? ESTRUCTURA_DEUDA.M.tasaInteres
    : ESTRUCTURA_DEUDA.P.tasaInteres
  const equityPct = 1 - deudaPct
  const tirEquityCalc = equityPct > 0
    ? tir + (tir - tasaDeuda * 100) * (deudaPct / equityPct)
    : tir

  return {
    pobActiva: popActiva, vivActivas, rsuTotalTonDia, rsuPorTipo,
    volCapturablePorMat,
    camionesRequeridos: camiones,
    ocupacionCAs: Math.min(100, volTotalDia / Math.max(1,
      caP * CA_CONFIG.P.capTonDia + caM * CA_CONFIG.M.capTonDia + caG * CA_CONFIG.G.capTonDia
    ) * 100),
    breakEvenCAP: breakEvenKgDia,
    dscr: ebitda > 0 ? ebitda / Math.max(1, capexTotal * 0.1) : 0,
    serieAnual,
    ingresosBrutos, capexTotal, opexAnual, ebitda, margenEbitda,
    vpn, tir, tirEquity: tirEquityCalc, moic: capexTotal > 0 ? vpn / capexTotal : 0,
    paybackMeses, paybackDescontado: paybackDesc,
    ingresoCarbono,
    // Biogás: potencial técnico informativo — excluido de ingresos base (requiere permiso CRE)
    ingresoBiogas: kwhBiogas * OPEX_PARAMS.precioKwh,
    ahorroDisposicion: ahorroDisp,
    // Modelo de concesión
    ingresosMunicipioOperativo,
    ingresosMunicipioFiscal,
    ingresosMunicipioTotal,
    derramaIndustrialPorSector,
    empleosPorSector,
    empleosDirectosCAs, empleosDirectosRecic: empleosRecicladoras,
    empleosTotalesDirectos: empleosDirectosCAs + empleosRecicladoras,
    empleosIndirectos, pepenadoresFormalizados: pepenadoresForm,
    derramaSalarial: empleosDirectosCAs * 14298 * 12 + empleosRecicladoras * 12500 * 12,
    co2eEvitadasTon:          co2eEvitadasHorizonte,
    co2eEvitadasAnualTon:     co2eEvitadasAnual,
    co2eEvitadasHorizonteTon: co2eEvitadasHorizonte,
    pm25EvitadoTon: pm25Evit, kwhBiogas,
    extensionRelleno: extensionRellenoAnios,
    casosIRAEvitados: casosIRA, casosDengueEvitados: casosDengue, avadEvitados: casosIRA * 0.006 + casosDengue * 0.003,
    ahorroSalud,
    cadenaProveedores: ingresosBrutos * MULTIPLICADORES.cadenaProveedores,
    revenueFiscal: ingresosBrutos * MULTIPLICADORES.revenueFiscal,
    valorPropiedad: ingresosBrutos * MULTIPLICADORES.valorPropiedad,
    inversionPrivada: ingresosBrutos * MULTIPLICADORES.inversionPrivada,
    derremaTotal, scorePolitico,
    ratingESGDelta: ratingESGNorm,
    // Costo de educación ciudadana año 1 (más intensivo) — expuesto para M04 y CapacitacionTab
    // Fórmula: hogares_vp × $80/hogar × factor_VP × factor_brecha_IPC
    costoEducacionAnual: (() => {
      const ipcRef2 = ((state as typeof state & { indicePreparacionCiudadana?: number | null }).indicePreparacionCiudadana) ?? 70
      const brecha2 = clamp(1 + (70 - ipcRef2) / 100, 0.5, 1.5)
      return Math.round(vivActivas * casaVPShare * 80 * (1 + 2 * casaVPFrac) * brecha2)
    })(),
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

/** Perturbación canónica Monte Carlo — precios, captura y merma (triangular). */
export function perturbStateMonteCarlo(state: SimulatorState): SimulatorState {
  const precioFactor = triangularSample(0.70, 1.00, 1.30)
  const pct0 = state.pctCapturaPorAño[0] ?? 20
  const pctFactor = triangularSample(0.60, 1.00, 1.20)
  const mermaFactor = triangularSample(0.75, 1.00, 1.25)

  return {
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
      clamp(p * (pctFactor * pct0 / Math.max(0.01, pct0)), 1, 100),
    ),
    mermaLogPct: clamp(state.mermaLogPct * mermaFactor, 2, 40),
  }
}

export const MONTE_CARLO_SPEC = {
  iterationsDefault: 2000,
  variables: [
    { name: 'Precios materiales', range: '70%–130% del escenario base (triangular)' },
    { name: 'Captura por año', range: '60%–120% del escenario base' },
    { name: 'Merma logística', range: '75%–125% del escenario base' },
  ],
  method: 'Muestreo triangular · cada iteración ejecuta calcular() completo',
} as const

export function monteCarloTriangularSamples(
  state: SimulatorState,
  n = 2000,
  metric: 'tir' | 'vpn' = 'tir',
): number[] {
  const samples: number[] = []
  for (let i = 0; i < n; i++) {
    const r = calcular(perturbStateMonteCarlo(state))
    samples.push(metric === 'tir' ? r.tir : r.vpn)
  }
  samples.sort((a, b) => a - b)
  return samples
}

export function percentileFromSorted(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0
}

export function monteCarloTriangular(state: SimulatorState, n = 2000): MonteCarloPercentiles {
  const tirs = monteCarloTriangularSamples(state, n, 'tir')
  const p10 = percentileFromSorted(tirs, 0.10)
  const p50 = percentileFromSorted(tirs, 0.50)
  const p90 = percentileFromSorted(tirs, 0.90)

  const base = calcular(state)
  const bcr_p50 = base.capexTotal > 0
    ? (base.ingresosBrutos + base.ahorroDisposicion) / base.capexTotal
    : 0

  return { p10, p50, p90, bcr_p50 }
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
