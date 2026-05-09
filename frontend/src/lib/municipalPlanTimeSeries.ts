/**
 * Serie temporal unificada del plan municipal (hitos territoriales + motor §2.4 + resultados calculados).
 * Un solo lugar para progresión mes a mes; los componentes de UI solo proyectan.
 */

import type { AñoResultados, ResultadosCalculados, SimulatorState } from '@/types'
import { MODELO_PARAMS, PRESETS_TRAYECTORIA } from '@/lib/constants'
import { buildDespliegueOperativoSeries } from '@/lib/despliegueOperativoSeries'
import {
  getHitosForZm,
  HITOS_TIMELINE_SLP,
  HORIZONTE_DIAS_MESES_36,
  type Hito,
} from '@/data/hitosTimeline'
import { kpisAcumulados as hitosKpisHastaDia, pertExpectedDays } from '@/lib/pertUtils'

const PRESET_FIJADO = 'Realista' as const

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function sumVolTonDia(vol: AñoResultados['volTonDia']): number {
  return Object.values(vol).reduce((s, v) => s + (v ?? 0), 0)
}

function sampleSerieProgress(serie: AñoResultados[], u: number): {
  pctCaptura: number
  volSumTonDia: number
  ingresosAnual: number
  empleosDirectosCA: number
  co2eAnual: number
} {
  const n = serie.length
  if (n === 0) {
    return {
      pctCaptura: 0,
      volSumTonDia: 0,
      ingresosAnual: 0,
      empleosDirectosCA: 0,
      co2eAnual: 0,
    }
  }
  const uClamped = Math.min(1, Math.max(0, u))
  if (n === 1) {
    const a = serie[0]
    return {
      pctCaptura: a.pctCaptura,
      volSumTonDia: sumVolTonDia(a.volTonDia),
      ingresosAnual: a.ingresos,
      empleosDirectosCA: a.empleosDirectos,
      co2eAnual: a.co2e,
    }
  }
  const x = uClamped * (n - 1)
  const i0 = Math.floor(x)
  const f = x - i0
  const i1 = Math.min(n - 1, i0 + 1)
  const a = serie[i0]
  const b = serie[i1]
  const va = sumVolTonDia(a.volTonDia)
  const vb = sumVolTonDia(b.volTonDia)
  return {
    pctCaptura: lerp(a.pctCaptura, b.pctCaptura, i0 === i1 ? 0 : f),
    volSumTonDia: lerp(va, vb, i0 === i1 ? 0 : f),
    ingresosAnual: lerp(a.ingresos, b.ingresos, i0 === i1 ? 0 : f),
    empleosDirectosCA: lerp(a.empleosDirectos, b.empleosDirectos, i0 === i1 ? 0 : f),
    co2eAnual: lerp(a.co2e, b.co2e, i0 === i1 ? 0 : f),
  }
}

export type PuntoMesPlanMunicipal = {
  mes: number
  etiqueta: string
  añoEtiqueta: number
  mesEnAño: number
  faseDespliegue: number
  caAcumulados: number
  recicladorasAcumuladas: number
  empleosFormalesAcum: number
  pepenadoresFormalizadosAcum: number
  derramaAcumuladaMxN: number
  toneladasCapturadasMes: number
  ingresoValorizacionMesMxN: number
  reduccionRellenoPct: number
  co2eEvitadasAcumTon: number
  ahorroSaludAcumMxN: number
  cumplimientoNormativoPct: number
  rsuCapturadoPct: number
  circularidadCompuestaPct: number
}

export type FilaHitoResumen = {
  id: string
  hito: string
  mesEstimado: number
  etiquetaTemporal: string
  variableClave: string
  deltaPeriodo: string
  acumuladoNota: string
}

