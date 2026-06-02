'use client'
import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSICIÓN RSU — FIJA (Bootstrap §2.1 / Modelo_BASED.xlsx)
// ─────────────────────────────────────────────────────────────────────────────
const COMP = {
  organico:  0.45,
  papel:     0.20,
  plastico:  0.15,  // PET 50% + HDPE 50% dentro de este
  vidrio:    0.05,
  metales:   0.05,  // Aluminio 70% dentro de este
  otros:     0.10,
}
const PCT_PET_DE_PLASTICO    = 0.50
const PCT_ALUMINIO_DE_METAL  = 0.70

// PRECIOS MXN/kg — base documental; la plataforma pondera supuestos por escenario.
const PRECIO = {
  organico:  1.00,
  papel:     2.50,
  pet:       5.50,
  hdpe:      8.50,
  vidrio:    2.30,
  aluminio:  15.10,
  otros_met: 5.00,
}

// COSTOS DE REFERENCIA (Bootstrap §3.2 + §2.8)
const COSTO_DISPOSICION_POR_TON = 320   // MXN/ton — disposición final relleno sanitario
const SALUD_POR_HAB_ANUAL       = 145   // MXN/hab/año — OMS-OPS LATAM
const FACTOR_CH4_M3_POR_KG      = 0.234 // m³ CH4 / kg materia orgánica (Bootstrap §0)
const DENSIDAD_CH4_TON_POR_M3   = 0.0007168
const GWP_CH4                   = 27    // tCO₂e / t CH4 — IPCC AR6
// Factores emisión virgen (IPCC / EPA) — tCO₂e por ton producida
const EF_VIRGEN = { pet: 2.5, papel: 0.9, aluminio: 9.0, vidrio: 0.6 }

// ─────────────────────────────────────────────────────────────────────────────
// CIUDADES
// ─────────────────────────────────────────────────────────────────────────────
interface Ciudad {
  id:           string
  nombre:       string
  nombreCorto:  string
  gentilicio:   string
  estado:       string
  poblacion:    number
  kgPersonaDia: number   // generación per cápita base SEMARNAT DBGIR 2022
  tonDiarias:   number
  tonAnuales:   number
}

