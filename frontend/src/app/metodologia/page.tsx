import { PublicHero, PublicPageShell } from '@/components/public/PublicPageShell'

const dataCategories = [
  {
    code: '01',
    label: 'Documento del cliente',
    description:
      'Documento cargado directamente por el municipio o institución contratante. Conserva: nombre del documento, página, cita literal, usuario de carga, fecha y estado de revisión.',
  },
  {
    code: '02',
    label: 'Investigación municipal',
    description:
      'Dato obtenido de fuentes oficiales del municipio en cuestión: actas de cabildo, planes de desarrollo, padrones, estudios propios. Institución emisora, año, URL y fecha de consulta requeridos.',
  },
  {
    code: '03',
    label: 'Dato estatal',
    description:
      'Estadística o normativa de nivel estatal aplicable al municipio. Fuente: gobierno del estado, SEMARNAT estatal, organismos intermedios. Alcance territorial explícito.',
  },
  {
    code: '04',
    label: 'Zona metropolitana',
    description:
      'Información de zona metropolitana declarada (CONAPO / SEDATU). No se trata como dato municipal; se usa como contexto regional con rango de varianza.',
  },
  {
    code: '05',
    label: 'Dato nacional',
    description:
      'Estadística federal: INEGI, SEMARNAT, SHCP, CONEVAL, otros. Puede servir como línea base o benchmark nacional. No sustituye dato municipal ni estatal.',
  },
  {
    code: '06',
    label: 'Ciudad comparable',
    description:
      'Municipio de características similares (tamaño, región, densidad) usado como referencia metodológica. Explícita la justificación de comparabilidad. Nunca se presenta como dato del cliente.',
  },
  {
    code: '07',
    label: 'Modelo calculado',
    description:
      'Derivado de otras categorías mediante fórmula transparente. Conserva fórmula, campos fuente, metodología y sello "Calculado · ver metodología". Hereda las limitaciones de sus insumos.',
  },
  {
    code: '—',
    label: 'Pendiente · brecha crítica',
    description:
      'Si una cifra no encaja en ninguna categoría anterior, no entra al sistema. El campo queda pendiente con instrucción específica: qué documento, fuente o cálculo se requiere para llenarlo.',
  },
]

const notDo = [
  'No certifica resultados como oficiales.',
  'No sustituye estudios locales.',
  'No sustituye decisiones públicas, jurídicas o de cabildo.',
  'No convierte benchmarks en verdad municipal.',
  'No mezcla municipio, zona metropolitana, estado y país sin distinción.',
  'No genera declaratorias sin reglamento municipal cargado.',
  'No exporta informe con cumplimiento de evidencia por debajo del 80 %.',
]

export default function MethodologyPage() {
  return (
    <PublicPageShell actionLabel="Ver mi municipio">
      <PublicHero
        eyebrow="Metodología pública"
        title="Evidencia primero. Inferencia marcada. Brecha crítica cuando falta estudio local."
        body="ALQUIMIA organiza el diagnóstico municipal con una regla simple: nada estimado se presenta como oficial y ningún benchmark se presenta como estudio local. Cada cifra lleva su categoría de origen."
      />

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 md:grid-cols-2 xl:grid-cols-4">
        {dataCategories.map(cat => (
          <article key={cat.code} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
            <p className="font-mono text-[11px] font-semibold text-[#A8A49C]">{cat.code}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#1C1B18]">{cat.label}</h2>
            <p className="mt-3 text-[13px] leading-6 text-[#5C574F]">{cat.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="border-t border-[#D8D2C5] py-8">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C8880]">
            Esquema de cita
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
              <p className="font-mono text-[11px] font-semibold text-[#A8A49C]">A</p>
              <h3 className="mt-1 text-[14px] font-semibold text-[#1C1B18]">A · Datos investigados</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                Fuente oficial verificada: INEGI, SEMARNAT, gobierno municipal o estatal. Requiere institución, año, URL y fecha de consulta. formato Chicago.
              </p>
            </div>
            <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
              <p className="font-mono text-[11px] font-semibold text-[#A8A49C]">B</p>
              <h3 className="mt-1 text-[14px] font-semibold text-[#1C1B18]">B · Datos calculados</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                Derivados de categoría A mediante fórmula transparente. Conservan fórmula, campos fuente y sello "Calculado · ver metodología".
              </p>
            </div>
            <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
              <p className="font-mono text-[11px] font-semibold text-[#A8A49C]">C</p>
              <h3 className="mt-1 text-[14px] font-semibold text-[#1C1B18]">C · Datos del cliente</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                Documentos cargados directamente por el municipio. Conservan nombre, página, cita literal, usuario de carga y estado de revisión.
              </p>
            </div>
          </div>
        </div>
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
                La bibliografía comparable puede orientar hipótesis, planeación y contexto. No desbloquea un
                claim municipal local ni sustituye reglamento, estudio local o documento del cliente.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {notDo.map(item => (
                <p
                  key={item}
                  className="border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[13px] text-[#4A4740]"
                >
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
