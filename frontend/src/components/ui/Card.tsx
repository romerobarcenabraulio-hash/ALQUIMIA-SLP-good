'use client'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EditorialMetric } from '@/components/editorial/EditorialMetric'
interface CardProps {
  children: ReactNode
  optimo?: boolean
  blocked?: boolean
  className?: string
  onClick?: () => void
}

/** Contenedor interactivo (selección, hover) — no usar para copy editorial plano. */
export function Card({ children, optimo, blocked, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 shadow-sm',
        'transition-all duration-200',
        !blocked && 'hover:shadow-md hover:border-[#E2DED6]',
        optimo && 'border-[#F6C84B] bg-[#FEF7E7]',
        blocked && 'opacity-35 pointer-events-none',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: ReactNode
  source?: string
  sourceType?: 'live' | 'fallback'
}

/** KPI sin card — layout consulting-editorial. */
export function KpiCard({ label, value, sub, color, icon, source, sourceType }: KpiCardProps) {
  return (
    <div className="min-w-0">
      {icon && <span className="text-gray-400c mb-2 block">{icon}</span>}
      <EditorialMetric
        label={label}
        value={value}
        sub={sub}
        figureClassName={cn('text-[26px] tabular-nums', color)}
        headerRight={
          source ? (
            <span
              className={cn(
                'text-[10px] uppercase tracking-wide',
                sourceType === 'live' ? 'text-green-600a' : 'text-amber-500a',
              )}
            >
              {sourceType === 'live' ? '● ' : '○ '}
              {source}
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
