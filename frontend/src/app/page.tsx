import Link from 'next/link'
import { Recycle, BarChart2, FileText, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MODULOS: Array<{
  ruta: string
  Icon: LucideIcon
  titulo: string
  desc: string
}> = [
  {
    ruta: '/simulator',
    Icon: BarChart2,
    titulo: 'Simulador interactivo',
    desc: 'Variables en tiempo real: demografía, sensibilidades, huella y lectura documental asociada.',
  },
  {
    ruta: '/ca-studio',
    Icon: Recycle,
    titulo: 'CA-Studio',
    desc: 'Diseña centros de acopio en vista isométrica y escala urbana.',
  },
  {
    ruta: '/hub',
    Icon: FileText,
    titulo: 'Hub de documentos',
    desc: 'Paquetes ÁGORA: marco legal, modelo financiero, piezas para Cabildo y ciudadanía.',
  },
  {
    ruta: '/aprende',
    Icon: Globe,
    titulo: 'Centro educativo',
    desc: 'Flujos divulgativos sin cuenta; complemento al escenario de referencia.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      <header className="bg-[#FDFCFA]/90 backdrop-blur-sm border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 min-w-0">
            <span className="font-serif text-[20px] text-[#3B6D11] font-semibold shrink-0">ALQUIMIA</span>
            <span className="text-[10px] leading-snug text-[#8C8880] max-w-[17rem]">
              Consultoría en circularidad municipal
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-[12px]">
            <Link href="/aprende" className="text-[#6B6760] hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/simulator" className="text-[#6B6760] hover:text-[#3B6D11]">Simulador</Link>
            <Link href="/hub" className="text-[#6B6760] hover:text-[#3B6D11]">Documentos</Link>
            <Link href="/login" className="btn-primary text-[12px]">Acceso institucional</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#3B6D11] mb-4">
          Plataforma de consultoría en circularidad municipal
        </p>
        <h1 className="font-serif text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.03em] text-[#1C1B18] mb-6 max-w-3xl mx-auto">
          Modela el programa de RSU de tu municipio con trazabilidad y rigor consultivo
        </h1>
        <p className="text-[16px] text-[#6B6760] mb-6 max-w-2xl mx-auto leading-relaxed">
          ALQUIMIA integra baseline, sensibilidades, documentos y narrativa institucional en un solo flujo orientado a decisiones locales.
        </p>
        <p className="text-[15px] font-medium text-[#1C1B18] mb-8 max-w-2xl mx-auto leading-snug">
          ALQUIMIA genera escenarios técnicos para análisis de factibilidad.{' '}
          No sustituye una consultoría especializada ni constituye un dictamen oficial.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          <Link
            href="/simulator"
            className="btn-primary text-[15px] px-8 py-3 text-center rounded-[10px]"
          >
            Ver escenario de referencia
          </Link>
          <Link
            href="/login"
            className="btn-secondary text-[15px] px-8 py-3 text-center rounded-[10px]"
          >
            Acceder con cuenta institucional
          </Link>
        </div>
        <details className="mt-8 max-w-2xl mx-auto text-left border border-[#E8E4DC] rounded-[12px] bg-[#FDFCFA]/90 px-4 py-3">
          <summary className="font-serif text-[15px] text-[#1C1B18] cursor-pointer list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
            <span className="text-[#3B6D11] select-none" aria-hidden>▸</span>
            Alcances y limitaciones
          </summary>
          <ul className="mt-4 space-y-3 text-[13px] text-[#6B6760] leading-relaxed list-none pl-0">
            <li className="flex gap-2">
              <span className="shrink-0 font-mono text-[#3B6D11]" aria-hidden>●</span>
              <span>
                Los <strong className="font-medium text-[#1C1B18]">números y textos en pantalla</strong> son <strong className="font-medium text-[#1C1B18]">propuestas de trabajo</strong> del simulador; no sustituyen publicación en medios oficiales ni resoluciones administrativas.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-mono text-[#3B6D11]" aria-hidden>●</span>
              <span>
                En entornos con autenticación, el sistema puede <strong className="font-medium text-[#1C1B18]">registrar accesos</strong> relevantes (por ejemplo inicio de sesión o uso del simulador) para auditoría interna y mejora del servicio, según la configuración desplegada.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-mono text-[#3B6D11]" aria-hidden>●</span>
              <span>
                Los accesos registrados y las credenciales se rigen por la política de tu instancia; ALQUIMIA no sustituye los canales oficiales de transparencia o notificación del ayuntamiento.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-mono text-[#3B6D11]" aria-hidden>●</span>
              <span>
                Si operas datos personales, aplica la normativa aplicable en tu ámbito y documenta el tratamiento conforme a tus propios lineamientos.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-mono text-[#3B6D11]" aria-hidden>●</span>
              <span>
                Consulta el aviso legal y la política de privacidad de tu instancia cuando estén publicados.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-[#A8A49C]">
            Alineado con blueprint 17.1 · publicación y control de acceso
          </p>
        </details>
        <p className="mt-6 text-[11px] text-[#A8A49C] max-w-xl mx-auto leading-relaxed">
          El escenario de referencia usa datos ilustrativos y supuestos configurables; el acceso institucional prepara sesiones trazables según la política de tu organización.
        </p>
      </section>

      <section className="border-y border-[#E8E4DC] py-12">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs uppercase tracking-widest text-[#A8A49C] mb-2 text-center">
            Referencias de contexto nacional · órdenes de magnitud
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: '120,000', u: 't/día RSU generado', s: 'fuente: SEMARNAT 2022' },
              { v: '75%',     u: 'termina en relleno', s: 'pérdida recuperable' },
              { v: '$80B',    u: 'MXN/año sin capturar', s: 'estimado commodities' },
              { v: '500K',    u: 'empleos potenciales', s: 'formalizables LATAM' },
            ].map(m => (
              <div key={m.v} className="text-center text-sm font-normal">
                <p className="font-mono text-sm text-[#3B6D11]">{m.v}</p>
                <p className="text-sm text-[#1C1B18] font-normal">{m.u}</p>
                <p className="text-sm text-[#A8A49C] mt-1 font-normal">{m.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-[28px] text-center text-[#1C1B18] mb-10">Una sola plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULOS.map(({ ruta, Icon, titulo, desc }) => (
            <Link key={ruta} href={ruta}
              className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[16px] p-6 hover:border-[#3B6D11]/30 hover:shadow-md transition-all group">
              <Icon className="w-7 h-7 text-[#3B6D11] mb-3 shrink-0" aria-hidden strokeWidth={1.75} />
              <h3 className="text-[15px] font-medium text-[#1C1B18] mb-2 group-hover:text-[#3B6D11] transition-colors">
                {titulo}
              </h3>
              <p className="text-[13px] text-[#6B6760] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#1F3B06] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-serif text-[28px] text-white mb-4">Misma propuesta consultiva, siguiente paso a tu ritmo</h2>
          <p className="text-[#EAF3DE] text-[14px] mb-8 leading-relaxed">
            Continúa con un escenario de referencia ilustrativo o coordina acceso institucional para integrar trazabilidad y validaciones en tu organización.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/simulator"
              className="bg-[#F6C84B] text-[#1C1B18] font-medium text-[15px] px-8 py-4 rounded-[10px] hover:bg-[#D4881E] hover:text-white transition-colors inline-block text-center">
              Ver escenario de referencia
            </Link>
            <Link href="/login"
              className="border border-[#EAF3DE] text-[#EAF3DE] font-medium text-[15px] px-8 py-4 rounded-[10px] hover:bg-[#EAF3DE]/10 transition-colors inline-block text-center">
              Acceso institucional
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8E4DC] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          <p className="text-[11px] text-[#A8A49C] text-center">
            Plataforma de circularidad para municipios mexicanos · consultoría y simulación
          </p>
          <nav className="flex gap-4 text-[11px] text-[#A8A49C]">
            <Link href="/aprende">Aprende</Link>
            <Link href="/simulator">Simulador</Link>
            <Link href="/hub">Hub</Link>
            <Link href="/login">Login</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
