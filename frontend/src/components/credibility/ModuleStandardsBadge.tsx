'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { resolveModuleStandards, toModuleCode } from '@/lib/standardsMap'
import { StandardsSidePanel } from '@/components/credibility/StandardsSidePanel'

const MAX_VISIBLE = 3

export interface ModuleStandardsBadgeProps {
  moduleId: string
  className?: string
}

export function ModuleStandardsBadge({ moduleId, className }: ModuleStandardsBadgeProps) {
  const [open, setOpen] = useState(false)
  const record = resolveModuleStandards(moduleId)
  const standards = record?.standards ?? []

  const closePanel = useCallback(() => setOpen(false), [])

  if (!standards.length || record?.status === 'no_aplica') {
    return null
  }

  const visible = standards.slice(0, MAX_VISIBLE)
  const overflow = Math.max(0, standards.length - visible.length)

  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn(
          'flex flex-wrap items-center justify-end gap-1 shrink-0 rounded-[6px] px-1 py-0.5',
          'hover:bg-[#F4F2ED] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B6D11]/40',
          className,
        )}
        data-testid="module-standards-badge"
        aria-label={`${standards.length} estándares de respaldo — abrir listado`}
      >
        {visible.map(s => (
          <span
            key={s.code}
            className="font-mono text-[9px] text-[#A8A49C] border border-[#E8E4DC] rounded px-1.5 py-0.5 max-w-[96px] truncate"
            title={s.code}
          >
            {s.code.length > 14 ? `${s.code.slice(0, 12)}…` : s.code}
          </span>
        ))}
        {overflow > 0 && (
          <span className="font-mono text-[9px] text-[#6B6760] border border-[#E8E4DC] rounded px-1.5 py-0.5">
            +{overflow} más
          </span>
        )}
      </button>

      {open && (
        <StandardsSidePanel
          standards={standards}
          moduleId={moduleId}
          moduleCode={toModuleCode(moduleId)}
          onClose={closePanel}
        />
      )}
    </>
  )
}
