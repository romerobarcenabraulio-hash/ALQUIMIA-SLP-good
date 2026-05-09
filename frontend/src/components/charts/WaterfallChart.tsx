'use client'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function WaterfallChart() {
  const { resultados } = useSimulatorStore()
  if (!resultados) return <div className="h-64 bg-[#F0EDE5] rounded-lg animate-pulse" />

  const r = resultados
  const items = [
    { label: 'Venta materiales', value: r.ingresosBrutos, color: '#1A5FA8', cumulative: 0 },
    { label: 'OPEX', value: -r.opexAnual * r.serieAnual.length, color: '#C0392B', cumulative: 0 },
    { label: 'EBITDA', value: r.ebitda, color: '#3B6D11', cumulative: 0 },
    { label: 'Carbono', value: r.ingresoCarbono, color: '#1D9E75', cumulative: 0 },
    { label: 'Biogás', value: r.ingresoBiogas, color: '#639922', cumulative: 0 },
    { label: 'Ahorro disp.', value: r.ahorroDisposicion, color: '#D4881E', cumulative: 0 },
    { label: 'Ahorro salud', value: r.ahorroSalud, color: '#8B6B4A', cumulative: 0 },
    { label: 'Escenario ampliado', value: r.derremaTotal, color: '#1C1B18', cumulative: 0 },
  ]

  // Calcular cumulativos (waterfall logic)
  let running = 0
  const data = items.map(item => {
    const bottom = running
    if (item.value > 0) running += item.value
    else running += item.value
    return {
      ...item,
      bottom: item.value > 0 ? bottom : running,
      display: Math.abs(item.value),
    }
  })

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: 20 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#A8A49C', fontFamily: 'JetBrains Mono' }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tickFormatter={v => fmt.mxnM(v)} tick={{ fontSize: 10, fill: '#A8A49C', fontFamily: 'JetBrains Mono' }} />
          <Tooltip
            formatter={(v: number, n: string) => [fmt.mxn(v), n]}
            contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="#E8E4DC" />
          <Bar dataKey="display" radius={[3,3,0,0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} opacity={0.9} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
