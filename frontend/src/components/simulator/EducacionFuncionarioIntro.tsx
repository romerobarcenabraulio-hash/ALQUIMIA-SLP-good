'use client'

import { ArrowRight, BookOpen, CircleDollarSign, Scale } from 'lucide-react'
import { Conclusion, SectionLabel } from '@/components/editorial'

const EDUCATION_CARDS = [
  {
    title: 'Qué es RSU y cómo se separa',
    body: 'RSU son los residuos sólidos urbanos de vivienda, oficina y calle: orgánicos, papel/cartón, plásticos, vidrio, metales y rechazo. Separar desde origen evita que el material se contamine antes de llegar a recolección, acopio o reciclaje.',
    tag: 'Educación ciudadana',
    Icon: BookOpen,
  },
  {
    title: 'Qué pasa después del bote',
    body: 'Si todo llega mezclado, el camión mueve más volumen, el relleno recibe material con valor y los recolectores de base separan en condiciones más pesadas. Si llega separado, el flujo puede convertirse en ruta útil, acopio e industria recicladora.',
    tag: 'Modelo lineal vs circular',
    Icon: ArrowRight,
  },
  {
    title: 'El costo de no separar',
    body: 'El costo no es solo la recolección: también incluye disposición, presión sanitaria, emisiones y pérdida de valor material. Por eso el modelo distingue venta de residuos separados, ahorro público y externalidades condicionadas.',
    tag: 'Costo público',
    Icon: CircleDollarSign,
  },
  {
    title: 'Cómo entra la ley',
    body: 'La ley federal define principios, pero la operación real se vuelve municipal: reglamento, rutas, obligaciones, evidencia e implementación. ALQUIMIA no emite actos oficiales; prepara análisis y propuestas para revisión competente.',
    tag: 'Marco municipal',
    Icon: Scale,
  },
]

export function EducacionFuncionarioIntro() {
  return (
    <section aria-labelledby="educacion-funcionario-title">
      <SectionLabel>Educación previa a la decisión</SectionLabel>
      <h2 id="educacion-funcionario-title" className="font-serif text-[24px] text-[#1C1B18] mb-4">
        Lo que debe entenderse antes de decidir
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {EDUCATION_CARDS.map(({ title, body, tag, Icon }) => (
          <article key={title} className="border-t border-[#E8E4DC] pt-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3DE] text-[#3B6D11]">
                <Icon size={16} aria-hidden />
              </span>
              <div>
                <SectionLabel>{tag}</SectionLabel>
                <h3 className="font-serif text-[18px] text-[#1C1B18]">{title}</h3>
                <Conclusion className="text-[15px] md:text-[16px] mb-0 mt-2">{body}</Conclusion>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
