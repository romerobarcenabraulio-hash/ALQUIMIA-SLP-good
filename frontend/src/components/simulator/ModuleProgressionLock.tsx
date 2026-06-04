'use client'

import { ReactNode } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import type { DecisionModuleId } from '@/types'
import { useModuleProgression } from '@/hooks/useModuleProgression'
import { cn } from '@/lib/utils'

interface ModuleProgressionLockProps {
  moduleId: DecisionModuleId
  children: ReactNode
  className?: string
  showBlur?: boolean
}

export function ModuleProgressionLock({
  moduleId,
  children,
  className,
  showBlur = true,
}: ModuleProgressionLockProps) {
  const { isModuleUnlocked } = useModuleProgression()
  const isUnlocked = isModuleUnlocked(moduleId)

  if (isUnlocked) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border border-gray-200 bg-gray-50 p-8',
        showBlur && 'backdrop-blur-sm',
        className
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg">
        <div className="rounded-full bg-gray-200 p-3">
          <Lock className="h-6 w-6 text-gray-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-gray-900">Módulo bloqueado</h3>
          <p className="mt-1 text-sm text-gray-600">
            Completa los módulos anteriores para acceder a este
          </p>
        </div>
      </div>
      {showBlur && (
        <div className="pointer-events-none select-none opacity-30">
          {children}
        </div>
      )}
    </div>
  )
}
