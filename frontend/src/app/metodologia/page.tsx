import { PublicHero, PublicPageShell } from '@/components/public/PublicPageShell'

const sections = [
  {
    title: 'A · Datos investigados',
    body: 'Vienen de una fuente externa identificable. Cada dato conserva institución emisora, título, año, URL cuando aplique, fecha de consulta, alcance territorial y referencia bibliográfica en formato Chicago.',
  },
  {
    title: 'B · Datos calculados',
    body: 'Derivan de datos investigados mediante fórmula transparente. La plataforma conserva la fórmula, los campos fuente, la metodología y el sello “Calculado · ver metodología”.',
  },
  {
    title: 'C · Datos del cliente',
    body: 'Vienen de documentos que el municipio o institución sube a la plataforma. Cada dato conserva documento, página, cita literal, usuario de carga, fecha y estado de revisión humana.',
  },
  {
    title: 'Sin dato · Brecha crítica',
    body: 'Si una cifra no encaja en A, B o C, no entra al sistema. El campo queda pendiente con la instrucción de qué documento, fuente o cálculo se requiere para llenarlo.',
  },
]

const notDo = [
  'No certifica resultados como oficiales.',
  'No sustituye estudios locales.',
  'No sustituye decisiones públicas, jurídicas o de cabildo.',
  'No convierte benchmarks en verdad municipal.',
  'No mezcla municipio, zona metropolitana, estado y país.',
]

export default function MethodologyPage() {
  return (
    <PublicPageShell actionLabel="Ver mi municipio">
      <PublicHero
        eyebrow="Metodología pública"
        title="Evidencia primero. Inferencia marcada. Brecha crítica cuando falta estudio local."
        body="ALQUIMIA organiza el diagnóstico municipal con una regla simple: nada estimado se presenta como oficial y ningún benchmark se presenta como estudio local."
      />

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 md:grid-cols-2">
        {sections.map(section => (
          <article key={section.title} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
            <h2 className="text-[18px] font-semibold">{section.title}</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#5C574F]">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="border-t border-[#D8D2C5] bg-transparent py-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C8880]">
                Regla operativa
              </p>
              <h2 className="mt-2 max-w-md font-serif text-[30px] leading-tight text-[#1C1B18]">
                Cero cifras sin cita; cero benchmarks tratados como estudio local.
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-7 text-[#5C574F]">
                La bibliografía comparable puede orientar hipótesis, planeación y contexto. No desbloquea un claim
                municipal local ni sustituye reglamento, estudio local o documento del cliente.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            {notDo.map(item => (
              <p key={item} className="border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[13px] text-[#4A4740]">
                {item}
              </p>
            ))}
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
