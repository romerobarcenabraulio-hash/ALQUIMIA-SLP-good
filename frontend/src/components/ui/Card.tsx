'use client'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  optimo?: boolean
  blocked?: boolean
  className?: string
  onClick?: () => void
}

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
        className
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
  icon?: React.ReactNode
  source?: string
  sourceType?: 'live' | 'fallback'
}

export function KpiCard({ label, value, sub, color, icon, source, sourceType }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        {icon && <span className="text-[#A8A49C]">{icon}</span>}
        {source && (
          <span className={cn(
            'text-[10px] uppercase tracking-wide',
            sourceType === 'live' ? 'text-[#3B6D11]' : 'text-[#D4881E]'
          )}>
            {sourceType === 'live' ? '● ' : '○ '}{source}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#A8A49C] uppercase tracking-wide mb-1">{label}</p>
      <p className={cn('font-mono text-2xl font-medium', color ?? 'text-[#1C1B18]')}>{value}</p>
      {sub && <p className="text-[12px] text-[#6B6760] mt-1">{sub}</p>}
    </Card>
  )
}
