import { Suspense } from 'react'
import { StageWorkspace } from '@/components/platform/StageWorkspace'

export default function ValidationPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <StageWorkspace platformStage="validation" />
    </Suspense>
  )
}
