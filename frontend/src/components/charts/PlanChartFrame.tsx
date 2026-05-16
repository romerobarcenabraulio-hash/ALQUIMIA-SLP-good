'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

const CHART_WIDTH = 720

type PlanChartFrameProps = {
  height: number
  children: (width: number, height: number) => ReactNode
  className?: string
}

/**
 * Contenedor fijo para Recharts sin ResponsiveContainer (evita bucles de resize que tumban la pestaña).
 */
export function PlanChartFrame({ height, children, className }: PlanChartFrameProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(CHART_WIDTH)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0)
      if (next >= 280) setWidth(prev => (prev === next ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chartWidth = Math.max(width, 280)

  return (
    <div ref={ref} className={className ?? 'w-full overflow-x-auto mt-3'} style={{ minHeight: height }}>
      <div style={{ width: chartWidth, height }}>{children(chartWidth, height)}</div>
    </div>
  )
}
