'use client'

import { useState, useCallback } from 'react'
import { Expand, X } from 'lucide-react'

interface ExpandableChartProps {
  children: React.ReactNode
  title: string
  chartId?: string
  subtitle?: string
  className?: string
}

export function ExpandableChart({ children, title, chartId, subtitle, className = '' }: ExpandableChartProps) {
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback((e: React.MouseEvent) => {
    // No abrir si el clic fue en un input o botón interactivo dentro de la gráfica
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, a, [role="button"]')) return
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <div
        className={`relative group ${className}`}
        data-chart-id={chartId}
      >
        {children}

        {/* Botón flotante — visible solo en hover, no contamina la vista en reposo */}
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Ampliar gráfica: ${title}`}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
            bg-white/90 border border-[#E8E4DC] rounded-[6px] px-1.5 py-1
            text-[9px] text-[#6B6760] flex items-center gap-1 shadow-sm
            hover:bg-[#F4FAEC] hover:border-[#3B6D11]/40 hover:text-[#3B6D11]
            z-10"
        >
          <Expand size={10} />
          Ampliar
        </button>
      </div>

      {/* Modal fullscreen */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-[16px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E8E4DC] shrink-0">
              <div>
                <p className="font-semibold text-[14px] text-[#1C1B18] leading-tight">{title}</p>
                {subtitle && (
                  <p className="text-[11px] text-[#A8A49C] mt-0.5 leading-snug">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="shrink-0 p-1.5 rounded-[7px] text-[#A8A49C] hover:bg-[#F4F2ED] hover:text-[#1C1B18] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido — misma gráfica a tamaño completo */}
            <div className="flex-1 overflow-auto p-6 min-h-0">
              <div className="h-[65vh] w-full">
                {children}
              </div>
            </div>

            {/* Footer con instrucción de cierre */}
            <div className="px-6 py-2 border-t border-[#F0EDE5] shrink-0">
              <p className="text-[9px] text-[#C4C0B8] text-center">
                Clic fuera o Escape para cerrar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
