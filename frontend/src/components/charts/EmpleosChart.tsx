'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AreaChart, Area } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { fmt } from '@/lib/utils'

export function EmpleosChart() {
  const { resultados } = useSimulatorStore()
  if (!resultados) return <div className="h-52 bg-[#F0EDE5] rounded-lg animate-pulse" />

  const data = resultados.serieAnual.map(a => ({
    año: `Año ${a.año}`,
    CAs: a.empleosDirectos,
    Recicladoras: Math.round(a.empleosDirectos * 0.4),
    Indirectos: Math.round(a.empleosDirectos * 2.5),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pirámide empleos */}
      <div>
        <p className="text-[11px] text-[#A8A49C] uppercase tracking-wide mb-2">Empleos por tipo · año final</p>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 40 }}>
              <XAxis type="number" tick={CHART_AXIS_TICK} />
              <YAxis type="category" dataKey="año" tick={CHART_AXIS_TICK} width={40} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="CAs"         fill="#3B6D11" stackId="a" />
              <Bar dataKey="Recicladoras" fill="#1A5FA8" stackId="a" />
              <Bar dataKey="Indirectos"  fill="#D4881E" stackId="a" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Masa salarial */}
      <div>
        <p className="text-[11px] text-[#A8A49C] uppercase tracking-wide mb-2">Masa salarial anual (MXN)</p>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradSal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B6D11" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B6D11" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="año" tick={CHART_AXIS_TICK} />
              <YAxis tickFormatter={v => fmt.mxnM(v * 12000 * 12)} tick={CHART_AXIS_TICK} />
              <Tooltip
                formatter={(v: number) => [fmt.mxn(v * 12000 * 12), 'Derrama salarial']}
                contentStyle={CHART_TOOLTIP_STYLE}
              />
              <Area type="monotone" dataKey="CAs" stroke="#3B6D11" fill="url(#gradSal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
