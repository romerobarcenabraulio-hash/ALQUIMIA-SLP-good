'use client'

import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'

export interface FuenteReglamentoIconProps {
  municipioId?: string
  className?: string
  label?: string
}

export function FuenteReglamentoIcon({
  municipioId: municipioProp,
  className,
  label = 'Abrir reglamento de referencia en el que se basa la simulación',
}: FuenteReglamentoIconProps) {
  const { openReglamento } = useReglamentoFuente()
  const activos = useSimulatorStore(s => s.municipiosActivos)
  const mid = (municipioProp ?? activos[0] ?? 'slp').toLowerCase()

  return (
    <button
      type="button"
      onClick={() => openReglamento(mid)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-[#E8E4DC] bg-white p-1 text-[#3B6D11] shadow-sm transition hover:bg-[#EAF3DE]',
        className,
      )}
      title={label}
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <FileText className="h-4 w-4" aria-hidden />
    </button>
  )
}
