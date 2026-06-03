'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'

const BENCHMARKS = [
  { name: 'Bogotá',    color: '#639922', data: [8, 22, 40, 60, 80, 95, 100] },
  { name: 'B. Aires',  color: '#D4881E', data: [5, 15, 30, 55, 75, 90, 100] },
  { name: 'Curitiba',  color: '#8B6B4A', data: [20, 45, 65, 80, 90, 95, 100] },
]

export function CapturaAreaChart() {
  const { pctCapturaPorAño, horizonte, zmActiva } = useSimulatorStore()

  const data = Array.from({ length: 7 }, (_, i) => {
    const año = i + 1
    const plan = pctCapturaPorAño[i] ?? (i >= horizonte ? 100 : null)
    const row: Record<string, number | string | null> = { año: `Año ${año}`, Plan: plan }
    BENCHMARKS.forEach(b => { row[b.name] = b.data[i] ?? null })
    return row
  })

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1A5FA8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1A5FA8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="año" tick={CHART_AXIS_TICK} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={CHART_AXIS_TICK} />
          <Tooltip
            formatter={(v: number, n: string) => [`${v}%`, n]}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#6B6760' }} />
          <Area type="monotone" dataKey="Plan" stroke="#1A5FA8" fill="url(#gradPlan)" strokeWidth={2.5} name={`Plan ${zmActiva}`} connectNulls />
          {BENCHMARKS.map(b => (
            <Area key={b.name} type="monotone" dataKey={b.name} stroke={b.color} fill="none" strokeWidth={1.5} strokeDasharray="5 3" connectNulls />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
