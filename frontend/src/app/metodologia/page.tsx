import { PublicHero, PublicPageShell } from '@/components/public/PublicPageShell'

const sections = [
  {
    title: 'Cómo se construye el diagnóstico inicial',
    body: 'La plataforma reúne fuentes públicas, datos provistos por el municipio o institución y evidencia documental disponible. Cada dato se clasifica por fuente, fecha, método, confianza y alcance territorial.',
  },
  {
    title: 'Cómo se validan las cifras',
    body: 'Una cifra solo puede avanzar como dato validado cuando existe fuente suficiente, fecha de corte, método claro y revisión humana. Las estimaciones permanecen marcadas como preliminares.',
  },
  {
    title: 'Cómo se evita inventar datos',
    body: 'Si falta estudio local, el sistema no rellena el vacío con narrativa. Muestra brecha crítica. Un benchmark no es estudio local y una inferencia no es dato validado.',
  },
  {
    title: 'Paquete documental por ciudad',
    body: 'Todas las ciudades usan el mismo índice y el mismo número de documentos. El contenido cambia por investigación, cotejo, diagnóstico y evidencia disponible.',
  },
]

const notDo = [
  'No certifica resultados oficiales.',
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
        <div className="rounded-[8px] border border-[#D8D2C5] bg-white p-6">
          <h2 className="text-[20px] font-semibold">Qué no hace ALQUIMIA</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {notDo.map(item => (
              <p key={item} className="rounded-[6px] bg-[#F4F2ED] px-4 py-3 text-[13px] text-[#4A4740]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
