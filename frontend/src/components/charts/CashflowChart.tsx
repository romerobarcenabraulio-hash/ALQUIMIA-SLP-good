'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { calcular } from '@/lib/calculator'
import { useMemo } from 'react'
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { fmt } from '@/lib/utils'

export function CashflowChart() {
  const state = useSimulatorStore()
  const { resultados } = state

  const scenarios = useMemo(() => {
    const opt = calcular({ ...state, precios: { ...state.precios, pet: state.precios.pet * 1.2, aluminio: state.precios.aluminio * 1.2 } })
    const pes = calcular({ ...state, precios: { ...state.precios, pet: state.precios.pet * 0.75, aluminio: state.precios.aluminio * 0.75 } })
    return { opt, pes }
  }, [state.precios, state.pctCapturaPorAño, state.horizonte])

  if (!resultados) return <div className="h-56 bg-[#F0EDE5] rounded-lg animate-pulse" />

  const data = resultados.serieAnual.map((a, i) => ({
    año:       `Año ${a.año}`,
    Realista:  a.fcfAcumulado,
    Optimista: scenarios.opt.serieAnual[i]?.fcfAcumulado ?? a.fcfAcumulado,
    Pesimista: scenarios.pes.serieAnual[i]?.fcfAcumulado ?? a.fcfAcumulado,
  }))

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 20 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="año" tick={CHART_AXIS_TICK} />
          <YAxis tickFormatter={v => fmt.mxnM(v)} tick={CHART_AXIS_TICK} />
          <Tooltip
            formatter={(v: number) => [fmt.mxn(v), '']}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#C0392B" strokeDasharray="4 2" label={{ value: 'Breakeven', fontSize: 10, fill: '#C0392B' }} />
          <Line type="monotone" dataKey="Realista"  stroke="#1A5FA8" strokeWidth={2.5} dot={{ r: 4, fill: '#1A5FA8' }} />
          <Line type="monotone" dataKey="Optimista" stroke="#3B6D11" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          <Line type="monotone" dataKey="Pesimista" stroke="#A8A49C" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
