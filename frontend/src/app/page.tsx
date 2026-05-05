import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <header className="bg-[#FDFCFA]/90 backdrop-blur-sm border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-[20px] text-[#3B6D11] font-semibold">ALQUIMIA</span>
          <nav className="hidden sm:flex items-center gap-4 text-[12px]">
            <Link href="/aprende" className="text-[#6B6760] hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/simulator" className="text-[#6B6760] hover:text-[#3B6D11]">Simulador</Link>
            <Link href="/hub" className="text-[#6B6760] hover:text-[#3B6D11]">Documentos</Link>
            <Link href="/login" className="btn-primary text-[12px]">Iniciar sesión</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#3B6D11] mb-4">
          Plataforma de circularidad municipal
        </p>
        <h1 className="font-serif text-[52px] leading-[1.0] tracking-[-0.03em] text-[#1C1B18] mb-6 max-w-3xl mx-auto">
          Convierte los residuos de tu ciudad en un motor económico
        </h1>
        <p className="text-[16px] text-[#6B6760] mb-10 max-w-2xl mx-auto leading-relaxed">
          ALQUIMIA calcula en tiempo real el impacto de un programa de valorización de RSU:
          ingresos, empleos, CO₂e evitadas, documentos para Cabildo. Todo en una plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/simulator" className="btn-primary text-[15px] px-8 py-3">
            Comenzar simulación →
          </Link>
          <Link href="/aprende" className="btn-secondary text-[15px] px-8 py-3">
            Aprende cómo funciona
          </Link>
        </div>
      </section>

      {/* Métricas país */}
      <section className="border-y border-[#E8E4DC] py-12">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-[11px] uppercase tracking-wide text-[#A8A49C] mb-8">
            Potencial nacional del reciclaje formal en México
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: '120,000', u: 't/día RSU generado', s: 'fuente: SEMARNAT 2022' },
              { v: '75%',     u: 'termina en relleno', s: 'pérdida recuperable' },
              { v: '$80B',    u: 'MXN/año sin capturar', s: 'estimado commodities' },
              { v: '500K',    u: 'empleos potenciales', s: 'formalizables LATAM' },
            ].map(m => (
              <div key={m.v} className="text-center">
                <p className="font-mono text-[32px] text-[#3B6D11]">{m.v}</p>
                <p className="text-[13px] text-[#1C1B18]">{m.u}</p>
                <p className="text-[10px] text-[#A8A49C] mt-1">{m.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-[28px] text-center text-[#1C1B18] mb-10">Una sola plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              ruta: '/simulator',
              icon: '📊',
              titulo: 'Simulador interactivo',
              desc: '20 secciones. 19 gráficas. Variables en tiempo real. Desde demografía hasta TIR y CO₂e.',
            },
            {
              ruta: '/ca-studio',
              icon: '🏭',
              titulo: 'CA-Studio',
              desc: 'Diseña tu Centro de Acopio en vista isométrica. Configura escala y contexto urbano.',
            },
            {
              ruta: '/hub',
              icon: '📁',
              titulo: 'Hub de documentos',
              desc: 'ÁGORA genera automáticamente todos los documentos — marco legal, CFO, Cabildo, ciudadanos.',
            },
            {
              ruta: '/aprende',
              icon: '🌱',
              titulo: 'Centro educativo',
              desc: 'Sin login. Flujos animados, contador en tiempo real, FAQ. Para ciudadanos y funcionarios.',
            },
          ].map(m => (
            <Link key={m.ruta} href={m.ruta}
              className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[16px] p-6 hover:border-[#3B6D11]/30 hover:shadow-md transition-all group">
              <span className="text-[28px] mb-3 block">{m.icon}</span>
              <h3 className="text-[15px] font-medium text-[#1C1B18] mb-2 group-hover:text-[#3B6D11] transition-colors">
                {m.titulo}
              </h3>
              <p className="text-[13px] text-[#6B6760] leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#1F3B06] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-serif text-[32px] text-white mb-4">¿Listo para transformar tu ciudad?</h2>
          <p className="text-[#EAF3DE] text-[14px] mb-8">
            Configura tu ZM, define el horizonte, ajusta el mix de CAs.
            En minutos tienes los números. En horas, el plan completo.
          </p>
          <Link href="/simulator"
            className="bg-[#F6C84B] text-[#1C1B18] font-medium text-[15px] px-8 py-4 rounded-[10px] hover:bg-[#D4881E] hover:text-white transition-colors inline-block">
            Comenzar simulación gratuita →
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E8E4DC] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          <p className="text-[11px] text-[#A8A49C] text-center">
            Plataforma de circularidad para municipios mexicanos · 2025
          </p>
          <nav className="flex gap-4 text-[11px] text-[#A8A49C]">
            <Link href="/aprende">Aprende</Link>
            <Link href="/simulator">Simulador</Link>
            <Link href="/hub">Hub</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
