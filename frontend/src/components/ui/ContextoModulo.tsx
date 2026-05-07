import { Info, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// ContextoModulo — bloque editorial reutilizable para explicar/justificar/aclarar
// lo que está sucediendo en cada módulo del simulador.
//
// Uso mínimo:
//   <ContextoModulo
//     titulo="¿Qué modela esta sección?"
//     cuerpo="Aquí ajustas la tasa de captura por año..."
//   />
//
// Uso completo con fuente, advertencia y lista de puntos clave:
//   <ContextoModulo
//     titulo="..."
//     cuerpo="..."
//     puntos={['Punto A', 'Punto B']}
//     fuente="SEMARNAT DBGIR 2022"
//     advertencia="Los valores son estimados..."
//     variante="info" | "legal" | "operativo" | "financiero" | "ambiental"
//   />
// ─────────────────────────────────────────────────────────────────────────────

type Variante = 'info' | 'legal' | 'operativo' | 'financiero' | 'ambiental'

interface ContextoModuloProps {
  titulo:       string
  cuerpo:       string
  puntos?:      string[]
  fuente?:      string
  advertencia?: string
  variante?:    Variante
  className?:   string
}

const VARIANTE_ESTILOS: Record<Variante, { border: string; bg: string; iconColor: string; label: string }> = {
  info:       { border: '#E8E4DC',       bg: '#F8F6F1',   iconColor: '#A8A49C', label: 'Contexto'      },
  legal:      { border: '#3B6D11',       bg: '#EAF3DE',   iconColor: '#3B6D11', label: 'Marco legal'   },
  operativo:  { border: '#D4881E',       bg: '#FEF7E7',   iconColor: '#D4881E', label: 'Operativo'     },
  financiero: { border: '#1A5FA8',       bg: '#EBF3FB',   iconColor: '#1A5FA8', label: 'Financiero'    },
  ambiental:  { border: '#1D9E75',       bg: '#E5F5EF',   iconColor: '#1D9E75', label: 'Ambiental'     },
}

export function ContextoModulo({
  titulo, cuerpo, puntos, fuente, advertencia,
  variante = 'info', className = '',
}: ContextoModuloProps) {
  const s = VARIANTE_ESTILOS[variante]

  return (
    <div
      className={`rounded-[12px] border px-5 py-4 mb-5 ${className}`}
      style={{ borderColor: s.border + (variante === 'info' ? '' : '40'), background: s.bg + (variante === 'info' ? '' : '40') }}
    >
      {/* Kicker de variante */}
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3 h-3 shrink-0" style={{ color: s.iconColor }} />
        <span
          className="text-[9px] uppercase tracking-[0.12em] font-semibold"
          style={{ color: s.iconColor }}
        >
          {s.label}
        </span>
      </div>

      {/* Título */}
      <p className="text-[13px] font-medium text-[#1C1B18] mb-1.5">{titulo}</p>

      {/* Cuerpo */}
      <p className="text-[12px] text-[#6B6760] leading-relaxed">{cuerpo}</p>

      {/* Puntos clave */}
      {puntos && puntos.length > 0 && (
        <ul className="mt-3 space-y-1">
          {puntos.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
              <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: s.iconColor }} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Advertencia */}
      {advertencia && (
        <div className="flex items-start gap-2 mt-3 rounded-[8px] border border-[#D4881E]/30 bg-[#FEF7E7] px-3 py-2">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-[#D4881E]" />
          <p className="text-[11px] text-[#8A4F08] leading-relaxed">{advertencia}</p>
        </div>
      )}

      {/* Fuente */}
      {fuente && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#E8E4DC]">
          <BookOpen className="w-3 h-3 shrink-0 text-[#A8A49C]" />
          <p className="text-[10px] text-[#A8A49C] leading-relaxed">{fuente}</p>
        </div>
      )}
    </div>
  )
}
