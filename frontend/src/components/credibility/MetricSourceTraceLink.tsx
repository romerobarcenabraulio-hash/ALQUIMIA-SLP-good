'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dispatchSourceTraceNavigation } from '@/data/metricStandardsTrace'

export interface MetricSourceTraceLinkProps {
  traceKey: string
  children: ReactNode
  className?: string
  title?: string
}

/** Cifra click-to-source → M19 con traza de estándar (evento global, sin tocar backend). */
export function MetricSourceTraceLink({ traceKey, children, className, title }: MetricSourceTraceLinkProps) {
  return (
    <button
      type="button"
      onClick={() => dispatchSourceTraceNavigation(traceKey)}
      className={cn(
        'inline border-0 bg-transparent p-0 font-inherit text-inherit cursor-pointer',
        'underline decoration-dotted decoration-[#A8A49C] underline-offset-[3px]',
        'hover:decoration-[#3B6D11] hover:text-[#1C1B18] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]/30 rounded-[2px]',
        className,
      )}
      title={title ?? 'Ver fuente, fórmula y estándar en M19 Trazabilidad'}
      data-testid={`metric-source-trace-${traceKey}`}
      data-trace-key={traceKey}
    >
      {children}
    </button>
  )
}
