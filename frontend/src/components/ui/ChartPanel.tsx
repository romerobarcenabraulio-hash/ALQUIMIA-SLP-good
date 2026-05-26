'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Expand, Info, X } from 'lucide-react'
import type { ChartBrief } from '@/data/moduleEditorialBriefs'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { resolveChartBrief } from '@/lib/chartQhcDynamic'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CHART_PANEL_CLASS, CHART_SUBTITLE, CHART_TITLE } from '@/lib/chartTheme'
import { cn } from '@/lib/utils'

export type ChartPanelKpi = {
  label: string
  value: string
  accent?: string
}

export type ChartLegendItem = {
  id: string
  label: string
  color: string
}

interface ChartPanelProps {
  children: ReactNode
  title: string
  chartId?: string
  subtitle?: string
  className?: string
  brief?: ChartBrief | null
  kpis?: ChartPanelKpi[]
  footer?: ReactNode
  expandable?: boolean
}

function BriefPanel({ brief, compact = false }: { brief: ChartBrief; compact?: boolean }) {
  const m = brief.metodologia
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      <p className="text-[11px] font-semibold text-[#3B6D11]">{brief.chart_label}</p>
      <p className="text-[11px] text-[#4A4740] leading-relaxed">{m.como_se_calcula}</p>
      {!compact && (
        <>
          <p className="text-[11px] text-[#6B6760] leading-relaxed">
            <span className="font-semibold text-[#1C1B18]">Fuente: </span>
            {m.origen_datos}
          </p>
          <p className="text-[11px] text-[#6B6760] leading-relaxed">
            <span className="font-semibold text-[#1C1B18]">Por qué este enfoque: </span>
            {m.por_que_este_enfoque}
          </p>
          <p className="text-[11px] text-[#A8A49C] leading-relaxed italic">
            Supuesto crítico: {m.supuesto_critico}
          </p>
          {brief.referencias && brief.referencias.length > 0 && (
            <div className="pt-1 border-t border-[#F0EDE5] space-y-0.5">
              {brief.referencias.map(ref => (
                <p key={ref.clave} className="text-[10px] text-[#A8A49C]">
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

function KpiStrip({ kpis }: { kpis: ChartPanelKpi[] }) {
  if (!kpis.length) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-5 py-4 border-b border-[0.5px] border-gray-200c">
      {kpis.map(k => (
        <AnchorFigure
          key={k.label}
          figure={k.value}
          context={k.label}
          figureClassName="text-[22px] tabular-nums"
        />
      ))}
    </div>
  )
}

function ChartPanelGrid({
  cols = 2,
  children,
  className = '',
}: {
  cols?: 1 | 2
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid divide-[#F0EDE5]',
        cols === 2 ? 'grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x' : 'grid-cols-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

function ChartPanelCell({ title, unit, children }: { title: string; unit?: string; children: ReactNode }) {
  return (
    <div className="p-4 min-w-0">
      <p className="text-[12px] font-semibold text-[#1C1B18] mb-0.5">{title}</p>
      {unit && <p className="text-[11px] text-[#6B6760] mb-2">{unit}</p>}
      {children}
    </div>
  )
}

function ChartPanelLegend({
  items,
  activeId,
}: {
  items: ChartLegendItem[]
  activeId?: string
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-4 py-3 border-t border-[#F0EDE5]">
      {items.map(item => {
        const active = activeId === item.id
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <div
              className="w-6 h-[2px] rounded-full"
              style={{
                background: item.color,
                opacity: active ? 1 : 0.55,
              }}
            />
            <span
              className={cn('text-[11px]', active ? 'font-semibold' : 'text-[#6B6760]')}
              style={{ color: active ? item.color : undefined }}
            >
              {item.label}
              {active && ' · activo'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ChartPanelRoot({
  children,
  title,
  chartId,
  subtitle,
  className = '',
  brief,
  kpis,
  footer,
  expandable = true,
}: ChartPanelProps) {
  const [open, setOpen] = useState(false)
  const [briefOpen, setBriefOpen] = useState(false)
  const simState = useSimulatorStore()
  const resolvedBrief = brief ?? (chartId ? resolveChartBrief(chartId, simState) : null)

  const handleOpen = useCallback((e: React.MouseEvent) => {
    if (!expandable) return
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, a, [role="button"]')) return
    setOpen(true)
  }, [expandable])

  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <div
        className={cn(CHART_PANEL_CLASS, 'relative group', className)}
        data-chart-id={chartId}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2 border-b border-[#F0EDE5]">
          <div className="min-w-0">
            <p className={CHART_TITLE}>{title}</p>
            {subtitle && <p className={cn(CHART_SUBTITLE, 'mt-0.5')}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {resolvedBrief && (
              <button
                type="button"
                onClick={() => setBriefOpen(v => !v)}
                aria-label={`Interpretación: ${title}`}
                aria-pressed={briefOpen}
                className="bg-white/90 border border-[#E8E4DC] rounded-[6px] px-2 py-1
                  text-[11px] text-[#6B6760] flex items-center gap-1 shadow-sm
                  hover:bg-[#F4FAEC] hover:border-[#3B6D11]/40 hover:text-[#3B6D11]"
              >
                <Info size={12} />
                QHC
              </button>
            )}
            {expandable && (
              <button
                type="button"
                onClick={handleOpen}
                aria-label={`Ampliar gráfica: ${title}`}
                className="bg-white/90 border border-[#E8E4DC] rounded-[6px] px-2 py-1
                  text-[11px] text-[#6B6760] flex items-center gap-1 shadow-sm
                  hover:bg-[#F4FAEC] hover:border-[#3B6D11]/40 hover:text-[#3B6D11]"
              >
                <Expand size={12} />
                Ampliar
              </button>
            )}
          </div>
        </div>

        {kpis && kpis.length > 0 && <KpiStrip kpis={kpis} />}

        {resolvedBrief && briefOpen && (
          <div className="mx-5 mt-3 rounded-[10px] border border-[#D7E8C0] bg-[#F6FAEF] px-4 py-3">
            <BriefPanel brief={resolvedBrief} compact />
          </div>
        )}

        <div className={cn(kpis?.length || briefOpen ? 'pt-2' : '')}>{children}</div>

        {footer}
      </div>

      {expandable && open && (
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
                <p className="font-serif font-semibold text-[15px] text-[#1C1B18] leading-tight">{title}</p>
                {subtitle && (
                  <p className="text-[11px] text-[#6B6760] mt-0.5 leading-snug">{subtitle}</p>
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
              <div className="h-[65vh] w-full">{children}</div>
            </div>

            <div className="px-6 py-3 border-t border-[#F0EDE5] shrink-0">
              {resolvedBrief ? (
                <BriefPanel brief={resolvedBrief} />
              ) : (
                <p className="text-[11px] text-[#A8A49C] text-center">Clic fuera o Escape para cerrar</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const ChartPanel = Object.assign(ChartPanelRoot, {
  Grid: ChartPanelGrid,
  Cell: ChartPanelCell,
  Legend: ChartPanelLegend,
})
