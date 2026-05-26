'use client'

import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Conclusion } from '@/components/editorial/Conclusion'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { editorial } from '@/components/editorial/editorialStyles'
import type {
  NarrativeBridgeEvidence,
  NarrativeBridgeNextStep,
  NarrativeBridgeSource,
  NarrativeBridgeVariant,
} from '@/components/simulator/NarrativeBridge'

export interface EditorialCloseProps {
  summary: string
  evidence?: NarrativeBridgeEvidence[]
  source?: NarrativeBridgeSource
  nextStep?: NarrativeBridgeNextStep
  variant?: NarrativeBridgeVariant
  className?: string
}

/**
 * Cierre editorial bajo gráficas/KPIs — sustituye NarrativeBridge con cajas de color.
 * Misma API de datos; layout consulting-editorial.
 */
export function EditorialClose({
  summary,
  evidence,
  source,
  nextStep,
  variant = 'bridge',
  className,
}: EditorialCloseProps) {
  const tone = variant === 'warning' ? 'caution' : 'default'
  const parts = summary.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  return (
    <div className={cn('mt-5 px-5 pb-5', className)} role="note">
      {parts.length <= 1 ? (
        <Conclusion tone={tone}>{summary}</Conclusion>
      ) : (
        <div className="space-y-5 mb-7">
          {parts.map((part, i) => (
            <Conclusion key={i} tone={tone} className={i > 0 ? 'mb-0' : undefined}>
              {part}
            </Conclusion>
          ))}
        </div>
      )}

      {evidence && evidence.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 mb-6 -mt-2">
          {evidence.slice(0, 4).map(item => (
            <AnchorFigure
              key={`${item.label}:${item.value}`}
              figure={item.value}
              context={item.label}
            />
          ))}
        </div>
      )}

      {source && (
        <MarginalNote prefix="Fuente">
          {source.fuente}
          {source.unidad ? ` · Unidad: ${source.unidad}` : ''}
          {source.incertidumbre ? ` · Incertidumbre: ${source.incertidumbre}` : ''}
        </MarginalNote>
      )}

      {nextStep && (nextStep.href || nextStep.onClick || nextStep.helper) && (
        <div className={cn('mt-4 flex flex-wrap items-center gap-3', editorial.divider, 'pt-4')}>
          {nextStep.href ? (
            <a
              href={nextStep.href}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-green-600a hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          ) : nextStep.onClick ? (
            <button
              type="button"
              onClick={nextStep.onClick}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-green-600a hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {nextStep.helper && (
            <span className="text-[12px] text-gray-600c">{nextStep.helper}</span>
          )}
        </div>
      )}
    </div>
  )
}
