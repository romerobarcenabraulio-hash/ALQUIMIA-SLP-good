'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { downloadExpedientePdf } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { ExpedienteSancionDto, InspeccionPrediaDto, PredioRegistroDto } from '@/types/predios'

export const EXPEDIENTE_PDF_EVENT = 'alquimia:expediente-pdf' as const

export interface ExpedientePDFProps {
  predio: PredioRegistroDto
  inspeccion: InspeccionPrediaDto
  expediente: ExpedienteSancionDto
  disabled?: boolean
}

export function ExpedientePDF({ predio, inspeccion, expediente, disabled }: ExpedientePDFProps) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const descargar = useCallback(async () => {
    if (disabled) return
    setLoading(true)
    setError(null)
    try {
      await downloadExpedientePdf({
        zm: zmActiva,
        predio: predio as unknown as Record<string, unknown>,
        inspeccion: inspeccion as unknown as Record<string, unknown>,
        expediente: expediente as unknown as Record<string, unknown>,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setLoading(false)
    }
  }, [disabled, zmActiva, predio, inspeccion, expediente])

  useEffect(() => {
    const onExternal = () => {
      void descargar()
    }
    window.addEventListener(EXPEDIENTE_PDF_EVENT, onExternal)
    return () => window.removeEventListener(EXPEDIENTE_PDF_EVENT, onExternal)
  }, [descargar])

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void descargar()}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#3B6D11] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:border-[#E8E4DC] disabled:bg-[#E2DED6] disabled:text-[#A8A49C]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Generando acta PDF…
          </>
        ) : (
          'Descargar PDF del expediente (Times New Roman)'
        )}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </span>
  )
}
