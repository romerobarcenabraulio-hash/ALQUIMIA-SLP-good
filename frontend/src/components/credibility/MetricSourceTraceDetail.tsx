'use client'

import { SectionLabel } from '@/components/editorial/SectionLabel'
import {
  getMatrixRowForTrace,
  getMetricSourceTrace,
  formatMetricTraceValue,
} from '@/data/metricStandardsTrace'
import { resolveModuleStandards } from '@/lib/standardsMap'
import { MODULE_NUMBERS } from '@/lib/chapterConfig'

export interface MetricSourceTraceDetailProps {
  traceKey: string
  /** Valor mostrado en el módulo origen (opcional) */
  displayValueTon?: number
}

export function MetricSourceTraceDetail({ traceKey, displayValueTon }: MetricSourceTraceDetailProps) {
  const trace = getMetricSourceTrace(traceKey)
  const row = getMatrixRowForTrace(traceKey)

  if (!trace || !row) {
    return (
      <p className="text-[12px] text-[#A8A49C] italic" data-testid="metric-source-trace-missing">
        Trazabilidad no configurada para esta cifra.
      </p>
    )
  }

  const originCode = MODULE_NUMBERS[trace.originModuleId]
    ? `M${MODULE_NUMBERS[trace.originModuleId]}`
    : trace.originModuleId

  const standardEntries = trace.standardCodes.length
    ? trace.standardCodes
    : (resolveModuleStandards(trace.originModuleId)?.standards ?? []).map(s => s.code)

  return (
    <aside
      id={`metric-trace-${traceKey}`}
      data-testid="metric-source-trace-detail"
      className="mt-6 border-t border-[#E8E4DC] pt-6 space-y-4 scroll-mt-24"
    >
      <SectionLabel>Trazabilidad de cifra · {trace.metricLabel}</SectionLabel>

      {displayValueTon != null && displayValueTon > 0 && (
        <p className="font-mono text-[20px] text-[#1C1B18]">
          {formatMetricTraceValue(displayValueTon)}
          <span className="ml-2 font-sans text-[12px] text-[#6B6760]">valor del escenario activo</span>
        </p>
      )}

      <dl className="grid gap-3 text-[12px] leading-relaxed max-w-[640px]">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold">Fuente</dt>
          <dd className="text-[#1C1B18] mt-0.5">{row.fuente}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold">Fórmula</dt>
          <dd className="font-mono text-[11px] text-[#4A4740] mt-0.5">{row.formula}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold">
            Estándar que respalda esta métrica
          </dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {standardEntries.map(code => (
              <span
                key={code}
                className="font-mono text-[10px] border border-[#E8E4DC] rounded px-2 py-0.5 text-[#6B6760]"
              >
                {code}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold">
            Módulos dependientes
          </dt>
          <dd className="font-mono text-[11px] text-[#6B6760] mt-0.5">
            {trace.dependentModuleCodes.join(', ')} · origen {originCode}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold">Afirmación</dt>
          <dd className="text-[#5A5750] mt-0.5">{row.afirmacion}</dd>
        </div>
      </dl>
    </aside>
  )
}
