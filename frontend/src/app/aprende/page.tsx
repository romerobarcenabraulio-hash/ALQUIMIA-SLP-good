import type { LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import {
  AlertCircle,
  CheckCircle,
  CircleDot,
  FileText,
  Leaf,
  Package2,
  Wine,
  XCircle,
} from 'lucide-react'
import { FlujosAnimados } from '@/components/aprende/FlujosAnimados'
import { EconomiaLinealCircularIntro } from '@/components/aprende/EconomiaLinealCircularIntro'
import { ContadorRelleno } from '@/components/aprende/ContadorRelleno'
import { FAQSection } from '@/components/aprende/FAQSection'
import LegislacionRSU from '@/components/aprende/LegislacionRSU'
import { SimulatorGatewayHint } from '@/components/simulator/SimulatorGatewayHint'

type FraccionGuia = {
  nombre: string
  accent: string
  Icon: LucideIcon
  si: string[]
  no: string[]
}

const FRACCIONES_GUIA: FraccionGuia[] = [
  {
    nombre: 'Orgánicos',
    accent: '#4A7C1C',
    Icon: Leaf,
    si: ['Cáscaras de fruta', 'Verduras', 'Restos de comida', 'Papel sucio'],
    no: ['Carne con grasas', 'Aceite', 'Medicamentos'],
  },
  {
    nombre: 'Plásticos',
    accent: '#1A5FA8',
    Icon: Package2,
    si: ['Botellas PET limpias', 'Envases HDPE', 'Bolsas limpias'],
    no: ['Plásticos sucios', 'Unicel', 'Hules'],
  },
  {
    nombre: 'Papel / cartón',
    accent: '#B8751A',
    Icon: FileText,
    si: ['Cajas de cartón', 'Periódico', 'Revistas'],
    no: ['Papel encerado', 'Papel sucio', 'Papeles con pegamento'],
  },
  {
    nombre: 'Vidrio',
    accent: '#158264',
    Icon: Wine,
    si: ['Botellas limpias', 'Frascos', 'Envases de vidrio'],
    no: ['Espejos', 'Vidrio templado', 'Focos'],
  },
  {
    nombre: 'Metales',
    accent: '#6B5344',
    Icon: CircleDot,
    si: ['Latas de aluminio', 'Latas de hojalata', 'Tapas metálicas'],
    no: ['Aerosoles', 'Baterías', 'Electrodomésticos'],
  },
  {
    nombre: 'Otros / especiales',
    accent: '#5C594F',
    Icon: AlertCircle,
    si: ['Pilas → punto especial', 'Medicamentos → punto especial'],
    no: ['Mezclar con basura común', 'Tirar en drenaje'],
  },
]

function TarjetaFraccionGuia({
  nombre,
  accent,
  Icon,
  si,
  no,
}: FraccionGuia) {
  return (
    <article className="group rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] shadow-[0_1px_0_rgba(28,27,24,0.04)] transition-shadow hover:shadow-[0_6px_24px_-12px_rgba(28,27,24,0.12)]">
      <div
        className="flex gap-4 p-4 sm:p-5 rounded-[14px] border-l-[4px]"
        style={{ borderLeftColor: accent }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E8E4DC] bg-[#F8F6F1] text-[#1C1B18] transition-colors group-hover:border-[#DAD3C7]"
          style={{ color: accent }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[18px] leading-snug text-[#1C1B18]">{nombre}</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                <CheckCircle className="h-3.5 w-3.5 text-[#3B6D11]" aria-hidden strokeWidth={2} />
                Separa aquí
              </p>
              <ul className="space-y-1.5 text-[13px] leading-snug text-[#1C1B18]">
                {si.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#3B6D11]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                <XCircle className="h-3.5 w-3.5 text-[#A63D32]" aria-hidden strokeWidth={2} />
                No mezcles aquí
              </p>
              <ul className="space-y-1.5 text-[13px] leading-snug text-[#6B6760]">
                {no.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#C0392B]/70" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function AprendePage() {
  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Qué es el RSU y por qué importa */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Qué es el RSU y por qué importa</p>
          <h2 className="font-serif text-[32px] text-[#1C1B18] mb-4">¿Qué es un RSU y cómo separo?</h2>
          <p className="text-[14px] text-[#6B6760] mb-5 max-w-2xl leading-relaxed">
            <strong className="font-medium text-[#1C1B18]">RSU</strong> son los Residuos Sólidos Urbanos: lo que generamos en casa, en la oficina o en la calle.
            Esta guía no sustituye el reglamento de tu municipio: sirve para leer rápido qué sí y qué no conviene mezclar si quieres aprovechar materiales que hoy terminan enterrados.
          </p>
          <p className="text-[12px] text-[#8A857C] mb-10 max-w-2xl leading-relaxed">
            Cada tarjeta = una fracción. Izquierda, lo que conviene llevar bien separado; derecha, lo que suele contaminar el bote y baja la calidad del reciclaje.
          </p>

          <div className="grid grid-cols-1 gap-5 md:gap-6">
            {FRACCIONES_GUIA.map(f => (
              <TarjetaFraccionGuia key={f.nombre} {...f} />
            ))}
          </div>
        </section>

        {/* Qué pasa después del bote */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Qué pasa después del bote</p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] mb-6">¿Qué pasa con tu basura?</h2>
          <EconomiaLinealCircularIntro />
          <h3 className="font-serif text-[20px] text-[#1C1B18] mb-4 mt-2">Sigue el viaje de tu fracción</h3>
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

        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Desde la guía al paquete consultivo</p>
          <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3">
            <SimulatorGatewayHint />
          </div>
        </section>

      </main>
    </AppShell>
  )
}
