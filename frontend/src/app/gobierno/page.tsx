'use client'

import Link from 'next/link'
import { ArrowRight, Recycle, Heart, Bus, GraduationCap, MapPin, Lock, CheckCircle2, Building2, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

// ─── Service catalog ──────────────────────────────────────────────────────────

interface ServiceDef {
  id: string
  label: string
  tagline: string
  description: string
  scope: string[]
  status: 'active' | 'coming'
  color: string
  bgLight: string
  borderColor: string
  href?: string
  Icon: LucideIcon
}

const SERVICES: ServiceDef[] = [
  {
    id: 'rsu',
    label: 'Residuos Sólidos Urbanos',
    tagline: 'Diagnóstico, plan y modelo financiero para separación y valorización',
    description:
      'Análisis completo en 4 capítulos (Diagnóstico, Planificación, Modelo, Control): línea base RSU, ' +
      'marco legal, centros de acopio, escenarios financieros y expediente para Cabildo.',
    scope: [
      'Diagnóstico jurídico y PDF del reglamento',
      'Dimensionamiento de centros de acopio',
      'Escenarios financieros TIR/VPN',
      'Expediente ejecutivo para Cabildo',
      'Monitoreo y doble materialidad ESG',
    ],
    status: 'active',
    color: '#3B6D11',
    bgLight: '#EAF3DE',
    borderColor: '#C9DDB1',
    href: '/gobierno/rsu',
    Icon: Recycle,
  },
  {
    id: 'salud',
    label: 'Salud pública municipal',
    tagline: 'Infraestructura sanitaria, epidemiología y cobertura',
    description:
      'Diagnóstico de infraestructura de salud, análisis epidemiológico por colonia, cobertura de ' +
      'unidades médicas, planeación de inversión y reporte de indicadores para cabildo y IMSS-Bienestar.',
    scope: [
      'Mapa de cobertura de unidades médicas',
      'Índice de vulnerabilidad sanitaria',
      'Priorización de inversión en salud',
      'Indicadores OMS / OPS / Agenda 2030',
    ],
    status: 'coming',
    color: '#0284C7',
    bgLight: '#E0F2FE',
    borderColor: '#BAE6FD',
    Icon: Heart,
  },
  {
    id: 'transporte',
    label: 'Transporte público',
    tagline: 'Eficiencia de rutas, cobertura y modelo de concesión de ruta',
    description:
      'Análisis de cobertura por polígono urbano, eficiencia de rutas de transporte concesionadas, modelo tarifario ' +
      'y recomendaciones de modernización con base en datos INEGI y GPS de flota.',
    scope: [
      'Cobertura por zona vs. demanda INEGI',
      'Eficiencia operativa de rutas',
      'Modelo tarifario sostenible',
      'Plan de modernización de concesiones de ruta',
    ],
    status: 'coming',
    color: '#D4881E',
    bgLight: '#FEF7E7',
    borderColor: '#F5DCA0',
    Icon: Bus,
  },
  {
    id: 'educacion',
    label: 'Educación municipal',
    tagline: 'Infraestructura escolar, brecha educativa y programas compensatorios',
    description:
      'Mapeo de rezago educativo, estado de infraestructura escolar (INIFED), cálculo de brecha ' +
      'por nivel y zona, y propuestas de inversión con impacto social cuantificado.',
    scope: [
      'Índice de rezago educativo por AGEB',
      'Estado de infraestructura INIFED',
      'Proyección de matrícula a 10 años',
      'Costo-beneficio de programas de apoyo',
    ],
    status: 'coming',
    color: '#7C3AED',
    bgLight: '#F5EFF9',
    borderColor: '#D8C4E8',
    Icon: GraduationCap,
  },
  {
    id: 'urbano',
    label: 'Desarrollo urbano y zonificación',
    tagline: 'Plan de desarrollo, uso de suelo y gestión territorial',
    description:
      'Análisis de expansión urbana, compatibilidad de uso de suelo, riesgo por CENAPRED, ' +
      'polígonos de actuación y soporte al plan de desarrollo urbano municipal (PDUM).',
    scope: [
      'Análisis de uso de suelo y densificación',
      'Mapa de riesgo CENAPRED integrado',
      'Polígonos de actuación para inversión',
      'Soporte técnico al PDUM',
    ],
    status: 'coming',
    color: '#0D9488',
    bgLight: '#CCFBF1',
    borderColor: '#99F6E4',
    Icon: MapPin,
  },
]

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ s, onNotify }: { s: ServiceDef; onNotify: (id: string) => void }) {
  const active = s.status === 'active'

  return (
    <div
      className={[
        'relative rounded-[18px] border p-6 flex flex-col transition-all',
        active
          ? 'bg-white hover:shadow-[0_6px_24px_rgba(28,27,24,0.09)] hover:-translate-y-0.5'
          : 'bg-[#FAFAF8] opacity-80',
      ].join(' ')}
      style={{ borderColor: active ? s.borderColor : '#E8E4DC' }}
    >
      {/* Badge */}
      <div className="absolute top-4 right-4">
        {active ? (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: s.bgLight, color: s.color }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Disponible
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F0EDE5] text-[#A8A49C]">
            <Lock className="w-3 h-3" />
            Próximamente
          </span>
        )}
      </div>

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4 shrink-0"
        style={{ background: active ? s.bgLight : '#F0EDE5' }}
      >
        <s.Icon
          className="w-5 h-5"
          style={{ color: active ? s.color : '#A8A49C' }}
          strokeWidth={1.75}
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3
          className="text-[15px] font-semibold mb-1"
          style={{ color: active ? '#1C1B18' : '#6B6760' }}
        >
          {s.label}
        </h3>
        <p className="text-[12px] mb-3" style={{ color: active ? s.color : '#A8A49C' }}>
          {s.tagline}
        </p>
        <p className="text-[12px] text-[#6B6760] leading-relaxed mb-4">{s.description}</p>

        {/* Scope list */}
        <ul className="space-y-1.5 mb-5">
          {s.scope.map(item => (
            <li key={item} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
              <ChevronRight
                className="w-3 h-3 mt-0.5 shrink-0"
                style={{ color: active ? s.color : '#C8C4BC' }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      {active && s.href ? (
        <Link
          href={s.href}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:opacity-90"
          style={{ background: s.color }}
        >
          Entrar al módulo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onNotify(s.id)}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium border border-[#E8E4DC] text-[#A8A49C] hover:border-[#C8C4BC] hover:text-[#6B6760] transition-colors"
        >
          Notificarme cuando esté disponible
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GobiernoPage() {
  const [notified, setNotified] = useState<Set<string>>(new Set())

  function handleNotify(id: string) {
    setNotified(prev => new Set([...prev, id]))
  }

  return (
    <div className="min-h-screen" style={{ background: '#F4F2ED' }}>

      {/* Navbar */}
      <header className="bg-[#0F1E0A] sticky top-0 z-40 border-b border-[#1E3510]">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
                <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="font-serif text-[18px] text-white font-semibold tracking-tight">ALQUIMIA</span>
            </Link>
            <span className="hidden sm:flex items-center gap-2 text-[11px] text-[#5A8A3A] border-l border-[#1E3510] pl-3">
              <Building2 className="w-3.5 h-3.5" />
              Plataforma Gobierno
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12px] text-[#A8C898] hover:text-white transition-colors">
              ← Inicio
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-[6px] bg-[#3B6D11] text-white text-[12px] font-medium hover:bg-[#4A8A16] transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0F1E0A] pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#5A8A3A] mb-4">
            ALQUIMIA para municipios y gobiernos
          </p>
          <h1 className="font-serif text-[40px] sm:text-[52px] text-white leading-[1.05] max-w-3xl mx-auto mb-5">
            Plataforma de consultoría{' '}
            <span className="text-[#6EC247]">gubernamental integral</span>
          </h1>
          <p className="text-[16px] text-[#7AAB60] leading-[1.7] max-w-2xl mx-auto">
            Análisis técnico, legal y financiero para que los municipios tomen decisiones sobre servicios
            urbanos respaldadas por datos trazables — sin reemplazar la autoridad municipal.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-7xl mx-auto px-5 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#A8A49C] mb-1">Servicios sectoriales de consultoría</p>
            <h2 className="font-serif text-[26px] text-[#1C1B18]">Servicios disponibles para tu municipio</h2>
          </div>
          <p className="text-[12px] text-[#6B6760] max-w-xs sm:text-right">
            Cada servicio sectorial es un contrato independiente. Hoy desbloqueado: RSU.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SERVICES.map(s => (
            <div key={s.id} className="relative">
              <ServiceCard s={s} onNotify={handleNotify} />
              {notified.has(s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-[18px]">
                  <div className="text-center px-6">
                    <CheckCircle2 className="w-8 h-8 text-[#3B6D11] mx-auto mb-2" />
                    <p className="text-[13px] font-medium text-[#1C1B18]">¡Listo!</p>
                    <p className="text-[12px] text-[#6B6760]">Te avisamos en cuanto esté disponible.</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA solicitar */}
      <section id="solicitar" className="bg-[#1C2B15] py-14">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#5A8A3A] mb-3">¿Aún no tienes acceso?</p>
          <h2 className="font-serif text-[28px] text-white mb-4">Agenda una demo con tu municipio</h2>
          <p className="text-[14px] text-[#7AAB60] leading-[1.7] mb-8">
            Te mostramos el módulo RSU en 45 minutos con datos de tu municipio. Si queda claro el valor,
            coordinamos el contrato de acceso institucional.
          </p>
          <a
            href="mailto:hola@alquimia.mx?subject=Solicitud%20de%20demo%20RSU"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#3B6D11] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#4A8A16] transition-colors"
          >
            Solicitar demo <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-[#4A7030] mt-4">Sin costo · sin compromiso · respuesta en 24 h</p>
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
            Plataforma de consultoría integral para gestión pública · no sustituye actos de autoridad
          </p>
          <nav className="flex gap-5 text-[11px] text-[#6B6760]">
            <Link href="/" className="hover:text-[#3B6D11]">Inicio</Link>
            <Link href="/aprende" className="hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/privados" className="hover:text-[#3B6D11]">Privados</Link>
            <Link href="/login" className="hover:text-[#3B6D11]">Iniciar sesión</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
