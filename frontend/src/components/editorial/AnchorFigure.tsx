'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { editorial } from '@/components/editorial/editorialStyles'

export interface AnchorFigureProps {
  /** Cifra ancla — columna izquierda */
  figure: ReactNode
  /** Contexto breve — columna derecha */
  context: string
  className?: string
  figureClassName?: string
}

/**
 * KPI editorial: cifra serif + contexto sans, sin card ni pill.
 */
export function AnchorFigure({
  figure,
  context,
  className,
  figureClassName,
}: AnchorFigureProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr] gap-x-5 gap-y-0 items-start min-w-0',
        className,
      )}
    >
      <p
        className={cn(
          'font-serif text-[28px] font-medium leading-none text-gray-900c tabular-nums',
          figureClassName,
        )}
      >
        {figure}
      </p>
      <p className={cn(editorial.anchorContext, 'min-w-0')}>{context}</p>
    </div>
  )
}
