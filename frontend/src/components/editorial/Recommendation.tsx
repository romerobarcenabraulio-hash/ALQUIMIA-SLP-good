'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { editorial } from '@/components/editorial/editorialStyles'

export interface RecommendationProps {
  children: ReactNode
  label?: string
  className?: string
}

/** Bloque de recomendación a Cabildo — solo línea superior, sin fondo. */
export function Recommendation({
  children,
  label = 'Recomendación al Cabildo',
  className,
}: RecommendationProps) {
  return (
    <section className={cn('pt-6', editorial.divider, className)}>
      <SectionLabel>{label}</SectionLabel>
      <div className={cn(editorial.recommendationBody, 'mt-3')}>{children}</div>
    </section>
  )
}
