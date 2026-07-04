'use client'

import { Lock, CheckCircle2, Circle } from 'lucide-react'
import type { DecisionModuleId } from '@/types'
import { useModuleProgression } from '@/hooks/useModuleProgression'
import { cn } from '@/lib/utils'

interface ModuleProgressionIndicatorProps {
  moduleId: DecisionModuleId
  className?: string
  showLabel?: boolean
}

export function ModuleProgressionIndicator({
  moduleId,
  className,
  showLabel = true,
}: ModuleProgressionIndicatorProps) {
  const { getModuleStatusInfo } = useModuleProgression()
  const { status, isLocked, isUnlocked, isCompleted } = getModuleStatusInfo(moduleId)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isLocked && (
        <>
          <Lock className="h-4 w-4 text-gray-400" />
          {showLabel && <span className="text-sm text-gray-500">Bloqueado</span>}
        </>
      )}
      {isUnlocked && (
        <>
          <Circle className="h-4 w-4 text-blue-500" />
          {showLabel && <span className="text-sm text-blue-600">Disponible</span>}
        </>
      )}
      {isCompleted && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {showLabel && <span className="text-sm text-green-600">Completado</span>}
        </>
      )}
    </div>
  )
}
