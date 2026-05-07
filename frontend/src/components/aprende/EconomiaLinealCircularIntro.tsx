'use client'
import Image from 'next/image'

// Fotos ilustrativas de Unsplash (licencia gratuita) — no representan sitios municipales reales.
// Lineal: residuos mezclados (basura general)
const IMG_LINEAR =
  'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=960&q=75'
// Circular: reciclaje / planta de valorización
const IMG_CIRCULAR =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=960&q=75'

function DiagramaLineal() {
  const steps = [
    { n: 1, label: 'Extraer\nmateriales' },
    { n: 2, label: 'Fabricar\nproducto' },
    { n: 3, label: 'Usar y\nconsumir' },
    { n: 4, label: 'Desechar\ncomo basura' },
    { n: 5, label: 'Relleno\nsanitario' },
  ]
  return (
    <svg
      viewBox="0 0 540 120"
      className="w-full h-auto max-h-[110px] mt-5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* línea base */}
      <line
        x1="28" y1="46" x2="512" y2="46"
        stroke="#C0392B" strokeWidth="2" strokeDasharray="7 5" opacity="0.35"
      />
      {steps.map((s, i) => {
        const cx = 28 + i * 121
        return (
          <g key={s.n}>
            {/* flecha entre nodos */}
            {i > 0 && (
              <polygon
                points={`${cx - 14},42 ${cx - 14},50 ${cx - 6},46`}
                fill="#C0392B"
                opacity="0.6"
              />
            )}
            <circle cx={cx} cy={46} r={15} fill="#FDFCFA" stroke="#C0392B" strokeWidth="2" opacity="0.9" />
            <text x={cx} y={51} textAnchor="middle" fontSize="11" fontWeight="600" fill="#C0392B">
              {s.n}
            </text>
            {s.label.split('\n').map((line, li) => (
              <text key={li} x={cx} y={78 + li * 13} textAnchor="middle" fontSize="9.5" fill="#6B6760">
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function DiagramaCircular() {
  // 4 nodos en círculo, etiquetas fuera
  const nodes = [
    { angle: 270, label: 'Separar\ncorrectamente', color: '#3B6D11' },
    { angle: 0,   label: 'Centro de\nacopio',         color: '#1A5FA8' },
    { angle: 90,  label: 'Industria\nrecicladora',    color: '#D4881E' },
    { angle: 180, label: 'Nuevo\nproducto',           color: '#1D9E75' },
  ]
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 62       // radio de la órbita de nodos
  const CX = 110, CY = 110

  return (
    <svg
      viewBox="0 0 220 220"
      className="w-full max-w-[220px] h-auto mx-auto mt-3"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <marker id="circ-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#3B6D11" opacity="0.7" />
        </marker>
      </defs>
      {/* arco de fondo */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3B6D11" strokeWidth="2" opacity="0.2" />
      {/* arco con flecha */}
      <path
        d={`M ${CX + R * Math.cos(toRad(260))} ${CY + R * Math.sin(toRad(260))}
            A ${R} ${R} 0 1 1 ${CX + R * Math.cos(toRad(250))} ${CY + R * Math.sin(toRad(250))}`}
        fill="none"
        stroke="#3B6D11"
        strokeWidth="2.5"
        opacity="0.65"
        markerEnd="url(#circ-arrow)"
      />
      {nodes.map((node) => {
        const rad = toRad(node.angle)
        const nx = CX + R * Math.cos(rad)
        const ny = CY + R * Math.sin(rad)
        // etiqueta un poco más al exterior
        const LR = R + 28
        const lx = CX + LR * Math.cos(rad)
        const ly = CY + LR * Math.sin(rad)
        return (
          <g key={node.angle}>
            <circle cx={nx} cy={ny} r={14} fill="#FDFCFA" stroke={node.color} strokeWidth="2" />
            {node.label.split('\n').map((ln, li) => (
              <text
                key={li}
                x={lx}
                y={ly + li * 11 - (node.label.split('\n').length - 1) * 5.5}
                textAnchor="middle"
                fontSize="8.5"
                fill="#1C1B18"
                fontWeight="600"
              >
                {ln}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export function EconomiaLinealCircularIntro() {
  return (
    <div className="mb-10">
      <p className="text-[13px] leading-relaxed text-[#6B6760] mb-8 max-w-3xl">
        Para entender por qué importa separar, conviene ver la diferencia entre dos modelos:{' '}
        <strong className="text-[#1C1B18]">cómo fluyen los materiales hoy</strong> y
        <strong className="text-[#3B6D11]"> cómo deberían fluir</strong> si aprovechamos bien cada fracción.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── ECONOMÍA LINEAL ── */}
        <article className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden shadow-sm flex flex-col">
          <figure className="relative aspect-[16/9] bg-[#E8E4DC]">
            <Image
              src={IMG_LINEAR}
              alt="Residuos mezclados en contenedor — ilustra el modelo lineal"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 left-4 text-white text-[11px] font-semibold tracking-wide uppercase">
              Modelo lineal (hoy)
            </span>
          </figure>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-3 h-3 rounded-full bg-[#C0392B] opacity-80" />
              <h3 className="font-serif text-[20px] text-[#1C1B18]">Extraer · Usar · Desechar</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-[#6B6760]">
              Los materiales van en una sola dirección: se extraen de la naturaleza, se fabrican
              productos, se consumen y <strong className="text-[#C0392B]">la mayor parte termina en el relleno</strong>.
              Cada tonelada enterrada pierde su valor económico y genera pasivos ambientales.
            </p>
            <DiagramaLineal />
            <p className="text-[10px] text-[#A8A49C] mt-3 leading-relaxed">
              Diagrama didáctico · no representa inventario ni costos oficiales locales.
            </p>
          </div>

          <div className="px-5 pb-4 text-[10px] text-[#A8A49C]">
            Foto ilustrativa ·{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A5FA8] hover:underline"
            >
              Unsplash
            </a>{' '}
            · licencia gratuita · no muestra un sitio municipal específico.
          </div>
        </article>

        {/* ── ECONOMÍA CIRCULAR ── */}
        <article className="rounded-[14px] border border-[#D4E8C4] bg-[#FDFCFA] overflow-hidden shadow-sm flex flex-col">
          <figure className="relative aspect-[16/9] bg-[#DAE8C8]">
            <Image
              src={IMG_CIRCULAR}
              alt="Materiales organizados para reciclaje — ilustra el modelo circular"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 left-4 text-white text-[11px] font-semibold tracking-wide uppercase">
              Modelo circular (meta)
            </span>
          </figure>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-3 h-3 rounded-full bg-[#3B6D11] opacity-80" />
              <h3 className="font-serif text-[20px] text-[#1C1B18]">Recuperar · Valorizar · Reingresar</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-[#6B6760]">
              Los materiales <strong className="text-[#3B6D11]">regresan al ciclo productivo</strong>: el PET se convierte en
              fibra, el aluminio en nueva lata, lo orgánico en composta o biogás. El relleno es el
              último recurso, no la norma. Esto reduce costo municipal y emisiones GEI.
            </p>
            <DiagramaCircular />
            <p className="text-[10px] text-[#A8A49C] mt-3 leading-relaxed">
              Diagrama didáctico · basado en principios LGPGIR y SEMARNAT.
            </p>
          </div>

          <div className="px-5 pb-4 text-[10px] text-[#A8A49C]">
            Foto ilustrativa ·{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A5FA8] hover:underline"
            >
              Unsplash
            </a>{' '}
            · licencia gratuita · no muestra un sitio municipal específico.
          </div>
        </article>
      </div>

      {/* puente hacia los flujos por material */}
      <div className="mt-8 rounded-[12px] border border-[#DAD3C7] bg-[#F4F1EC] px-5 py-4 text-[13px] text-[#6B6760] max-w-3xl">
        <strong className="text-[#1C1B18]">¿Y en la práctica?</strong> Elige una fracción abajo para ver
        un ejemplo real de cómo ese material recorre la cadena cuando se separa correctamente desde casa.
      </div>
    </div>
  )
}
