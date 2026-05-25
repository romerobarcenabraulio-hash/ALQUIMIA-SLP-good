'use client'

import { ArrowRight, BookOpen, CircleDollarSign, Scale } from 'lucide-react'

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
    <section className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4" aria-labelledby="educacion-funcionario-title">
      <h2 id="educacion-funcionario-title" className="font-serif text-[24px] text-[#1C1B18]">
        Lo que debe entenderse antes de decidir
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {EDUCATION_CARDS.map(({ title, body, tag, Icon }) => (
          <article key={title} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3DE] text-[#3B6D11]">
                <Icon size={16} aria-hidden />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{tag}</p>
                <h3 className="mt-1 font-serif text-[18px] text-[#1C1B18]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">{body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
