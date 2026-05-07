'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { getScopeAnclaLine } from '@/lib/municipioMadurezContexto'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  variant?: 'default' | 'muted'
}

/** Línea corta bajo títulos de módulo: refuerza escenario municipal y ancla técnica cuando hay varios en programa. */
export function ScopeAnclaKicker({ className, variant = 'default' }: Props) {
  const ids = useSimulatorStore(s => s.municipiosActivos)
  const line = getScopeAnclaLine(ids)
  return (
    <p
      className={cn(
        'text-[11px] leading-snug',
        variant === 'muted' ? 'text-[#8A857C]' : 'text-[#5A6347]',
        className,
      )}
      aria-live="polite"
    >
      {line}
    </p>
  )
}
