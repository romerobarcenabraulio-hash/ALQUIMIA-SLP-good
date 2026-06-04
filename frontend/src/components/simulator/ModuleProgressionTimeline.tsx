'use client'

import { useModuleProgression } from '@/hooks/useModuleProgression'
import type { DecisionModuleId } from '@/types'
import { Lock, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULE_ORDER: DecisionModuleId[] = [
  'M00B', 'M01', 'M02A', 'M02B', 'M02C', 'M02D',
  'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15',
]

interface ModuleProgressionTimelineProps {
  className?: string
  onModuleClick?: (moduleId: DecisionModuleId) => void
}

export function ModuleProgressionTimeline({
  className,
  onModuleClick,
}: ModuleProgressionTimelineProps) {
  const { getModuleStatusInfo, moduleProgression } = useModuleProgression()

  const getIcon = (status: string) => {
    switch (status) {
      case 'locked':
        return <Lock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getColorClass = (status: string) => {
    switch (status) {
      case 'locked':
        return 'text-gray-400 hover:text-gray-500'
      case 'completed':
        return 'text-green-600 hover:text-green-700'
      default:
        return 'text-blue-500 hover:text-blue-600'
    }
  }

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2', className)}>
      {MODULE_ORDER.map((moduleId, idx) => {
        const { status } = getModuleStatusInfo(moduleId)
        const isCurrent = moduleProgression.currentModuleId === moduleId
        const isClickable = status !== 'locked'

        return (
          <div key={moduleId} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => isClickable && onModuleClick?.(moduleId)}
              disabled={!isClickable}
              className={cn(
                'p-2 rounded-full transition-colors',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
                isCurrent && 'ring-2 ring-blue-400',
                getColorClass(status)
              )}
              title={`${moduleId} - ${status}`}
            >
              {getIcon(status)}
            </button>
            {idx < MODULE_ORDER.length - 1 && (
              <div className="w-1 h-0.5 bg-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}
