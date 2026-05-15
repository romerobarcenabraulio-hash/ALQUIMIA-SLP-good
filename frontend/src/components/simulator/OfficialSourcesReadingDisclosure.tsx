'use client'

import {
  OFFICIAL_INDICATOR_FORMAT_SPEC,
  OFFICIAL_SOURCES_READING_BODY,
  OFFICIAL_SOURCES_READING_SUMMARY,
  OFFICIAL_STAT_MERGE_CHECKLIST,
  OFFICIAL_STAT_PROHIBITED_PUBLIC,
} from '@/lib/social/officialStatsReadingFramework'
import {
  AGGREGATED_KPI_ALLOWED_ONE_LINER,
  COARSE_OR_INTERVAL_CRITERION,
  INFERENCE_PROHIBITED_ONE_LINER,
} from '@/lib/social/aggregatedKpiCopy'
import { cn } from '@/lib/utils'

export type OfficialSourcesReadingDisclosureProps = {
  className?: string
  /** compact: solo texto principal; full: checklist + prohibido + formato sugerido */
  variant?: 'compact' | 'full'
}

export function OfficialSourcesReadingDisclosure({
  className,
  variant = 'full',
}: OfficialSourcesReadingDisclosureProps) {
  return (
    <details
      data-testid="official-sources-reading-disclosure"
      className={cn(
        'rounded-[8px] border border-[#C5D4E8]/80 bg-[#F4F8FC]/90 px-3 py-2 text-[11px] leading-relaxed text-[#4A5568]',
        className,
      )}
    >
      <summary className="cursor-pointer select-none font-medium text-[#1C1B18]">
        {OFFICIAL_SOURCES_READING_SUMMARY}
      </summary>
      <p className="mt-2 border-t border-[#E2E8F0] pt-2 text-[#4A5568]">{OFFICIAL_SOURCES_READING_BODY}</p>

      {variant === 'full' && (
        <>
          <div className="mt-3 border-t border-[#E2E8F0] pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
              Checklist de merge antes de exponer un número
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] text-[#4A5568]">
              {OFFICIAL_STAT_MERGE_CHECKLIST.map((line, i) => (
                <li key={`merge-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3 border-t border-[#E2E8F0] pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Prohibido en copy</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] text-[#4A5568]">
              {OFFICIAL_STAT_PROHIBITED_PUBLIC.map((line, i) => (
                <li key={`prohibited-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3 border-t border-[#E2E8F0] pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
              KPI agregado o derivado (sin equiparar a dictamen)
            </p>
            <p className="mt-1 text-[10px] text-[#4A5568]">{AGGREGATED_KPI_ALLOWED_ONE_LINER}</p>
            <p className="mt-1 text-[10px] text-[#4A5568]">{INFERENCE_PROHIBITED_ONE_LINER}</p>
            <p className="mt-2 text-[10px] font-medium text-[#334155]">Criterio de precisión / dato grueso</p>
            <p className="mt-0.5 text-[10px] text-[#4A5568]">{COARSE_OR_INTERVAL_CRITERION}</p>
          </div>
          <p className="mt-3 border-t border-[#E2E8F0] pt-2 font-mono text-[10px] text-[#64748B]">
            Formato sugerido por indicador: {OFFICIAL_INDICATOR_FORMAT_SPEC}
          </p>
        </>
      )}
    </details>
  )
}
