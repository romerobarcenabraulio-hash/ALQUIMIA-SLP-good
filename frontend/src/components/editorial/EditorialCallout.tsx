'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { editorial } from '@/components/editorial/editorialStyles'

export interface EditorialCalloutProps extends Omit<ComponentPropsWithoutRef<'aside'>, 'children'> {
  children: ReactNode
  label?: string
  tone?: 'default' | 'caution' | 'critical'
}

/** Aviso editorial sin caja de color — solo jerarquía tipográfica y línea superior. */
export function EditorialCallout({
  children,
  label,
  tone = 'default',
  className,
  ...rest
}: EditorialCalloutProps) {
  const toneClass =
    tone === 'critical'
      ? 'text-red-800'
      : tone === 'caution'
        ? 'text-amber-900'
        : 'text-[#6B6760]'

  return (
    <aside className={cn('pt-4', editorial.divider, className)} {...rest}>
      {label && <SectionLabel>{label}</SectionLabel>}
      <div className={cn('font-sans text-[14px] leading-[1.55] max-w-[620px]', toneClass)}>
        {children}
      </div>
    </aside>
  )
}
