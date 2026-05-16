'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function SimulatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[simulator]', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-700" aria-hidden />
      <h1 className="mt-4 font-serif text-[24px] text-[#1C1B18]">El simulador no pudo cargar</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#6B6760]">
        Ocurrió un error al renderizar esta vista. Puedes reintentar o volver al inicio; si abrías Metas futuras / Gantt-PERT, prueba
        primero la pestaña «PERT y oleadas».
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[8px] bg-[#3B6D11] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2D5409]"
        >
          Reintentar
        </button>
        <a
          href="/"
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-4 py-2 text-[13px] font-medium text-[#1C1B18] hover:bg-[#F8F6F1]"
        >
          Ir al inicio
        </a>
      </div>
    </main>
  )
}
