import {
  SOURCE_VERIFICATION_MATRIX,
  type SourceVerificationRow,
} from '@/data/sourceVerificationMatrix'
import { resolveModuleStandards, type StandardEntry } from '@/lib/standardsMap'
import { MODULE_NUMBERS } from '@/lib/chapterConfig'

export type MetricSourceTrace = {
  /** Id en SOURCE_VERIFICATION_MATRIX */
  matrixId: string
  metricLabel: string
  originModuleId: string
  /** Códigos M## de módulos que consumen la cifra en cascada */
  dependentModuleCodes: string[]
  /** Estándares del módulo origen (desde standards_map.json) */
  standardCodes: string[]
}

function moduleCode(moduleId: string): string {
  const num = MODULE_NUMBERS[moduleId]
  return num && num !== '??' && num !== '·' ? `M${num}` : moduleId
}

function standardCodesForModule(moduleId: string, filter?: (s: StandardEntry) => boolean): string[] {
  const record = resolveModuleStandards(moduleId)
  if (!record?.standards?.length) return []
  const list = filter ? record.standards.filter(filter) : record.standards
  return list.map(s => s.code)
}

function rowById(id: string): SourceVerificationRow | undefined {
  return SOURCE_VERIFICATION_MATRIX.find(r => r.id === id)
}

/** Trazas declaradas — sin inventar fuentes ni estándares fuera del mapa. */
export const METRIC_SOURCE_TRACES: Record<string, MetricSourceTrace> = {
  co2e_anual: {
    matrixId: 'emisiones',
    metricLabel: 'CO₂e evitadas (anual)',
    originModuleId: 'city_baseline',
    dependentModuleCodes: ['M04', 'M13', 'M15', 'M18'],
    standardCodes: standardCodesForModule('city_baseline', s =>
      s.code.includes('306') || s.code.includes('305'),
    ),
  },
}

export function getMetricSourceTrace(traceKey: string): MetricSourceTrace | null {
  return METRIC_SOURCE_TRACES[traceKey] ?? null
}

export function getMatrixRowForTrace(traceKey: string): SourceVerificationRow | undefined {
  const trace = getMetricSourceTrace(traceKey)
  if (!trace) return undefined
  return rowById(trace.matrixId)
}

export function formatMetricTraceValue(tons: number): string {
  if (tons >= 1000) {
    return `${(tons / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })}K tCO₂e`
  }
  return `${tons.toLocaleString('es-MX', { maximumFractionDigits: 0 })} tCO₂e`
}

export const SOURCE_TRACE_NAV_EVENT = 'alquimia:source-trace' as const

export type SourceTraceNavDetail = { traceKey: string }

export function dispatchSourceTraceNavigation(traceKey: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<SourceTraceNavDetail>(SOURCE_TRACE_NAV_EVENT, { detail: { traceKey } }),
  )
}

export function moduleCodeLabel(code: string): string {
  return code.startsWith('M') ? code : moduleCode(code)
}
