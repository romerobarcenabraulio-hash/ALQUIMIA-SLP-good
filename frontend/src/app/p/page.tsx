import { Suspense } from 'react'
import { PlatformPage } from '@/components/platform/PlatformPage'

export default function PlanningPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <PlatformPage platformStage="planning" />
    </Suspense>
  )
}
