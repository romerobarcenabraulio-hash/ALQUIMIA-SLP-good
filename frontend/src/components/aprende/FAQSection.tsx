'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: '¿Mi ciudad ya tiene un programa de separación?',
    a: 'La mayoría de ciudades medianas mexicanas tienen programas incipientes o inexistentes. El simulador ALQUIMIA permite evaluar el potencial de tu ZM específica. SLP tiene recicladoras establecidas (IPSL, PetStar) que ya absorben flujos pero sin programa formal de separación en fuente.',
  },
  {
    q: '¿Cómo propongo a mi edificio instalar un centro de acopio?',
    a: 'Descarga la plantilla de "Carta para administrador de condominio" del Hub. Los pasos básicos: 1) Presenta el análisis de viabilidad del CA-Studio, 2) Propón en asamblea, 3) Contacta a una recicladora local para acuerdo de compra.',
  },
  {
    q: '¿Puedo invertir en un centro de acopio?',
    a: 'Sí. Los CAs tienen TIRs de 109%–212% según escala, con paybacks de 5-7 meses. El modelo es de co-inversión municipal-privada. Para más información, configura un escenario en el simulador y genera el modelo CFO.',
  },
  {
    q: '¿Qué hago con pilas y medicamentos?',
    a: 'Pilas: lleva a puntos de acopio especiales (Walmart, Home Depot, FEMSA tienen programas). Medicamentos: lleva a farmacias participantes del programa COFEPRIS o centros de salud. NUNCA en basura común ni drenaje.',
  },
  {
    q: '¿Por qué los recicladores/pepenadores son importantes?',
    a: 'Históricamente han sostenido la cadena de reciclaje informal. El programa ALQUIMIA incluye su formalización como operadores certificados de los CAs — con salario formal, IMSS y capacitación.',
  },
]

export function FAQSection() {
  const [abierto, setAbierto] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] overflow-hidden">
          <button
            onClick={() => setAbierto(abierto === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-[13px] font-medium text-[#1C1B18]">{faq.q}</span>
            <span className={cn('text-[#A8A49C] transition-transform', abierto === i && 'rotate-45')}>+</span>
          </button>
          {abierto === i && (
            <div className="px-5 pb-4 border-t border-[#E8E4DC]">
              <p className="text-[13px] text-[#6B6760] leading-relaxed pt-3">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
