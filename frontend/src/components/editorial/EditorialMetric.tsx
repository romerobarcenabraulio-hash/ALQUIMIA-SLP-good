'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'

export interface EditorialMetricProps {
  label: string
  value: string
  sub?: string
  figureClassName?: string
  compare?: ReactNode
  headerRight?: ReactNode
  className?: string
}

/** KPI de lectura — sustituye tiles `bg-[#FDFCFA] border rounded`. */
export function EditorialMetric({
  label,
  value,
  sub,
  figureClassName,
  compare,
  headerRight,
  className,
}: EditorialMetricProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {headerRight && <div className="flex justify-end mb-1">{headerRight}</div>}
      <AnchorFigure figure={value} context={label} figureClassName={figureClassName} />
      {sub && <p className="font-sans text-[11px] text-gray-400c mt-1 leading-snug">{sub}</p>}
      {compare}
    </div>
  )
}
