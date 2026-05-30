import Link from 'next/link'

const journey = [
  ['Validación', 'Comienza viendo dónde estás'],
  ['Planeación', 'Diseña cómo lo vas a hacer'],
  ['Ejecución', 'Demuestra que funciona'],
] as const

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F4F2ED] text-[#1C1B18]">
      <header className="border-b border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <span className="font-serif text-[22px] font-semibold">ALQUIMIA</span>
          <nav className="flex items-center gap-3 text-[13px]">
            <Link href="/metodologia" className="hidden text-[#4A4740] hover:text-[#1C1B18] sm:inline">
              Metodología
            </Link>
            <Link href="/sign-in" className="text-[#4A4740] hover:text-[#1C1B18]">
              Iniciar sesión
            </Link>
            <Link href="/comenzar" className="rounded-[8px] bg-[#1C2B15] px-4 py-2 font-semibold text-white">
              Comenzar
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="mb-4 text-[12px] font-semibold uppercase text-[#6B6760]">
            Diagnóstico municipal trazable
          </p>
          <h1 className="max-w-4xl font-serif text-[52px] leading-[1.05] tracking-[0] text-[#1C1B18] md:text-[68px]">
            La circularidad en tu ciudad sí se puede.
          </h1>
          <p className="mt-4 max-w-2xl text-[24px] leading-8 text-[#2F5B0D]">
            Súmate al cambio. Toma las medidas. Hazlas acción.
          </p>
          <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#4A4740]">
            ALQUIMIA es una plataforma dedicada a crear, impulsar y aterrizar política pública.
            Hoy enfocada en convertir el diagnóstico de residuos en una ruta municipal accionable,
            trazable y defendible.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/comenzar" className="rounded-[8px] bg-[#1C2B15] px-5 py-3 text-[14px] font-semibold text-white">
              Ver el diagnóstico para mi municipio
            </Link>
            <Link href="/metodologia" className="rounded-[8px] border border-[#3B6D11] px-5 py-3 text-[14px] font-semibold text-[#2F5B0D]">
              Conocer la metodología
            </Link>
          </div>
        </div>

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
    </main>
  )
}
