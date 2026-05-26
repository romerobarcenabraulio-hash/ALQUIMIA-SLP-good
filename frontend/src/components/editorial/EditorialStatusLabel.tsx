'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EditorialStatusTone = 'success' | 'caution' | 'critical' | 'info' | 'neutral'

const toneDot: Record<EditorialStatusTone, string> = {
  success: 'bg-[#3B6D11]',
  caution: 'bg-[#D4881E]',
  critical: 'bg-[#C0392B]',
  info: 'bg-[#1A5FA8]',
  neutral: 'bg-[#A8A49C]',
}

const toneText: Record<EditorialStatusTone, string> = {
  success: 'text-[#23470A]',
  caution: 'text-[#6B4800]',
  critical: 'text-[#B91C1C]',
  info: 'text-[#0D3B7A]',
  neutral: 'text-[#6B6760]',
}

export interface EditorialStatusLabelProps {
  children: ReactNode
  tone?: EditorialStatusTone
  className?: string
}

/** Estado operativo sin caja de color — punto + tipografía. */
export function EditorialStatusLabel({ children, tone = 'neutral', className }: EditorialStatusLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        toneText[tone],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', toneDot[tone])} aria-hidden />
      {children}
    </span>
  )
}

export function badgeToneFromLegacy(
  badge: 'green' | 'yellow' | 'red' | string | undefined,
): EditorialStatusTone {
  if (badge === 'green') return 'success'
  if (badge === 'yellow') return 'caution'
  if (badge === 'red') return 'critical'
  return 'neutral'
}

export function gravedadTone(gravedad: string): EditorialStatusTone {
  if (gravedad === 'Alto') return 'critical'
  if (gravedad === 'Medio') return 'caution'
  if (gravedad === 'Bajo') return 'success'
  return 'neutral'
}
