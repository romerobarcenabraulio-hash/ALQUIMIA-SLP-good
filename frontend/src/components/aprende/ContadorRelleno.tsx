'use client'

const impactos = [
  ['Disposicion final', 'Costo operativo por tonelada enterrada que debe verificarse contra contrato, concesion o presupuesto municipal.'],
  ['Valor recuperable', 'Materiales con mercado potencial, siempre condicionados por calidad, merma, comprador y logistica.'],
  ['Salud publica', 'Riesgos por fauna nociva, lixiviados, quema y gestion inadecuada; requieren fuente local o comparable declarada.'],
  ['Emisiones', 'Metano y emisiones evitables pueden modelarse, pero no publicarse como dato local sin fuente y metodo.'],
]

export function ContadorRelleno() {
  return (
    <div className="border-y border-[#E8E4DC] py-6">
      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3B6D11]">Costo de no separar</p>
          <h3 className="mt-3 font-serif text-[28px] leading-tight text-[#1C1B18]">
            No se debe convertir una cifra nacional en verdad municipal.
          </h3>
          <p className="mt-4 text-[14px] leading-7 text-[#5C574F]">
            La plataforma puede modelar el costo de disposicion, valor recuperable, salud publica y emisiones, pero cada resultado debe indicar fuente, fecha, metodo, alcance y confianza. Si falta evidencia local, se muestra como brecha critica.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {impactos.map(([title, body]) => (
            <div key={title} className="border-l border-[#D8D2C5] pl-4">
              <p className="text-[13px] font-semibold text-[#1C1B18]">{title}</p>
              <p className="mt-1 text-[12px] leading-6 text-[#6B6760]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
