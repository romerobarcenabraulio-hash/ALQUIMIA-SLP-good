import { Suspense } from 'react'
import { PlatformPage } from '@/components/platform/PlatformPage'

export default function ValidationPlatformRoute() {
  return (
    <Suspense fallback={null}>
      <PlatformPage platformStage="validation" />
    </Suspense>
  )
}
