'use client'

import { AlertTriangle, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoDataStateProps {
  title?: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'empty' | 'error' | 'fallback'
  className?: string
}

export function NoDataState({
  title = 'Sin datos disponibles',
  description,
  actionLabel,
  onAction,
  variant = 'empty',
  className,
}: NoDataStateProps) {
  const Icon = variant === 'error' ? AlertTriangle : Database
  const styles = {
    empty: 'border-[#E8E4DC] bg-[#FAFAF8] text-[#6B6760]',
    error: 'border-red-200 bg-red-50 text-red-800',
    fallback: 'border-amber-200 bg-amber-50 text-amber-800',
  }

  return (
    <div className={cn('rounded-[10px] border px-4 py-4 flex items-start gap-3', styles[variant], className)}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[12px] font-semibold">{title}</p>
        <p className="text-[11px] mt-1 leading-relaxed opacity-90">{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-3 text-[11px] font-semibold text-[#3B6D11] hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
