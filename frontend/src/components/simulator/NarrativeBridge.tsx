'use client'

/**
 * Fase 22.3 — NarrativeBridge.
 *
 * Componente de "pegamento" entre cálculo y acción siguiente. Su `summary`
 * debe derivarse de datos reales del store o respuesta API; auditoría
 * rechaza copy estático.
 */

import type { ReactNode } from 'react'
import { ArrowRight, Info, Sparkles, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NarrativeBridgeVariant = 'result' | 'warning' | 'bridge'

export interface NarrativeBridgeEvidence {
  label: string
  value: string
}

export interface NarrativeBridgeNextStep {
  label: string
  helper?: string
  href?: string
  onClick?: () => void
}

export interface NarrativeBridgeSource {
  fuente: string
  unidad?: string
  incertidumbre?: string
}

export interface NarrativeBridgeProps {
  kicker: string
  title?: string
  summary: string
  evidence?: NarrativeBridgeEvidence[]
  nextStep?: NarrativeBridgeNextStep
  variant?: NarrativeBridgeVariant
  source?: NarrativeBridgeSource
  audience?: 'citizen' | 'functionary' | 'entrepreneur'
  className?: string
}

const VARIANT_STYLES: Record<NarrativeBridgeVariant, { container: string; kicker: string; icon: ReactNode }> = {
  result: {
    container: 'border-[#C9DDB1] bg-[#F1F6E5]',
    kicker: 'text-[#23470A]',
    icon: <Sparkles className="h-4 w-4 text-[#3B6D11]" aria-hidden />,
  },
  warning: {
    container: 'border-amber-300 bg-amber-50',
    kicker: 'text-amber-900',
    icon: <TriangleAlert className="h-4 w-4 text-amber-700" aria-hidden />,
  },
  bridge: {
    container: 'border-[#E8E4DC] bg-[#FDFCFA]',
    kicker: 'text-[#A8A49C]',
    icon: <Info className="h-4 w-4 text-[#6B6760]" aria-hidden />,
  },
}

export function NarrativeBridge({
  kicker,
  title,
  summary,
  evidence,
  nextStep,
  variant = 'bridge',
  source,
  audience,
  className,
}: NarrativeBridgeProps) {
  const styles = VARIANT_STYLES[variant]
  return (
    <aside
      className={cn(
        'mt-4 rounded-[14px] border px-5 py-4 shadow-[0_1px_0_rgba(28,27,24,0.04)]',
        styles.container,
        className,
      )}
      role="note"
      data-audience={audience}
    >
      <div className="flex items-center gap-2">
        {styles.icon}
        <p className={cn('text-[10px] uppercase tracking-[0.14em]', styles.kicker)}>{kicker}</p>
      </div>
      {title && (
        <h3 className="mt-2 font-serif text-[20px] leading-tight text-[#1C1B18]">{title}</h3>
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-[#1C1B18]">{summary}</p>

      {evidence && evidence.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {evidence.slice(0, 4).map(item => (
            <div
              key={`${item.label}:${item.value}`}
              className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{item.label}</dt>
              <dd className="mt-1 font-mono text-[14px] text-[#1C1B18]">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {source && (
        <p className="mt-3 text-[11px] text-[#6B6760]">
          Fuente: {source.fuente}
          {source.unidad ? ` · Unidad: ${source.unidad}` : ''}
          {source.incertidumbre ? ` · Incertidumbre: ${source.incertidumbre}` : ''}
        </p>
      )}

      {nextStep && (nextStep.href || nextStep.onClick || nextStep.helper) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E8E4DC] pt-3">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49C]">Acción siguiente</span>
          {nextStep.href ? (
            <a
              href={nextStep.href}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3B6D11] hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          ) : nextStep.onClick ? (
            <button
              type="button"
              onClick={nextStep.onClick}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3B6D11] hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {nextStep.helper && (
            <span className="text-[12px] text-[#6B6760]">{nextStep.helper}</span>
          )}
        </div>
      )}
    </aside>
  )
}
