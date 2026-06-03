'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { MATERIAL_COLORS } from '@/lib/utils'

export function VolumenBarChart() {
  const { resultados } = useSimulatorStore()
  if (!resultados) return <div className="h-64 bg-[#F0EDE5] rounded-lg animate-pulse" />

  const data = resultados.serieAnual.map(a => ({
    año: `Año ${a.año}`,
    Orgánico:  +(a.volTonDia.organico  * 300).toFixed(0),
    Papel:     +(a.volTonDia.papel     * 300).toFixed(0),
    Plásticos: +(a.volTonDia.plastico  * 300).toFixed(0),
    Vidrio:    +(a.volTonDia.vidrio    * 300).toFixed(0),
    Aluminio:  +(a.volTonDia.aluminio  * 300).toFixed(0),
    Otros:     +(a.volTonDia.otros     * 300).toFixed(0),
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
          <XAxis dataKey="año" tick={{ fontSize: 10, fill: '#A8A49C', fontFamily: 'JetBrains Mono' }} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#A8A49C', fontFamily: 'JetBrains Mono' }} />
          <Tooltip
            formatter={(v: number, n: string) => [`${v.toLocaleString('es-MX')} t/año`, n]}
            contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6B6760' }} />
          <Bar dataKey="Orgánico"  stackId="a" fill={MATERIAL_COLORS.organico}  radius={[0,0,0,0]} />
          <Bar dataKey="Papel"     stackId="a" fill={MATERIAL_COLORS.papel} />
          <Bar dataKey="Plásticos" stackId="a" fill={MATERIAL_COLORS.plastico} />
          <Bar dataKey="Vidrio"    stackId="a" fill={MATERIAL_COLORS.vidrio} />
          <Bar dataKey="Aluminio"  stackId="a" fill={MATERIAL_COLORS.aluminio} />
          <Bar dataKey="Otros"     stackId="a" fill={MATERIAL_COLORS.otros} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
