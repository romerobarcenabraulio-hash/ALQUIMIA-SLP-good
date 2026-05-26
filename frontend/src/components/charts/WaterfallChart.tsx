'use client'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { fmt } from '@/lib/utils'

export function WaterfallChart() {
  const { resultados, horizonte } = useSimulatorStore()
  if (!resultados) return <div className="h-72 bg-[#F0EDE5] rounded-lg animate-pulse" />

  const r = resultados
  const opexTotal = r.opexAnual * Math.max(1, horizonte)
  const capexTotal = r.capexTotal ?? 0

  // Waterfall items: positives add, negatives subtract
  const items: Array<{ label: string; delta: number; color: string; isTotal?: boolean }> = [
    { label: 'Venta\nmateriales', delta: r.ingresosBrutos,     color: '#1A5FA8' },
    { label: 'Ahorro\ndisposición', delta: r.ahorroDisposicion, color: '#3B6D11' },
    { label: 'Crédito\ncarbono',   delta: r.ingresoCarbono,    color: '#1D9E75' },
    { label: 'Biogás',             delta: r.ingresoBiogas,     color: '#639922' },
    { label: 'CAPEX',              delta: -capexTotal,          color: '#C0392B' },
    { label: 'OPEX\nacum.',        delta: -opexTotal,           color: '#E67E22' },
    { label: 'VPN\nneto',         delta: r.vpn,               color: r.vpn >= 0 ? '#3B6D11' : '#C0392B', isTotal: true },
  ]

  // Build floating waterfall: [spacer (transparent), display bar]
  let running = 0
  const data = items.map(item => {
    let spacer: number
    let display: number
    if (item.isTotal) {
      // Total bar starts from 0
      spacer = 0
      display = item.delta
    } else if (item.delta >= 0) {
      spacer = running
      display = item.delta
      running += item.delta
    } else {
      running += item.delta
      spacer = running
      display = -item.delta
    }
    return {
      label: item.label,
      spacer: Math.max(0, spacer),
      display: Math.abs(display),
      delta: item.delta,
      color: item.color,
      isTotal: !!item.isTotal,
    }
  })

  const maxVal = Math.max(...data.map(d => d.spacer + d.display), 0)

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 48, left: 24 }}>
          <XAxis
            dataKey="label"
            tick={{ ...CHART_AXIS_TICK, fontFamily: 'JetBrains Mono' }}
            angle={-30}
            textAnchor="end"
            interval={0}
            height={52}
          />
          <YAxis
            tickFormatter={v => fmt.mxnM(v)}
            tick={CHART_AXIS_TICK}
            tickLine={false}
            axisLine={false}
            domain={[0, maxVal * 1.12]}
          />
          <Tooltip
            formatter={(v: number, name: string, props: { payload?: { delta?: number; label?: string } }) => {
              if (name === 'spacer') return null
              const delta = props?.payload?.delta ?? 0
              return [fmt.mxnM(delta), props?.payload?.label ?? '']
            }}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <ReferenceLine y={0} stroke="#E8E4DC" />
          {/* Transparent spacer bar */}
          <Bar dataKey="spacer" stackId="wf" fill="transparent" isAnimationActive={false} />
          {/* Visible colored bar */}
          <Bar dataKey="display" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} opacity={0.9} />
            ))}
            <LabelList
              dataKey="delta"
              position="top"
              formatter={(v: number) => fmt.mxnM(v)}
              style={{ fontSize: 10, fill: '#A8A49C', fontFamily: 'JetBrains Mono' }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
