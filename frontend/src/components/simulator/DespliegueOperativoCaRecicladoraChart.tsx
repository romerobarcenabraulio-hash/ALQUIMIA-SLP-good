'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import {
  buildDespliegueOperativoSeries,
  empleoFormalDirectoCierre,
} from '@/lib/despliegueOperativoSeries'

export function DespliegueOperativoCaRecicladoraChart() {
  const horizonte = useSimulatorStore(s => s.horizonte)
  const presetTrayectoria = useSimulatorStore(s => s.presetTrayectoria)

  const series = useMemo(
    () => buildDespliegueOperativoSeries(horizonte, presetTrayectoria),
    [horizonte, presetTrayectoria],
  )

  const chartData = useMemo(
    () =>
      series.map(p => ({
        ...p,
        etiqueta: `F${p.fase}`,
        etiquetaMes: `~${p.mesAcumulado} mes`,
      })),
    [series],
  )

  const last = series[series.length - 1]
  const empleoCierre = empleoFormalDirectoCierre(series)

  if (!series.length || !last) return null

  return (
    <div className="mt-8 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">
        Despliegue operativo · referencia §2.4
      </p>
      <h2 className="font-serif text-[22px] text-[#1C1B18] mb-1">
        Despliegue operativo: CA + Recicladoras
      </h2>
      <p className="text-[12px] text-[#6B6760] mb-4 max-w-3xl leading-relaxed">
        Curva acumulada según fases de infraestructura del modelo, horizonte a{' '}
        <span className="font-medium text-[#1C1B18]">{horizonte} año{horizonte !== 1 ? 's' : ''}</span> y ritmo del preset{' '}
        <span className="font-medium text-[#1C1B18]">{presetTrayectoria}</span>. Sin parámetros adicionales: solo lectura del plan.
      </p>

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiPill label="CA al cierre" value={fmt.num0(last.caAcumulados)} sub="Centros acumulados (§2.4)" />
        <KpiPill
          label="Recicladoras al cierre"
          value={fmt.num0(last.recicladorasAcumuladas)}
          sub="Offtake activo (modelo visual)"
        />
        <KpiPill
          label="Empleo formal est. al cierre"
          value={fmt.num0(empleoCierre)}
          sub="Directos CA + línea recicladoras (80)"
        />
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 10, fill: '#6B6760' }}
              tickLine={false}
              axisLine={{ stroke: '#E8E4DC' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#6B6760' }}
              allowDecimals={false}
              width={32}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#6B6760' }}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: '#1C1B18',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => [fmt.num0(value), name]}
              labelFormatter={label => {
                const row = chartData.find(d => d.etiqueta === label)
                return row
                  ? `${row.etiqueta} · ${row.etiquetaMes} · ${row.faseNombre}`
                  : String(label)
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="caAcumulados"
              name="CA activos (acum.)"
              stroke="#3B6D11"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3B6D11' }}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="recicladorasAcumuladas"
              name="Recicladoras activas (acum.)"
              stroke="#1A5FA8"
              strokeWidth={2}
              dot={{ r: 3, fill: '#1A5FA8' }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[10px] text-[#8A857C] leading-snug">
        Eje X: fases F1…Fn distribuidas en ~{horizonte * 12} meses del horizonte. Recicladoras: derivación interna por cobertura e infraestructura; no sustituye catálogo contractual. Empleo: mix P/M/G de §2.4 + 80 directos recicladoras como en el motor de referencia.
      </p>
    </div>
  )
}

function KpiPill({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3 shadow-[0_1px_0_rgba(28,27,24,0.03)]">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[22px] font-semibold text-[#1C1B18]">{value}</p>
      <p className="mt-0.5 text-[10px] text-[#8A857C]">{sub}</p>
    </div>
  )
}
