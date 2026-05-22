'use client'

import Link from 'next/link'
import { ArrowRight, Recycle, TrendingUp, BarChart2, FileText, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const COMING: Array<{ Icon: LucideIcon; label: string; desc: string }> = [
  {
    Icon: BarChart2,
    label: 'Consultoría RSU para empresas',
    desc: 'Diagnóstico de flujos de residuos generados, plan de reducción, cumplimiento NOM y huella de carbono.',
  },
  {
    Icon: Leaf,
    label: 'Doble materialidad ESG',
    desc: 'Reporte bajo GRI 306 / ESRS E5: cuantificación de impactos para inversionistas y financiadores verdes.',
  },
  {
    Icon: TrendingUp,
    label: 'Debida diligencia ambiental',
    desc: 'Análisis técnico de activos y riesgos ambientales para M&A, concesiones o financiamiento (due diligence).',
  },
  {
    Icon: FileText,
    label: 'Expedientes para licitaciones',
    desc: 'Documentación técnica, modelo financiero y propuesta de valor para licitaciones de servicios urbanos.',
  },
]

export default function PrivadosPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F4F2ED' }}>

      {/* Navbar */}
      <header className="bg-[#0E1E30] sticky top-0 z-40 border-b border-[#1A3050]">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-[6px] bg-[#1A5FA8] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[18px] text-white font-semibold tracking-tight">ALQUIMIA</span>
            <span className="hidden sm:block text-[11px] text-[#3A6090] border-l border-[#1A3050] pl-3">
              Plataforma Privados
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12px] text-[#5A90C0] hover:text-white transition-colors">
              ← Inicio
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-[6px] bg-[#1A5FA8] text-white text-[12px] font-medium hover:bg-[#2470C8] transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0E1E30] pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#3A6090] mb-4">
            ALQUIMIA para empresas y organizaciones privadas
          </p>
          <h1 className="font-serif text-[40px] sm:text-[52px] text-white leading-[1.05] max-w-3xl mx-auto mb-5">
            Consultoría técnica para el{' '}
            <span className="text-[#5B9FD8]">sector privado</span>
          </h1>
          <p className="text-[16px] text-[#5A90C0] leading-[1.7] max-w-2xl mx-auto mb-10">
            Análisis de residuos, reporte ESG, due diligence ambiental y soporte para licitaciones de
            servicios urbanos — todo en un solo lugar, con datos trazables.
          </p>

          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#132539] border border-[#1A3050] text-[#5B9FD8] text-[13px]">
            <span className="w-2 h-2 rounded-full bg-[#1A5FA8] animate-pulse" />
            Lanzamiento próximo — cupos limitados para piloto
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-5 py-14">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#A8A49C] mb-1">Lo que viene</p>
          <h2 className="font-serif text-[26px] text-[#1C1B18]">Servicios en desarrollo</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMING.map(({ Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-[14px] border border-[#E8E4DC] p-6 flex gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#E8F0FA] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#1A5FA8]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1C1B18] mb-1">{label}</h3>
                <p className="text-[12px] text-[#6B6760] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0E1E30] py-14">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#3A6090] mb-3">¿Interesado en el piloto?</p>
          <h2 className="font-serif text-[28px] text-white mb-4">Únete a la lista de espera</h2>
          <p className="text-[14px] text-[#5A90C0] leading-[1.7] mb-8">
            Estamos seleccionando empresas para el programa piloto del sector privado.
            Los primeros en acceder tendrán condiciones preferenciales.
          </p>
          <a
            href="mailto:hola@alquimia.mx?subject=Interés%20en%20ALQUIMIA%20Privados"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#1A5FA8] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#2470C8] transition-colors"
          >
            Registrar interés <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-[#2A5070] mt-4">Sin costo · respuesta en 48 h</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DC] bg-[#FDFCFA] py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-[5px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          </Link>
          <p className="text-[11px] text-[#A8A49C] text-center">
            Plataforma de consultoría integral para el sector público y privado
          </p>
          <nav className="flex gap-5 text-[11px] text-[#6B6760]">
            <Link href="/" className="hover:text-[#3B6D11]">Inicio</Link>
            <Link href="/gobierno" className="hover:text-[#3B6D11]">Gobierno</Link>
            <Link href="/aprende" className="hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/login" className="hover:text-[#3B6D11]">Iniciar sesión</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
