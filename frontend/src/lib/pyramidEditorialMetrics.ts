import { computeOmisionHeroMetrics } from '@/lib/costoOmisionContrafactual'
import type { ResultadosCalculados } from '@/types'

export type PyramidEditorialMetrics = {
  enterradoAnual: number
  capexTotal: number
  vivActivas: number
  costoOmisionTotalM: number
  ahorroSaludProgramaM: number
  tir: number
  paybackMeses: number
  horizonte: number
}

export function buildPyramidEditorialMetrics(input: {
  resultados: ResultadosCalculados | null
  costoDisposicionPorTon: number
  horizonte: number
}): Partial<PyramidEditorialMetrics> {
  const r = input.resultados
  if (!r) return {}

  const tonAnual = r.rsuTotalTonDia * 365
  const enterradoAnual = tonAnual * input.costoDisposicionPorTon
  const años = Math.max(input.horizonte, 10)
  const ingresoAnual = (r.ingresosBrutos / Math.max(1, 10)) * 0.8
  const co2eAnual = r.co2eEvitadasAnualTon ?? tonAnual * 0.35
  const omision = computeOmisionHeroMetrics(r.rsuTotalTonDia, años, ingresoAnual, co2eAnual)

  return {
    enterradoAnual,
    capexTotal: r.capexTotal,
    vivActivas: r.vivActivas,
    costoOmisionTotalM: omision.costoTotalM,
    ahorroSaludProgramaM: omision.ahorroSaludM,
    tir: r.tir,
    paybackMeses: r.paybackMeses,
    horizonte: años,
  }
}

export function fmtMillonesEditorial(nM: number): string {
  if (nM >= 1000) {
    return `$${Math.round(nM).toLocaleString('es-MX')} millones`
  }
  return `$${nM.toFixed(1)}M`
}

export function fmtViviendasEditorial(n: number): string {
  if (n >= 1_000) {
    const miles = Math.round(n / 1_000)
    return `${miles.toLocaleString('es-MX')} mil viviendas`
  }
  return `${n.toLocaleString('es-MX')} viviendas`
}
