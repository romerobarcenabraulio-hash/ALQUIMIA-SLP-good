'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { INSTITUTIONAL_BODIES } from '@/lib/standardsInstitutional'

export interface InstitutionalBadgeProps {
  className?: string
  /** En hero oscuro M00 */
  variant?: 'default' | 'onDark'
}

export function InstitutionalBadge({ className, variant = 'default' }: InstitutionalBadgeProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const onDark = variant === 'onDark'

  return (
    <div
      className={cn('relative', className)}
      role="group"
      aria-label="Respaldo normativo: GRI, ISO, PMI y CSRD"
      data-testid="institutional-badge"
    >
      <p
        className={cn(
          'font-mono text-[11px] tracking-wide text-center',
          onDark ? 'text-white/65' : 'text-[#6B6760]',
        )}
      >
        {INSTITUTIONAL_BODIES.map((b, i) => (
          <span key={b.id}>
            {i > 0 && <span className="mx-2 opacity-60" aria-hidden>·</span>}
            <button
              type="button"
              className={cn(
                'inline border-0 bg-transparent p-0 font-mono text-[11px] underline-offset-2 transition-colors',
                onDark ? 'text-white/80 hover:text-white hover:underline' : 'text-[#6B6760] hover:text-[#1C1B18] hover:underline',
              )}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(b.id)}
              onBlur={() => setHovered(null)}
              aria-describedby={hovered === b.id ? `inst-tooltip-${b.id}` : undefined}
            >
              {b.sigla}
            </button>
          </span>
        ))}
      </p>

      {hovered && (() => {
        const body = INSTITUTIONAL_BODIES.find(b => b.id === hovered)
        if (!body) return null
        return (
          <div
            id={`inst-tooltip-${body.id}`}
            role="tooltip"
            className={cn(
              'absolute left-1/2 z-20 mt-2 w-[min(100%,280px)] -translate-x-1/2 rounded-[8px] border px-3 py-2 text-left shadow-md',
              onDark
                ? 'border-white/20 bg-[#1C2B15] text-white/90'
                : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#4A4740]',
            )}
          >
            <p className="font-mono text-[10px] font-semibold text-inherit">{body.sigla}</p>
            <p className="mt-1 text-[11px] leading-snug">{body.fullName}</p>
            <p className={cn('mt-1 text-[10px]', onDark ? 'text-white/60' : 'text-[#A8A49C]')}>
              {body.standardsCount} estándares referenciados en esta plataforma
            </p>
          </div>
        )
      })()}
    </div>
  )
}
