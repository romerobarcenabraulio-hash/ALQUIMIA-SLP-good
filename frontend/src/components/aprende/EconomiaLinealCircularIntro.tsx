import Image from 'next/image'

const IMG_LINEAR =
  'https://images.unsplash.com/photo-1576086213369-97b306467d91?auto=format&fit=crop&w=960&q=80'
const IMG_CIRCULAR =
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=960&q=80'

/** Diagrama esquemático — no es modelo contable ni inventario oficial. Texto institucional ALQUIMIA Aprende. */
function DiagramaEconomiaLineal() {
  const steps = ['Recursos', 'Industria', 'Consumo', 'Residuo', 'Relleno / fin']
  return (
    <svg
      viewBox="0 0 520 100"
      className="mt-5 w-full h-auto max-h-[110px]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="24" y1="50" x2="492" y2="50" stroke="#C0392B" strokeWidth="2" opacity="0.45" strokeDasharray="6 6" />
      {steps.map((label, i) => {
        const x = 32 + i * 108
        return (
          <g key={label}>
            <circle cx={x} cy="50" r="13" fill="#FDFCFA" stroke="#C0392B" strokeWidth="2" opacity="0.9" />
            <text x={x} y="54" textAnchor="middle" fontSize="10" fill="#1C1B18">
              {i + 1}
            </text>
            <text x={x} y="82" textAnchor="middle" fontSize="10" fill="#6B6760">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DiagramaEconomiaCircular() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="mt-3 mx-auto w-full max-w-[220px] h-auto max-h-[200px]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <marker id="eco-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 z" fill="#3B6D11" />
        </marker>
      </defs>
      <ellipse
        cx="100"
        cy="100"
        rx="74"
        ry="56"
        fill="none"
        stroke="#3B6D11"
        strokeWidth="2"
        opacity="0.55"
      />
      <path
        d="M 100 36 Q 164 72 154 126 Q 146 164 100 172 Q 54 166 42 126 Q 32 74 100 36"
        fill="none"
        stroke="#3B6D11"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#eco-arrow)"
        opacity="0.85"
      />
      {[0, 1, 2, 3].map((i, idx) => {
        const angles = [200, 110, 20, 290]
        const rad = ((angles[idx] ?? 0) * Math.PI) / 180
        const ox = Math.cos(rad) * 58
        const oy = Math.sin(rad) * 42
        return (
          <circle key={idx} cx={100 + ox} cy={100 + oy} r="13" fill="#FDFCFA" stroke="#3B6D11" strokeWidth="1.75" />
        )
      })}
      <text x="100" y="42" textAnchor="middle" fontSize="9" fill="#1C1B18" fontWeight="600">
        Separar bien
      </text>
      <text x="152" y="108" textAnchor="middle" fontSize="9" fill="#1C1B18" fontWeight="600">
        Reciclaje / industria
      </text>
      <text x="100" y="176" textAnchor="middle" fontSize="9" fill="#1C1B18" fontWeight="600">
        Nuevo producto
      </text>
      <text x="48" y="108" textAnchor="middle" fontSize="9" fill="#1C1B18" fontWeight="600">
        Hogar de nuevo
      </text>
    </svg>
  )
}

export function EconomiaLinealCircularIntro() {
  return (
    <div className="mb-10 space-y-6">
      <p className="text-[13px] leading-relaxed text-[#6B6760] max-w-3xl">
        Antes de seguir una cadena específica (PET, aluminio…), ayuda ubicar cómo suele comportarse nuestra ciudad hoy si
        mezclamos todo: la mayor parte del material<strong className="text-[#1C1B18]"> sale del circuito económico y se pierde como residuo.</strong>{' '}
        Una economía<strong className="text-[#1C1B18]"> más circular intenta recuperar materiales útiles antes del relleno</strong>.
      </p>

      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <article className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden shadow-[0_1px_0_rgba(28,27,24,0.04)] flex flex-col">
          <figure className="relative aspect-[16/10] bg-[#E8E4DC]">
            <Image
              src={IMG_LINEAR}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </figure>
          <figcaption className="px-4 pt-3 text-[10px] text-[#8A857C]">
            Fotografía ilustrativa: acopio o disposición de residuo (no muestra caso municipal puntual){' · '}
            <a
              className="text-[#1A5FA8] hover:underline"
              href="https://unsplash.com/photos/black-and-gray-metal-tool-on-brown-soil-q10bmprAZhc"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsplash · Tim Mossholder
            </a>
          </figcaption>
          <div className="p-5 pt-4 flex-1 flex flex-col border-t border-[#F0EDE5]">
            <h3 className="font-serif text-xl text-[#1C1B18]">Economía mayormente lineal</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
              Se extraen materiales, se fabrica, se usa y<strong className="text-[#C0392B]/90"> gran parte termina abandonada</strong>:
              menos valor, más volumen ocioso para el ayuntamiento. El diagrama es didáctico: no cuenta toneladas reales ni costos públicos locales.
            </p>
            <DiagramaEconomiaLineal />
          </div>
        </article>

        <article className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden shadow-[0_1px_0_rgba(28,27,24,0.04)] flex flex-col">
          <figure className="relative aspect-[16/10] bg-[#E8E4DC]">
            <Image
              src={IMG_CIRCULAR}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </figure>
          <figcaption className="px-4 pt-3 text-[10px] text-[#8A857C]">
            Fotografía ilustrativa: residuo acumulado (metáfora de material que debe revalorizarse){' · '}
            <a
              className="text-[#1A5FA8] hover:underline"
              href="https://unsplash.com/photos/person-driving-red-and-yellow-forklift-near-brown-cardboard-boxes-_h7aBovrrea"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsplash · Rikkard Hågren
            </a>
          </figcaption>
          <div className="p-5 pt-4 flex-1 flex flex-col border-t border-[#F0EDE5]">
            <h3 className="font-serif text-xl text-[#1C1B18]">Economía más circular</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
              El principio público conocido desde la<strong className="text-[#1C1B18]"> Ley General para la Prevención y Gestión Integral de Residuos (LGPGIR)</strong>
              obliga pensar<strong className="text-[#3B6D11]"> valorización, minimización</strong>
              {' '}y ciclo más largo de los materiales. Aquí<strong className="text-[#1C1B18]"> recuperar antes del relleno</strong>{' '}
              es ordenar mejor la mesa económico–ambiental; el esquema no es cuenta satélite oficial.
            </p>
            <DiagramaEconomiaCircular />
          </div>
        </article>
      </div>

      <div className="rounded-[12px] border border-[#DAD3C7] bg-[#F8F6F1] px-4 py-3 text-[11px] text-[#6B6760]">
        Marco normativo México: LGPGIR y normas expedidas por SEMARNAT. Las fotos sólo contextualizan; ALQUIMIA no afirma
        que ese sitio fotografiado coincida con la realidad hidráulica-operativa municipal del lector.
      </div>

      <div className="border-t border-[#E8E4DC] pt-8 mt-10">
        <p className="text-[13px] text-[#6B6760] max-w-2xl mb-8">
          Ahora elige una fracción: verás<strong className="text-[#1C1B18]"> un ejemplo típico de trayectoria</strong>
          cuando el material ya sale bien clasificado desde casa hasta un destino de transformación cercano{' '}
          <span className="text-[#8A857C]">(nombres de planta pueden variar ciudad a ciudad).</span>
        </p>
      </div>
    </div>
  )
}
