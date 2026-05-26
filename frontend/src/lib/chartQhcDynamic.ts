import type { ChartBrief } from '@/data/moduleEditorialBriefs'
import { getCatalogChartBrief } from '@/data/chartBriefCatalog'
import { buildContrafactualData, INPC_ANNUAL_OMISION } from '@/lib/costoOmisionContrafactual'
import { monteCarloTriangularSamples, tornadoAnalysis } from '@/lib/calculator'
import { fmt } from '@/lib/utils'
import type { useSimulatorStore } from '@/store/simulatorStore'

type ChartQhcState = ReturnType<typeof useSimulatorStore.getState>

const MAX_QHC_WORDS = 55

export function qhcWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function clampQhc(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= MAX_QHC_WORDS) return words.join(' ')
  return `${words.slice(0, MAX_QHC_WORDS).join(' ')}…`
}

function buildTrajectoryCaptura(pctArr: number[], horizonte: number) {
  return Array.from({ length: horizonte + 1 }, (_, yr) => {
    if (yr === 0) return { año: yr, captura: 0 }
    const t = yr / horizonte
    const raw = t * (pctArr.length - 1)
    const lo = Math.floor(raw)
    const hi = Math.min(lo + 1, pctArr.length - 1)
    const frac = raw - lo
    const captura =
      Math.round(((pctArr[lo] ?? 0) * (1 - frac) + (pctArr[hi] ?? 0) * frac) * 10) / 10
    return { año: yr, captura }
  })
}

function mxnMillions(n: number): string {
  const m = n / 1_000_000
  return m >= 100 ? `$${m.toFixed(0)}` : `$${m.toFixed(1)}`
}

