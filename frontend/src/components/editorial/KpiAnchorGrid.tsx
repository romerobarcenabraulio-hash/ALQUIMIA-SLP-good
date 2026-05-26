'use client'

import { cn } from '@/lib/utils'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'

export type KpiAnchorItem = {
  label: string
  value: string
  figureClassName?: string
}

export interface KpiAnchorGridProps {
  items: KpiAnchorItem[]
  columns?: 2 | 3 | 4
  className?: string
}

/** Sustituye grids de KPI en cards — patrón consulting-editorial. */
export function KpiAnchorGrid({ items, columns = 4, className }: KpiAnchorGridProps) {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={cn('grid grid-cols-1 gap-x-8 gap-y-6', colClass, className)}>
      {items.map(item => (
        <AnchorFigure
          key={item.label}
          figure={item.value}
          context={item.label}
          figureClassName={item.figureClassName}
        />
      ))}
    </div>
  )
}
