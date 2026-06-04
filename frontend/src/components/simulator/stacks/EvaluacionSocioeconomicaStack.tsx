'use client'

import { SocialFiscalImpactSection } from '@/components/simulator/SocialFiscalImpactSection'
import { EmpleosSection } from '@/components/simulator/EmpleosSection'
import { MultiplicadoresEco } from '@/components/simulator/MultiplicadoresEco'
import { useDataPointsByModule } from '@/hooks/useDataPointsByModule'

export function EvaluacionSocioeconomicaStack() {
  // Sprint 3 · Load DataPoints (gradual migration)
  const { data: dataPoints } = useDataPointsByModule('costo_omision')

  return (
    <div className="space-y-5">
      <SocialFiscalImpactSection />
      <EmpleosSection />
      <MultiplicadoresEco />
    </div>
  )
}
