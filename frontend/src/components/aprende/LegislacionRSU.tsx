'use client'
import { useState } from 'react'

interface NodeInfo {
  title: string
  content: string
}

const NODES: Record<string, NodeInfo> = {
  lgpgir: {
    title: 'LGPGIR — Ley General de Residuos',
    content: 'Ley General para la Prevención y Gestión Integral de los Residuos. Encarga a los municipios la prestación del servicio de limpia, pero no especifica el número de fracciones ni las condiciones de separación. Ese es el vacío que el reglamento municipal debe llenar.',
  },
  lgec: {
    title: 'LGEC — Ley de Economía Circular',
    content: 'Obliga a los municipios a aplicar criterios de circularidad en la gestión de residuos, pero no define parámetros específicos de separación ni establece sanciones para quien no separe. Es un mandato sin mecanismo.',
  },
  art4: {
    title: 'Artículo 4 Constitucional',
    content: 'Toda persona tiene derecho a un medio ambiente sano para su desarrollo y bienestar. El Estado debe garantizar ese derecho. Esto convierte la reforma reglamentaria en un acto de cumplimiento constitucional, no en una opción política.',
  },
  ley_ambiental: {
    title: 'Ley Ambiental Estatal',
    content: 'Faculta a los ayuntamientos para regular el manejo y disposición final de RSU en su territorio. Les da el margen, pero no diseña el sistema. Eso es tarea del reglamento municipal.',
  },
  ley_condominios: {
    title: 'Ley de Condominios',
    content: 'Define al administrador como responsable de los servicios comunes del edificio. No incluye obligaciones específicas de separación de residuos — ese vacío lo llena el Artículo 21 Bis del Reglamento de Aseo Público reformado.',
  },
  reglamento: {
    title: 'Reglamento de Aseo Público',
    content: 'Es EL instrumento que se reforma. Se adicionan artículos que definen las 5 fracciones de separación obligatoria, las obligaciones de los vecinos, las responsabilidades de los administradores de edificios, y el régimen de sanciones. Requiere aprobación de Cabildo y publicación en Gaceta Municipal.',
  },
  adenda: {
    title: 'Adenda al contrato de concesión',
    content: 'Hoy el concesionario de limpia cobra más por cada tonelada que entierra. Eso lo hace enemigo del reciclaje. La adenda al contrato corrige ese incentivo: el concesionario gana cuando valoriza, no cuando entierra. Sin esta corrección, el mejor reglamento del mundo no funciona.',
  },
  vecino: {
    title: 'Tú, el vecino',
    content: 'Estás obligado a separar tus residuos en 5 fracciones (orgánicos, plásticos, papel/cartón, vidrio, metales) antes de entregarlos. Si vives en condominio, los depositas en los contenedores del área común. Si no lo haces, el reglamento prevé sanciones progresivas.',
  },
  administrador: {
    title: 'El administrador del edificio',
    content: 'Instala y opera el centro de acopio del inmueble con contenedores diferenciados por fracción. Informa a los vecinos sobre los horarios y reglas. Es el primer eslabón de la cadena — si falla, todo lo demás falla.',
  },
  recolector: {
    title: 'El recolector (concesionario)',
    content: 'Opera rutas diferenciadas por material — no mezcla todo en un solo camión. Orgánicos lunes/miércoles/viernes, plásticos martes/jueves, papel lunes/miércoles, vidrio miércoles, metales jueves. El horario es preciso para minimizar tráfico y maximizar eficiencia.',
  },
  centro_acopio: {
    title: 'El centro de acopio',
    content: 'Recibe el material separado, lo pesa, lo clasifica con mayor precisión, lo compacta en pacas y lo vende a las recicladoras. Este es el punto donde tu separación se convierte en dinero real. PET a $5.50/kg, aluminio a $15.10/kg, papel a $2.50/kg, vidrio a $2.30/kg.',
  },
}

