'use client'

import { Loader2 } from 'lucide-react'
import { MONTE_CARLO_SPEC } from '@/lib/calculator'
import { cn } from '@/lib/utils'

type Props = {
  progress: number
  isRunning: boolean
  completed: number
  total: number
  metricLabel?: string
  className?: string
}

export function SimulationComputeTrace({
  progress,
  isRunning,
  completed,
  total,
  metricLabel = 'VPN',
  className,
}: Props) {
  const pct = Math.round(progress * 100)

  return (
    <div className={cn('rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3 space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">
          Monte Carlo
        </p>
        {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3B6D11]" aria-hidden />}
      </div>

      <div className="h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden">
        <div
          className="h-full bg-[#3B6D11] transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <p className="text-[10px] text-[#6B6760] font-mono">
        {completed.toLocaleString('es-MX')} / {total.toLocaleString('es-MX')} iteraciones
        {' · '}
        {isRunning ? 'ejecutando calcular()…' : 'distribución de ' + metricLabel + ' lista'}
      </p>

      <ul className="text-[9px] text-[#A8A49C] space-y-0.5">
        {MONTE_CARLO_SPEC.variables.map(v => (
          <li key={v.name}>
            <span className="text-[#6B6760]">{v.name}:</span> {v.range}
          </li>
        ))}
      </ul>

      <p className="text-[9px] text-[#A8A49C]">{MONTE_CARLO_SPEC.method}</p>
    </div>
  )
}
