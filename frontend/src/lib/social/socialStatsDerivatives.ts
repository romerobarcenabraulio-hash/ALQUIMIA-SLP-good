import type { OfficialStatSlice, SocialStatsBundle } from '@/types/socialOfficialStats'
import { resolveOfficialStat, type StatResolutionContext } from '@/lib/social/socialStatsResolve'
import type { AuditorWhitelistedRatio } from '@/lib/social/pr4DerivativeWhitelist'
import { PR4_AUDITOR_RATIO_WHITELIST } from '@/lib/social/pr4DerivativeWhitelist'

export type WhitelistedRatioOutcome =
  | {
      status: 'ok'
      value: number
      unit: string
      label: string
      /** Metadatos comunes (numerador y denominador homogéneos). */
      meta: Pick<OfficialStatSlice, 'geoLevel' | 'vintageLabel' | 'sourceId' | 'geoLabel' | 'geoCode'>
    }
  | { status: 'no_whitelist' }
  | { status: 'no_disponible'; reason: 'missing_numerator' | 'missing_denominator' }
  | {
      status: 'blocked'
      warning: string
    }

function sliceFromResolved(
  bundle: SocialStatsBundle,
  indicatorId: string,
  ctx: StatResolutionContext,
): OfficialStatSlice | null {
  const r = resolveOfficialStat(bundle, indicatorId, ctx)
  return r.slice
}

function homogeneousForRatio(a: OfficialStatSlice, b: OfficialStatSlice): boolean {
  if (a.unit.trim() !== b.unit.trim()) return false
  if (a.geoLevel !== b.geoLevel) return false
  if ((a.geoCode ?? '') !== (b.geoCode ?? '')) return false
  if (a.vintageLabel.trim() !== b.vintageLabel.trim()) return false
  return true
}

/**
 * Evalúa un ratio de la lista blanca: sólo si numerador y denominador existen,
 * comparten unidad, geoLevel, geoCode y vintageLabel.
 */
export function evaluateWhitelistedRatio(
  bundle: SocialStatsBundle,
  ctx: StatResolutionContext,
  rule: AuditorWhitelistedRatio,
): WhitelistedRatioOutcome {
  const num = sliceFromResolved(bundle, rule.numeratorIndicatorId, ctx)
  const den = sliceFromResolved(bundle, rule.denominatorIndicatorId, ctx)

  if (!num) return { status: 'no_disponible', reason: 'missing_numerator' }
  if (!den) return { status: 'no_disponible', reason: 'missing_denominator' }

  if (!homogeneousForRatio(num, den)) {
    return {
      status: 'blocked',
      warning:
        'Comparación bloqueada (Auditor): las series no son homogéneas (unidad, ámbito territorial o vintage distintos). No se expone un cociente sin etiqueta.',
    }
  }

  if (den.value === 0) {
    return {
      status: 'blocked',
      warning: 'Comparación bloqueada: denominador cero.',
    }
  }

  return {
    status: 'ok',
    value: num.value / den.value,
    unit: 'adimensional',
    label: rule.label,
    meta: {
      geoLevel: num.geoLevel,
      vintageLabel: num.vintageLabel,
      sourceId: `${num.sourceId}+${den.sourceId}`,
      geoLabel: num.geoLabel,
      geoCode: num.geoCode,
    },
  }
}

export function evaluateFirstWhitelistedRatio(
  bundle: SocialStatsBundle,
  ctx: StatResolutionContext,
): WhitelistedRatioOutcome {
  if (PR4_AUDITOR_RATIO_WHITELIST.length === 0) {
    return { status: 'no_whitelist' }
  }
  return evaluateWhitelistedRatio(bundle, ctx, PR4_AUDITOR_RATIO_WHITELIST[0])
}
