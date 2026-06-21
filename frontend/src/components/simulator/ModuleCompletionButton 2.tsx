'use client'

import { CheckCircle2, Lock } from 'lucide-react'
import type { DecisionModuleId } from '@/types'
import { useModuleProgression } from '@/hooks/useModuleProgression'
import { cn } from '@/lib/utils'

interface ModuleCompletionButtonProps {
  moduleId: DecisionModuleId
  className?: string
  variant?: 'primary' | 'secondary'
}

export function ModuleCompletionButton({
  moduleId,
  className,
  variant = 'primary',
}: ModuleCompletionButtonProps) {
  const { completeAndUnlockNext, isModuleCompleted } = useModuleProgression()
  const isCompleted = isModuleCompleted(moduleId)

  const handleComplete = () => {
    completeAndUnlockNext(moduleId)
  }

  if (isCompleted) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          'bg-green-100 text-green-700 cursor-default',
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        Completado
      </button>
    )
  }

  return (
    <button
      onClick={handleComplete}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
        className
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      Marcar como completado
    </button>
  )
}
