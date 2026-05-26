import type { OfficialStatSlice, ResolvedOfficialStat } from '@/types/socialOfficialStats'
import {
  AGGREGATED_KPI_COPY_VETO_EXAMPLES,
  buildOfficialNumericVisualizationFooter,
  formatOfficialStatValueForDisplay,
  OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER,
} from '@/lib/social/aggregatedKpiCopy'
import { OFFICIAL_INDICATOR_FORMAT_SPEC } from '@/lib/social/officialStatsReadingFramework'
import { cn } from '@/lib/utils'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'

export const SOCIAL_STAT_MISMATCH_AUDITOR_COPY =
  'No hay fila municipal para el CVE activo en este dataset; el valor proviene de otro ámbito territorial explícito en las etiquetas. No lo cite como dato del municipio solicitado sin revisión documental.'

export const SOCIAL_STAT_MISMATCH_NAVIGATOR_COPY =
  'Navigator: no atribuya cifras de entidad federativa o de zona metropolitana estadística al municipio (CVE) sin desglose; mantenga separados Municipality y MetropolitanZone en actos y comunicación.'

export type OfficialStatCardProps = {
  availability: ResolvedOfficialStat['availability']
  slice: OfficialStatSlice | null
  /** Texto del ámbito pedido (p. ej. municipio CVE · etiqueta). */
  requestedAmbitoLabel: string
  className?: string
}

function isValidHttpUrl(u: string): boolean {
  try {
    const x = new URL(u)
    return x.protocol === 'http:' || x.protocol === 'https:'
  } catch {
    return false
  }
}

