/**
 * OPEX logístico desde contrato HERMES — KRONOS Fase 0-1.
 * Fórmula validada en HANDOFF_HERMES_KRONOS_MAY2026.txt
 */
import type { LogisticsKpiContract } from '@/lib/logisticsCalc'

export interface OpexLogisticaParams {
  costoCamionMesMxn: number
  costoVisitaMxn: number
  costoContingenciaTonMxn: number
}

export interface OpexLogisticaResult {
  opexFlotaAnualMxn: number
  opexVisitasAnualMxn: number
  opexContingenciaAnualMxn: number
  opexLogisticaAnualMxn: number
  opexLogisticaMensualMxn: number
  confianzaAplicada: number
  advertencia: string | null
  fuente: string
}

export interface FinanceKpiContract {
  timestamp: string
  fase_producto: '0-1'
  municipio_id: string | null
  capex_total_mxn: number
  opex_centros_mensual_mxn: number
  opex_logistica_anual_mxn: number
  opex_logistica_mensual_mxn: number
  opex_total_anual_mxn: number
  tir_pct: number | null
  brecha_ton_dia: number
  riesgo_operativo: 'Bajo' | 'Medio' | 'Alto'
  modulos_prerequisitos_ok: boolean
  advertencia_gate: string | null
}

/** Defaults nacionales editables — no ancla SLP. Fuente: benchmark mercado MX 2026. */
export const OPEX_LOGISTICA_DEFAULTS: OpexLogisticaParams = {
  costoCamionMesMxn: 85_000,
  costoVisitaMxn: 450,
  costoContingenciaTonMxn: 280,
}

export function computeOpexLogisticaAnual(
  contract: LogisticsKpiContract | null,
  params: OpexLogisticaParams,
): OpexLogisticaResult | null {
  if (!contract) return null

  const { kpis_logisticos, calidad } = contract
  const confianza = calidad.confianza

  const opexFlotaAnual =
    kpis_logisticos.total_camiones_requeridos * params.costoCamionMesMxn * 12
  const opexVisitasAnual =
    kpis_logisticos.visitas_mes_estimadas * params.costoVisitaMxn * 12
  const opexContingenciaAnual =
    kpis_logisticos.brecha_ton_dia * params.costoContingenciaTonMxn * 365

  let total = opexFlotaAnual + opexVisitasAnual + opexContingenciaAnual
  let advertencia: string | null = null

  if (confianza < 0.7) {
    total *= confianza
    advertencia = `Confianza ${(confianza * 100).toFixed(0)}% — complete M01 y M06 para estimación plena.`
  }

  if (kpis_logisticos.brecha_ton_dia > 0) {
    advertencia = (advertencia ? `${advertencia} ` : '') +
      `Brecha sanitaria ${kpis_logisticos.brecha_ton_dia.toFixed(1)} t/día incluida en contingencia.`
  }

  return {
    opexFlotaAnualMxn: opexFlotaAnual,
    opexVisitasAnualMxn: opexVisitasAnual,
    opexContingenciaAnualMxn: opexContingenciaAnual,
    opexLogisticaAnualMxn: total,
    opexLogisticaMensualMxn: total / 12,
    confianzaAplicada: confianza,
    advertencia,
    fuente: 'HERMES LogisticsKpiContract + parámetros editables store',
  }
}

export function deriveMixCasFromPoblacion(poblacion: number): { P: number; M: number; G: number } {
  const pobMiles = poblacion / 1000
  if (pobMiles < 200) {
    return { P: Math.max(1, Math.round(pobMiles / 50)), M: 0, G: 0 }
  }
  if (pobMiles < 800) {
    return { P: 2, M: Math.max(0, Math.round(pobMiles / 200)), G: 0 }
  }
  return { P: 2, M: 3, G: Math.max(0, Math.round(pobMiles / 400)) }
}

/** Escala costo disposición 200–900 MXN/ton según escala municipal. */
export function deriveCostoDisposicionPorTon(poblacion: number): number {
  const pobMiles = poblacion / 1000
  if (pobMiles < 100) return 220
  if (pobMiles < 300) return 280
  if (pobMiles < 800) return 350
  return 420
}

export function buildFinanceKpiContract(input: {
  municipioId: string | null
  capexTotal: number
  opexCentrosMensual: number
  opexLogistica: OpexLogisticaResult | null
  tir: number | null
  logistics: LogisticsKpiContract | null
  hasM01: boolean
  hasM06: boolean
}): FinanceKpiContract {
  const opexLogAnual = input.opexLogistica?.opexLogisticaAnualMxn ?? 0
  const opexCentrosAnual = input.opexCentrosMensual * 12
  const prereqsOk = input.hasM01 && input.hasM06

  let riesgo: FinanceKpiContract['riesgo_operativo'] = 'Bajo'
  const brecha = input.logistics?.kpis_logisticos.brecha_ton_dia ?? 0
  const estacional = input.logistics?.kpis_logisticos.estacionalidad_meses_saturacion.length ?? 0

  if (brecha > 5 || estacional >= 3) riesgo = 'Alto'
  else if (brecha > 0 || estacional > 0) riesgo = 'Medio'

  let advertenciaGate: string | null = null
  if (!input.hasM01) {
    advertenciaGate = 'Sin M01 (línea base RSU): OPEX logístico no dimensionado.'
  } else if (!input.hasM06) {
    advertenciaGate = 'Sin M06 (infraestructura): CAPEX de centros no validado contra demanda.'
  } else if (brecha > 0) {
    advertenciaGate = `Brecha operativa ${brecha.toFixed(1)} t/día — revisar M08 antes de Cabildo.`
  }

  return {
    timestamp: new Date().toISOString(),
    fase_producto: '0-1',
    municipio_id: input.municipioId,
    capex_total_mxn: input.capexTotal,
    opex_centros_mensual_mxn: input.opexCentrosMensual,
    opex_logistica_anual_mxn: opexLogAnual,
    opex_logistica_mensual_mxn: input.opexLogistica?.opexLogisticaMensualMxn ?? 0,
    opex_total_anual_mxn: opexCentrosAnual + opexLogAnual,
    tir_pct: input.tir,
    brecha_ton_dia: brecha,
    riesgo_operativo: riesgo,
    modulos_prerequisitos_ok: prereqsOk,
    advertencia_gate: advertenciaGate,
  }
}

/** Multiplicador de estrés M13 cuando hay saturación estacional (conservador). */
export function scenarioStressMultiplier(logistics: LogisticsKpiContract | null): number {
  if (!logistics) return 1
  const meses = logistics.kpis_logisticos.estacionalidad_meses_saturacion.length
  const brecha = logistics.kpis_logisticos.brecha_ton_dia
  let mult = 1
  if (meses > 0) mult *= 1 - Math.min(0.15, meses * 0.03)
  if (brecha > 0) mult *= 1 - Math.min(0.12, brecha * 0.008)
  return Math.max(0.75, mult)
}
