/**
 * Motor de evaluación socioeconómica: empleos → pobreza + waterfall alivio fiscal estatal.
 */

import type { ResultadosCalculados } from '@/types'
import {
  getMunicipioBaseline,
  getStateBaseline,
  STATE_FISCAL_BASELINES,
  type EntidadKey,
} from '@/data/stateFiscalBaselines'

export type EscenarioFiscal = 'conservador' | 'base' | 'optimista'

export interface SocialFiscalImpactInput {
  resultados: ResultadosCalculados
  estado: string
  municipioGeoCode?: string
  escenario?: EscenarioFiscal
}

export interface WaterfallCanal {
  id: string
  label: string
  montoAnualMxn: number
  fuente: string
}

export interface SocialFiscalImpactResult {
  empleosDirectos: number
  empleosIndirectos: number
  empleosEfectivos: number
  personasBeneficiadas: number
  personasSalidaPobreza: number
  reduccionPobrezaMunPp: number
  reduccionPobrezaEstPp: number
  waterfall: WaterfallCanal[]
  alivioFiscalAnualMxn: number
  equivalenteReduccionDeudaPct: number
  scopeWarning?: string
  escenario: EscenarioFiscal
}

const ESCENARIO_MULT: Record<EscenarioFiscal, { formalizacion: number; rescate: number }> = {
  conservador: { formalizacion: 0.35, rescate: 0.08 },
  base:        { formalizacion: 0.45, rescate: 0.10 },
  optimista:   { formalizacion: 0.55, rescate: 0.12 },
}

const FACTOR_HOGAR = 2.4
const PESO_INDIRECTO = 0.6
const PCT_CARGA_ESTATAL_SALUD = 0.40
const CAP_STOCK_POBREZA = 0.15

export function computeSocialFiscalImpact(input: SocialFiscalImpactInput): SocialFiscalImpactResult {
  const { resultados, estado, municipioGeoCode, escenario = 'base' } = input
  const mult = ESCENARIO_MULT[escenario]

  const st = getStateBaseline(estado)
  const mun = getMunicipioBaseline(municipioGeoCode, estado)

  const directos = resultados.empleosTotalesDirectos ?? 0
  const indirectos = resultados.empleosIndirectos ?? 0
  const empleosEfectivos = directos + indirectos * PESO_INDIRECTO
  const personasBeneficiadas = Math.round(empleosEfectivos * FACTOR_HOGAR * mult.formalizacion)
  const capSalida = Math.round(mun.pobPobrezaMunicipio * CAP_STOCK_POBREZA)
  const personasSalidaPobreza = Math.min(personasBeneficiadas, capSalida)

  const reduccionPobrezaMunPp = mun.pobTotalMunicipio > 0
    ? (personasSalidaPobreza / mun.pobTotalMunicipio) * 100
    : 0
  const reduccionPobrezaEstPp = st.pobTotalEstado > 0
    ? (personasSalidaPobreza / st.pobTotalEstado) * 100
    : 0

  const isnDerechos = resultados.ingresosMunicipioFiscal ?? 0
  const ahorroSaludEstatal = (resultados.ahorroSalud ?? 0) * PCT_CARGA_ESTATAL_SALUD
  const rescateEvitado = (resultados.ingresosMunicipioOperativo ?? 0) * mult.rescate
  const spreadDeuda = st.tasaDeudaConvencional - st.tasaDeudaVerde
  const ahorroDeudaVerde = (resultados.capexTotal ?? 0) * spreadDeuda

  const waterfall: WaterfallCanal[] = [
    { id: 'isn', label: 'ISN y derechos municipales', montoAnualMxn: isnDerechos, fuente: 'calculator.ingresosMunicipioFiscal' },
    { id: 'salud', label: 'Ahorro salud SSA estatal', montoAnualMxn: ahorroSaludEstatal, fuente: 'ahorroSalud × 40%' },
    { id: 'rescate', label: 'Menor presión rescate municipal', montoAnualMxn: rescateEvitado, fuente: 'ingresosMunicipioOperativo × pctRescate' },
    { id: 'deuda_verde', label: 'Ahorro servicio deuda verde', montoAnualMxn: ahorroDeudaVerde, fuente: 'CAPEX × spread tasa' },
  ]

  const alivioFiscalAnualMxn = waterfall.reduce((s, c) => s + c.montoAnualMxn, 0)
  const equivalenteReduccionDeudaPct = st.deudaPublicaEstatalMxn > 0
    ? (alivioFiscalAnualMxn / st.deudaPublicaEstatalMxn) * 100
    : 0

  const scopeWarning = !municipioGeoCode
    ? 'Ámbito municipal no seleccionado — reducción de pobreza municipal es estimación proxy estatal.'
    : undefined

  return {
    empleosDirectos: directos,
    empleosIndirectos: indirectos,
    empleosEfectivos: Math.round(empleosEfectivos),
    personasBeneficiadas,
    personasSalidaPobreza,
    reduccionPobrezaMunPp,
    reduccionPobrezaEstPp,
    waterfall,
    alivioFiscalAnualMxn,
    equivalenteReduccionDeudaPct,
    scopeWarning,
    escenario,
  }
}

export function entidadFromZmEstado(estado: string): EntidadKey {
  if (estado in STATE_FISCAL_BASELINES) return estado as EntidadKey
  return 'San Luis Potosí'
}
