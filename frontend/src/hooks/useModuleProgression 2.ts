import { useSimulatorStore } from '@/store/simulatorStore'
import type { DecisionModuleId, ModuleProgressionStatus } from '@/types'
import { useCallback } from 'react'

export function useModuleProgression() {
  const moduleProgression = useSimulatorStore((s) => s.moduleProgression)
  const markModuleCompleted = useSimulatorStore((s) => s.markModuleCompleted)
  const unlockNextModule = useSimulatorStore((s) => s.unlockNextModule)
  const isModuleUnlocked = useSimulatorStore((s) => s.isModuleUnlocked)
  const isModuleCompleted = useSimulatorStore((s) => s.isModuleCompleted)
  const getModuleStatus = useSimulatorStore((s) => s.getModuleStatus)
  const setCurrentModule = useSimulatorStore((s) => s.setCurrentModule)

  const completeAndUnlockNext = useCallback(
    (moduleId: DecisionModuleId) => {
      markModuleCompleted(moduleId)
      unlockNextModule(moduleId)
      setCurrentModule(null)
    },
    [markModuleCompleted, unlockNextModule, setCurrentModule]
  )

  const getModuleStatusInfo = useCallback(
    (moduleId: DecisionModuleId) => {
      const status = getModuleStatus(moduleId)
      const isLocked = status === 'locked'
      const isUnlocked = status === 'unlocked'
      const isCompleted = status === 'completed'
      return { status, isLocked, isUnlocked, isCompleted }
    },
    [getModuleStatus]
  )

  return {
    moduleProgression,
    completeAndUnlockNext,
    getModuleStatusInfo,
    setCurrentModule,
    isModuleUnlocked,
    isModuleCompleted,
    getModuleStatus,
  }
}
