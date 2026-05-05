'use client'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'live' | 'fallback' | 'optimo' | 'blocked' | 'info'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
      variant === 'live'     && 'bg-[#EAF3DE] text-[#3B6D11]',
      variant === 'fallback' && 'bg-[#FEF7E7] text-[#D4881E]',
      variant === 'optimo'   && 'bg-[#FEF7E7] text-[#8A4F08] border border-[#F6C84B]',
      variant === 'blocked'  && 'bg-[#FBEAEA] text-[#C0392B]',
      variant === 'info'     && 'bg-[#EBF3FB] text-[#1A5FA8]',
      className
    )}>
      {variant === 'live' && (
        <span className="w-[5px] h-[5px] rounded-full bg-[#3B6D11] animate-pulse-dot" />
      )}
      {children}
    </span>
  )
}
