'use client'

import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { StandardEntry } from '@/lib/standardsMap'
import { toModuleCode } from '@/lib/standardsMap'

export function StandardsSidePanel({
  standards,
  moduleId,
  moduleCode: moduleCodeProp,
  title = 'Estándares del módulo',
  onClose,
}: {
  standards: StandardEntry[]
  moduleId: string
  moduleCode?: string
  title?: string
  onClose: () => void
}) {
  const moduleCode = moduleCodeProp ?? toModuleCode(moduleId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-black/20"
        aria-label="Cerrar panel de estándares"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-labelledby="standards-module-panel-title"
        className="fixed right-0 top-0 z-[91] flex h-full w-full max-w-[360px] flex-col border-l border-[#E8E4DC] bg-[#FDFCFA] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E4DC] px-4 py-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#A8A49C]">
              Respaldo institucional · {moduleCode}
            </p>
            <h3 id="standards-module-panel-title" className="mt-1 font-serif text-[15px] font-semibold text-[#1C1B18]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1 text-[#A8A49C] hover:bg-[#F0EDE5] hover:text-[#1C1B18]"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {standards.map(s => (
            <li key={s.code} className="border-t border-[#E8E4DC] pt-3 first:border-t-0 first:pt-0">
              <p className="font-mono text-[11px] font-semibold text-[#1C1B18]">{s.code}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#4A4642]">{s.full_name}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6B6760]">{s.relevance}</p>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#3B6D11] hover:underline"
              >
                Fuente oficial
                <ExternalLink size={11} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
