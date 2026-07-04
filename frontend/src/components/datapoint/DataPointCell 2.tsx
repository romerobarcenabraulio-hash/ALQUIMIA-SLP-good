'use client'

import { DataPoint } from '@/types/dataPoint'
import { cn } from '@/lib/utils'

/**
 * Badge for DataPoint category
 */
function getCategoryBadgeStyle(category: string): { bg: string; text: string; label: string } {
  switch (category) {
    case 'client_document':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: '01 · Cliente' }
    case 'municipal_research':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: '02 · Municipal' }
    case 'state_data':
      return { bg: 'bg-[#F3E5F5]', text: 'text-[#6A1B9A]', label: '03 · Estatal' }
    case 'metropolitan_zone':
      return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: '04 · ZM' }
    case 'national_data':
      return { bg: 'bg-[#FFEAA7]', text: 'text-[#D4A51D]', label: '05 · Nacional' }
    case 'comparable_city':
      return { bg: 'bg-[#FCE4EC]', text: 'text-[#C2185B]', label: '06 · Comparable' }
    case 'calculated_model':
      return { bg: 'bg-[#E1F5FE]', text: 'text-[#01579B]', label: '07 · Cálculo' }
    case 'pending':
      return { bg: 'bg-[#EFEBE9]', text: 'text-[#3E2723]', label: '— · Pendiente' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#616161]', label: category }
  }
}

/**
 * Badge for status
 */
function getStatusBadgeStyle(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'verificado':
      return { bg: 'bg-[#C8E6C9]', text: 'text-[#1B5E20]', label: 'Verificado' }
    case 'estimado':
      return { bg: 'bg-[#FFE0B2]', text: 'text-[#E65100]', label: 'Estimado' }
    case 'no_disponible':
      return { bg: 'bg-[#FFCDD2]', text: 'text-[#B71C1C]', label: 'No disponible' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#616161]', label: status }
  }
}

/**
 * Confidence color scale
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-[#2E7D32]'
  if (confidence >= 60) return 'text-[#F57F17]'
  return 'text-[#C62828]'
}

interface DataPointCellProps {
  dataPoint: DataPoint
  showSource?: boolean
  showHistory?: boolean
  onViewHistory?: () => void
}

/**
 * Renders a single DataPoint with category, source, confidence badge
 */
export function DataPointCell({
  dataPoint,
  showSource = true,
  showHistory = false,
  onViewHistory,
}: DataPointCellProps) {
  const categoryStyle = getCategoryBadgeStyle(dataPoint.category)
  const statusStyle = getStatusBadgeStyle(dataPoint.status)
  const confidenceColor = getConfidenceColor(dataPoint.confidence)

  return (
    <div className="rounded-[6px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
      {/* Header: value + unit + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[#1C1B18] break-words">
            {dataPoint.value}
            {dataPoint.unit && <span className="text-[12px] text-[#A8A49C] ml-1">{dataPoint.unit}</span>}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <span className={cn('inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-medium', categoryStyle.bg, categoryStyle.text)}>
            {categoryStyle.label}
          </span>
        </div>
      </div>

      {/* Source + confidence row */}
      {showSource && (
        <div className="mt-2 text-[11px] text-[#6B6760]">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">
              <span className="font-semibold">{dataPoint.metadata.source_name}</span>
              {dataPoint.metadata.source_year && <span className="text-[#A8A49C]"> · {dataPoint.metadata.source_year}</span>}
            </span>
            <span className={cn('font-medium whitespace-nowrap', confidenceColor)}>
              {dataPoint.confidence}%
            </span>
          </div>
          {dataPoint.metadata.source_institution && (
            <p className="text-[#8C8880] mt-0.5">{dataPoint.metadata.source_institution}</p>
          )}
        </div>
      )}

      {/* Status + history */}
      <div className="mt-2 flex items-center gap-1">
        <span className={cn('inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-medium', statusStyle.bg, statusStyle.text)}>
          {statusStyle.label}
        </span>
        {showHistory && onViewHistory && (
          <button
            onClick={onViewHistory}
            className="text-[10px] text-[#007ACC] hover:underline ml-auto"
          >
            Ver cambios
          </button>
        )}
      </div>

      {/* Notes if present */}
      {dataPoint.notes && (
        <p className="mt-2 text-[11px] text-[#6B6760] italic border-l-2 border-[#D8D2C5] pl-2">
          {dataPoint.notes}
        </p>
      )}
    </div>
  )
}
