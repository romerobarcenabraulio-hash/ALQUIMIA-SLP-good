'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { useLiveMonteCarlo } from '@/hooks/useLiveMonteCarlo'
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { fmt } from '@/lib/utils'
import { SimulationComputeTrace } from '@/components/simulator/SimulationComputeTrace'

export function MonteCarloVpnChart() {
  const state = useSimulatorStore()
  const { samples, progress, isRunning, p10, p50, p90, total } = useLiveMonteCarlo(state, 'vpn')

  const histogram = useMemo(() => {
    if (samples.length < 2) return []
    const min = Math.min(...samples)
    const max = Math.max(...samples)
    const bins = 24
    const size = (max - min) / bins || 1

    return Array.from({ length: bins }, (_, i) => {
      const lo = min + i * size
      const hi = lo + size
      const mid = (lo + hi) / 2
      return {
        bin: fmt.mxnM(mid),
        count: samples.filter(s => s >= lo && (i === bins - 1 ? s <= hi : s < hi)).length,
        lo,
        hi: mid,
        positive: mid >= 0,
      }
    })
  }, [samples])

  const completed = Math.round(progress * total)

  if (!state.resultados) {
    return (
      <p className="text-[11px] text-[#A8A49C] p-4">
        Configura el simulador para ver la distribución Monte Carlo del VPN.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <SimulationComputeTrace
        progress={progress}
        isRunning={isRunning}
        completed={completed}
        total={total}
        metricLabel="VPN"
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'P10 (escenario bajista)', value: fmt.mxnM(p10), color: '#C0392B' },
          { label: 'P50 (mediana)', value: fmt.mxnM(p50), color: '#1A5FA8' },
          { label: 'P90 (escenario optimista)', value: fmt.mxnM(p90), color: '#3B6D11' },
        ].map(k => (
          <div key={k.label} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-2.5">
            <p className="text-[9px] uppercase text-[#A8A49C] mb-0.5">{k.label}</p>
            <p className="font-mono text-[14px] font-semibold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {histogram.length > 0 && (
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...CHART_GRID} vertical={false} />
              <XAxis dataKey="bin" tick={CHART_AXIS_TICK} interval={4} />
              <YAxis tick={CHART_AXIS_TICK} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: number) => [`${v} simulaciones`, 'Frecuencia']}
              />
              <ReferenceLine x={fmt.mxnM(p50)} stroke="#1A5FA8" strokeDasharray="4 2" />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {histogram.map((d, i) => (
                  <Cell key={i} fill={d.positive ? '#3B6D11' : '#F5B7B1'} opacity={isRunning ? 0.65 : 0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-[9px] text-[#A8A49C]">
        {total.toLocaleString('es-MX')} iteraciones · distribución triangular · motor calcular().
        No constituye garantía de resultados.
      </p>
    </div>
  )
}
