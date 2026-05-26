'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { editorial } from '@/components/editorial/editorialStyles'

export interface EditorialCalloutProps {
  children: ReactNode
  label?: string
  tone?: 'default' | 'caution' | 'critical'
  className?: string
}

/** Aviso editorial sin caja de color — solo jerarquía tipográfica y línea superior. */
export function EditorialCallout({ children, label, tone = 'default', className }: EditorialCalloutProps) {
  const toneClass =
    tone === 'critical'
      ? 'text-red-800'
      : tone === 'caution'
        ? 'text-amber-900'
        : 'text-[#6B6760]'

  return (
    <aside className={cn('pt-4', editorial.divider, className)}>
      {label && <SectionLabel>{label}</SectionLabel>}
      <div className={cn('font-sans text-[14px] leading-[1.55] max-w-[620px]', toneClass)}>
        {children}
      </div>
    </aside>
  )
}
