/**
 * Reconstruye LogisticsKpiContract desde el store — mismo motor que M08.
 * Usado por M09 (CostosPrograma) y M13 (Escenarios) sin depender de window.
 */
import { ESTACIONALIDAD } from '@/lib/constants'
import { computeOpexLogisticaAnual, OPEX_LOGISTICA_DEFAULTS } from '@/lib/financeLogisticsCalc'
import { infraOperativaFromStore } from '@/lib/infraOperativaSummary'
import {
  buildLogisticsKpiContract,
  computeLogisticsKpis,
  computeSeasonData,
  computeTrucksByMaterial,
  type LogisticsKpiContract,
} from '@/lib/logisticsCalc'
import type { ResultadosCalculados } from '@/types'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildLogisticsKpiFromStore(input: {
  zmActiva: string
  municipioLabel: string
  municipioId: string | null
  claveInegi?: string | null
  capCamionTon: number
  mixCAs: { P: number; M: number; G: number }
  resultados: ResultadosCalculados | null
  rechazoPorMat?: Record<string, number>
  opexParams?: {
    costoCamionMesMxn: number
    costoVisitaMxn: number
    costoContingenciaTonMxn: number
  }
}): LogisticsKpiContract | null {
  const rsuDia = input.resultados?.rsuTotalTonDia ?? 0
  const hasResultados = rsuDia > 0 && !!input.resultados?.camionesRequeridos
  if (!hasResultados) return null

  const infra = infraOperativaFromStore(input.mixCAs, input.resultados)
  const trucks = computeTrucksByMaterial(rsuDia, input.resultados ?? undefined)
  const kpis = computeLogisticsKpis(trucks)
  const seasonData = computeSeasonData(rsuDia, infra.capInstaladaTonDia, MESES, ESTACIONALIDAD)
  const totalCAs = input.mixCAs.P + input.mixCAs.M + input.mixCAs.G
  const opexParams = input.opexParams ?? OPEX_LOGISTICA_DEFAULTS

  const draftContract = buildLogisticsKpiContract({
    zm: input.zmActiva,
    municipio: input.municipioLabel,
    municipio_id: input.municipioId,
    clave_inegi: input.claveInegi ?? null,
    capCamionTon: input.capCamionTon,
    infra,
    trucks,
    kpis,
    seasonData,
    hasResultados,
    hasM06: totalCAs > 0,
    rechazoPorMat: input.rechazoPorMat,
  })

  const opexLog = computeOpexLogisticaAnual(draftContract, opexParams)

  return buildLogisticsKpiContract({
    zm: input.zmActiva,
    municipio: input.municipioLabel,
    municipio_id: input.municipioId,
    clave_inegi: input.claveInegi ?? null,
    capCamionTon: input.capCamionTon,
    infra,
    trucks,
    kpis,
    seasonData,
    hasResultados,
    hasM06: totalCAs > 0,
    rechazoPorMat: input.rechazoPorMat,
    opexLogisticaAnualMxn: opexLog?.opexLogisticaAnualMxn,
  })
}