/** Etapa derivada del horizonte global (sin UI adicional) — para Sankey y sellos. */
export function getPlanTemporalStage(horizonte: number) {
  const H = Math.max(1, horizonte)
  const series = buildDespliegueOperativoSeries(H, PRESET_FIJADO)
  const last = series[series.length - 1]
  const mesTotal = H * 12
  return {
    fase: last?.fase ?? 0,
    faseNombre: last?.faseNombre ?? '',
    mes: mesTotal,
  }
}

/** Año efectivo continuo [0,5] para `interpolateSankeyLinks` según avance del plan. */
export function sankeyYearFromHorizonte(horizonte: number): number {
  return Math.min(5, Math.max(0, horizonte))
}

export function pctCapturaFijadaPorAno(horizonte: number): number[] {
  const años = PRESETS_TRAYECTORIA[PRESET_FIJADO]?.años ?? [20, 45, 70, 90, 100]
  return Array.from({ length: Math.max(1, horizonte) }, (_, i) => años[Math.min(i, años.length - 1)] ?? 70)
}

function etiquetaMes(m: number, h: number): { añoEtiqueta: number; mesEnAño: number; texto: string } {
  const añoEtiqueta = Math.ceil(m / 12)
  const mesEnAño = ((m - 1) % 12) + 1
  const texto = h <= 3 ? `A${añoEtiqueta}·M${mesEnAño}` : `M${m}`
  return { añoEtiqueta, mesEnAño, texto }
}

/**
 * Construye la serie mensual completa. `empleoBaseHitos` ancla hitos a personal ya contabilizado en motor.
 */
export function buildMunicipalPlanTimeSeries(
  state: SimulatorState,
  resultados: ResultadosCalculados,
  _resultadosSinPrograma: ResultadosCalculados | null,
  opts: { baselineCircularityPct?: number; empleoBaseHitos?: number } = {},
): PuntoMesPlanMunicipal[] {
  const H = Math.max(1, state.horizonte)
  const totalMeses = H * 12
  const serie = resultados.serieAnual
  const despliegue = buildDespliegueOperativoSeries(H, PRESET_FIJADO)
  const { hitos } = getHitosForZm(state.zmActiva)

  const baseline = opts.baselineCircularityPct ?? 8
  const empleoBase =
    opts.empleoBaseHitos ?? Math.max(0, Math.round(resultados.empleosDirectosCAs * 0.12))

  const diasMes = MODELO_PARAMS.diasOperativos / 12

  const diaTotalPlan = H * 365
  const pepAlcanceHitos = hitosKpisHastaDia(hitos, diaTotalPlan, empleoBase).pepenadores
  const escalaPep =
    pepAlcanceHitos > 0 ? resultados.pepenadoresFormalizados / pepAlcanceHitos : 1

  const out: PuntoMesPlanMunicipal[] = []
  let ingBrutoAcum = 0
  let co2Acum = 0

  for (let m = 1; m <= totalMeses; m++) {
    const u = totalMeses <= 1 ? 1 : (m - 0.5) / totalMeses
    const sample = sampleSerieProgress(serie, u)

    let ca = 0
    let rec = 0
    let empCa = 0
    let fase = 0
    for (const p of despliegue) {
      if (p.mesAcumulado <= m) {
        ca = p.caAcumulados
        rec = p.recicladorasAcumuladas
        empCa = p.empleosDirectosCa
        fase = p.fase
      }
    }

    const { añoEtiqueta, mesEnAño, texto } = etiquetaMes(m, H)
    const empLineaRecic = 80
    const empleosFormalesAcum = sample.empleosDirectosCA + empLineaRecic

    const diaSim = (m / totalMeses) * diaTotalPlan
    const hitK = hitosKpisHastaDia(hitos, diaSim, empleoBase)
    const pepenadoresFormalizadosAcum = Math.min(
      resultados.pepenadoresFormalizados,
      Math.max(0, hitK.pepenadores * escalaPep),
    )

    ingBrutoAcum += sample.ingresosAnual / 12
    const derramaAcumuladaMxN = ingBrutoAcum

    const toneladasCapturadasMes = sample.volSumTonDia * diasMes
    const ingresoValorizacionMesMxN = sample.ingresosAnual / 12

    const reduccionRellenoPct = Math.min(
      100,
      Math.max(0, (sample.volSumTonDia / Math.max(1e-6, resultados.rsuTotalTonDia)) * 100),
    )

    co2Acum += sample.co2eAnual / 12

    const progress = m / totalMeses
    const ahorroSaludAcumMxN = progress * resultados.ahorroSalud

    const capturaNorma = Math.min(
      100,
      baseline + (sample.pctCaptura - baseline) * 0.82 + (hitK.captura_pct > 0 ? 4 : 0),
    )
    const cumplimientoNormativoPct = capturaNorma

    const circularidadCompuestaPct = Math.min(
      100,
      0.42 * sample.pctCaptura +
        0.28 * reduccionRellenoPct +
        0.18 * Math.min(100, (pepenadoresFormalizadosAcum / Math.max(1, resultados.pepenadoresFormalizados)) * 100) +
        0.12 * baseline,
    )

    out.push({
      mes: m,
      etiqueta: texto,
      añoEtiqueta,
      mesEnAño,
      faseDespliegue: fase,
      caAcumulados: ca,
      recicladorasAcumuladas: rec,
      empleosFormalesAcum,
      pepenadoresFormalizadosAcum,
      derramaAcumuladaMxN,
      toneladasCapturadasMes,
      ingresoValorizacionMesMxN,
      reduccionRellenoPct,
      co2eEvitadasAcumTon: co2Acum,
      ahorroSaludAcumMxN,
      cumplimientoNormativoPct,
      rsuCapturadoPct: sample.pctCaptura,
      circularidadCompuestaPct,
    })
  }

  return out
}

