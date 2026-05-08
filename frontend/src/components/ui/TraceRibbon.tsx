export function TraceRibbon({
  hecho,
  supuesto,
  fuente,
  formula,
  corte,
  confianza,
}: {
  hecho: string
  supuesto: string
  fuente: string
  formula: string
  corte: string
  confianza: 'alto' | 'medio' | 'bajo'
}) {
  const confLabel = confianza === 'alto' ? 'Alto' : confianza === 'medio' ? 'Medio' : 'Bajo'
  return (
    <div className="mt-3 grid gap-2 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3 text-[11px] leading-snug text-[#6B6760]">
      <p>
        <span className="font-semibold text-[#1C1B18]">Hecho verificado:</span> {hecho}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Supuesto de simulación:</span> {supuesto}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Fuente:</span> {fuente}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Fórmula (resumen):</span> {formula}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[#8A857C]">
        <span>Fecha de corte (referencia UI): {corte}</span>
        <span>Nivel de confianza: {confLabel}</span>
      </p>
    </div>
  )
}
