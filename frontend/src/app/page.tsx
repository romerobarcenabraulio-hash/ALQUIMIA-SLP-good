import Link from 'next/link'
import { PublicHero, PublicPageShell } from '@/components/public/PublicPageShell'

const journey = [
  ['Validación', 'Comienza viendo dónde estás'],
  ['Planeación', 'Diseña cómo lo vas a hacer'],
  ['Ejecución', 'Demuestra que funciona'],
] as const

export default function LandingPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <PublicHero
          eyebrow="Diagnóstico municipal trazable"
          title="La circularidad en tu ciudad sí se puede."
          body="ALQUIMIA es una plataforma dedicada a crear, impulsar y aterrizar política pública. Hoy enfocada en convertir el diagnóstico de residuos en una ruta municipal accionable, trazable y defendible."
        >
          <p className="mt-4 max-w-2xl text-[24px] leading-8 text-[#2F5B0D]">
            Súmate al cambio. Toma las medidas. Hazlas acción.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/comenzar" className="rounded-[8px] bg-[#1C2B15] px-5 py-3 text-[14px] font-semibold text-white">
              Ver el diagnóstico para mi municipio
            </Link>
            <Link href="/metodologia" className="rounded-[8px] border border-[#3B6D11] px-5 py-3 text-[14px] font-semibold text-[#2F5B0D]">
              Conocer la metodología
            </Link>
          </div>
        </PublicHero>

        <aside className="rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-6">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Respaldo institucional</p>
          <p className="mt-3 text-[28px] font-serif leading-tight">Metodología respaldada por estándares internacionales.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['GRI', 'ISO', 'PMI', 'CSRD', 'NMX-AA', 'SDG 11.6'].map(item => (
              <span key={item} className="rounded-full border border-[#D8D2C5] px-3 py-1 text-[12px] text-[#4A4740]">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-5 border-t border-[#E8E4DC] pt-5 text-[14px] leading-7 text-[#5C574F]">
            Diagnóstico técnicamente defendible. Cero invención de cifras.
          </p>
        </aside>
      </section>

      <section className="border-y border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <p className="mb-3 text-[12px] font-semibold uppercase text-[#6B6760]">El viaje del cambio</p>
          <div className="grid gap-4 md:grid-cols-3">
            {journey.map(([title, body]) => (
              <article key={title} className="rounded-[8px] border border-[#E8E4DC] bg-white p-6">
                <h2 className="text-[20px] font-semibold">{title}</h2>
                <p className="mt-3 text-[14px] leading-7 text-[#5C574F]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase text-[#6B6760]">Cuña inicial</p>
          <h2 className="font-serif text-[38px] leading-tight">Por qué vivienda en condominio</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            'Oportunidad operativa para organizar separación, acopio y trazabilidad.',
            'Concentración de generación que permite observar rutas y hábitos con menor dispersión.',
            'Posibilidad de intervención organizada con administraciones y residentes.',
            'Necesidad de evidencia municipal antes de convertir una hipótesis en verdad local.',
          ].map(item => (
            <p key={item} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5 text-[14px] leading-7 text-[#4A4740]">
              {item}
            </p>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-[#6B6760]">
          <span>ALQUIMIA</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/sign-in">Iniciar sesión</Link>
            <Link href="/comenzar">Comenzar</Link>
            <Link href="/metodologia">Metodología</Link>
            <a href="mailto:hola@alquimia.mx">Contacto</a>
          </div>
        </div>
      </footer>
    </PublicPageShell>
  )
}
