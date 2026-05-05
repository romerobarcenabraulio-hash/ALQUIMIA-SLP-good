'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AreaChart, Area } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
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
              <XAxis type="number" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis type="category" dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} width={40} />
              <Tooltip contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10 }} />
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
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis tickFormatter={v => fmt.mxnM(v * 12000 * 12)} tick={{ fontSize: 8, fill: '#A8A49C' }} />
              <Tooltip
                formatter={(v: number) => [fmt.mxn(v * 12000 * 12), 'Derrama salarial']}
                contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10 }}
              />
              <Area type="monotone" dataKey="CAs" stroke="#3B6D11" fill="url(#gradSal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
