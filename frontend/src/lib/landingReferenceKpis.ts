/**
 * KPIs de la landing alineados al mismo marco que el simulador (DIA: una sola fuente canónica).
 */
import { ESTACIONALIDAD, ZMS } from '@/lib/constants'
import { calcular } from '@/lib/calculator'
import { SIMULATOR_STATE_DEFAULT } from '@/store/simulatorStore'

const ZM_SLP = ZMS.find(z => z.id === 'SLP')

/** RSU t/día: población total ZM × kg/hab·día del catálogo; rango por estacionalidad ± del modelo. */
export function landingZmSlpRsuTonDiaRange(): { min: number; max: number; kgPerCapita: number; totalPop: number } {
  if (!ZM_SLP) {
    return { min: 0, max: 0, kgPerCapita: 0.9, totalPop: 0 }
  }
  const base = (ZM_SLP.totalPop * ZM_SLP.genKgDia) / 1000
  const peak = 1 + Math.max(...ESTACIONALIDAD)
  return {
    min: Math.round(base),
    max: Math.round(base * peak),
    kgPerCapita: ZM_SLP.genKgDia,
    totalPop: ZM_SLP.totalPop,
  }
}

/** Ingresos brutos anualizados (MXN) con estado por defecto del simulador — mismo motor que /simulator. */
export function landingZmSlpIngresosBrutosAnualMXN(): number {
  const r = calcular(SIMULATOR_STATE_DEFAULT)
  const h = Math.max(1, SIMULATOR_STATE_DEFAULT.horizonte)
  return r.ingresosBrutos / h
}
