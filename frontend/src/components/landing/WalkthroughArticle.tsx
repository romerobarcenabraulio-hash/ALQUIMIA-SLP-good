'use client'

const flowSteps = [
  ['01', 'Investigacion', 'Municipio, reglamento, documentos, APIs publicas y evidencia disponible.'],
  ['02', 'Cotejo', 'La plataforma separa dato local, comparable, benchmark, supuesto y brecha critica.'],
  ['03', 'Diagnostico', 'Se emiten conclusiones solo cuando existe fuente, fecha, metodo, alcance y confianza.'],
  ['04', 'Planeacion', 'Escenarios cerrados, riesgos, hoja de ruta y documentos faltantes.'],
]

const evidenceRules = [
  ['Dato validado', 'Puede soportar una afirmacion municipal si el alcance, metodo y fuente coinciden.'],
  ['Inferencia', 'Solo orienta planeacion; debe mostrar metodo, confianza y limite de uso.'],
  ['Benchmark', 'Sirve como contexto comparable; nunca reemplaza estudio local.'],
  ['Brecha critica', 'Se muestra cuando falta evidencia; no se rellena con cifras decorativas.'],
]

const diagrams = [
  ['Flujo 100% RSU', 'Domiciliario, comercial, institucional, publico y macrogeneradores.'],
  ['Mapa de captura privada', 'Privadas, vivienda vertical, escuelas, plazas, mercados, hoteles, oficinas e industria ligera.'],
  ['Cascada economica', 'Generacion, recuperacion, merma, logistica, calidad, comprador y precio ponderado.'],
  ['Matriz evidencia-claim', 'Cada afirmacion se liga a fuente, fecha, metodo, alcance, confianza y estado humano.'],
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3B6D11]">{children}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2 font-serif text-[28px] leading-tight text-[#1C1B18] sm:text-[34px]">{children}</h2>
}

export function WalkthroughArticle() {
  return (
    <article className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="grid gap-8 border-b border-[#E8E4DC] pb-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end">
        <div>
          <SectionLabel>Metodologia ALQUIMIA RSU Gobierno</SectionLabel>
          <h1 className="mt-4 font-serif text-[40px] leading-[1.04] text-[#1C1B18] sm:text-[56px]">
            De evidencia municipal a paquete consultivo defendible.
          </h1>
        </div>
        <div className="space-y-4 text-[15px] leading-7 text-[#5C574F]">
          <p>
            ALQUIMIA no debe presentar una ciudad precargada como verdad local. La plataforma primero ordena evidencia,
            identifica brechas y despues calcula escenarios condicionados para diagnostico, planeacion y monitoreo.
          </p>
          <p className="text-[13px] leading-6 text-[#8A857C]">
            Ninguna cifra estimada se muestra como oficial. Municipio, zona metropolitana, estado y benchmark se mantienen separados.
          </p>
        </div>
      </header>

      <section className="grid gap-8 border-b border-[#E8E4DC] py-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <SectionLabel>Secuencia operativa</SectionLabel>
          <SectionTitle>El producto no empieza con numeros; empieza con trazabilidad.</SectionTitle>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {flowSteps.map(([n, title, body]) => (
            <div key={n} className="border-l border-[#D8D2C5] pl-4">
              <p className="font-mono text-[12px] text-[#3B6D11]">{n}</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1C1B18]">{title}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#6B6760]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-b border-[#E8E4DC] py-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionLabel>Regla de evidencia</SectionLabel>
          <SectionTitle>La plataforma debe decir que sabe, que infiere y que no puede afirmar.</SectionTitle>
          <p className="mt-4 text-[14px] leading-7 text-[#5C574F]">
            El objetivo es automatizar investigacion, cotejo, diagnostico y ruta de accion sin inventar una realidad municipal.
            Si falta estudio local, se conserva la brecha critica y se explica que documento o fuente falta para subir confianza.
          </p>
        </div>
        <div className="space-y-3">
          {evidenceRules.map(([title, body]) => (
            <div key={title} className="grid grid-cols-[120px_1fr] gap-4 border-t border-[#E8E4DC] pt-3 first:border-t-0 first:pt-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1C1B18]">{title}</p>
              <p className="text-[13px] leading-6 text-[#6B6760]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionLabel>Visualizacion</SectionLabel>
          <SectionTitle>La narrativa debe ser mitad texto, mitad diagramas defendibles.</SectionTitle>
          <p className="mt-4 text-[14px] leading-7 text-[#5C574F]">
            Los diagramas no son decoracion. Deben reducir carga textual y mostrar el razonamiento: de donde sale cada escenario,
            que evidencia lo soporta y que parte permanece bloqueada por falta de informacion.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {diagrams.map(([title, body]) => (
            <div key={title} className="min-h-[132px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
              <div className="h-1 w-14 bg-[#3B6D11]" />
              <p className="mt-5 text-[15px] font-semibold text-[#1C1B18]">{title}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#6B6760]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E8E4DC] pt-8">
        <p className="max-w-3xl font-serif text-[26px] leading-snug text-[#1C1B18]">
          Resultado esperado: un paquete de consultoria municipal que calcula hasta donde hay evidencia, declara limites y deja una hoja de ruta accionable para decision humana.
        </p>
      </section>
    </article>
  )
}
