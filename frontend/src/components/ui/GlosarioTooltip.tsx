'use client'

import { useState, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { type GlosarioEntry } from '@/data/glosario'

interface GlosarioTooltipProps {
  termino: string
  entry: GlosarioEntry
  children: React.ReactNode
  className?: string
}

export function GlosarioTooltip({ termino, entry, children, className = '' }: GlosarioTooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(true)
  }

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 120)
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        className="underline decoration-dotted decoration-[#8CAA7A] underline-offset-2
          cursor-help text-inherit"
        aria-label={`Definición de ${termino}`}
      >
        {children}
      </span>

      {visible && (
        <span
          onMouseEnter={show}
          onMouseLeave={hide}
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 z-[100]
            w-[220px] rounded-[10px] border border-[#D7E8C0] bg-white shadow-lg
            px-3 py-2.5 text-left pointer-events-auto"
        >
          <span className="block text-[9px] uppercase tracking-[0.08em] text-[#8CAA7A] font-semibold mb-1">
            {entry.termino}
          </span>
          <span className="block text-[11px] text-[#4A5041] leading-snug">
            {entry.definicion}
          </span>
          {entry.fuente && (
            <span className="block mt-1.5 text-[9px] text-[#A8A49C]">
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 hover:text-[#3B6D11]"
                >
                  <ExternalLink size={8} />
                  {entry.fuente}
                </a>
              ) : (
                entry.fuente
              )}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

/**
 * Versión simplificada: pasa el término y la definición directamente.
 * Útil para términos one-off que no están en el glosario global.
 */
export function TerminoTooltip({
  children,
  definicion,
  fuente,
  className = '',
}: {
  children: React.ReactNode
  definicion: string
  fuente?: string
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        className="underline decoration-dotted decoration-[#8CAA7A] underline-offset-2 cursor-help"
      >
        {children}
      </span>
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 z-[100]
            w-[200px] rounded-[10px] border border-[#D7E8C0] bg-white shadow-lg
            px-3 py-2.5"
        >
          <span className="block text-[11px] text-[#4A5041] leading-snug">{definicion}</span>
          {fuente && (
            <span className="block mt-1 text-[9px] text-[#A8A49C]">{fuente}</span>
          )}
        </span>
      )}
    </span>
  )
}
