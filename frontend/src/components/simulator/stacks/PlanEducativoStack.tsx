'use client'

import { CapacitacionTab } from '@/components/simulator/CapacitacionTab'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function PlanEducativoStack() {
  const resultados = useSimulatorStore(s => s.resultados)
  const costoEduc = resultados?.costoEducacionAnual

  return (
    <div className="space-y-5">
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">M08B · Operativo</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Plan educativo y comunicación social</h2>
        <p className="mt-2 text-[13px] text-[#6B6760]">
          Capacitación ciudadana segmentada H1/H2 y comunicación política antes del arranque operativo.
        </p>
        {costoEduc != null && costoEduc > 0 && (
          <p className="mt-2 text-[12px] font-mono font-semibold text-[#3B6D11]">
            Costo educación año 1: {fmt.mxn(costoEduc)}
          </p>
        )}
      </div>
      <CapacitacionTab />
    </div>
  )
}
