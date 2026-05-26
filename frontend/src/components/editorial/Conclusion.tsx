'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { editorial } from '@/components/editorial/editorialStyles'

export interface ConclusionProps {
  children: ReactNode
  /** Tono de alerta sin caja — solo color de texto */
  tone?: 'default' | 'caution'
  className?: string
  as?: 'p' | 'div'
}

/**
 * Oración de cierre o apertura — serif grande, sin caja ni borde.
 * Objetivo Cabildo: respuesta en ~5 s, justificación en el párrafo.
 */
export function Conclusion({
  children,
  tone = 'default',
  className,
  as: Tag = 'p',
}: ConclusionProps) {
  return (
    <Tag
      className={cn(
        editorial.conclusion,
        tone === 'caution' && 'text-amber-800',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
