import { Suspense } from 'react'
import { PlatformPage } from '@/components/platform/PlatformPage'

export default function ExecutionPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <PlatformPage platformStage="execution" />
    </Suspense>
  )
}
