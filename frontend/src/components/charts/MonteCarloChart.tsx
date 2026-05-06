'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { monteCarlo } from '@/lib/calculator'
import { useMemo } from 'react'

export function MonteCarloCChart() {
  const state  = useSimulatorStore()
  const wacc = state.wacc

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mismo patrón que TornadoChart (ámbito municipal Q-024)
  const results = useMemo(() => monteCarlo(state, 2000), [
    state.precios, state.pctCapturaPorAño, state.mermaLogPct, state.horizonte,
    state.zmActiva, state.municipiosActivos,
  ])

  const min  = Math.min(...results)
  const max  = Math.max(...results)
  const bins = 40
  const size = (max - min) / bins

  const histogram = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * size
    const hi = lo + size
    return {
      bin:   `${lo.toFixed(0)}%`,
      count: results.filter(r => r >= lo && r < hi).length,
      lo, hi,
    }
  })

  const p10 = results[Math.floor(results.length * 0.10)]
  const p50 = results[Math.floor(results.length * 0.50)]
  const p90 = results[Math.floor(results.length * 0.90)]

  return (
    <div>
      <div className="flex gap-6 mb-3">
        {[['P10', p10], ['P50', p50], ['P90', p90]].map(([label, val]) => (
          <div key={label as string} className="text-center">
            <p className="text-[10px] text-[#A8A49C] uppercase tracking-wide">{label as string}</p>
            <p className="font-mono text-[14px] text-[#1C1B18]">{(val as number).toFixed(1)}%</p>
          </div>
        ))}
      </div>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" vertical={false} />
            <XAxis dataKey="bin" tick={{ fontSize: 8, fill: '#A8A49C' }} interval={7} />
            <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} />
            <Tooltip
              contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11 }}
              formatter={(v: number) => [`${v} simulaciones`, 'Frecuencia']}
            />
            <ReferenceLine x={`${wacc.toFixed(0)}%`} stroke="#C0392B" strokeDasharray="4 2" label={{ value: 'WACC', fontSize: 9, fill: '#C0392B' }} />
            <Bar dataKey="count" radius={[2,2,0,0]}>
              {histogram.map((d, i) => (
                <Cell key={i} fill={d.lo >= wacc ? '#3B6D11' : '#E8E4DC'} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
