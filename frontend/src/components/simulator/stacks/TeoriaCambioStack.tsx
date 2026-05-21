'use client'

import { TheoryOfChangePanel } from '@/components/simulator/TheoryOfChangePanel'

export function TeoriaCambioStack() {
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">M04C · Cierre diagnóstico</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Teoría de cambio</h2>
        <p className="mt-2 text-[13px] text-[#6B6760]">
          Cómo se conecta todo lo diagnosticado: inputs → actividades → outputs → outcomes → impacto.
        </p>
      </div>
      <TheoryOfChangePanel />
    </div>
  )
}