export default function LegislacionRSU() {
  const [selected, setSelected] = useState<NodeInfo | null>(null)

  const open = (key: string) => setSelected(NODES[key] ?? null)

  return (
    <section className="py-12">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginBottom: 8 }}>
        ¿Cómo funciona la ley de residuos en México?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Tres niveles de gobierno. Una cadena de facultades. Un vacío que el municipio puede — y debe — llenar.
      </p>

      <div className="relative">
        {/* SVG diagram — scrollable on mobile */}
        <div className="overflow-x-auto">
          <svg
            width="100%"
            viewBox="0 0 680 860"
            style={{ minWidth: 480 }}
            role="img"
            aria-label="Jerarquía legislativa de RSU en México"
          >
            <style>{`
              .c-blue  rect { fill: #EBF3FB; stroke: #1A5FA8; }
              .c-blue  text { fill: #1A5FA8; }
              .c-teal  rect { fill: #E5F5EF; stroke: #1D9E75; }
              .c-teal  text { fill: #1D9E75; }
              .c-amber rect { fill: #FEF7E7; stroke: #D4881E; }
              .c-amber text { fill: #D4881E; }
              .c-green rect { fill: #EAF3DE; stroke: #3B6D11; }
              .c-green text { fill: #3B6D11; }
              .node   { cursor: pointer; }
              .node:hover rect { opacity: 0.75; }
              .node rect { transition: opacity 0.15s; }
            `}</style>

            <title>La ley de residuos en México — de la Constitución a tu casa</title>
            <desc>Diagrama que muestra cómo la legislación federal habilita a los estados, los estados a los municipios, y los municipios son quienes pueden hacer exigible la separación de residuos.</desc>

            <defs>
              <marker id="arr-leg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#A8A49C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            <text fontFamily="var(--font-sans)" fontSize="12" fill="#A8A49C" x="340" y="20" textAnchor="middle">
              Toca cualquier bloque para aprender más
            </text>

            {/* ── NIVEL FEDERAL ── */}
            <g className="c-blue">
              <rect x="20" y="32" width="640" height="32" rx="6" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="340" y="48" textAnchor="middle" dominantBaseline="central">Nivel federal — El Congreso fija los principios</text>
            </g>

            <g className="node c-blue" onClick={() => open('lgpgir')}>
              <rect x="20" y="74" width="198" height="78" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="119" y="94" textAnchor="middle">LGPGIR</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="119" y="112" textAnchor="middle">Ley General de Residuos.</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="119" y="126" textAnchor="middle">Los municipios deben</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="119" y="140" textAnchor="middle">gestionar RSU. Sin detalle.</text>
            </g>

            <g className="node c-blue" onClick={() => open('lgec')}>
              <rect x="241" y="74" width="198" height="78" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="340" y="94" textAnchor="middle">LGEC</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="340" y="112" textAnchor="middle">Ley de Economía Circular.</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="340" y="126" textAnchor="middle">Obliga a aplicar criterios</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="340" y="140" textAnchor="middle">de circularidad. Sin detalle.</text>
            </g>

            <g className="node c-blue" onClick={() => open('art4')}>
              <rect x="462" y="74" width="198" height="78" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="561" y="94" textAnchor="middle">Art. 4 Constitución</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="561" y="112" textAnchor="middle">Derecho a un medio</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="561" y="126" textAnchor="middle">ambiente sano.</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="561" y="140" textAnchor="middle">El Estado lo garantiza.</text>
            </g>

            {/* Vacío federal */}
            <rect x="20" y="162" width="640" height="38" rx="6" fill="none" stroke="#C0392B" strokeWidth="0.5" strokeDasharray="3 3" />
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#C0392B" x="340" y="177" textAnchor="middle">Lo que las leyes federales NO dicen: cuántas fracciones separar, cómo deben ser los contenedores,</text>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#C0392B" x="340" y="193" textAnchor="middle">qué debe hacer el administrador de tu edificio, ni qué pasa si no separas. Ese es el vacío operativo.</text>

            <line x1="340" y1="208" x2="340" y2="226" stroke="#A8A49C" strokeWidth="1.5" markerEnd="url(#arr-leg)" />
            <text fontFamily="var(--font-sans)" fontSize="10" fill="#A8A49C" x="352" y="220">habilita</text>

            {/* ── NIVEL ESTATAL ── */}
            <g className="c-teal">
              <rect x="20" y="232" width="640" height="32" rx="6" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="340" y="248" textAnchor="middle" dominantBaseline="central">Nivel estatal — El congreso local adapta y faculta</text>
            </g>

            <g className="node c-teal" onClick={() => open('ley_ambiental')}>
              <rect x="60" y="274" width="250" height="68" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="185" y="294" textAnchor="middle">Ley Ambiental Estatal</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="185" y="312" textAnchor="middle">Faculta al municipio para regular</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="185" y="326" textAnchor="middle">el manejo de RSU en su territorio.</text>
            </g>

            <g className="node c-teal" onClick={() => open('ley_condominios')}>
              <rect x="370" y="274" width="250" height="68" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="495" y="294" textAnchor="middle">Ley de Condominios</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="495" y="312" textAnchor="middle">El administrador cuida servicios</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="495" y="326" textAnchor="middle">comunes. Sin mandato de RSU.</text>
            </g>

            <line x1="340" y1="350" x2="340" y2="368" stroke="#A8A49C" strokeWidth="1.5" markerEnd="url(#arr-leg)" />
            <text fontFamily="var(--font-sans)" fontSize="10" fill="#A8A49C" x="352" y="362">delega</text>

            {/* ── NIVEL MUNICIPAL ── */}
            <g className="c-amber">
              <rect x="20" y="374" width="640" height="32" rx="6" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="340" y="390" textAnchor="middle" dominantBaseline="central">Nivel municipal — Aquí la ley se convierte en operación real</text>
            </g>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#A8A49C" x="340" y="406" textAnchor="middle">Art. 115 CPEUM: el municipio tiene competencia exclusiva en limpia, recolección y disposición de RSU.</text>

            <g className="node c-amber" onClick={() => open('reglamento')}>
              <rect x="30" y="416" width="300" height="90" rx="8" strokeWidth="1" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="180" y="438" textAnchor="middle">Reglamento de Aseo Público</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="180" y="456" textAnchor="middle">Define fracciones, obligaciones,</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="180" y="470" textAnchor="middle">contenedores y sanciones.</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="180" y="484" textAnchor="middle">Se aprueba en Cabildo. ← LA CLAVE</text>
            </g>

            <g className="node c-amber" onClick={() => open('adenda')}>
              <rect x="350" y="416" width="300" height="90" rx="8" strokeWidth="1" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="500" y="438" textAnchor="middle">Adenda al contrato</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="500" y="456" textAnchor="middle">Corrige el incentivo del</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="500" y="470" textAnchor="middle">concesionario: gana más</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="500" y="484" textAnchor="middle">reciclando que enterrando.</text>
            </g>

            <line x1="340" y1="514" x2="340" y2="532" stroke="#A8A49C" strokeWidth="1.5" markerEnd="url(#arr-leg)" />
            <text fontFamily="var(--font-sans)" fontSize="10" fill="#A8A49C" x="352" y="526">obliga a</text>

            {/* ── NIVEL OPERATIVO ── */}
            <g className="c-green">
              <rect x="20" y="538" width="640" height="32" rx="6" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="340" y="554" textAnchor="middle" dominantBaseline="central">Nivel operativo — Lo que le toca a cada quien</text>
            </g>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#A8A49C" x="340" y="570" textAnchor="middle">Con el reglamento reformado, cada actor tiene un rol exigible — no voluntario.</text>

            <g className="node c-green" onClick={() => open('vecino')}>
              <rect x="20" y="580" width="148" height="90" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="94" y="600" textAnchor="middle">Tú, el vecino</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="94" y="618" textAnchor="middle">Separas en</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="94" y="632" textAnchor="middle">5 fracciones</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="94" y="646" textAnchor="middle">en tu hogar.</text>
            </g>

            <g className="node c-green" onClick={() => open('administrador')}>
              <rect x="178" y="580" width="148" height="90" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="252" y="600" textAnchor="middle">Administrador</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="252" y="618" textAnchor="middle">Opera el centro</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="252" y="632" textAnchor="middle">de acopio de</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="252" y="646" textAnchor="middle">tu edificio.</text>
            </g>

            <g className="node c-green" onClick={() => open('recolector')}>
              <rect x="336" y="580" width="148" height="90" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="410" y="600" textAnchor="middle">El recolector</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="410" y="618" textAnchor="middle">Rutas distintas</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="410" y="632" textAnchor="middle">por material</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="410" y="646" textAnchor="middle">y por día.</text>
            </g>

            <g className="node c-green" onClick={() => open('centro_acopio')}>
              <rect x="494" y="580" width="148" height="90" rx="8" strokeWidth="0.5" />
              <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" x="568" y="600" textAnchor="middle">Centro de acopio</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="568" y="618" textAnchor="middle">Clasifica y vende.</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="568" y="632" textAnchor="middle">Tu separación</text>
              <text fontFamily="var(--font-sans)" fontSize="11" x="568" y="646" textAnchor="middle">vale dinero aquí.</text>
            </g>

            {/* Conclusión */}
            <rect x="20" y="686" width="640" height="96" rx="10" fill="none" stroke="#3B6D11" strokeWidth="0.5" strokeDasharray="4 3" />
            <text fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" fill="#3B6D11" x="340" y="710" textAnchor="middle">La reforma es municipal — no federal, no estatal</text>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#6B6760" x="340" y="730" textAnchor="middle">Las leyes federales y estatales reconocen la economía circular pero no dicen cómo hacerla.</text>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#6B6760" x="340" y="748" textAnchor="middle">El municipio ya tiene la facultad. Solo necesita usarla: reformar su Reglamento de Aseo Público</text>
            <text fontFamily="var(--font-sans)" fontSize="11" fill="#6B6760" x="340" y="764" textAnchor="middle">y corregir el contrato con el concesionario. Eso es todo.</text>
            <text fontFamily="var(--font-sans)" fontSize="12" fontWeight="500" fill="#3B6D11" x="340" y="782" textAnchor="middle">Sin reforma reglamentaria municipal, todo lo demás son buenas intenciones.</text>
          </svg>
        </div>

        {/* Panel lateral */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-[#FDFCFA] w-full max-w-sm h-full shadow-2xl p-8 flex flex-col overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="self-end text-[#A8A49C] hover:text-[#1C1B18] mb-6 text-[20px] leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
              <h3
                className="text-[#1C1B18] mb-4"
                style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}
              >
                {selected.title}
              </h3>
              <p className="text-[14px] text-[#6B6760] leading-relaxed">
                {selected.content}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
