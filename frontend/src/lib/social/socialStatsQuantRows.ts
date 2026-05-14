import type { OfficialStatSlice } from '@/types/socialOfficialStats'
import { resolveOfficialStat, type StatResolutionContext } from '@/lib/social/socialStatsResolve'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import {
  evaluateFirstWhitelistedRatio,
  type WhitelistedRatioOutcome,
} from '@/lib/social/socialStatsDerivatives'
import { PR4_AUDITOR_RATIO_WHITELIST } from '@/lib/social/pr4DerivativeWhitelist'
import { SOCIAL_QUANT_VIZ_MAX_SERIES, SOCIAL_STATS_PR4_TABLE_INDICATORS } from '@/data/socialStats/vizIndicators'

export type QuantPrimaryRow = {
  kind: 'primary'
  indicatorId: string
  label: string
  value: number | null
  unit: string
  availability: string
  meta: Pick<OfficialStatSlice, 'geoLevel' | 'vintageLabel' | 'sourceId' | 'geoLabel' | 'geoCode'> | null
}

export type QuantDerivativeRow = {
  kind: 'derivative'
  derivativeId: string
  label: string
  value: number | null
  unit: string
  outcome: WhitelistedRatioOutcome
  meta: Pick<OfficialStatSlice, 'geoLevel' | 'vintageLabel' | 'sourceId' | 'geoLabel' | 'geoCode'> | null
}

export type QuantVizRow = QuantPrimaryRow | QuantDerivativeRow

export type QuantChartPoint = {
  key: string
  name: string
  value: number
  meta: Pick<OfficialStatSlice, 'geoLevel' | 'vintageLabel' | 'sourceId'>
}

export function buildQuantVizRows(bundle: SocialStatsBundle, ctx: StatResolutionContext): {
  rows: QuantVizRow[]
  chartPoints: QuantChartPoint[]
} {
  const primaryRows: QuantPrimaryRow[] = []

  for (const indicatorId of SOCIAL_STATS_PR4_TABLE_INDICATORS) {
    const resolved = resolveOfficialStat(bundle, indicatorId, ctx)
    const slice = resolved.slice
    primaryRows.push({
      kind: 'primary',
      indicatorId,
      label: slice?.label ?? indicatorId,
      value: slice?.value ?? null,
      unit: slice?.unit ?? '—',
      availability: resolved.availability,
      meta: slice
        ? {
            geoLevel: slice.geoLevel,
            vintageLabel: slice.vintageLabel,
            sourceId: slice.sourceId,
            geoLabel: slice.geoLabel,
            geoCode: slice.geoCode,
          }
        : null,
    })
  }

  const ratio = evaluateFirstWhitelistedRatio(bundle, ctx)
  const rule0 = PR4_AUDITOR_RATIO_WHITELIST[0]

  const derivativeRow: QuantDerivativeRow = {
    kind: 'derivative',
    derivativeId: rule0?.id ?? 'whitelist_ratio',
    label:
      ratio.status === 'ok'
        ? ratio.label
        : ratio.status === 'blocked'
          ? `${rule0?.label ?? 'Derivado lista blanca'} — comparación bloqueada`
          : ratio.status === 'no_whitelist'
            ? 'Derivado lista blanca — sin reglas aprobadas'
            : `${rule0?.label ?? 'Derivado lista blanca'} — no disponible`,
    value: ratio.status === 'ok' ? ratio.value : null,
    unit: ratio.status === 'ok' ? ratio.unit : '—',
    outcome: ratio,
    meta:
      ratio.status === 'ok'
        ? {
            geoLevel: ratio.meta.geoLevel,
            vintageLabel: ratio.meta.vintageLabel,
            sourceId: ratio.meta.sourceId,
            geoLabel: ratio.meta.geoLabel,
            geoCode: ratio.meta.geoCode,
          }
        : null,
  }

  const maxPrimary = Math.max(0, SOCIAL_QUANT_VIZ_MAX_SERIES - 1)
  const primaryCapped = primaryRows.slice(0, maxPrimary)
  const rows: QuantVizRow[] = [...primaryCapped, derivativeRow].slice(0, SOCIAL_QUANT_VIZ_MAX_SERIES)

  const chartPoints: QuantChartPoint[] = []
  for (const r of rows) {
    if (chartPoints.length >= SOCIAL_QUANT_VIZ_MAX_SERIES) break
    if (r.kind === 'primary' && r.value != null && r.meta) {
      chartPoints.push({
        key: `p-${r.indicatorId}`,
        name: r.label.length > 42 ? `${r.label.slice(0, 42)}…` : r.label,
        value: r.value,
        meta: {
          geoLevel: r.meta.geoLevel,
          vintageLabel: r.meta.vintageLabel,
          sourceId: r.meta.sourceId,
        },
      })
    } else if (r.kind === 'derivative' && r.outcome.status === 'ok' && r.value != null && r.meta) {
      chartPoints.push({
        key: `d-${r.derivativeId}`,
        name: 'Razón (lista blanca)',
        value: r.value,
        meta: {
          geoLevel: r.meta.geoLevel,
          vintageLabel: r.meta.vintageLabel,
          sourceId: r.meta.sourceId,
        },
      })
    }
  }

  return { rows, chartPoints }
}
