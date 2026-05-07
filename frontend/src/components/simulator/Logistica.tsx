'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt, MATERIAL_LABELS } from '@/lib/utils'
import { MESES } from '@/lib/utils'
import { ESTACIONALIDAD } from '@/lib/constants'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function Logistica() {
  const { resultados, capCamionTon, mermaLogPct } = useSimulatorStore()

  const estData = ESTACIONALIDAD.map((f, i) => ({
    mes: MESES[i].slice(0, 3),
    factor: +(1 + f).toFixed(2),
    rsu: resultados ? +(resultados.rsuTotalTonDia * (1 + f)).toFixed(1) : 0,
  }))

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S11 — Logística</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Recolección y transporte</h2>
      <ScopeAnclaKicker className="mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
          <p className="text-[12px] font-medium text-[#6B6760] mb-2">Parámetros logísticos (lectura del plan global)</p>
          <p className="text-[12px] leading-relaxed text-[#6B6760]">
            Capacidad por camión: <span className="font-mono text-[#1C1B18]">{capCamionTon} t</span>.
            Merma logística modelada: <span className="font-mono text-[#1C1B18]">{mermaLogPct}%</span>.
            Se fijan en el modelo municipal; aquí no hay ajustes locales adicionales.
          </p>
        </div>

        {/* Tabla camiones por material */}
        {resultados && (
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[12px] font-medium text-[#6B6760] mb-3">Camiones requeridos (año final)</p>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E8E4DC]">
                  <th className="text-left py-1.5 text-[#A8A49C]">Material</th>
                  <th className="text-right py-1.5 text-[#A8A49C] font-mono">Vol t/día</th>
                  <th className="text-right py-1.5 text-[#A8A49C] font-mono">Camiones</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(resultados.volCapturablePorMat) as [string, number][]).map(([mat, vol]) => (
                  <tr key={mat} className="border-b border-[#F0EDE5]">
                    <td className="py-1 text-[#1C1B18]">{MATERIAL_LABELS[mat] ?? mat}</td>
                    <td className="py-1 text-right font-mono text-[#6B6760]">{fmt.num(vol)}</td>
                    <td className="py-1 text-right font-mono text-[#1C1B18]">
                      {resultados.camionesRequeridos[mat as keyof typeof resultados.camionesRequeridos]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estacionalidad */}
      <div>
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Estacionalidad mensual de RSU</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis domain={[0.85, 1.25]} tickFormatter={v => `${v}x`} tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                formatter={(v: number) => [`${v}x`, 'Factor estacional']}
                contentStyle={{ background: '#1C1B18', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10 }}
              />
              <Bar dataKey="factor" fill="#3B6D11" opacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
