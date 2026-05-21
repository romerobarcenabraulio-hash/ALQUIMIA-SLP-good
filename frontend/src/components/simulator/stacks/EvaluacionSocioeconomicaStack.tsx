'use client'

import { SocialFiscalImpactSection } from '@/components/simulator/SocialFiscalImpactSection'
import { EmpleosSection } from '@/components/simulator/EmpleosSection'
import { MultiplicadoresEco } from '@/components/simulator/MultiplicadoresEco'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

export function EvaluacionSocioeconomicaStack() {
  return (
    <div className="space-y-5">
      <ScopeAnclaKicker className="mb-1" />
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">M04B · Financiero-económico</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Evaluación socioeconómica</h2>
        <p className="mt-2 text-[13px] text-[#6B6760] leading-relaxed">
          Análisis costo-beneficio social: empleos generados → reducción de pobreza (municipio y estado)
          y alivio fiscal equivalente sobre deuda pública estatal (ISN, salud, rescate, deuda verde).
        </p>
      </div>
      <SocialFiscalImpactSection />
      <EmpleosSection />
      <MultiplicadoresEco />
    </div>
  )
}
