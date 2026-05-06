'use client'

import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { reglamentoFuentePorMunicipio, tieneUrlFuentePrimaria } from '@/data/reglamentos'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'

export interface FuenteReglamentoIconProps {
  municipioId?: string
  className?: string
  label?: string
  /** Artículos o notas de contexto para la etapa (Marco legal, gate, etc.). */
  articulosEtapa?: string[]
}

export function FuenteReglamentoIcon({
  municipioId: municipioProp,
  className,
  label = 'Abrir reglamento de referencia en el que se basa la simulación',
  articulosEtapa,
}: FuenteReglamentoIconProps) {
  const { openReglamento } = useReglamentoFuente()
  const activos = useSimulatorStore(s => s.municipiosActivos)
  const mid = (municipioProp ?? activos[0] ?? 'slp').toLowerCase()
  const reg = reglamentoFuentePorMunicipio(mid)
  const marcaVerificacion = !reg || !tieneUrlFuentePrimaria(reg)

  return (
    <span className="relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        onClick={() => openReglamento(mid, articulosEtapa ? { articulosEtapa } : undefined)}
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
      {marcaVerificacion && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 rounded bg-amber-100 px-0.5 text-[7px] font-bold uppercase leading-none text-amber-950 ring-1 ring-amber-300"
          aria-hidden
        >
          Verif.
        </span>
      )}
    </span>
  )
}
