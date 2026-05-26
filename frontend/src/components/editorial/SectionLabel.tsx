'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { editorial } from '@/components/editorial/editorialStyles'

export interface SectionLabelProps {
  children: ReactNode
  className?: string
  as?: 'p' | 'h2' | 'h3' | 'span'
}

/** Rótulo de sección — sans uppercase, sin badge ni pill. */
export function SectionLabel({ children, className, as: Tag = 'p' }: SectionLabelProps) {
  return <Tag className={cn(editorial.sectionLabel, className)}>{children}</Tag>
}
