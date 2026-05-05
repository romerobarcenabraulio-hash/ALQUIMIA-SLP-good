import Link from 'next/link'
import { FlujosAnimados } from '@/components/aprende/FlujosAnimados'
import { ContadorRelleno } from '@/components/aprende/ContadorRelleno'
import { FAQSection } from '@/components/aprende/FAQSection'
import LegislacionRSU from '@/components/aprende/LegislacionRSU'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AprendePage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      {/* Header simple (sin auth) */}
      <header className="bg-[#FDFCFA] border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-[18px] text-[#3B6D11] font-semibold">ALQUIMIA</span>
          <nav className="hidden sm:flex gap-4 text-[12px] text-[#6B6760]">
            <Link href="/" className="hover:text-[#3B6D11]">Inicio</Link>
            <Link href="/simulator" className="hover:text-[#3B6D11]">Simulador</Link>
            <Link href="/aprende" className="text-[#3B6D11] font-medium">Aprende</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Qué es el RSU y por qué importa */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Qué es el RSU y por qué importa</p>
          <h2 className="font-serif text-[32px] text-[#1C1B18] mb-4">¿Qué es un RSU y cómo separo?</h2>
          <p className="text-[14px] text-[#6B6760] mb-8 max-w-2xl leading-relaxed">
            RSU son los Residuos Sólidos Urbanos: todo lo que tiramos en casa, oficina o calle.
            Separarlos correctamente permite recuperar materiales valiosos en lugar de enterrarlos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                color: '#639922', bg: '#EAF3DE', nombre: 'Orgánicos',
                si: ['Cáscaras de fruta', 'Verduras', 'Restos de comida', 'Papel sucio'],
                no: ['Carne con grasas', 'Aceite', 'Medicamentos'],
              },
              {
                color: '#1A5FA8', bg: '#EBF3FB', nombre: 'Plásticos',
                si: ['Botellas PET limpias', 'Envases HDPE', 'Bolsas limpias'],
                no: ['Plásticos sucios', 'Unicel', 'Hules'],
              },
              {
                color: '#D4881E', bg: '#FEF7E7', nombre: 'Papel / Cartón',
                si: ['Cajas de cartón', 'Periódico', 'Revistas'],
                no: ['Papel encerado', 'Papel sucio', 'Papeles con pegamento'],
              },
              {
                color: '#1D9E75', bg: '#E5F5EF', nombre: 'Vidrio',
                si: ['Botellas limpias', 'Frascos', 'Envases de vidrio'],
                no: ['Espejos', 'Vidrio templado', 'Focos'],
              },
              {
                color: '#8B6B4A', bg: '#F0E8DC', nombre: 'Metales',
                si: ['Latas de aluminio', 'Latas de hojalata', 'Tapas metálicas'],
                no: ['Aerosoles', 'Baterías', 'Electrodomésticos'],
              },
              {
                color: '#A8A49C', bg: '#F8F6F1', nombre: 'Otros / Especiales',
                si: ['Pilas → punto especial', 'Medicamentos → punto especial'],
                no: ['Mezclar con basura común', 'Tirar en drenaje'],
              },
            ].map(f => (
              <div key={f.nombre} className="rounded-[14px] p-4 border" style={{ background: f.bg, borderColor: f.color + '30' }}>
                <h3 className="text-[14px] font-medium mb-3" style={{ color: f.color }}>{f.nombre}</h3>
                <div className="text-[11px]">
                  <p className="font-medium text-[#3B6D11] mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: f.color }} aria-label="cumple" strokeWidth={2} />
                    Va aquí:
                  </p>
                  {f.si.map(s => (
                    <p key={s} className="text-[#6B6760] flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5 text-[#3B6D11]" aria-label="cumple" strokeWidth={2} />
                      <span>{s}</span>
                    </p>
                  ))}
                  <p className="font-medium text-[#C0392B] mt-2 mb-1 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-[#C0392B]" aria-label="no cumple" strokeWidth={2} />
                    No va aquí:
                  </p>
                  {f.no.map(n => (
                    <p key={n} className="text-[#6B6760] flex items-start gap-1.5">
                      <XCircle className="h-3 w-3 shrink-0 mt-0.5 text-[#C0392B]" aria-label="no cumple" strokeWidth={2} />
                      <span>{n}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Qué pasa después del bote */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Qué pasa después del bote</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-4">¿Qué pasa con tu basura?</h2>
          <FlujosAnimados />
        </section>

        {/* Impacto económico y ambiental del relleno */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Impacto económico y ambiental del relleno</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-4">El costo de NO separar</h2>
          <ContadorRelleno />
        </section>

        {/* Marco normativo y cadena de reforma */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Marco normativo y cadena de reforma</p>
          <LegislacionRSU />
        </section>

        {/* Cómo orientarse en la evaluación del modelo */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Cómo orientarse en la evaluación del modelo</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-6">Preguntas frecuentes</h2>
          <FAQSection />
        </section>

      </main>

      <footer className="border-t border-[#E8E4DC] py-6 text-center text-[12px] text-[#A8A49C]">
        ALQUIMIA · Plataforma de circularidad municipal · México 2025
      </footer>
    </div>
  )
}
