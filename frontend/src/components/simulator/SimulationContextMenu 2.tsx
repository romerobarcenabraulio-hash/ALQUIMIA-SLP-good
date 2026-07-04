'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Copy,
  Trash2,
  Download,
  Share2,
  Info,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimulationContextMenuProps {
  simulationId: string
  simulationName: string
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onExport?: (id: string) => void
  onViewDetails?: (id: string) => void
  disabled?: boolean
}

export function SimulationContextMenu({
  simulationId,
  simulationName,
  onDuplicate,
  onDelete,
  onExport,
  onViewDetails,
  disabled,
}: SimulationContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'p-1 rounded hover:bg-[#F4F2ED] transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="More options"
      >
        <MoreVertical className="h-4 w-4 text-[#6B6760]" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-1 rounded-lg border border-[#E8E4DC] bg-white shadow-lg z-50 min-w-48"
        >
          {onViewDetails && (
            <button
              onClick={() => {
                onViewDetails(simulationId)
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-[#1C1B18] hover:bg-[#F4F2ED] border-b border-[#E8E4DC] flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              View Details
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => {
                onDuplicate(simulationId)
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-[#1C1B18] hover:bg-[#F4F2ED] border-b border-[#E8E4DC] flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
          )}

          {onExport && (
            <button
              onClick={() => {
                onExport(simulationId)
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-[#1C1B18] hover:bg-[#F4F2ED] border-b border-[#E8E4DC] flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                onDelete(simulationId)
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
