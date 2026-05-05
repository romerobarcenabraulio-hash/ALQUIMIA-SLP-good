'use client'

/**
 * Fase 22.4 — Timeline horizontal editorial.
 *
 * Sustituye listas verticales y tablas densas por un eje temporal con hitos
 * narrativos. Cada hito declara fecha (o fase), título, valor opcional y nota.
 */

import { cn } from '@/lib/utils'

export type TimelineTone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface TimelineMilestone {
  id: string
  label: string
  title: string
  value?: string
  note?: string
  tone?: TimelineTone
}

interface EditorialTimelineProps {
  title?: string
  kicker?: string
  milestones: TimelineMilestone[]
  className?: string
}

const TONE_STYLES: Record<TimelineTone, { dot: string; ring: string; label: string }> = {
  neutral: { dot: 'bg-[#6B6760]', ring: 'ring-[#E8E4DC]', label: 'text-[#6B6760]' },
  positive: { dot: 'bg-[#3B6D11]', ring: 'ring-[#C9DDB1]', label: 'text-[#23470A]' },
  warning: { dot: 'bg-[#C47E00]', ring: 'ring-amber-200', label: 'text-amber-900' },
  critical: { dot: 'bg-[#B3261E]', ring: 'ring-red-200', label: 'text-[#B3261E]' },
}

export function EditorialTimeline({ title, kicker, milestones, className }: EditorialTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-6 text-center text-[12px] text-[#6B6760]">
        Aún no hay hitos para mostrar en la línea de tiempo.
      </div>
    )
  }
  return (
    <div className={cn('rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-5', className)}>
      {kicker && (
        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">{kicker}</p>
      )}
      {title && (
        <h3 className="mb-4 font-serif text-[20px] leading-tight text-[#1C1B18]">{title}</h3>
      )}
      <ol className="relative flex gap-6 overflow-x-auto pb-3">
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-[15px] h-[2px] bg-[#E8E4DC]"
        />
        {milestones.map(m => {
          const tone = TONE_STYLES[m.tone ?? 'neutral']
          return (
            <li key={m.id} className="relative min-w-[180px] max-w-[260px] flex-1">
              <span
                className={cn(
                  'relative z-10 block h-[14px] w-[14px] rounded-full ring-4',
                  tone.dot,
                  tone.ring,
                )}
              />
              <p className={cn('mt-3 text-[10px] uppercase tracking-[0.12em]', tone.label)}>
                {m.label}
              </p>
              <p className="mt-1 font-serif text-[16px] leading-tight text-[#1C1B18]">
                {m.title}
              </p>
              {m.value && (
                <p className="mt-1 font-mono text-[13px] text-[#1C1B18]">{m.value}</p>
              )}
              {m.note && (
                <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">{m.note}</p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
