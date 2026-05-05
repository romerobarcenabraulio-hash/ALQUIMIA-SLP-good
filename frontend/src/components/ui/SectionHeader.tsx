import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  numero: string
  titulo: string
  subtitulo?: string
  heroValue?: string
  heroLabel?: string
  heroContext?: string
  className?: string
}

export function SectionHeader({ numero, titulo, subtitulo, heroValue, heroLabel, heroContext, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">
        {numero} — {subtitulo}
      </p>
      <h2 className="font-serif text-[28px] leading-[1.1] text-[#1C1B18] mb-4">{titulo}</h2>
      {heroValue && (
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[52px] leading-none text-[#3B6D11]">{heroValue}</span>
          {heroLabel && <span className="text-[16px] text-[#6B6760]">{heroLabel}</span>}
        </div>
      )}
      {heroContext && (
        <p className="text-[14px] text-[#6B6760] mt-2 max-w-2xl">{heroContext}</p>
      )}
    </div>
  )
}
