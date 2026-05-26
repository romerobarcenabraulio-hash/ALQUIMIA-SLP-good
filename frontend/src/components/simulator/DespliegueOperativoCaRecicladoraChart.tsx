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
import { KpiAnchorGrid, SectionLabel } from '@/components/editorial'

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
    <div className="mt-8 border-t border-[#E8E4DC] pt-5">
      <SectionLabel>
        Despliegue CA + recicladoras · {horizonte}a · {presetTrayectoria}
      </SectionLabel>

      <KpiAnchorGrid
        columns={3}
        className="mb-5"
        items={[
          { label: 'Centros acumulados (§2.4)', value: fmt.num0(last.caAcumulados) },
          { label: 'Offtake activo (modelo visual)', value: fmt.num0(last.recicladorasAcumuladas) },
          { label: 'Directos CA + línea recicladoras (80)', value: fmt.num0(empleoCierre) },
        ]}
      />

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
