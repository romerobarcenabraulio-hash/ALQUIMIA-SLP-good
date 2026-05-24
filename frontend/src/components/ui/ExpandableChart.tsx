'use client'

import { useState, useCallback } from 'react'
import { Expand, Info, X } from 'lucide-react'
import type { ChartBrief } from '@/data/moduleEditorialBriefs'

interface ExpandableChartProps {
  children: React.ReactNode
  title: string
  chartId?: string
  subtitle?: string
  className?: string
  brief?: ChartBrief | null
}

function BriefPanel({ brief, compact = false }: { brief: ChartBrief; compact?: boolean }) {
  const m = brief.metodologia
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      <p className="text-[10px] font-semibold text-[#3B6D11]">{brief.chart_label}</p>
      <p className="text-[11px] text-[#4A4740] leading-relaxed">{m.como_se_calcula}</p>
      {!compact && (
        <>
          <p className="text-[10px] text-[#6B6760] leading-relaxed">
            <span className="font-semibold text-[#1C1B18]">Fuente: </span>
            {m.origen_datos}
          </p>
          <p className="text-[10px] text-[#6B6760] leading-relaxed">
            <span className="font-semibold text-[#1C1B18]">Por qué este enfoque: </span>
            {m.por_que_este_enfoque}
          </p>
          <p className="text-[10px] text-[#A8A49C] leading-relaxed italic">
            Supuesto crítico: {m.supuesto_critico}
          </p>
          {brief.referencias && brief.referencias.length > 0 && (
            <div className="pt-1 border-t border-[#F0EDE5] space-y-0.5">
              {brief.referencias.map(ref => (
                <p key={ref.clave} className="text-[9px] text-[#A8A49C]">
                  {ref.clave} {ref.texto}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ExpandableChart({ children, title, chartId, subtitle, className = '', brief }: ExpandableChartProps) {
  const [open, setOpen] = useState(false)
  const [briefOpen, setBriefOpen] = useState(false)

  const handleOpen = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, a, [role="button"]')) return
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <div
        className={`relative group rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden ${className}`}
        data-chart-id={chartId}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2 border-b border-[#F0EDE5]">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#1C1B18] leading-snug">{title}</p>
            {subtitle && (
              <p className="text-[11px] text-[#A8A49C] mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {brief && (
            <button
              type="button"
              onClick={() => setBriefOpen(v => !v)}
              aria-label={`Interpretación: ${title}`}
              aria-pressed={briefOpen}
              className="bg-white/90 border border-[#E8E4DC] rounded-[6px] px-1.5 py-1
                text-[9px] text-[#6B6760] flex items-center gap-1 shadow-sm
                hover:bg-[#F4FAEC] hover:border-[#3B6D11]/40 hover:text-[#3B6D11]"
            >
              <Info size={10} />
              Guía
            </button>
          )}
          <button
            type="button"
            onClick={handleOpen}
            aria-label={`Ampliar gráfica: ${title}`}
            className="bg-white/90 border border-[#E8E4DC] rounded-[6px] px-1.5 py-1
              text-[9px] text-[#6B6760] flex items-center gap-1 shadow-sm
              hover:bg-[#F4FAEC] hover:border-[#3B6D11]/40 hover:text-[#3B6D11]"
          >
            <Expand size={10} />
            Ampliar
          </button>
          </div>
        </div>

        <div className="px-5 py-4">{children}</div>

        {brief && briefOpen && (
          <div className="mx-5 mb-4 rounded-[10px] border border-[#D7E8C0] bg-[#F6FAEF] px-4 py-3">
            <BriefPanel brief={brief} compact />
          </div>
        )}
      </div>

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

            <div className="flex-1 overflow-auto p-6 min-h-0">
              <div className="h-[65vh] w-full">
                {children}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#F0EDE5] shrink-0">
              {brief ? (
                <BriefPanel brief={brief} />
              ) : (
                <p className="text-[9px] text-[#C4C0B8] text-center">
                  Clic fuera o Escape para cerrar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
