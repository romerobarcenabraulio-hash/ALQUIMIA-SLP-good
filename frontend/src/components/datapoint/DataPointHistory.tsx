'use client'

import { DataPointHistory } from '@/types/dataPoint'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface DataPointHistoryProps {
  entries: DataPointHistory[]
  currentValue: string | number | boolean
  currentConfidence: number
}

/**
 * Timeline of changes to a DataPoint
 * Shows old → new values, confidence changes, who changed it and when
 */
export function DataPointHistoryTimeline({ entries, currentValue, currentConfidence }: DataPointHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[6px] border border-[#E8E4DC] bg-[#FDFCFA] p-3 text-[12px] text-[#6B6760]">
        No hay cambios registrados en esta cifra.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Current state */}
      <div className="rounded-[6px] border-l-4 border-[#007ACC] bg-[#E3F2FD] p-3">
        <p className="text-[12px] font-medium text-[#1C1B18]">Estado actual</p>
        <p className="text-[13px] font-semibold text-[#1C1B18] mt-1">{currentValue}</p>
        <p className="text-[11px] text-[#01579B] mt-1">Confianza: {currentConfidence}%</p>
      </div>

      {/* History entries (most recent first) */}
      <div className="space-y-2">
        {[...entries].reverse().map((entry, index) => (
          <div key={entry.id} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-[11px] text-[#A8A49C] uppercase tracking-[0.05em]">{entry.reason || 'Cambio'}</p>
                <p className="text-[12px] font-medium text-[#1C1B18] mt-1">
                  {entry.old_value ?? '(sin valor)'} → {entry.new_value}
                </p>
              </div>
              <div className="text-[10px] text-[#6B6760] flex-shrink-0 text-right">
                <p>{entry.changed_by}</p>
                <p className="text-[#A8A49C]">
                  {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>

            {/* Confidence change if present */}
            {(entry.old_confidence !== undefined || entry.new_confidence !== undefined) && (
              <div className="mt-2 text-[11px] text-[#6B6760]">
                <span className="text-[#A8A49C]">Confianza: </span>
                {entry.old_confidence !== undefined ? `${entry.old_confidence}% → ` : ''}
                {entry.new_confidence}%
              </div>
            )}

            {/* Status change if present */}
            {(entry.old_status !== undefined || entry.new_status !== undefined) && (
              <div className="mt-1 text-[11px] text-[#6B6760]">
                <span className="text-[#A8A49C]">Estado: </span>
                {entry.old_status ?? '(sin estado)'} → {entry.new_status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
