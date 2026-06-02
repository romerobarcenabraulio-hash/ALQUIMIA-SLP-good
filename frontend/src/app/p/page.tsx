import { Suspense } from 'react'
import { StageWorkspace } from '@/components/platform/StageWorkspace'

export default function PlanningPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <StageWorkspace platformStage="planning" />
    </Suspense>
  )
}
