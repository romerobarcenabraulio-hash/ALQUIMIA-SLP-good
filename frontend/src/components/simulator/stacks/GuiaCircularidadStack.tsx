'use client'

import { useMemo } from 'react'
import {
  ArrowRight, Recycle, Scale, Target,
  BarChart3, MapPin, CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { NarrativaIntroBridge } from '@/components/simulator/NarrativeBridge'
import { CHAPTERS } from '@/lib/chapterConfig'
import { CHAPTER_COUNT, CHAPTER_SUBQUESTIONS, chapterModuleRange } from '@/lib/chapterNarratives'
import {
  countJourneyModeModules,
  JOURNEY_MODE_META,
  type JourneyMode,
} from '@/lib/journeyMode'
import { Conclusion, MarginalNote, SectionLabel } from '@/components/editorial'
import { InstitutionalBadge } from '@/components/credibility'
import { useTenantMunicipalProfile } from '@/hooks/useTenantMunicipalProfile'
import { TenantFirstLoginSummary } from '@/components/simulator/TenantProfilePanels'

const CHAPTER_ICONS: Record<number, LucideIcon> = {
  1: MapPin,
  2: Target,
  3: Scale,
  4: BarChart3,
}

interface GuiaCircularidadProps {
  onNavigate?: (moduleId: string) => void
}

export function GuiaCircularidadStack({ onNavigate }: GuiaCircularidadProps = {}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const journeyMode = useSimulatorStore(s => s.journeyMode)
  const setJourneyMode = useSimulatorStore(s => s.setJourneyMode)
  const resultados = useSimulatorStore(s => s.resultados)
  const { profile, data } = useTenantMunicipalProfile()

  const municipioNarrativa = useMemo(() => {
    if (municipiosActivos.length === 1) {
      return getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    }
    return 'Un municipio mexicano'
  }, [municipiosActivos, zmActiva])

  const handleSelectMode = (mode: JourneyMode) => {
    setJourneyMode(mode)
  }

  const handleStart = () => {
    if (!onNavigate) return
    const startId = JOURNEY_MODE_META[journeyMode].startModuleId
    onNavigate(startId)
  }

  const chaptersForMode = useMemo(() => {
    if (journeyMode === 'validar') {
      return CHAPTERS.filter(ch => ch.num === 1 || ch.num === 3)
    }
    return CHAPTERS.filter(ch => ch.num === 2 || ch.num === 4)
  }, [journeyMode])

  const modeModuleCount = countJourneyModeModules(journeyMode)

  return (
    <div className="space-y-10">
      <section className="-mx-6 bg-gradient-to-br from-[#1C2B15] to-[#2D4A1A] text-white px-6 py-7 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <Recycle size={120} strokeWidth={0.8} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-[22px] leading-[1.25] font-bold mb-2">
            Pasos hacia la circularidad
          </h1>
          <InstitutionalBadge variant="onDark" className="mb-4" />
          <p className="text-[14px] leading-[1.7] text-white/90 max-w-2xl">
            Guía de lectura del simulador — elige el recorrido según tu objetivo.
            Pregunta central: ¿puede{' '}
            {municipiosActivos.length === 1 ? municipioNarrativa : 'un municipio mexicano'}{' '}
            convertir RSU en valor económico, empleos y calidad de vida?
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/75 max-w-2xl">
            Modo activo: <strong className="text-white">{JOURNEY_MODE_META[journeyMode].title}</strong>
            {' '}· {modeModuleCount} módulos visibles en el menú lateral.
          </p>
        </div>
      </section>

      <TenantFirstLoginSummary
        profile={profile}
        moduleLabel={`M00 · ${data?.municipio ?? municipioNarrativa}`}
      />

      <NarrativaIntroBridge />

      <section className="border-t border-[#E8E4DC] pt-6">
        <SectionLabel>¿Para qué entras hoy?</SectionLabel>
        <Conclusion className="text-[16px] md:text-[17px] mb-4">
          ALQUIMIA tiene {CHAPTER_COUNT} capítulos consultivos; no hace falta recorrerlos todos de
          una vez. Elige si necesitas validar la propuesta ante Cabildo o planificar la implementación
          y los controles de operación.
        </Conclusion>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['validar', 'implementar'] as const).map(mode => {
            const meta = JOURNEY_MODE_META[mode]
            const active = journeyMode === mode
            const Icon = mode === 'validar' ? Scale : Target
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={cn(
                  'rounded-[12px] border p-4 text-left transition-all',
                  active
                    ? 'border-[#3B6D11] bg-[#F4FAF0] ring-2 ring-[#3B6D11]/25'
                    : 'border-[#E8E4DC] bg-[#FDFCFA] hover:border-[#C9DDB1] hover:bg-[#FAFCF8]',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      active ? 'bg-[#3B6D11] text-white' : 'bg-[#EAF3DE] text-[#3B6D11]',
                    )}
                  >
                    <Icon size={16} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-gray-900c">{meta.title}</p>
                      {active && (
                        <CheckCircle2 size={14} className="text-[#3B6D11] shrink-0" aria-hidden />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-gray-600c">{meta.subtitle}</p>
                    <p className="mt-2 text-[10px] font-medium text-[#3B6D11]">{meta.chapters}</p>
                    <p className="mt-1 font-mono text-[10px] text-gray-400c">
                      {countJourneyModeModules(mode)} módulos · {meta.question}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {journeyMode === 'implementar' && !resultados && (
          <p className="mt-3 rounded-[8px] border border-[#D4881E]/30 bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#8B5A00]">
            Recomendado: complete al menos M00B y M01 (antecedentes y línea base) en modo validar antes de planificar
            infraestructura — los KPIs del simulador alimentan Cap. 2 y el paquete consultoría.
          </p>
        )}
      </section>

      <section className="border-t border-[#E8E4DC] pt-6">
        <SectionLabel>Capítulos visibles — {JOURNEY_MODE_META[journeyMode].title}</SectionLabel>
        <MarginalNote className="mb-5">
          Vista de conjunto del modo seleccionado. Puede cambiar el recorrido aquí en cualquier
          momento sin perder datos del simulador.
        </MarginalNote>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {chaptersForMode.map(ch => {
            const Icon = CHAPTER_ICONS[ch.num] ?? MapPin
            return (
              <div
                key={ch.num}
                className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4"
                style={{ borderLeftWidth: 3, borderLeftColor: ch.color }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ch.bgColor }}
                  >
                    <Icon size={16} style={{ color: ch.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: ch.color }}>
                      Capítulo {ch.num} · {ch.label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-gray-900c leading-snug">{ch.question}</p>
                    <p className="mt-1 text-[11px] text-gray-600c leading-snug">
                      {CHAPTER_SUBQUESTIONS[ch.num]}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-gray-400c">
                      {chapterModuleRange(ch)} · {ch.modulos.length} módulos · {ch.rubros.length} rubros
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="border-t border-[#E8E4DC] pt-6">
        <SectionLabel>Lo que ALQUIMIA no es</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-gray-600c">
          {[
            { no: 'No es un dictamen oficial', si: 'Requiere validación del equipo jurídico y técnico del municipio.' },
            { no: 'No sustituye al consultor humano', si: 'Acelera cálculos y escenarios que tomarían semanas en hoja de cálculo.' },
            { no: 'No inventa datos', si: 'Cada cifra tiene fuente. Sin dato, el supuesto queda editable con rango de incertidumbre.' },
            { no: 'No garantiza resultados', si: 'Proyecta escenarios; el resultado real depende de ejecución y voluntad política.' },
          ].map(item => (
            <div key={item.no} className="rounded-[8px] bg-surface-muted p-3">
              <p className="font-semibold text-red-500a mb-1">✕ {item.no}</p>
              <p className="text-gray-600c leading-relaxed">{item.si}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] bg-green-50a p-5 text-center border-l-[3px] border-green-500a">
        <p className="text-[13px] text-green-600a mb-4 max-w-lg mx-auto">
          Modo <strong>{JOURNEY_MODE_META[journeyMode].title}</strong>:{' '}
          {JOURNEY_MODE_META[journeyMode].cta.replace('Comenzar ', 'comience en ')}
          {journeyMode === 'validar'
            ? ' — verá la portada del capítulo Diagnóstico con el índice filtrado.'
            : ' — incluye puentes M00B/M01/M03 para contexto histórico y dictamen.'}
        </p>
        {onNavigate ? (
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-green-500a text-white text-[13px] font-semibold hover:bg-green-600a transition-colors mx-auto"
          >
            <ArrowRight size={15} />
            {JOURNEY_MODE_META[journeyMode].cta}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-green-500a">
            <ArrowRight size={16} />
            <span>Siguiente: {JOURNEY_MODE_META[journeyMode].cta}</span>
          </div>
        )}
      </section>
    </div>
  )
}
