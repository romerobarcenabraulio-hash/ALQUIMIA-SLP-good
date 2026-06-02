import { Suspense } from 'react'
import { StageWorkspace } from '@/components/platform/StageWorkspace'

export default function ExecutionPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <StageWorkspace platformStage="execution" />
    </Suspense>
  )
}
