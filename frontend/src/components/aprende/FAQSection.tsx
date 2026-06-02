'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: '¿Mi ciudad ya tiene un programa de separación?',
    a: 'No se debe asumir. La plataforma coteja reglamento, documentos municipales, infraestructura disponible y evidencia de campo. Si falta estudio local, se muestra una brecha crítica; no se rellena con benchmark ni con datos de otra ciudad.',
  },
  {
    q: '¿Cómo propongo a mi edificio instalar un centro de acopio?',
    a: 'Descarga la plantilla de "Carta para administrador de condominio" del Hub. Los pasos básicos: 1) Presenta el análisis de viabilidad del CA-Studio, 2) Propón en asamblea, 3) Contacta a una recicladora local para acuerdo de compra.',
  },
  {
    q: '¿Puedo invertir en un centro de acopio?',
    a: 'Puede evaluarse, pero no con una promesa fija. El paquete consultivo calcula escenarios cerrados con CAPEX, OPEX, compradores probables, logística, calidad esperada y confianza de evidencia. Sin cotización local y revisión humana, no se presenta como inversión validada.',
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
