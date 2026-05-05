'use client'

/**
 * Fase 22.0 — Gateway de Identidad obligatorio.
 *
 * Tres audiencias, una sola entrada. Sin selección, el simulador no carga
 * ningún módulo. Persiste la elección en el store (zustand) y mapea a un
 * PortalEntry backend sin tocar el contrato actual.
 */

import { useState } from 'react'
import { ArrowRight, Briefcase, HeartHandshake, Landmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { Audience } from '@/types'
import { cn } from '@/lib/utils'

type AudienceCard = {
  id: Audience
  icon: LucideIcon
  kicker: string
  title: string
  promise: string
  modules: string[]
  cta: string
}

const CARDS: AudienceCard[] = [
  {
    id: 'citizen',
    icon: HeartHandshake,
    kicker: 'Ciudadano · Educación',
    title: '¿Por qué es mi problema?',
    promise: 'Convierte la generación de tu colonia en evidencia accionable: cuánto generas, qué pierde el municipio y cómo tu separación cambia la huella ambiental.',
    modules: ['Baseline RSU de tu ciudad', 'Composición y vivienda', 'Huella ambiental personal'],
    cta: 'Continuar como ciudadano',
  },
  {
    id: 'functionary',
    icon: Landmark,
    kicker: 'Funcionario público · Decisión',
    title: '¿Cómo planeo el cambio?',
    promise: 'Entra a la sala de mando institucional: marco legal y cumplimiento, logística PER, mapas de implementación y comparador de escenarios con trazabilidad municipal vigente.',
    modules: ['Marco legal y diagnóstico', 'PER y advertencias educativas', 'Comparador de escenarios y exportables'],
    cta: 'Continuar como funcionario',
  },
  {
    id: 'entrepreneur',
    icon: Briefcase,
    kicker: 'Empresario · Negocio',
    title: '¿Cuál es mi retorno?',
    promise: 'Lee el modelo financiero como una hoja de viabilidad: ROI, Monte Carlo, sensibilidad y trazabilidad de mercado — todo con narrativa de consultoría senior.',
    modules: ['Perfil de organización y macrogeneradores', 'Trazabilidad de mercado y precolocación', 'ROI, Monte Carlo y sensibilidad'],
    cta: 'Continuar como empresario',
  },
]

export function AudienceGateway() {
  const setAudience = useSimulatorStore(s => s.setAudience)
  const [submitting, setSubmitting] = useState<Audience | null>(null)

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
    <section
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="audience-gateway-title"
    >
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#A8A49C]">
          ALQUIMIA · Identifica tu rol
        </p>
        <h1
          id="audience-gateway-title"
          className="mt-3 font-serif text-[34px] leading-tight text-[#1C1B18] sm:text-[42px]"
        >
          Antes de simular, dinos quién eres
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-[#6B6760]">
          Cada audiencia ve solo lo que necesita decidir. La narrativa, los módulos visibles y el lenguaje cambian según tu rol; nada es genérico.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map(card => {
          const Icon = card.icon
          const isLoading = submitting === card.id
          return (
            <article
              key={card.id}
              className="flex flex-col rounded-[16px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 shadow-[0_1px_0_rgba(28,27,24,0.04)] transition-shadow hover:shadow-[0_8px_28px_-18px_rgba(28,27,24,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EEE5] text-[#3B6D11]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">
                  {card.kicker}
                </p>
              </div>
              <h2 className="mt-4 font-serif text-[24px] leading-tight text-[#1C1B18]">
                {card.title}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-[#6B6760]">
                {card.promise}
              </p>
              <ul className="mt-4 space-y-1.5 text-[12px] text-[#6B6760]">
                {card.modules.map(m => (
                  <li key={m} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-[#3B6D11]" aria-hidden />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSelect(card.id)}
                disabled={Boolean(submitting)}
                className={cn(
                  'mt-6 inline-flex items-center justify-between gap-3 rounded-full border px-5 py-3 text-[13px] font-medium transition-colors',
                  isLoading
                    ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                    : 'border-[#1C1B18] bg-[#1C1B18] text-white hover:bg-[#3B6D11] hover:border-[#3B6D11]',
                  submitting && !isLoading && 'opacity-50',
                )}
              >
                <span>{isLoading ? 'Cargando journey…' : card.cta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </article>
          )
        })}
      </div>

      <footer className="mt-8 max-w-3xl text-[12px] text-[#A8A49C]">
        Tu selección se guarda localmente y se puede cambiar más adelante desde el header del simulador. ALQUIMIA produce simulaciones y propuestas; los documentos oficiales requieren validación competente.
      </footer>
    </section>
  )
}