/** Párrafo QHC (Qué) con cifras del escenario activo — conclusión · ancla · acción. */
export function buildDynamicQhcLead(chartId: string, state: ChartQhcState): string | null {
  const r = state.resultados
  if (!r) return null

  switch (chartId) {
    case 'trayectoria-captura': {
      const traj = buildTrajectoryCaptura(state.pctCapturaPorAño, state.horizonte)
      const final = traj[traj.length - 1]?.captura ?? 0
      const y1 = traj[1]?.captura ?? 0
      const mesFin = state.horizonte * 12
      const mesMedio = Math.max(6, Math.round(mesFin / 2))
      const derrAnual = r.ingresosBrutos / Math.max(1, state.horizonte)
      const valorPuntoM = final > 0 ? derrAnual / final / 1_000_000 : 0
      return clampQhc(
        `Al año ${state.horizonte}, el ${final.toFixed(0)}% del RSU se separa en origen. La curva sube de ${y1.toFixed(0)}% (mes ${mesMedio}) a ${final.toFixed(0)}% (mes ${mesFin}). Cada punto extra vale ${mxnMillions(valorPuntoM * 1_000_000)} millones en valorización — invierta en campaña temprana.`,
      )
    }

    case 'volumen-rsu': {
      const cap = r.rsuTotalTonDia * ((state.pctCapturaPorAño[state.horizonte - 1] ?? 30) / 100)
      const ingAnual = r.ingresosBrutos / Math.max(1, state.horizonte)
      return clampQhc(
        `La derrama se arma aquí: ${cap.toFixed(0)} t/día capturables y ${fmt.mxnM(ingAnual)}/año en venta de material. Si la captura o la merma no cierran con campo, no lleve estas cifras a Cabildo — recalibre M01 primero.`,
      )
    }

    case 'costo-omision-acumulado': {
      const años = Math.max(state.horizonte, 10)
      const ingresoAnual = ((r.ingresosBrutos ?? 0) / Math.max(1, 10)) * 0.8
      const co2eAnual = r.co2eEvitadasAnualTon ?? (r.rsuTotalTonDia ?? 0) * 365 * 0.35
      const data = buildContrafactualData(r.rsuTotalTonDia, años, ingresoAnual, co2eAnual)
      const ultimo = data[data.length - 1]
      if (!ultimo) return null
      const inflPct = Math.round(INPC_ANNUAL_OMISION * 100)
      return clampQhc(
        `$${ultimo.diferencia.toLocaleString('es-MX')} millones de diferencia en ${años} años. La línea roja (sin programa) crece con inflación ${inflPct}%; la verde se aplana tras año 4 por amortización. Use la brecha para justificar inversión, no solo ahorro operativo.`,
      )
    }

    case 'm13-monte-carlo-tir':
    case 'm13-monte-carlo-vpn': {
      const metric = chartId === 'm13-monte-carlo-vpn' ? 'vpn' : 'tir'
      const samples = monteCarloTriangularSamples(state, 2000, metric)
      if (!samples.length) return null
      const q = (p: number) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))]
      const p10 = q(0.1)
      const p50 = q(0.5)
      const p90 = q(0.9)
      const resist = p10 >= (metric === 'tir' ? state.wacc : 0)
      if (metric === 'vpn') {
        return clampQhc(
          `Dos mil simulaciones del VPN. P10 ${fmt.mxnM(p10)}, mediana ${fmt.mxnM(p50)}, P90 ${fmt.mxnM(p90)}. ${resist ? 'La cola baja sigue positiva: priorice contratos indexados si el P10 se acerca a cero.' : 'Revise captura y WACC: el P10 erosiona valor presente neto.'}`,
        )
      }
      return clampQhc(
        `Dos mil simulaciones del modelo. P10 ${p10.toFixed(1)}%, mediana ${p50.toFixed(1)}%, P90 ${p90.toFixed(1)}%. ${resist ? 'El proyecto resiste la mayoría de escenarios adversos — ancle Cabildo en la mediana.' : 'El P10 cae bajo WACC: ajuste precios o captura antes de comprometer CAPEX.'}`,
      )
    }

    case 'm13-tornado-vpn':
    case 'm05-tornado': {
      const rows = tornadoAnalysis(state)
      if (!rows.length) return null
      const top = rows[0]!
      const second = rows[1]
      const rangeM = top.range / 1_000_000
      const range2M = second ? second.range / 1_000_000 : 0
      const scope =
        chartId === 'm05-tornado'
          ? 'Priorice negociar offtaker y captura año 1 antes que microajustes de precio por material.'
          : 'Vigile costo de capital y arranque ciudadano; el resto es ajuste fino en contratos.'
      return clampQhc(
        `${top.label} mueve el VPN ${rangeM.toFixed(1)} millones (±20%). ${second ? `${second.label}, ${range2M.toFixed(1)} millones. ` : ''}PET y vidrio, mucho menos. ${scope}`,
      )
    }

    case 'impactos-acumulados': {
      const co2 = r.co2eEvitadasAnualTon * state.horizonte
      return clampQhc(
        `${(co2 / 1000).toFixed(1)} mil tCO₂e evitadas en ${state.horizonte} años — argumento climático separado del ingreso por material. Presente metas municipales con esta cifra; no la mezcle con derrama de venta.`,
      )
    }

    case 'escenarios-tir': {
      return clampQhc(
        `TIR base ${r.tir.toFixed(1)}%: referencia para Cabildo. Acelerado y conservador barren captura/precio ±25–28%; C y D (más abajo) prueban bloqueo operativo. Compare siempre contra WACC ${state.wacc}% antes de votar.`,
      )
    }

    case 'escenarios-waterfall': {
      return clampQhc(
        `VPN neto ${fmt.mxnM(r.vpn)} desglosado por palanca. Si el bloque rojo de implementación consume el verde, recorte CAPEX o suba captura — no exporte el waterfall sin revisar supuestos M09.`,
      )
    }

    default:
      return null
  }
}

export function resolveChartBrief(
  chartId: string | null,
  state?: ChartQhcState | null,
): ChartBrief | null {
  if (!chartId) return null
  const base = getCatalogChartBrief(chartId)
  if (!base) return null
  if (!state) return base

  const lead = buildDynamicQhcLead(chartId, state)
  if (!lead) return base

  return {
    ...base,
    metodologia: {
      ...base.metodologia,
      como_se_calcula: lead,
    },
  }
}