const CIUDADES: Ciudad[] = [
  { id: 'slp',            nombre: 'Zona Metropolitana de San Luis Potosí', nombreCorto: 'ZM San Luis Potosí', gentilicio: 'potosinos',           estado: 'San Luis Potosí', poblacion: 1_096_000, kgPersonaDia: 1.69, tonDiarias: 1_850,  tonAnuales: 675_250   },
  { id: 'queretaro',      nombre: 'Zona Metropolitana de Querétaro',        nombreCorto: 'ZM Querétaro',        gentilicio: 'queretanos',           estado: 'Querétaro',       poblacion: 1_049_000, kgPersonaDia: 1.10, tonDiarias: 1_154,  tonAnuales: 421_210   },
  { id: 'zacatecas',      nombre: 'Municipio de Zacatecas',                 nombreCorto: 'Zacatecas',           gentilicio: 'zacatecanos',          estado: 'Zacatecas',       poblacion:   160_000, kgPersonaDia: 0.95, tonDiarias:   152,  tonAnuales:  55_480   },
  { id: 'aguascalientes', nombre: 'Zona Metropolitana de Aguascalientes',   nombreCorto: 'ZM Aguascalientes',   gentilicio: 'aguascalentenses',     estado: 'Aguascalientes',  poblacion: 1_015_000, kgPersonaDia: 1.00, tonDiarias: 1_015,  tonAnuales: 370_475   },
  { id: 'guadalajara',    nombre: 'Zona Metropolitana de Guadalajara',      nombreCorto: 'ZM Guadalajara',      gentilicio: 'tapatíos',             estado: 'Jalisco',         poblacion: 5_268_000, kgPersonaDia: 1.22, tonDiarias: 6_427,  tonAnuales: 2_345_855 },
  { id: 'monterrey',      nombre: 'Zona Metropolitana de Monterrey',        nombreCorto: 'ZM Monterrey',        gentilicio: 'regiomontanos',        estado: 'Nuevo León',      poblacion: 5_341_000, kgPersonaDia: 1.30, tonDiarias: 6_943,  tonAnuales: 2_534_195 },
]

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULOS — toda la aritmética del artículo en un lugar
// ─────────────────────────────────────────────────────────────────────────────
function calcular(c: Ciudad) {
  const kg = c.kgPersonaDia

  // Kilogramos por fracción al día
  const org  = kg * COMP.organico
  const pap  = kg * COMP.papel
  const plas = kg * COMP.plastico
  const vid  = kg * COMP.vidrio
  const met  = kg * COMP.metales
  const pet  = plas * PCT_PET_DE_PLASTICO
  const hdpe = plas * (1 - PCT_PET_DE_PLASTICO)
  const alum = met  * PCT_ALUMINIO_DE_METAL
  const omet = met  * (1 - PCT_ALUMINIO_DE_METAL)

  // Valor MXN por persona al día (precio mercado × kg)
  const vOrg  = org  * PRECIO.organico
  const vPap  = pap  * PRECIO.papel
  const vPet  = pet  * PRECIO.pet
  const vHdpe = hdpe * PRECIO.hdpe
  const vVid  = vid  * PRECIO.vidrio
  const vAlum = alum * PRECIO.aluminio
  const vOmet = omet * PRECIO.otros_met
  const vDia  = vOrg + vPap + vPet + vHdpe + vVid + vAlum + vOmet
  const vMes  = vDia * 30
  const vAnio = vDia * 365
  const vCiudadAnio = (vDia * c.poblacion * 365) / 1_000_000  // millones MXN/año

  // Costo para el municipio — disposición final
  const tonPersonaAnio     = kg * 365 / 1000
  const costoMunicipioPersonaAnio = tonPersonaAnio * COSTO_DISPOSICION_POR_TON
  const costoMunicipioCiudadAnioM = (c.tonAnuales * COSTO_DISPOSICION_POR_TON) / 1_000_000

  // CO₂e por persona al año
  // Orgánicos → metano en relleno
  const co2eOrg   = org * 365 * FACTOR_CH4_M3_POR_KG * DENSIDAD_CH4_TON_POR_M3 * GWP_CH4 * 1000  // kg CO₂e
  // Materiales reciclables — emisiones evitadas si se reciclan (producción virgen vs reciclada)
  const co2ePet   = pet  * 365 * EF_VIRGEN.pet   // kg CO₂e (si se reciclara, se evitaría esto)
  const co2ePap   = pap  * 365 * EF_VIRGEN.papel
  const co2eAlum  = alum * 365 * EF_VIRGEN.aluminio
  const co2eVid   = vid  * 365 * EF_VIRGEN.vidrio
  const co2eTotal = (co2eOrg + co2ePet + co2ePap + co2eAlum + co2eVid) / 1000  // tCO₂e

  // Salud
  const saludPersonaAnio = SALUD_POR_HAB_ANUAL
  const saludCiudadAnioM = (c.poblacion * SALUD_POR_HAB_ANUAL) / 1_000_000

  return {
    // composición
    org, pap, plas, vid, met, pet, hdpe, alum, omet,
    // valor
    vOrg, vPap, vPet, vHdpe, vVid, vAlum, vOmet,
    vDia, vMes, vAnio, vCiudadAnio,
    // costo municipal
    tonPersonaAnio, costoMunicipioPersonaAnio, costoMunicipioCiudadAnioM,
    // emisiones
    co2eOrg, co2ePet, co2ePap, co2eAlum, co2eVid, co2eTotal,
    // salud
    saludPersonaAnio, saludCiudadAnioM,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de formato
// ─────────────────────────────────────────────────────────────────────────────
const $  = (n: number, dec = 0) => n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const $M = (n: number) => n >= 1000 ? `$${$(n / 1000, 1)}B` : `$${$(n)}M`

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.12em] text-[#3B6D11] font-medium mb-2 mt-10">
      {children}
    </p>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[26px] leading-[1.15] text-[#1C1B18] mb-4">
      {children}
    </h2>
  )
}

function Fuente({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-[#A8A49C] leading-relaxed mt-3 flex items-start gap-1.5">
      <Info className="w-3 h-3 shrink-0 mt-0.5 text-[#A8A49C]" />
      <span>{children}</span>
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Selector de ciudad
// ─────────────────────────────────────────────────────────────────────────────
function CiudadSelector({ ciudad, onChange }: { ciudad: Ciudad; onChange: (c: Ciudad) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative mb-8 inline-block">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#A8A49C] mb-2">Selecciona tu municipio</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-2.5 text-[13px] font-medium text-[#1C1B18] shadow-sm hover:border-[#3B6D11] transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-[#3B6D11] shrink-0" />
        {ciudad.nombreCorto}
        <ChevronDown className={`w-3.5 h-3.5 text-[#A8A49C] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-[12px] border border-[#E8E4DC] bg-white shadow-lg overflow-hidden">
          {CIUDADES.map(c => (
            <button key={c.id} onClick={() => { onChange(c); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-[13px] flex items-center gap-3 transition-colors ${c.id === ciudad.id ? 'bg-[#EAF3DE] text-[#3B6D11] font-medium' : 'text-[#1C1B18] hover:bg-[#F8F6F1]'}`}
            >
              <span className="flex-1">{c.nombreCorto}</span>
              <span className="text-[11px] text-[#A8A49C]">{c.estado}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabla de materiales con valor por persona
// ─────────────────────────────────────────────────────────────────────────────
function TablaValorMaterial({ r, kg }: { r: ReturnType<typeof calcular>; kg: number }) {
  const filas = [
    { mat: 'Orgánicos / composta', pct: 45, kgD: r.org,  precio: PRECIO.organico,  valD: r.vOrg,  color: '#639922', nota: 'Compostaje y biogás' },
    { mat: 'Papel y cartón',       pct: 20, kgD: r.pap,  precio: PRECIO.papel,     valD: r.vPap,  color: '#D4881E', nota: 'Precio en punto de venta recicladora' },
    { mat: 'PET',                  pct:  8, kgD: r.pet,  precio: PRECIO.pet,       valD: r.vPet,  color: '#1A5FA8', nota: '50% de la fracción plástico' },
    { mat: 'HDPE y otros plásticos', pct: 8, kgD: r.hdpe, precio: PRECIO.hdpe,    valD: r.vHdpe, color: '#4A8CC8', nota: '50% restante de plásticos' },
    { mat: 'Vidrio',               pct:  5, kgD: r.vid,  precio: PRECIO.vidrio,    valD: r.vVid,  color: '#1D9E75', nota: 'Precio Vitro / Owens Illinois regional' },
    { mat: 'Aluminio',             pct:  4, kgD: r.alum, precio: PRECIO.aluminio,  valD: r.vAlum, color: '#8B6B4A', nota: '70% de la fracción metales' },
  ]
  return (
    <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden mt-5">
      <div className="grid grid-cols-[1fr_60px_60px_70px_90px] gap-0 text-[10px] uppercase tracking-widest text-[#A8A49C] px-5 py-2.5 border-b border-[#F0EDE5] bg-[#F8F6F1]">
        <span>Fracción</span>
        <span className="text-right">% RSU</span>
        <span className="text-right">kg/día</span>
        <span className="text-right">$/kg</span>
        <span className="text-right">Valor/día</span>
      </div>
      {filas.map(f => (
        <div key={f.mat} className="grid grid-cols-[1fr_60px_60px_70px_90px] gap-0 px-5 py-2.5 border-b border-[#F0EDE5] last:border-0 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
            <div>
              <p className="text-[12px] text-[#1C1B18]">{f.mat}</p>
              <p className="text-[10px] text-[#A8A49C]">{f.nota}</p>
            </div>
          </div>
          <p className="text-right font-mono text-[12px] text-[#6B6760]">{f.pct}%</p>
          <p className="text-right font-mono text-[12px] text-[#6B6760]">{f.kgD.toFixed(2)}</p>
          <p className="text-right font-mono text-[12px] text-[#6B6760]">${f.precio.toFixed(2)}</p>
          <p className="text-right font-mono text-[12px] text-[#1C1B18] font-medium">${f.valD.toFixed(2)}</p>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_60px_60px_70px_90px] px-5 py-3 bg-[#F0EDE5] border-t border-[#E8E4DC]">
        <p className="text-[12px] font-medium text-[#1C1B18]">Total valorizable</p>
        <p className="text-right font-mono text-[12px] text-[#6B6760]">90%</p>
        <p className="text-right font-mono text-[12px] text-[#6B6760]">{(kg * 0.90).toFixed(2)}</p>
        <p className="text-right font-mono text-[12px] text-[#6B6760]">—</p>
        <p className="text-right font-mono text-[13px] text-[#3B6D11] font-semibold">${(r.vDia).toFixed(2)}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Barra comparativa (número grande + contexto)
// ─────────────────────────────────────────────────────────────────────────────
function MetricBar({ valor, label, sublabel, color = '#3B6D11' }: { valor: string; label: string; sublabel: string; color?: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-4">
      <p className="font-mono text-[28px] leading-none mb-1" style={{ color }}>{valor}</p>
      <p className="text-[13px] font-medium text-[#1C1B18] mb-1">{label}</p>
      <p className="text-[11px] text-[#6B6760] leading-relaxed">{sublabel}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTÍCULO PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function WalkthroughArticle() {
  const [ciudad, setCiudad] = useState<Ciudad>(CIUDADES[0]!)
  const r = calcular(ciudad)
  const { nombre, nombreCorto, gentilicio, poblacion, kgPersonaDia, tonDiarias, tonAnuales } = ciudad

  return (
    <article className="max-w-2xl">

      {/* Kicker superior + selector */}
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#3B6D11] mb-5 font-medium">
        Programa municipal de separación en cinco fracciones — Análisis técnico ALQUIMIA
      </p>
      <CiudadSelector ciudad={ciudad} onChange={setCiudad} />

      {/* ════════════════════════════════════════════════════════════
          TITULAR PRINCIPAL
      ════════════════════════════════════════════════════════════ */}
      <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.07] tracking-[-0.025em] text-[#1C1B18] mb-7">
        {nombre} genera {$(tonDiarias)} toneladas diarias de residuos sólidos urbanos.
        Hoy, la totalidad se destina a disposición final.
      </h1>

      <p className="text-[16px] text-[#6B6760] leading-[1.7] mb-10">
        Eso representa entre <strong className="text-[#1C1B18]">${$(Math.round(r.vCiudadAnio * 0.9))}
        y ${$(Math.round(r.vCiudadAnio * 1.05))} millones de pesos al año</strong> en valor
        económico recuperable que se entierra sin generar un solo ingreso al municipio,
        a los {gentilicio} ni a la cadena productiva. Esta página explica de dónde viene ese
        número, quién lo genera y qué significa para ti específicamente.
      </p>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 1 — QUIÉNES GENERAN
      ════════════════════════════════════════════════════════════ */}
      <Kicker>01 — Quiénes generan los residuos</Kicker>
      <H2>Los RSU no los genera &ldquo;la ciudad&rdquo;. Los generamos tú y yo.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        El término <em>residuos sólidos urbanos</em> (RSU) es la definición legal de
        todo lo que desechamos en el contexto de la vida cotidiana: lo que tiras en
        tu casa, en tu trabajo, en el restaurante donde comes, en la tienda donde compras.
        La ley mexicana —específicamente el artículo 5, fracción XXXIII de la{' '}
        <strong className="text-[#1C1B18]">LGPGIR</strong>— los define como
        los residuos que provienen de actividades domésticas o de la vía pública y que
        son responsabilidad directa del municipio gestionar.
      </p>
      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-4">
        En {nombreCorto}, la generación proviene principalmente de:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { pct: '~70%', label: 'Viviendas',         sub: 'Casas, dptos, residencias' },
          { pct: '~15%', label: 'Comercios',          sub: 'Tiendas, mercados, restaurantes' },
          { pct: '~10%', label: 'Instituciones',      sub: 'Oficinas, escuelas, hospitales' },
          { pct: '~5%',  label: 'Espacios públicos',  sub: 'Parques, calles, vía pública' },
        ].map(x => (
          <div key={x.label} className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-3 text-center">
            <p className="font-mono text-[20px] text-[#3B6D11] leading-none mb-1">{x.pct}</p>
            <p className="text-[12px] font-medium text-[#1C1B18]">{x.label}</p>
            <p className="text-[10px] text-[#A8A49C] leading-tight mt-0.5">{x.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-2">
        Este análisis se enfoca en la generación domiciliaria, que es la que puede
        transformarse con un programa de separación obligatoria y es la de mayor
        impacto político y operativo para el municipio.
      </p>
      <Fuente>Distribución por fuente: SEMARNAT, Informe de la Situación del Medio Ambiente en México 2022, Capítulo RSU.</Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 2 — CUÁNTO GENERA UNA PERSONA + VALOR
      ════════════════════════════════════════════════════════════ */}
      <Kicker>02 — Cuánto genera una persona y cuánto vale</Kicker>
      <H2>Tú generas {kgPersonaDia.toFixed(2)} kg al día. Eso tiene precio.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-4">
        Según la base de datos de generación y composición de residuos del{' '}
        <strong className="text-[#1C1B18]">SEMARNAT (DBGIR 2022)</strong>, una persona
        en {nombreCorto} genera en promedio{' '}
        <strong className="text-[#1C1B18]">{kgPersonaDia.toFixed(2)} kg de basura al día</strong>.
        Eso equivale a {(kgPersonaDia * 365).toFixed(0)} kg al año —casi{' '}
        {(kgPersonaDia * 365 / 70).toFixed(1)} veces tu propio peso.
      </p>
      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        Multiplicado por las {$(poblacion)} personas que habitamos {nombreCorto},
        el resultado son <strong className="text-[#1C1B18]">{$(tonDiarias)} toneladas diarias
        y {$(tonAnuales)} toneladas al año</strong>. Toda esa basura tiene composición conocida
        —no es un secreto— y cada fracción tiene un precio en el mercado de reciclaje.
        La tabla de abajo muestra cuánto vale lo que tiras tú, personalmente, en un día.
      </p>

      <TablaValorMaterial r={r} kg={kgPersonaDia} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <MetricBar valor={`$${r.vDia.toFixed(2)}`}  label="MXN al día por persona"  sublabel="Valor de mercado de tu basura diaria si se separa correctamente" />
        <MetricBar valor={`$${$(Math.round(r.vMes))}`} label="MXN al mes por persona" sublabel="A precio de recicladora, sin costo de transporte descontado" />
        <MetricBar valor={`$${$(Math.round(r.vAnio))}`} label="MXN al año por persona" sublabel="Lo que cada habitante representa como oportunidad económica" />
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mt-5 mb-2">
        Los precios de la tabla son precios base de compra en recicladora, no precios al
        consumidor. El PET a $5.50/kg es el precio al que PetStar y centros de acopio en
        México pueden comprar material limpio y separado bajo ciertas condiciones. El aluminio a
        $15.10/kg es una referencia conservadora y el papel a $2.50/kg depende de calidad y comprador.
        <strong className="text-[#1C1B18]">Estos precios son supuestos documentales editables del escenario</strong>;
        requieren cotización local antes de usarse como presupuesto o convenio.
      </p>
      <Fuente>
        Precios base: matriz de trazabilidad documental y cotizaciones integradas cuando existan.
        Composición RSU: estudio local o fuente pública trazable; si falta, se marca brecha crítica y no se declara como verdad municipal.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 3 — COSTO PARA EL MUNICIPIO
      ════════════════════════════════════════════════════════════ */}
      <Kicker>03 — Cuánto le cuestas al municipio</Kicker>
      <H2>Cada persona que no separa le cuesta ${$(Math.round(r.costoMunicipioPersonaAnio))} al año al erario.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-4">
        El municipio —o más precisamente la empresa concesionaria que contrata— cobra
        alrededor de <strong className="text-[#1C1B18]">$320 MXN por tonelada</strong> de residuo
        que lleva a disposición final. Ese es el costo promedio de operación del relleno
        sanitario en México para ciudades de porte medio, según datos de la SEMARNAT y
        contratos de concesión públicos. Ahora bien:
      </p>

      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-5 my-5 font-mono text-[13px] text-[#6B6760] space-y-2">
        <p><span className="text-[#1C1B18]">{kgPersonaDia.toFixed(2)} kg/día</span> × 365 días = <span className="text-[#1C1B18]">{(kgPersonaDia * 365).toFixed(1)} kg/año</span> por persona</p>
        <p><span className="text-[#1C1B18]">{(kgPersonaDia * 365 / 1000).toFixed(3)} ton/año</span> × $320 MXN/ton = <span className="text-[#3B6D11] font-semibold">${(r.costoMunicipioPersonaAnio).toFixed(2)} MXN/año por persona</span></p>
        <div className="border-t border-[#E8E4DC] pt-2 mt-2">
          <p>{$(tonAnuales)} ton/año (ciudad) × $320 = <span className="text-[#C0392B] font-semibold">${$(Math.round(r.costoMunicipioCiudadAnioM))} millones MXN/año</span> en disposición final</p>
        </div>
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-4">
        Ese costo se paga con el presupuesto municipal —con los impuestos de todos— y
        no genera ningún retorno. El residuo simplemente desaparece bajo tierra.
        Un programa de separación puede redirigir entre el 35% y el 40% de ese volumen
        a cadenas de reciclaje, <strong className="text-[#1C1B18]">convirtiendo un gasto
        en un ingreso</strong>. El ahorro en disposición final solo por desviar esa fracción
        representa <strong className="text-[#1C1B18]">${$(Math.round(r.costoMunicipioCiudadAnioM * 0.37))}
        millones de pesos al año</strong> que el municipio dejaría de pagar.
      </p>
      <Fuente>
        Costo de disposición final $320 MXN/ton: referencia SEMARNAT, contratos de concesión públicos y
        ALQUIMIA Bootstrap §3.2. El rango nacional es $240–$480/ton según capacidad del relleno y
        distancia de acarreo; $320 es el valor conservador para ciudad media de entre 500K–2M hab.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 4 — SALUD Y EMISIONES
      ════════════════════════════════════════════════════════════ */}
      <Kicker>04 — Tu huella invisible: salud y emisiones</Kicker>
      <H2>Lo que no separas contamina el aire que respiras y tiene precio en salud pública.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        La basura no &ldquo;desaparece&rdquo; en el relleno. Los residuos orgánicos sin gestionar
        generan <strong className="text-[#1C1B18]">metano (CH₄)</strong>, un gas de efecto invernadero
        con un potencial de calentamiento <strong className="text-[#1C1B18]">27 veces mayor que el CO₂
        en 100 años</strong> (IPCC AR6, 2021). Los residuos sin separar atraen fauna nociva,
        generan lixiviados que contaminan mantos freáticos y producen partículas PM2.5
        cuando se queman a cielo abierto —práctica aún común en México.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-[12px] border border-[#F0E8DC] bg-[#FEF7E7] px-5 py-4">
          <p className="font-mono text-[26px] text-[#D4881E] leading-none mb-1">
            {r.co2eTotal.toFixed(2)} tCO₂e
          </p>
          <p className="text-[13px] font-medium text-[#1C1B18] mb-1">por persona al año</p>
          <p className="text-[11px] text-[#6B6760] leading-relaxed">
            Si tu basura no se separa: metano del orgánico enterrado
            + emisiones de producción virgen de materiales que podrían reciclarse.
          </p>
        </div>
        <div className="rounded-[12px] border border-[#FBEAEA] bg-[#FFF5F5] px-5 py-4">
          <p className="font-mono text-[26px] text-[#C0392B] leading-none mb-1">
            ${$(r.saludPersonaAnio)} MXN
          </p>
          <p className="text-[13px] font-medium text-[#1C1B18] mb-1">costo en salud pública por habitante/año</p>
          <p className="text-[11px] text-[#6B6760] leading-relaxed">
            Estimado OMS-OPS para LATAM: infecciones respiratorias, dengue, afecciones
            gastrointestinales atribuibles a gestión inadecuada de RSU.
          </p>
        </div>
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-3">
        Cómo calculamos las emisiones por persona: tomamos los{' '}
        <strong className="text-[#1C1B18]">{r.org.toFixed(3)} kg de materia orgánica</strong>{' '}
        que generas al día, multiplicamos por 365 días, aplicamos el factor de generación de
        metano en relleno sanitario (0.234 m³ CH₄/kg orgánico, SEMARNAT), convertimos a
        toneladas de CH₄ y multiplicamos por el GWP del metano (27 tCO₂e/t CH₄, IPCC AR6).
        A eso se suman las emisiones evitables si recicláramos los materiales inorgánicos
        —cuánto CO₂e se emite al producir PET, papel, aluminio y vidrio virgen en lugar
        de reciclado.
      </p>
      <Fuente>
        CO₂e orgánicos: factor CH₄ 0.234 m³/kg (SEMARNAT), densidad CH₄ 0.0007168 ton/m³, GWP₁₀₀ = 27 (IPCC AR6 2021).
        CO₂e reciclables: factores de emisión virgen — PET 2.5, papel 0.9, aluminio 9.0, vidrio 0.6 tCO₂e/ton (EPA/IPCC).
        Costo salud: $145 MXN/hab/año — OMS-OPS LATAM, multiplicador §2.8 Bootstrap ALQUIMIA.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 5 — LO QUE VALE AL DÍA EN LA CIUDAD
      ════════════════════════════════════════════════════════════ */}
      <Kicker>05 — Cuánto valor hay en la basura de {nombreCorto} cada día</Kicker>
      <H2>${$(Math.round(r.vCiudadAnio / 365 * 1_000_000))} MXN al día. Enterrados.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        Si multiplicamos el valor diario por persona (${r.vDia.toFixed(2)}) por la
        población ({$(poblacion)} habitantes), el valor económico que {nombreCorto}
        entierra cada día es de{' '}
        <strong className="text-[#1C1B18]">${$(Math.round(r.vCiudadAnio / 365 * 1_000_000))} MXN</strong>.
        Al año, eso se convierte en{' '}
        <strong className="text-[#1C1B18]">${$M(Math.round(r.vCiudadAnio))} de pesos</strong>{' '}
        en materiales que industrias como PetStar, IPSL (papel), Vitro (vidrio)
        y fundidoras de aluminio ya compran y pagan a precio de mercado.
        Lo que falta no es el comprador. Lo que falta es que el material llegue separado.
      </p>

      <div className="rounded-[14px] border-l-4 border-[#3B6D11] pl-5 py-2 my-6">
        <p className="font-serif text-[21px] text-[#1C1B18] leading-[1.4] italic">
          &ldquo;El problema no es que no haya mercado para el reciclaje. El problema
          es que la cadena no empieza: nadie separa desde casa.&rdquo;
        </p>
      </div>

      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-5 my-5 font-mono text-[12px] text-[#6B6760] space-y-1.5">
        <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-3">Desglose de valor ciudad-año (precio base)</p>
        {[
          { mat: 'Orgánicos',    ton: tonAnuales * COMP.organico,               precio: PRECIO.organico,  color: '#639922' },
          { mat: 'Papel/cartón', ton: tonAnuales * COMP.papel,                  precio: PRECIO.papel,     color: '#D4881E' },
          { mat: 'PET',          ton: tonAnuales * COMP.plastico * 0.5,          precio: PRECIO.pet,       color: '#1A5FA8' },
          { mat: 'HDPE',         ton: tonAnuales * COMP.plastico * 0.5,          precio: PRECIO.hdpe,      color: '#4A8CC8' },
          { mat: 'Vidrio',       ton: tonAnuales * COMP.vidrio,                  precio: PRECIO.vidrio,    color: '#1D9E75' },
          { mat: 'Aluminio',     ton: tonAnuales * COMP.metales * 0.7,           precio: PRECIO.aluminio,  color: '#8B6B4A' },
        ].map(f => {
          const val = (f.ton * f.precio) / 1_000_000
          return (
            <div key={f.mat} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: f.color }} />
              <span className="w-28 text-[#1C1B18]">{f.mat}</span>
              <span className="w-28 text-right">{$(Math.round(f.ton))} ton/año</span>
              <span className="w-16 text-right">${f.precio.toFixed(2)}/kg</span>
              <span className="text-right text-[#3B6D11] font-medium ml-auto">${val < 100 ? val.toFixed(1) : $(Math.round(val))}M</span>
            </div>
          )
        })}
        <div className="border-t border-[#E8E4DC] pt-2 mt-2 flex justify-between">
          <span className="text-[#1C1B18] font-medium">Total anual recuperable</span>
          <span className="text-[#3B6D11] font-semibold">${$M(Math.round(r.vCiudadAnio))}</span>
        </div>
      </div>
      <Fuente>
        Composición fija del modelo (Bootstrap §2.1). Cálculo: ton/año × % fracción × precio base MXN/kg.
        Los precios varían; el paquete consultivo usa mezcla ponderada por fuente, fecha, calidad, merma y logística.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 6 — LA LEY
      ════════════════════════════════════════════════════════════ */}
      <Kicker>06 — El marco legal: dos vías de acción concreta</Kicker>
      <H2>La ley federal ya existe. Lo que falta es que el reglamento municipal la aterrice.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        La <strong className="text-[#1C1B18]">Ley General para la Prevención y Gestión
        Integral de los Residuos (LGPGIR)</strong> obliga a los municipios a gestionar los
        RSU de manera sustentable e incluir la separación en origen. Tres artículos
        son el núcleo de esa obligación:
      </p>

      <div className="space-y-2 mb-6">
        {[
          { art: 'Art. 10', texto: 'Los municipios son responsables de la prestación del servicio de manejo integral de RSU, incluyendo la separación en origen.' },
          { art: 'Art. 18', texto: 'Los RSU deberán separarse en al menos dos corrientes (orgánicos e inorgánicos); los programas municipales pueden ampliar a más fracciones.' },
          { art: 'Art. 36', texto: 'Los generadores deberán manejar sus residuos conforme a los programas municipales. El ayuntamiento puede exigir cumplimiento y establecer sanciones.' },
        ].map(a => (
          <div key={a.art} className="flex gap-4 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-3.5">
            <span className="font-mono text-[11px] text-[#3B6D11] font-medium shrink-0 mt-0.5 w-16">{a.art}</span>
            <p className="text-[13px] text-[#6B6760] leading-relaxed">{a.texto}</p>
          </div>
        ))}
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        El problema no es la LGPGIR. El problema es que en la mayoría de los municipios,
        el <strong className="text-[#1C1B18]">Reglamento Municipal de Aseo Público</strong> —el
        instrumento local que operacionaliza la ley federal— no contempla la separación
        diferenciada, no nombra las cinco fracciones, no define los términos técnicos y no
        tiene una escalera de sanciones aplicable. Sin reforma a ese reglamento, la LGPGIR
        no puede ejecutarse localmente.
      </p>

      {/* ── VÍA 1: Reforma reglamentaria ──────────────────────────── */}
      <div className="rounded-[14px] border border-[#3B6D11]/25 bg-[#EAF3DE]/30 px-5 py-5 mb-5">
        <p className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-3">
          Vía 1 · Reforma al Reglamento Municipal de Aseo Público
        </p>
        <p className="text-[14px] text-[#1C1B18] font-medium mb-3">
          En el Reglamento de Aseo Público de {nombreCorto} se propone modificar y adiendar los siguientes artículos:
        </p>

        {/* Artículos a modificar */}
        <div className="space-y-2 mb-4">
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-2">Artículos que se modifican</p>
          {[
            { art: 'Art. 3',  accion: 'Reforma', desc: 'Definiciones generales — se amplía para incluir los nuevos términos operativos (fracción recuperable, generador, recolección diferenciada, punto de acopio, rechazo de impurezas).' },
            { art: 'Art. 8',  accion: 'Reforma', desc: 'Obligaciones del generador — se añade la obligación explícita de separar en cinco fracciones previo a la puesta en acera.' },
            { art: 'Art. 15', accion: 'Reforma', desc: 'Modalidades de recolección — se incorpora la recolección diferenciada con días y rutas distintas por fracción.' },
            { art: 'Art. 35', accion: 'Reforma', desc: 'Infracciones y sanciones — se agrega la sanción por mezcla de residuos en tres niveles: aviso, multa menor y multa mayor, expresadas en UMAs.' },
          ].map(a => (
            <div key={a.art} className="flex gap-3 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3">
              <div className="shrink-0 text-right w-16">
                <p className="font-mono text-[11px] text-[#3B6D11] font-medium">{a.art}</p>
                <span className="text-[9px] uppercase tracking-wider text-[#D4881E] font-medium">{a.accion}</span>
              </div>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Artículos Bis nuevos */}
        <div className="space-y-2 mb-4">
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-2">Artículos nuevos (adendos)</p>
          {[
            { art: 'Art. 8 Bis',  desc: 'Separación obligatoria en cinco fracciones — define orgánicos, papel/cartón, plásticos, vidrio y metales como las cinco corrientes mínimas de separación para todo generador domiciliario, comercial e institucional.' },
            { art: 'Art. 15 Bis', desc: 'Centros de Acopio Municipal — establece la facultad del municipio para operar, concesionar o autorizar centros de acopio diferenciado como infraestructura de servicio público.' },
            { art: 'Art. 27 Bis', desc: 'Certificación de Circularidad — el municipio puede otorgar el certificado "Edificio Circular" o "Residencial Circular" a inmuebles que superen la auditoría de separación e infraestructura establecida en este reglamento.' },
          ].map(a => (
            <div key={a.art} className="flex gap-3 rounded-[10px] border border-[#3B6D11]/20 bg-[#EAF3DE]/20 px-4 py-3">
              <div className="shrink-0 text-right w-16">
                <p className="font-mono text-[11px] text-[#3B6D11] font-medium">{a.art}</p>
                <span className="text-[9px] uppercase tracking-wider text-[#3B6D11] font-medium">Nuevo</span>
              </div>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Glosario */}
        <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-2">Anexo normativo: Glosario de Circularidad Municipal</p>
          <p className="text-[12px] text-[#6B6760] leading-relaxed mb-2">
            Se añade al reglamento un glosario que define los términos base que hacen operable la reforma.
            Sin él, los artículos reformados no pueden ejecutarse porque las palabras clave no tienen
            definición jurídica local. Los términos mínimos son:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {['RSU','Fracción recuperable','Separación en origen','Recolección diferenciada','Punto de acopio','Generador domiciliario','Rechazo por impureza','Concesionario de limpia','Circularidad municipal'].map(t => (
              <span key={t} className="text-[10px] text-[#3B6D11] bg-[#EAF3DE] rounded-full px-2 py-0.5 text-center">{t}</span>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#A8A49C] mt-3 leading-relaxed">
          Los números de artículo son los más comunes en reglamentos de aseo público de ciudades medianas en México.
          ALQUIMIA adapta la numeración exacta al reglamento vigente del municipio seleccionado.
        </p>
      </div>

      {/* ── VÍA 2: Certificación de Circularidad ──────────────────── */}
      <div className="rounded-[14px] border border-[#1A5FA8]/25 bg-[#EBF3FB]/30 px-5 py-5 mb-5">
        <p className="text-[11px] uppercase tracking-widest text-[#1A5FA8] font-medium mb-3">
          Vía 2 · Certificación de Circularidad — Cédula de Idoneidad
        </p>
        <p className="text-[14px] text-[#1C1B18] font-medium mb-3">
          Una segunda vía de acción que no requiere esperar la aprobación del Cabildo.
        </p>
        <p className="text-[13px] text-[#6B6760] leading-relaxed mb-4">
          Mientras la reforma reglamentaria avanza —proceso que puede tomar de 3 a 9 meses—,
          los edificios, condominios, privadas y desarrollos residenciales pueden adoptar la
          separación de manera voluntaria y obtener la{' '}
          <strong className="text-[#1C1B18]">Cédula de Idoneidad ALQUIMIA</strong>, el
          certificado que acredita que ese inmueble cumple con los estándares de infraestructura,
          capacitación y operación para la separación en cinco fracciones.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {[
            {
              tipo: 'Edificios y condominios',
              icono: '🏢',
              items: [
                'Auditoría de infraestructura (contenedores, chutes, zonas de acopio)',
                'Revisión del programa de separación por piso',
                'Evaluación de capacitación a residentes',
                'Verificación de convenio con recicladora o CA',
              ],
            },
            {
              tipo: 'Residencial y privadas',
              icono: '🏘️',
              items: [
                'Auditoría de infraestructura en área común',
                'Revisión del programa de recolección interna',
                'Evaluación de adopción por hogar (muestra)',
                'Verificación de contrato de recolección diferenciada',
              ],
            },
          ].map(cert => (
            <div key={cert.tipo} className="rounded-[10px] border border-[#1A5FA8]/20 bg-[#FDFCFA] px-4 py-3">
              <p className="text-[13px] font-medium text-[#1C1B18] mb-2">{cert.icono} {cert.tipo}</p>
              <ul className="space-y-1">
                {cert.items.map(it => (
                  <li key={it} className="flex items-start gap-2 text-[11px] text-[#6B6760] leading-relaxed">
                    <span className="text-[#1A5FA8] shrink-0 mt-0.5">·</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-[#6B6760] leading-relaxed">
          El certificado no es oficial hasta que el municipio lo incorpore en su reglamento
          (Art. 27 Bis propuesto). En fase piloto, la Cédula es un instrumento técnico
          de ALQUIMIA que acredita el cumplimiento de estándares operativos y sirve como
          antecedente formal para la Vía 1. Es también el vehículo comercial principal:
          cada auditoría genera el documento de cédula que el inmueble puede usar para
          comunicar su compromiso circular ante el municipio, sus vecinos y sus operadores.
        </p>
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-2">
        Las dos vías se complementan. La Vía 2 (certificación) crea masa crítica de
        inmuebles funcionando antes de que la Vía 1 (reforma) obligue a todos.
        Cuando la reforma llega, la mayoría ya está operando. La curva de adopción
        ya no parte de cero.
      </p>
      <Fuente>
        LGPGIR: D.O.F. 08-10-2003, última reforma D.O.F. 22-05-2015. Arts. 10, 18 y 36 condensados con fidelidad al texto.
        Numeración de artículos reglamentarios: referencia promedio para ciudades medias; ALQUIMIA adapta al reglamento vigente del municipio.
        Cédula de Idoneidad: instrumento técnico ALQUIMIA — CEDULA_IDONEIDAD_EDIFICIOS_Vfinal y CEDULA_IDONEIDAD_RESIDENCIAL_Vfinal.
        No sustituye dictamen jurídico ni acto de autoridad municipal.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          BLOQUE 7 — QUÉ ES ALQUIMIA
      ════════════════════════════════════════════════════════════ */}
      <Kicker>07 — Qué es ALQUIMIA y para qué sirve exactamente</Kicker>
      <H2>Una plataforma técnica para convertir la voluntad política en un expediente ejecutable.</H2>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-5">
        ALQUIMIA es el instrumento técnico que diseña, simula y documenta un programa
        municipal de separación obligatoria en cinco fracciones adaptado a{' '}
        <strong className="text-[#1C1B18]">tu reglamento vigente, tu demografía y tu
        concesionario actual</strong>. No es software genérico ni un modelo académico:
        cada cálculo está anclado a datos reales de tu ciudad y cada número tiene
        una fuente verificable.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          { n: '01', titulo: 'Motor financiero', desc: 'Modela ingresos, CAPEX, OPEX, TIR, VPN y payback por escenarios cerrados y trazables.' },
          { n: '02', titulo: 'Marco legal y reforma', desc: 'Diagnóstico del reglamento vigente, brechas con la LGPGIR e iniciativa de reforma lista para Cabildo.' },
          { n: '03', titulo: 'Plan de implementación', desc: 'Gantt por fases, mix P/M/G de centros de acopio, rutas diferenciadas y KPIs operativos por fase.' },
          { n: '04', titulo: 'Documentos para Cabildo', desc: 'Reporte ejecutivo, presentación, modelo CFO y adenda al contrato de concesión. Generados en minutos.' },
        ].map(m => (
          <div key={m.n} className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-4">
            <p className="font-mono text-[11px] text-[#3B6D11] mb-2">{m.n}</p>
            <p className="text-[14px] font-medium text-[#1C1B18] mb-1">{m.titulo}</p>
            <p className="text-[12px] text-[#6B6760] leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[15px] text-[#6B6760] leading-[1.7] mb-2">
        El proceso es: seleccionas tu municipio, integras documentos y fuentes, la plataforma coteja evidencia,
        calcula escenarios cerrados y genera el paquete técnico preliminar. Un director de servicios públicos
        o un regidor puede revisar brechas, supuestos y matriz de evidencia antes de decidir qué se presenta a Cabildo.
      </p>
      <Fuente>
        ALQUIMIA integra datos de INEGI API, SEMARNAT DBGIR, Serper (precios spot) y Banxico (tipo de cambio).
        Cada variable relevante debe mostrar fuente, fecha, método, alcance territorial, confianza y estado humano.
      </Fuente>

      {/* ════════════════════════════════════════════════════════════
          RESUMEN DE OPORTUNIDAD
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-7 border-y border-[#E8E4DC] my-8">
        <MetricBar
          valor={$M(Math.round(r.vCiudadAnio))}
          label="MXN/año de valor recuperable"
          sublabel={`En ${nombreCorto}. Materiales que el mercado ya compra.`}
        />
        <MetricBar
          valor={`${$(Math.round(r.co2eTotal * poblacion / 1000))} K`}
          label="tCO₂e evitables al año"
          sublabel="Con separación en 5 fracciones (metano + producción virgen)."
          color="#D4881E"
        />
        <MetricBar
          valor={`$${$M(Math.round(r.saludCiudadAnioM))}`}
          label="en ahorro salud pública/año"
          sublabel="OMS-OPS: costos hospitalarios IRA, dengue y enfermedades atribuibles."
          color="#C0392B"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════
          NOTA METODOLÓGICA
      ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#F8F6F1] px-5 py-5 mt-2">
        <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-3 flex items-center gap-2">
          <Info className="w-3 h-3" /> Nota metodológica y fuentes
        </p>
        <div className="text-[11px] text-[#6B6760] leading-relaxed space-y-2">
          <p><strong className="text-[#1C1B18]">Generación per cápita:</strong> SEMARNAT, Base de Datos de Generación y Composición de Residuos (DBGIR) 2022. Para ciudades no en DBGIR, se usa el rango SEMARNAT por estrato de ciudad (megalópolis, grande, media, pequeña).</p>
          <p><strong className="text-[#1C1B18]">Composición RSU:</strong> estudio local cuando exista; si falta, la plataforma muestra brecha crítica y puede conservar un supuesto interno no oficial para planeación.</p>
          <p><strong className="text-[#1C1B18]">Precios de reciclaje:</strong> precios ponderados por escenario con fuente, fecha, calidad, merma, logística y comprador probable. No son cotización local ni precio oficial.</p>
          <p><strong className="text-[#1C1B18]">Costo disposición final:</strong> referencia editable por tonelada enterrada — debe sustituirse por contrato, concesión o cotización municipal cuando exista. No es presupuesto oficial.</p>
          <p><strong className="text-[#1C1B18]">Emisiones CO₂e:</strong> Factor CH₄ 0.234 m³/kg (SEMARNAT), GWP₁₀₀ = 27 (IPCC AR6 2021). Factores de emisión virgen: EPA/IPCC por material.</p>
          <p><strong className="text-[#1C1B18]">Costo salud pública:</strong> $145 MXN/hab/año — multiplicador OMS-OPS LATAM para gestión inadecuada RSU (Bootstrap §2.8).</p>
          <p className="border-t border-[#E8E4DC] pt-2 mt-2 text-[#A8A49C]">
            Todos los valores son estimaciones para uso técnico de planeación. No constituyen dictamen oficial ni sustituyen la validación de la autoridad competente. ALQUIMIA es una herramienta de análisis y preparación, no de resolución administrativa.
          </p>
        </div>
      </div>

    </article>
  )
}