/**
 * Hitos territoriales escalados al horizonte global; deltas del catálogo; acumulados narrativos.
 */
export function buildHitosResumenRows(horizonte: number, hitos: Hito[] = HITOS_TIMELINE_SLP): FilaHitoResumen[] {
  const totalMeses = Math.max(1, horizonte * 12)
  const refDias = HORIZONTE_DIAS_MESES_36

  let acumEmp = 0
  let acumPep = 0
  let acumCapPts = 0
  let acumCo2 = 0

  return hitos.map(h => {
    const mesEstimado = Math.max(
      1,
      Math.min(totalMeses, Math.round((pertExpectedDays(h) / refDias) * totalMeses)),
    )
    const año = Math.ceil(mesEstimado / 12)
    const mesEnAño = ((mesEstimado - 1) % 12) + 1

    acumEmp += h.kpis.empleos_delta
    acumPep += h.kpis.pepenadores_delta
    acumCapPts += h.kpis.captura_pct_pts
    acumCo2 += h.kpis.co2e_evitado_ton_delta

    const partesDelta: string[] = []
    if (h.kpis.empleos_delta) partesDelta.push(`+${h.kpis.empleos_delta} empleos`)
    if (h.kpis.pepenadores_delta) partesDelta.push(`+${h.kpis.pepenadores_delta} formalizaciones`)
    if (h.kpis.captura_pct_pts) partesDelta.push(`+${h.kpis.captura_pct_pts} pp captura ref.`)
    if (h.kpis.co2e_evitado_ton_delta) partesDelta.push(`+${h.kpis.co2e_evitado_ton_delta} t CO₂e`)

    return {
      id: h.id,
      hito: h.nombre_corto,
      mesEstimado,
      etiquetaTemporal: `Año ${año} · mes ${mesEnAño} (estimado)`,
      variableClave: h.es_gate_clave ? 'Competencia / gate normativa' : 'Operación / cobertura',
      deltaPeriodo: partesDelta.join(' · ') || '—',
      acumuladoNota: `Emp Δ ${acumEmp} · Pep Δ ${acumPep} · Captura ref. +${acumCapPts.toFixed(1)} pp · CO₂e +${acumCo2.toFixed(0)} t`,
    }
  })
}
