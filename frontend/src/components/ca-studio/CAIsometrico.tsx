'use client'

interface Props { escala: 'P' | 'M' | 'G'; contexto: string }

export function CAIsometrico({ escala, contexto }: Props) {
  const colors = {
    organico:  '#639922',
    papel:     '#D4881E',
    plastico:  '#1A5FA8',
    vidrio:    '#1D9E75',
  }

  // SVG isométrica animada — representación geométrica del CA
  const escalaData = {
    P: { label: 'Pequeño · 250 m²', workers: 5,  machines: 2, containers: 4 },
    M: { label: 'Mediano · 750 m²', workers: 14, machines: 3, containers: 6 },
    G: { label: 'Grande · 2,000 m²', workers: 34, machines: 5, containers: 8 },
  }

  const d = escalaData[escala]

  return (
    <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] overflow-hidden">
      <div className="p-4 border-b border-[#E8E4DC] flex items-center justify-between">
        <p className="text-[12px] font-medium text-[#1C1B18]">{d.label}</p>
        <span className="text-[10px] text-[#A8A49C]">Vista isométrica · animada</span>
      </div>

      {/* Isometric SVG */}
      <svg viewBox="0 0 600 350" className="w-full" style={{ minHeight: 280 }}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F0EDE5" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Fondo */}
        <rect width="600" height="350" fill="#F8F6F1" />
        <rect width="600" height="350" fill="url(#grid)" />

        {/* Piso isométrico */}
        <g transform="translate(300, 180)">
          {/* Base del CA */}
          <IsoCube x={0} y={0} w={180} h={80} d={30} fill="#E8E4DC" top="#FDFCFA" side="#D8D4CC" />

          {/* Contenedores de materiales */}
          {[colors.organico, colors.papel, colors.plastico, colors.vidrio].slice(0, d.containers > 4 ? 4 : 4).map((color, i) => (
            <g key={i} transform={`translate(${-70 + i * 45}, -40)`}>
              <IsoCube x={0} y={0} w={35} h={35} d={20} fill={color} top={color} side={color} opacity={0.7} />
            </g>
          ))}

          {/* Banda transportadora */}
          {escala !== 'P' && (
            <g transform="translate(-60, -55)">
              <rect x={0} y={0} width={140} height={12} rx={3} fill="#6B6760" opacity={0.6} transform="skewX(-30)" />
              <rect x={2} y={2} width={136} height={8} rx={2} fill="#A8A49C" transform="skewX(-30)" />
            </g>
          )}

          {/* Prensa hidráulica */}
          <g transform="translate(70, -70)">
            <rect x={0} y={0} width={30} height={50} rx={3} fill="#8B6B4A" opacity={0.8} />
            <rect x={5} y={-15} width={20} height={20} rx={2} fill="#6B6B4A" opacity={0.9} />
          </g>

          {/* Digestor (solo G) */}
          {escala === 'G' && (
            <g transform="translate(-80, -100)">
              <ellipse cx={0} cy={0} rx={30} ry={15} fill="#639922" opacity={0.7} />
              <rect x={-15} y={-50} width={30} height={50} fill="#639922" opacity={0.7} />
              <ellipse cx={0} cy={-50} rx={30} ry={15} fill="#7ab52e" opacity={0.8} />
              {/* Burbujas biogás */}
              {[0, 1, 2].map(b => (
                <circle key={b} cx={b * 8 - 8} cy={-65 - b * 8} r={3} fill="#639922" opacity={0.5} />
              ))}
            </g>
          )}

          {/* Trabajadores (puntos animados) */}
          {Array.from({ length: Math.min(d.workers, 8) }, (_, i) => {
            const wx = -80 + (i % 4) * 40
            const wy = -20 + Math.floor(i / 4) * 20
            return (
              <g key={i} transform={`translate(${wx}, ${wy})`}>
                <circle cx={0} cy={0} r={6} fill="#1C1B18" opacity={0.7} />
                <circle cx={0} cy={-8} r={4} fill="#F0E8DC" />
              </g>
            )
          })}

          {/* Montacargas */}
          {escala !== 'P' && (
            <g transform="translate(100, -50)">
              <rect x={0} y={0} width={20} height={25} rx={2} fill="#D4881E" opacity={0.8} />
              <rect x={2} y={-15} width={16} height={15} fill="#D4881E" opacity={0.6} />
            </g>
          )}
        </g>

        {/* Label escala */}
        <text x="20" y="30" fontFamily="Inter" fontSize="11" fill="#A8A49C">
          {contexto === 'torre' ? 'Contexto: Torre residencial' :
           contexto === 'casa' ? 'Contexto: Casa habitación' :
           contexto === 'privada' ? 'Contexto: Privada residencial' :
           'Contexto: Comercial mixto'}
        </text>

        {/* Animación indicadores */}
        <g transform="translate(20, 50)">
          {['Orgánico', 'Papel', 'Plástico', 'Vidrio'].map((mat, i) => (
            <g key={mat} transform={`translate(0, ${i * 20})`}>
              <circle cx={5} cy={5} r={4} fill={Object.values(colors)[i]} />
              <text x={14} y={9} fontFamily="Inter" fontSize="10" fill="#6B6760">{mat}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

function IsoCube({ x, y, w, h, d, fill, top, side, opacity = 1 }: {
  x: number; y: number; w: number; h: number; d: number
  fill: string; top: string; side: string; opacity?: number
}) {
  // Face frontal
  const front = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
  // Face superior
  const topFace = `M ${x} ${y} L ${x + d} ${y - d} L ${x + w + d} ${y - d} L ${x + w} ${y} Z`
  // Face lateral
  const rightFace = `M ${x + w} ${y} L ${x + w + d} ${y - d} L ${x + w + d} ${y + h - d} L ${x + w} ${y + h} Z`

  return (
    <g opacity={opacity}>
      <path d={front}     fill={fill} />
      <path d={topFace}   fill={top} />
      <path d={rightFace} fill={side} />
    </g>
  )
}
