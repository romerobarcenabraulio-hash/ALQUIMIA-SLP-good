'use client'

import { CapacitacionTab } from '@/components/simulator/CapacitacionTab'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function PlanEducativoStack() {
  const resultados = useSimulatorStore(s => s.resultados)
  const costoEduc = resultados?.costoEducacionAnual

  return (
    <div className="space-y-5">
      {costoEduc != null && costoEduc > 0 && (
        <p className="text-[12px] font-mono font-semibold text-[#3B6D11]">
          Costo educación año 1: {fmt.mxn(costoEduc)}
        </p>
      )}
      <CapacitacionTab />
    </div>
  )
}
