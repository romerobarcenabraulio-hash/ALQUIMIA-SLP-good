/** Tokens Recharts + clases Tailwind — contrato guardrail editorial/LOGOS para gráficas del simulador. */

import type { CSSProperties } from 'react'

export const CHART_AXIS_TICK = { fontSize: 10, fill: '#6B6760' } as const
export const CHART_AXIS_TICK_MUTED = { fontSize: 10, fill: '#A8A49C' } as const

export const CHART_GRID = { strokeDasharray: '3 3', stroke: '#F0EDE5' } as const

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  fontSize: 11,
  border: '1px solid #E8E4DC',
  borderRadius: 6,
}

export const CHART_TITLE = 'font-serif text-[14px] font-semibold text-[#1C1B18] leading-snug'
export const CHART_TITLE_SANS = 'text-[13px] font-semibold text-[#1C1B18] leading-snug'
export const CHART_SUBTITLE = 'text-[11px] text-[#6B6760] leading-snug'
export const CHART_METRIC_TITLE = 'text-[12px] font-semibold text-[#1C1B18]'
export const CHART_METRIC_UNIT = 'text-[11px] text-[#6B6760]'
export const CHART_PANEL_CLASS = 'rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden'
export const CHART_LEGEND_TEXT = 'text-[11px]'

export function activeSeriesStroke(active: boolean, color: string) {
  return {
    stroke: color,
    strokeWidth: active ? 2.5 : 1.5,
    strokeDasharray: active ? undefined : ('4 3' as const),
    opacity: active ? 1 : 0.55,
  }
}

export function formatAxisPct(v: number): string {
  return `${v}%`
}

export function formatAxisMoneyM(v: number): string {
  return `$${v}M`
}

export function formatAxisCo2K(v: number): string {
  return `${v}k`
}
