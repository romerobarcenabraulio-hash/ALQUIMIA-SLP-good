import { Conclusion } from '@/components/editorial/Conclusion'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { SectionLabel } from '@/components/editorial/SectionLabel'

type Variante = 'info' | 'legal' | 'operativo' | 'financiero' | 'ambiental'

interface ContextoModuloProps {
  titulo: string
  cuerpo: string
  puntos?: string[]
  fuente?: string
  advertencia?: string
  variante?: Variante
  className?: string
  /** `editorial` = sin caja de color (default). `card` = layout legacy con borde/fondo. */
  layout?: 'editorial' | 'card'
}

const VARIANTE_LABELS: Record<Variante, string> = {
  info: 'Contexto',
  legal: 'Marco legal',
  operativo: 'Operativo',
  financiero: 'Financiero',
  ambiental: 'Ambiental',
}

const VARIANTE_ESTILOS: Record<Variante, { border: string; bg: string; iconColor: string }> = {
  info: { border: '#E8E4DC', bg: '#F8F6F1', iconColor: '#A8A49C' },
  legal: { border: '#3B6D11', bg: '#EAF3DE', iconColor: '#3B6D11' },
  operativo: { border: '#D4881E', bg: '#FEF7E7', iconColor: '#D4881E' },
  financiero: { border: '#1A5FA8', bg: '#EBF3FB', iconColor: '#1A5FA8' },
  ambiental: { border: '#1D9E75', bg: '#E5F5EF', iconColor: '#1D9E75' },
}

function ContextoModuloCard({
  titulo,
  cuerpo,
  puntos,
  fuente,
  advertencia,
  variante,
  className,
}: ContextoModuloProps) {
  const s = VARIANTE_ESTILOS[variante ?? 'info']
  return (
    <div
      className={`rounded-[12px] border px-5 py-4 mb-5 ${className ?? ''}`}
      style={{
        borderColor: variante === 'info' ? s.border : `${s.border}40`,
        background: variante === 'info' ? s.bg : `${s.bg}40`,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: s.iconColor }}>
        {VARIANTE_LABELS[variante ?? 'info']}
      </p>
      <p className="text-[13px] font-medium text-[#1C1B18] mb-1.5">{titulo}</p>
      <p className="text-[12px] text-[#6B6760] leading-relaxed">{cuerpo}</p>
      {puntos && puntos.length > 0 && (
        <ul className="mt-3 space-y-1 list-disc pl-4 text-[11px] text-[#6B6760]">
          {puntos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {advertencia && (
        <p className="mt-3 text-[11px] text-amber-800 leading-relaxed italic">{advertencia}</p>
      )}
      {fuente && <p className="mt-3 pt-2 border-t border-[#E8E4DC] text-[10px] text-[#A8A49C]">{fuente}</p>}
    </div>
  )
}

function ContextoModuloEditorial({
  titulo,
  cuerpo,
  puntos,
  fuente,
  advertencia,
  variante = 'info',
  className = '',
}: ContextoModuloProps) {
  return (
    <section className={`mb-6 ${className}`}>
      <SectionLabel>{VARIANTE_LABELS[variante]}</SectionLabel>
      <Conclusion className="text-[18px] md:text-[20px] mb-3 mt-1">{titulo}</Conclusion>
      <p className="font-sans text-[14px] leading-[1.55] text-gray-600c max-w-[620px]">{cuerpo}</p>
      {puntos && puntos.length > 0 && (
        <ul className="mt-4 space-y-2 max-w-[620px] list-disc pl-4 font-sans text-[14px] leading-[1.55] text-gray-600c">
          {puntos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {fuente && (
        <MarginalNote prefix="Fuente" className="mt-4">
          {fuente}
        </MarginalNote>
      )}
      {advertencia && (
        <MarginalNote className="mt-2 italic">{advertencia}</MarginalNote>
      )}
    </section>
  )
}

export function ContextoModulo(props: ContextoModuloProps) {
  if (props.layout === 'card') {
    return <ContextoModuloCard {...props} />
  }
  return <ContextoModuloEditorial {...props} />
}
