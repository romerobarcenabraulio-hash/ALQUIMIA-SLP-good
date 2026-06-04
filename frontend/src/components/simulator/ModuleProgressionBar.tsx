'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'
import type { DecisionModuleId } from '@/types'
import { useModuleProgression } from '@/hooks/useModuleProgression'
import { cn } from '@/lib/utils'

const MODULE_ORDER: DecisionModuleId[] = [
  'M00B', 'M01', 'M02A', 'M02B', 'M02C', 'M02D',
  'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15',
]

const MODULE_LABELS: Record<DecisionModuleId, string> = {
  'M00B': 'Antecedentes',
  'M01': 'Línea Base',
  'M02A': 'Social',
  'M02B': 'Social B',
  'M02C': 'Actores',
  'M02D': 'Autoridad',
  'M03': 'Institucional',
  'M04': 'Costo Omisión',
  'M05': 'Hoja de Ruta',
  'M06': 'Infraestructura',
  'M07': 'Organigrama',
  'M08': 'Logística',
  'M09': 'Costos',
  'M10': 'Materiales',
  'M11': 'Concesión',
  'M12': 'Financiamiento',
  'M13': 'Escenarios',
  'M14': 'Riesgos',
  'M15': 'Expediente',
}

export function ModuleProgressionBar() {
  const { getModuleStatusInfo } = useModuleProgression()

  const completed = MODULE_ORDER.filter((m) => {
    const { isCompleted } = getModuleStatusInfo(m)
    return isCompleted
  }).length

  const progress = Math.round((completed / MODULE_ORDER.length) * 100)

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Progresión de módulos</h3>
        <span className="text-sm text-gray-600">{completed}/{MODULE_ORDER.length}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2 pt-2">
        {MODULE_ORDER.map((moduleId) => {
          const { status } = getModuleStatusInfo(moduleId)
          const isLocked = status === 'locked'
          const isCompleted = status === 'completed'

          return (
            <div key={moduleId} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  isLocked
                    ? 'bg-gray-100 text-gray-400'
                    : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                )}
              >
                {isLocked && <Lock className="h-4 w-4" />}
                {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                {!isLocked && !isCompleted && <Circle className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-gray-600">{moduleId}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
