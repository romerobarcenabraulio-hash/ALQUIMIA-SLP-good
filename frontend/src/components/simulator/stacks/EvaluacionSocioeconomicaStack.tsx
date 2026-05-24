'use client'

import { SocialFiscalImpactSection } from '@/components/simulator/SocialFiscalImpactSection'
import { EmpleosSection } from '@/components/simulator/EmpleosSection'
import { MultiplicadoresEco } from '@/components/simulator/MultiplicadoresEco'

export function EvaluacionSocioeconomicaStack() {
  return (
    <div className="space-y-5">
      <SocialFiscalImpactSection />
      <EmpleosSection />
      <MultiplicadoresEco />
    </div>
  )
}
