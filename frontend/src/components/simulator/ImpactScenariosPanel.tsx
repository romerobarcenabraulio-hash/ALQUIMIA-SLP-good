'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ChartPanel } from '@/components/ui/ChartPanel'
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
  activeSeriesStroke,
} from '@/lib/chartTheme'

type TrajectorySeries = {
  presetId: string
  label: string
  color: string
  captures: number[]
}

export type ImpactLinesData = {
  captChartData: Record<string, number>[]
  coChartData: Record<string, number>[]
  derrChartData: Record<string, number>[]
  saludChartData: Record<string, number>[]
  trajs: TrajectorySeries[]
}

type MetricChart = {
  title: string
  unit: string
  data: Record<string, number>[]
  fmtV: (v: number) => string
  yFmt: (v: number) => string
}

interface ImpactScenariosPanelProps {
  impactLines: ImpactLinesData
  horizonte: number
  presetTrayectoria: string
  activeLabel: string
}

export function ImpactScenariosPanel({
  impactLines,
  horizonte,
  presetTrayectoria,
  activeLabel,
}: ImpactScenariosPanelProps) {
  const yearRow = impactLines.captChartData[horizonte]

  const kpis = useMemo(() => {
    if (!yearRow) return []
    return [
      {
        label: 'Captura',
        value: `${(yearRow[activeLabel] ?? 0).toFixed(0)}%`,
        accent: impactLines.trajs.find(t => t.label === activeLabel)?.color ?? '#3B6D11',
      },
      {
        label: 'CO₂e acum.',
        value: `${impactLines.coChartData[horizonte]?.[activeLabel] ?? 0}K t`,
        accent: '#1A5FA8',
      },
      {
        label: 'Derrama acum.',
        value: `$${impactLines.derrChartData[horizonte]?.[activeLabel] ?? 0}M`,
        accent: '#D4881E',
      },
      {
        label: 'Salud acum.',
        value: `$${impactLines.saludChartData[horizonte]?.[activeLabel] ?? 0}M`,
        accent: '#C0392B',
      },
    ]
  }, [impactLines, horizonte, activeLabel, yearRow])

  const metrics: MetricChart[] = [
    {
      title: 'CO₂e evitado acumulado',
      unit: `ktCO₂e · ${horizonte} años`,
      data: impactLines.coChartData,
      fmtV: v => `${v}K tCO₂e`,
      yFmt: v => `${v}k`,
    },
    {
      title: 'Derrama económica acumulada',
      unit: `M MXN · ${horizonte} años`,
      data: impactLines.derrChartData,
      fmtV: v => `$${v}M`,
      yFmt: v => `$${v}M`,
    },
    {
      title: 'Ahorro en salud acumulado',
      unit: `M MXN · ${horizonte} años`,
      data: impactLines.saludChartData,
      fmtV: v => `$${v}M`,
      yFmt: v => `$${v}M`,
    },
    {
      title: 'Comparativa de captura',
      unit: `% · ${horizonte} años`,
      data: impactLines.captChartData,
      fmtV: v => `${v.toFixed(1)}%`,
      yFmt: v => `${v}%`,
    },
  ]

  const legendItems = impactLines.trajs.map(t => ({
    id: t.presetId,
    label: t.label,
    color: t.color,
  }))

  return (
    <ChartPanel
      chartId="impactos-acumulados"
      title="Impactos acumulados por escenario"
      subtitle={`Horizonte ${horizonte} años · escenario activo: ${activeLabel}`}
      kpis={kpis}
      footer={<ChartPanel.Legend items={legendItems} activeId={presetTrayectoria} />}
    >
      <ChartPanel.Grid cols={2}>
        {metrics.map(metric => (
          <ChartPanel.Cell key={metric.title} title={metric.title} unit={metric.unit}>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={metric.data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="año" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={metric.yFmt}
                  width={36}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [metric.fmtV(v), name]}
                  labelFormatter={(l: number) => `Año ${l}`}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                {impactLines.trajs.map(t => {
                  const active = presetTrayectoria === t.presetId
                  const style = activeSeriesStroke(active, t.color)
                  return (
                    <Line
                      key={t.label}
                      type="monotone"
                      dataKey={t.label}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      strokeDasharray={style.strokeDasharray}
                      opacity={style.opacity}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel.Cell>
        ))}
      </ChartPanel.Grid>
    </ChartPanel>
  )
}