export function OfficialStatCard({
  availability,
  slice,
  requestedAmbitoLabel,
  className,
}: OfficialStatCardProps) {
  if (availability === 'no_disponible' || !slice) {
    return (
      <article
        data-testid="social-context-official-stat-empty"
        data-availability="no_disponible"
        className={cn(
          'rounded-[10px] border border-dashed border-[#C8C2B8] bg-[#FAFAF8] px-3 py-4 text-[12px] text-[#6B6760]',
          className,
        )}
      >
        <p className="font-medium text-[#1C1B18]">Sin dato oficial en este subconjunto</p>
        <p className="mt-1">
          Ámbito solicitado: <span className="font-mono text-[#1C1B18]">{requestedAmbitoLabel}</span>. No hay fila compatible en
          el dataset actual para el indicador.
        </p>
      </article>
    )
  }

  const showMismatch = availability === 'disponible_otro_ambito'
  const canLink = slice.sourceUrl && isValidHttpUrl(slice.sourceUrl)
  const { display: valueDisplay, precisionNote } = formatOfficialStatValueForDisplay(slice)
  const numericFooter = buildOfficialNumericVisualizationFooter({
    unit: slice.unit,
    geoLabel: slice.geoLabel,
    geoLevel: slice.geoLevel,
    geoCode: slice.geoCode,
    vintageLabel: slice.vintageLabel,
  })

  return (
    <article
      data-testid="social-context-official-stat-card"
      data-availability={availability}
      data-indicator-id={slice.indicatorId}
      className={cn('pt-1', className)}
    >
      {showMismatch && (
        <div
          data-testid="social-context-official-stat-mismatch"
          className="mb-3 rounded-[8px] border border-amber-200 bg-amber-50/90 px-2 py-2 text-[11px] leading-snug text-amber-950"
        >
          <p className="font-semibold text-amber-900">disponible_otro_ambito</p>
          <p className="mt-1">{SOCIAL_STAT_MISMATCH_AUDITOR_COPY}</p>
          <p className="mt-1 text-[10px] text-amber-900/90">{SOCIAL_STAT_MISMATCH_NAVIGATOR_COPY}</p>
        </div>
      )}

      <h5 className="text-[14px] font-semibold text-[#1C1B18]">{slice.label}</h5>
      <p
        className="mt-2 text-[10px] leading-snug text-[#64748B]"
        data-testid="social-official-pre-numeric-disclaimer"
      >
        {OFFICIAL_STAT_PRE_NUMERIC_DISCLAIMER}
      </p>
      <div className="mt-3">
        <AnchorFigure
          figure={valueDisplay}
          context={slice.unit}
          figureClassName="font-mono text-[22px] font-semibold"
        />
      </div>
      {precisionNote && (
        <p className="mt-1 text-[10px] leading-snug text-[#64748B]" data-testid="social-official-precision-note">
          {precisionNote}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          data-testid="social-official-badge-source"
          className="rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#5A6347]"
        >
          {slice.sourceId}
        </span>
        <span
          data-testid="social-official-badge-vintage"
          className="rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 text-[10px] text-[#5A6347]"
        >
          {slice.vintageLabel}
        </span>
        <span
          data-testid="social-official-badge-geo"
          className="rounded-full border border-[#D7E8C0] bg-[#F6FAEF] px-2 py-0.5 text-[10px] font-medium text-[#23470A]"
        >
          {slice.geoLabel}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-[#6B6760]">
        Valido para: <span className="font-medium text-[#1C1B18]">{slice.geoLevel}</span>
        {slice.geoCode ? (
          <>
            {' '}
            · código <span className="font-mono">{slice.geoCode}</span>
          </>
        ) : null}
      </p>

      {slice.caveat && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#8B5A00]">{slice.caveat}</p>
      )}

      {(slice.sourceSpreadsheetTab?.trim() || slice.excelRowHint?.trim()) && (
        <p
          className="mt-2 rounded-[6px] border border-[#D7E8C0] bg-[#F6FAEF]/80 px-2 py-1.5 text-[10px] leading-snug text-[#23470A]"
          data-testid="social-official-source-trace"
        >
          <span className="font-semibold">Trazabilidad fuentes de cálculo: </span>
          {slice.sourceSpreadsheetTab?.trim() ? (
            <span className="font-mono text-[#1C1B18]">{slice.sourceSpreadsheetTab}</span>
          ) : null}
          {slice.lastExtractedGitShaOpcional?.trim() ? (
            <span className="ml-1 font-mono text-[#5A6347]">· {slice.lastExtractedGitShaOpcional.trim().slice(0, 40)}</span>
          ) : null}
          {slice.excelRowHint?.trim() ? (
            <span className="mt-1 block font-normal text-[#1C1B18]">{slice.excelRowHint}</span>
          ) : null}
        </p>
      )}

      <p className="mt-3 text-[10px] text-[#6B6760]">
        Fuente declarada:{' '}
        {canLink ? (
          <a
            href={slice.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#3B6D11] underline-offset-2 hover:underline"
            data-testid="social-official-source-link"
          >
            {slice.sourceId} (enlace)
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        ) : (
          <span data-testid="social-official-source-pending">pendiente de fuente verificable (sin URL estable)</span>
        )}
      </p>

      <p
        className="mt-2 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1.5 font-mono text-[9px] leading-snug text-[#64748B]"
        data-testid="social-official-reading-format-line"
        title={OFFICIAL_INDICATOR_FORMAT_SPEC}
      >
        <span className="sr-only">Formato de lectura: </span>
        {slice.label} | {slice.sourceId} | {slice.geoLabel} | {slice.vintageLabel} |{' '}
        {slice.caveat?.trim() ? slice.caveat : '—'}
      </p>

      <p
        className="mt-3 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 text-[10px] leading-snug text-[#475569]"
        data-testid="social-official-numeric-footer"
      >
        {numericFooter}
      </p>

      <details className="mt-2 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAFA] px-2 py-1.5 text-[10px] text-[#64748B]">
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Errores típicos de redacción (veto)</summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {AGGREGATED_KPI_COPY_VETO_EXAMPLES.map((line, i) => (
            <li key={`veto-${i}`}>{line}</li>
          ))}
        </ul>
      </details>
    </article>
  )
}
