import { MODELO_PARAMS } from '@/lib/constants'

const INPC_ANNUAL = 0.045
const COSTO_DISPOSICION_TM = 280
const COSTO_SALUD_POR_TON_ORGANICO = 185
const FACTOR_EMISION_RELLENO = 0.9
const PRECIO_SOCIAL_CARBONO_MXN = MODELO_PARAMS.precioCarbonoSCE[1] * MODELO_PARAMS.tipoCambio

export type ContrafactualYear = {
  año: string
  sinPrograma: number
  conPrograma: number
  diferencia: number
  captureRate: number
  costoCarbonoAnual: number
}

export function buildContrafactualData(
  rsuDia: number,
  años: number,
  ingresos_programa: number,
  co2eEvitadasAnualTon: number,
): ContrafactualYear[] {
  const results: ContrafactualYear[] = []
  let costoAcum = 0
  let costoPrograma = 0
  const tonAnual = rsuDia * 365

  for (let y = 1; y <= años; y++) {
    const inflFactor = Math.pow(1 + INPC_ANNUAL, y - 1)
    const costoDisposicion = tonAnual * COSTO_DISPOSICION_TM * inflFactor
    const costoSalud = tonAnual * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * inflFactor
    const costoCarbono = tonAnual * FACTOR_EMISION_RELLENO * PRECIO_SOCIAL_CARBONO_MXN * inflFactor
    const costoAnual = costoDisposicion + costoSalud + costoCarbono
    costoAcum += costoAnual

    const captureRate = Math.min(0.85, 0.15 + y * 0.12)
    const tonEvitada = co2eEvitadasAnualTon * captureRate
    const beneficioCarbono = tonEvitada * PRECIO_SOCIAL_CARBONO_MXN * inflFactor
    const costoConPrograma = tonAnual * (1 - captureRate) * COSTO_DISPOSICION_TM * inflFactor
    costoPrograma +=
      costoConPrograma + ingresos_programa * (1 - Math.pow(0.95, y - 1)) - beneficioCarbono

    results.push({
      año: `A${y}`,
      sinPrograma: Math.round(costoAcum / 1_000_000),
      conPrograma: Math.round(Math.max(0, costoPrograma) / 1_000_000),
      diferencia: Math.round((costoAcum - Math.max(0, costoPrograma)) / 1_000_000),
      captureRate: Math.round(captureRate * 100),
      costoCarbonoAnual: Math.round(costoCarbono / 1_000_000),
    })
  }
  return results
}

export const INPC_ANNUAL_OMISION = INPC_ANNUAL
export const COSTO_DISPOSICION_OMISION_TM = COSTO_DISPOSICION_TM
export const COSTO_SALUD_POR_TON_ORGANICO_OMISION = COSTO_SALUD_POR_TON_ORGANICO
export const FACTOR_EMISION_RELLENO_OMISION = FACTOR_EMISION_RELLENO

export function computeOmisionHeroMetrics(rsuDia: number, años: number, ingresoAnual: number, co2eAnual: number) {
  const data = buildContrafactualData(rsuDia, años, ingresoAnual, co2eAnual)
  const ultimo = data[data.length - 1]!
  const tonAnual = rsuDia * 365
  let saludSin = 0
  let saludCon = 0
  for (let y = 1; y <= años; y++) {
    const infl = Math.pow(1 + INPC_ANNUAL, y - 1)
    const salud = tonAnual * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * infl
    saludSin += salud
    const captureRate = Math.min(0.85, 0.15 + y * 0.12)
    saludCon += tonAnual * (1 - captureRate) * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * infl
  }
  return {
    costoTotalM: ultimo.sinPrograma,
    ahorroSaludM: (saludSin - saludCon) / 1_000_000,
    costoSalud10M: Math.round((tonAnual * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * años) / 1_000_000),
    costoCarbono10M: Math.round((tonAnual * FACTOR_EMISION_RELLENO * PRECIO_SOCIAL_CARBONO_MXN * años) / 1_000_000),
    diferenciaM: ultimo.diferencia,
  }
}
