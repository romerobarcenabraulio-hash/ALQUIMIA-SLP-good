import { FlujosAnimados } from '@/components/aprende/FlujosAnimados'
import { ContadorRelleno } from '@/components/aprende/ContadorRelleno'
import { FAQSection } from '@/components/aprende/FAQSection'
import LegislacionRSU from '@/components/aprende/LegislacionRSU'

export default function AprendePage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      {/* Header simple (sin auth) */}
      <header className="bg-[#FDFCFA] border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-[18px] text-[#3B6D11] font-semibold">ALQUIMIA</span>
          <nav className="hidden sm:flex gap-4 text-[12px] text-[#6B6760]">
            <a href="/"        className="hover:text-[#3B6D11]">Inicio</a>
            <a href="/simulator" className="hover:text-[#3B6D11]">Simulador</a>
            <a href="/aprende"   className="text-[#3B6D11] font-medium">Aprende</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Sección 1: ¿Qué es un RSU? */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Sección 1</p>
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
                  <p className="font-medium text-[#3B6D11] mb-1">✓ Va aquí:</p>
                  {f.si.map(s => <p key={s} className="text-[#6B6760]">• {s}</p>)}
                  <p className="font-medium text-[#C0392B] mt-2 mb-1">✗ No va aquí:</p>
                  {f.no.map(n => <p key={n} className="text-[#6B6760]">• {n}</p>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección 2: ¿Qué pasa con mi basura? */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Sección 2</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-4">¿Qué pasa con tu basura?</h2>
          <FlujosAnimados />
        </section>

        {/* Sección 3: El costo de NO separar */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Sección 3</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-4">El costo de NO separar</h2>
          <ContadorRelleno />
        </section>

        {/* Sección 4: Organigrama legislativo */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Sección 4</p>
          <LegislacionRSU />
        </section>

        {/* Sección 5: FAQ */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Sección 5</p>
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
