'use client'

import { useCallback, useState } from 'react'
import {
  resolveModuleStandards,
  toModuleCode,
  type StandardEntry,
} from '@/lib/standardsMap'
import { StandardsSidePanel } from '@/components/credibility/StandardsSidePanel'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'
import { useSimulatorStore } from '@/store/simulatorStore'

interface StandardsFooterProps {
  /** Canonical module_id (e.g. city_baseline) or M-code (e.g. M01). */
  moduleId: string
  className?: string
}

function StandardPill({
  standard,
  onSelect,
}: {
  standard: StandardEntry
  onSelect: (s: StandardEntry) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(standard)}
      className="inline-flex items-center rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-2 py-0.5 font-mono text-[10px] text-[#6B6760] transition-colors hover:border-[#C8C4BC] hover:bg-[#F4F2ED] hover:text-[#4A4642]"
      aria-label={`Ver respaldo: ${standard.code}`}
    >
      {standard.code}
    </button>
  )
}

export function StandardsFooter({ moduleId, className = '' }: StandardsFooterProps) {
  const [selected, setSelected] = useState<StandardEntry | null>(null)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const zmActiva = useSimulatorStore(s => s.zmActiva)

  const moduleCode = toModuleCode(moduleId)
  const record = resolveModuleStandards(moduleId)
  const isOperationMode = isCircularityBaselineReadyForUi(circularityBaseline, zmActiva)

  const closePanel = useCallback(() => setSelected(null), [])

  const opacityClass = isOperationMode ? 'opacity-100' : 'opacity-60'

  if (!record) {
    return (
      <footer
        className={`mt-8 border-t border-[#E8E4DC] pt-4 ${opacityClass} transition-opacity duration-300 ${className}`}
        aria-label="Respaldo institucional"
      >
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#A8A49C] mb-2">
          Respaldo institucional
        </p>
        <p className="text-[11px] text-[#A8A49C] italic">Estándar en revisión</p>
      </footer>
    )
  }

  if (record.status === 'no_aplica' || record.status === 'pendiente') {
    return (
      <footer
        className={`mt-8 border-t border-[#E8E4DC] pt-4 ${opacityClass} transition-opacity duration-300 ${className}`}
        aria-label="Respaldo institucional"
      >
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#A8A49C] mb-2">
          Respaldo institucional
        </p>
        <p className="text-[11px] text-[#A8A49C]">{record.message}</p>
      </footer>
    )
  }

  const standards = record.standards ?? []

  if (standards.length === 0) {
    return (
      <footer
        className={`mt-8 border-t border-[#E8E4DC] pt-4 ${opacityClass} transition-opacity duration-300 ${className}`}
        aria-label="Respaldo institucional"
      >
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#A8A49C] mb-2">
          Respaldo institucional
        </p>
        <p className="text-[11px] text-[#A8A49C] italic">
          {record.message ?? 'Estándar en revisión'}
        </p>
      </footer>
    )
  }

  return (
    <>
      <footer
        className={`mt-8 border-t border-[#E8E4DC] pt-4 ${opacityClass} transition-opacity duration-300 ${className}`}
        aria-label="Respaldo institucional"
      >
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[#A8A49C] mb-2">
          Respaldo institucional
        </p>
        {record.status === 'preliminar' && record.message && (
          <p className="text-[11px] text-[#A8A49C] mb-2">{record.message}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {standards.map(s => (
            <StandardPill key={s.code} standard={s} onSelect={setSelected} />
          ))}
        </div>
      </footer>

      {selected && (
        <StandardsSidePanel
          standards={[selected]}
          moduleId={moduleId}
          moduleCode={moduleCode}
          title={selected.code}
          onClose={closePanel}
        />
      )}
    </>
  )
}
