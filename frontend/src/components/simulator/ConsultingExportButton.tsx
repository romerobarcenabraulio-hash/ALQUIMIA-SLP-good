'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConsultingExport, type ExportAction } from '@/hooks/useConsultingExport'

interface ConsultingExportButtonProps {
  action?: ExportAction
  label?: string
  moduleLabel?: string
  className?: string
  disabled?: boolean
  variant?: 'footer' | 'primary' | 'header'
}

export function ConsultingExportButton({
  action = 'executive_pdf',
  label = 'Exportar borrador PDF',
  moduleLabel,
  className,
  disabled = false,
  variant = 'footer',
}: ConsultingExportButtonProps) {
  const { loading, error, runExport } = useConsultingExport()

  const base =
    variant === 'header'
      ? 'btn-primary text-[12px] px-4 py-1.5'
      : variant === 'primary'
        ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[12px] font-medium hover:bg-[#2D5409] transition-colors'
        : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E8E4DC] bg-white text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors'

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={disabled || loading}
        title={moduleLabel ? `Borrador PDF — ${moduleLabel}` : undefined}
        onClick={() => void runExport(action, { moduleLabel })}
        className={cn(base, (disabled || loading) && 'opacity-60 cursor-not-allowed', className)}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Generando PDF…
          </>
        ) : (
          label
        )}
      </button>
      {error && <span className="text-[10px] text-red-600 max-w-xs text-right">{error}</span>}
    </span>
  )
}
