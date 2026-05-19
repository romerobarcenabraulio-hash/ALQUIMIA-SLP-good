'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Briefcase, HeartHandshake, Landmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { Audience } from '@/types'
import { cn } from '@/lib/utils'
import {
  aplicarSustitucionesTerritorio,
  getEtiquetaNarrativaCiudad,
} from '@/lib/municipioMadurezContexto'

type AudienceCard = {
  id: Audience
  icon: LucideIcon
  kicker: string
  title: string
  promise: string
  modules: string[]
  cta: string
  accentColor: string
  bgColor: string
  available: boolean
}

const CARDS: AudienceCard[] = [
  {
    id: 'functionary',
    icon: Landmark,
    kicker: 'Funcionario público',
    title: '¿Cómo planeo el cambio con datos reales?',
    promise: 'Sala de mando institucional: vivienda INEGI, generación ajustable, operación PER, reglamento municipal, comparador de escenarios y exportables para Cabildo.',
    modules: ['Marco legal y diagnóstico jurídico', 'Infraestructura, PER y bitácora', 'Escenarios, derrama y paquete de salida'],
    cta: 'Entrar como funcionario',
    accentColor: '#1A5FA8',
    bgColor: '#EBF3FB',
    available: true,
  },
  {
    id: 'citizen',
    icon: HeartHandshake,
    kicker: 'Ciudadano',
    title: '¿Qué pasa con lo que tiro?',
    promise: 'Entiende cuánto genera tu vivienda, qué se puede separar y por qué una bolsa mezclada termina costando dinero, salud y espacio en el relleno.',
    modules: ['Diagnóstico RSU de tu ciudad', 'Composición de residuos y vivienda', 'Huella ambiental y multiplicadores'],
    cta: 'Entrar como ciudadano',
    accentColor: '#3B6D11',
    bgColor: '#EAF3DE',
    available: false,
  },
  {
    id: 'entrepreneur',
    icon: Briefcase,
    kicker: 'Empresario',
    title: '¿Cuál es mi retorno sobre la inversión?',
    promise: 'Lee el modelo como una hoja de viabilidad: CAPEX, TIR, Monte Carlo, sensibilidad de precios y trazabilidad de mercado — con narrativa de consultoría senior.',
    modules: ['Perfil de organización y macrogeneradores', 'Trazabilidad de mercado y precolocación', 'ROI, Monte Carlo y paquete ejecutivo'],
    cta: 'Entrar como empresario',
    accentColor: '#8B6B4A',
    bgColor: '#F5EDE3',
    available: false,
  },
]

export function AudienceGateway() {
  const setAudience        = useSimulatorStore(s => s.setAudience)
  const zmActiva           = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos  = useSimulatorStore(s => s.municipiosActivos)
  const [submitting, setSubmitting] = useState<Audience | null>(null)
  const [hovered, setHovered]       = useState<Audience | null>(null)

  const citizenModules = useMemo(() => {
    const etiqueta = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    return [
      aplicarSustitucionesTerritorio('Diagnóstico RSU de tu ciudad', etiqueta),
      'Composición de residuos y vivienda',
      'Huella ambiental y multiplicadores',
    ]
  }, [municipiosActivos, zmActiva])

  async function handleSelect(audience: Audience) {
    if (submitting) return
    setSubmitting(audience)
    try {
      await setAudience(audience)
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]" style={{ background: '#F4F2ED' }}>
      {/* Hero */}
      <div className="bg-[#1C2B15] px-6 py-10 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6A9A50] mb-3 font-medium">
          ALQUIMIA · Selecciona tu perfil
        </p>
        <h1 className="font-serif text-[32px] sm:text-[40px] text-white leading-[1.05] mb-4 max-w-2xl">
          Elige desde dónde quieres<br className="hidden sm:block" /> leer el problema
        </h1>
        <p className="text-[14px] text-[#7AAB60] leading-[1.7] max-w-2xl">
          La misma ciudad se entiende distinto si eres habitante, funcionario o empresa.
          ALQUIMIA adapta módulos, supuestos y lenguaje para que cada decisión tenga datos, fuentes y límites claros.
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid gap-4 md:grid-cols-3 max-w-5xl">
          {CARDS.map(card => {
            const Icon       = card.icon
            const isLoading  = submitting === card.id
            const isHovered  = hovered === card.id && card.available
            const modulesList = card.id === 'citizen' ? citizenModules : card.modules

            return (
              <article
                key={card.id}
                onMouseEnter={() => card.available && setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'flex flex-col rounded-[16px] border bg-white transition-all duration-200 overflow-hidden',
                  card.available
                    ? isHovered
                      ? 'border-[#3B6D11]/30 shadow-[0_8px_32px_-8px_rgba(28,27,24,0.15)]'
                      : 'border-[#E8E4DC] shadow-[0_2px_8px_rgba(28,27,24,0.05)]'
                    : 'border-[#E8E4DC] opacity-55',
                )}
              >
                {/* Top accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: card.available ? card.accentColor : '#E8E4DC' }}
                />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + kicker */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                      style={{ background: card.available ? card.bgColor : '#F4F2ED' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.available ? card.accentColor : '#C8C4BC' }} strokeWidth={1.75} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: card.available ? card.accentColor : '#A8A49C' }}
                      >
                        {card.kicker}
                      </span>
                      {!card.available && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#F4F2ED] border border-[#E0DCD6] text-[9px] font-semibold uppercase tracking-[0.08em] text-[#A8A49C]">
                          Próximamente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="font-serif text-[22px] text-[#1C1B18] leading-snug mb-3">
                    {card.title}
                  </h2>

                  {/* Promise */}
                  <p className="text-[12px] text-[#6B6760] leading-[1.65] mb-5 flex-1">
                    {card.promise}
                  </p>

                  {/* Modules list */}
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold mb-2">Incluye</p>
                    <ul className="space-y-1.5">
                      {modulesList.map(m => (
                        <li key={m} className="flex items-start gap-2 text-[11px] text-[#4A4642]">
                          <span
                            className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: card.accentColor }}
                            aria-hidden
                          />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => card.available && void handleSelect(card.id)}
                    disabled={!card.available || Boolean(submitting)}
                    className={cn(
                      'w-full inline-flex items-center justify-between gap-2 rounded-[10px] px-5 py-3 text-[13px] font-medium transition-all',
                      !card.available
                        ? 'bg-[#F4F2ED] text-[#A8A49C] cursor-not-allowed border border-[#E8E4DC]'
                        : isLoading
                          ? 'opacity-70 cursor-wait'
                          : 'hover:opacity-90',
                      card.available && submitting && !isLoading ? 'opacity-40 cursor-not-allowed' : '',
                    )}
                    style={card.available ? { background: card.accentColor, color: '#fff' } : undefined}
                  >
                    <span>{!card.available ? 'Próximamente' : isLoading ? 'Cargando journey…' : card.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* Footnote */}
        <p className="mt-8 text-[11px] text-[#A8A49C] max-w-xl">
          Tu selección se guarda localmente y puedes cambiarla desde el encabezado del simulador en cualquier momento.
          Escenarios generados como propuesta técnica — no constituyen dictamen oficial.
        </p>
      </div>
    </div>
  )
}
