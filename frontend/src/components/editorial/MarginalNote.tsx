'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { editorial } from '@/components/editorial/editorialStyles'

export interface MarginalNoteProps {
  children: ReactNode
  /** Prefijo opcional, p. ej. "Fuente" */
  prefix?: string
  className?: string
}

/** Nota al margen — metodología, fuente o incertidumbre sin caja info/warning. */
export function MarginalNote({ children, prefix, className }: MarginalNoteProps) {
  return (
    <p className={cn(editorial.marginalNote, 'mt-3 max-w-[620px]', className)}>
      {prefix ? (
        <>
          <span className="text-gray-900c font-medium">{prefix}: </span>
          {children}
        </>
      ) : (
        children
      )}
    </p>
  )
}
