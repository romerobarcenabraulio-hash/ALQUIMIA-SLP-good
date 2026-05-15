'use client'

import type { TooltipProps } from 'recharts'
import {
  Bar,
  CartesianGrid,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { QuantChartPoint } from '@/lib/social/socialStatsQuantRows'

type Payload = QuantChartPoint

function MetaTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload as Payload | undefined
  if (!p?.meta) return null
  return (
    <div
      role="status"
      className="max-w-[220px] rounded-[6px] border border-[#E8E4DC] bg-white px-2 py-2 text-[10px] shadow-md"
    >
      <p className="font-medium text-[#1C1B18]">{p.name}</p>
      <p className="mt-1 font-mono text-[#23470A]">{p.value}</p>
      <dl className="mt-2 space-y-0.5 text-[#6B6760]">
        <div>
          <dt className="inline font-normal after:content-[':']">Ámbito territorial (PR3)</dt>{' '}
          <dd className="inline font-medium text-[#1C1B18]">{p.meta.geoLevel}</dd>
        </div>
        <div>
          <dt className="inline font-normal after:content-[':']">Vintage</dt>{' '}
          <dd className="inline font-medium text-[#1C1B18]">{p.meta.vintageLabel}</dd>
        </div>
        <div>
          <dt className="inline font-normal after:content-[':']">Fuente</dt>{' '}
          <dd className="inline font-mono font-medium text-[#1C1B18]">{p.meta.sourceId}</dd>
        </div>
      </dl>
    </div>
  )
}

type Props = {
  points: QuantChartPoint[]
  className?: string
}

export function SocialStatsLightBarChart({ points, className }: Props) {
  if (points.length === 0) {
    return (
      <div
        className={`flex h-[200px] items-center justify-center rounded-[8px] border border-dashed border-[#C8C2B8] bg-[#FAFAF8] text-[11px] text-[#6B6760] ${className ?? ''}`}
        data-testid="social-pr4-chart-empty"
      >
        Sin puntos numéricos para graficar (subconjunto vacío o bloqueado).
      </div>
    )
  }

  const data = points.map(p => ({ ...p }))

  return (
    <div className={className} data-testid="social-pr4-bar-chart">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B6760' }} interval={0} angle={-18} dy={8} height={48} />
            <YAxis tick={{ fontSize: 9, fill: '#6B6760' }} width={44} />
            <Tooltip<number, string> content={props => <MetaTooltip {...props} />} cursor={{ fill: 'rgba(59,109,17,0.06)' }} />
            <Bar dataKey="value" fill="#3B6D11" opacity={0.85} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
