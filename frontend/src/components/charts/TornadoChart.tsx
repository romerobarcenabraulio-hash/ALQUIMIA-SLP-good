'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { tornadoAnalysis } from '@/lib/calculator'
import { useMemo } from 'react'
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { fmt } from '@/lib/utils'

export function TornadoChart() {
  const state = useSimulatorStore()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- entradas listadas; `state` completo cambia de identidad cada render
  const data = useMemo(() => tornadoAnalysis(state), [
    state.precios, state.wacc, state.pctCapturaPorAño, state.mermaLogPct,
    state.zmActiva, state.municipiosActivos,
  ])

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 80 }}>
          <XAxis type="number" tickFormatter={v => fmt.mxnM(v)} tick={CHART_AXIS_TICK} />
          <YAxis type="category" dataKey="label" tick={CHART_AXIS_TICK} width={80} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(v: number) => [fmt.mxn(v), 'Impacto en VPN']}
          />
          <ReferenceLine x={0} stroke="#E8E4DC" />
          <Bar dataKey="plus" fill="#3B6D11" radius={[0,3,3,0]} opacity={0.85} name="+20%" />
          <Bar dataKey="minus" fill="#C0392B" radius={[3,0,0,3]} opacity={0.75} name="-20%" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
