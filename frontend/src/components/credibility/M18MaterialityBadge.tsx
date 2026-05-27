'use client'

import { cn } from '@/lib/utils'

export type M18MaterialityBadgeVariant = 'header' | 'crossRef'

export interface M18MaterialityBadgeProps {
  variant?: M18MaterialityBadgeVariant
  className?: string
}

/**
 * Badge de doble materialidad (M18 / referencia en M15).
 * Sin decoración — fondo secundario y texto 12px.
 */
export function M18MaterialityBadge({ variant = 'header', className }: M18MaterialityBadgeProps) {
  const copy =
    variant === 'crossRef'
      ? 'El expediente incluye evaluación de doble materialidad conforme CSRD ESRS 1:2023.'
      : 'Doble materialidad — CSRD ESRS 1:2023; temas materiales GRI 3:2021 (impacto)'

  return (
    <p
      className={cn(
        'rounded-[6px] bg-[#F4F2ED] px-3 py-2 font-sans text-[12px] leading-snug text-[#5A5750]',
        className,
      )}
      data-testid={variant === 'crossRef' ? 'm18-materiality-crossref' : 'm18-materiality-badge'}
    >
      {copy}
      {variant === 'crossRef' && (
        <span className="block text-[11px] text-[#A8A49C] mt-0.5">CSRD ESRS 1:2023 · GRI 3:2021 (impacto)</span>
      )}
    </p>
  )
}
