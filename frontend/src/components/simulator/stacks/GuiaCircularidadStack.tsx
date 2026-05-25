'use client'

import { useMemo, type ReactNode } from 'react'
import {
  ArrowRight, Recycle,
  BarChart3, Scale, Target, MapPin,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { NarrativaIntroBridge } from '@/components/simulator/NarrativeBridge'
import {
  CHAPTERS,
  FUNCTIONARY_MODULE_ORDER,
} from '@/lib/chapterConfig'
import {
  CHAPTER_COUNT,
  CHAPTER_SUBQUESTIONS,
  chapterModuleRange,
} from '@/lib/chapterNarratives'
import { M01_NEXT_ACTION } from '@/lib/editorialRailLabels'

const MODULE_COUNT = FUNCTIONARY_MODULE_ORDER.length

const CHAPTER_ICONS: Record<number, LucideIcon> = {
  1: MapPin,
  2: Target,
  3: Scale,
  4: BarChart3,
}

function EditorialSection({
  title,
  children,
  accentColor,
  className,
}: {
  title: string
  children: ReactNode
  accentColor?: string
  className?: string
}) {
  return (
    <section
      className={cn('pl-5 border-l-[3px] py-1', className)}
      style={{ borderColor: accentColor ?? 'var(--surface-border)' }}
    >
      <p className="text-[14px] font-semibold text-gray-900c mb-3">{title}</p>
      {children}
    </section>
  )
}

interface GuiaCircularidadProps {
  onNavigate?: (moduleId: string) => void
}

export function GuiaCircularidadStack({ onNavigate }: GuiaCircularidadProps = {}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  const municipioNarrativa = useMemo(() => {
    if (municipiosActivos.length === 1) {
      return getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    }
    return 'Un municipio mexicano'
  }, [municipiosActivos, zmActiva])

  return (
    <div className="space-y-10">
      <section className="-mx-6 bg-gradient-to-br from-[#1C2B15] to-[#2D4A1A] text-white px-6 py-7 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <Recycle size={120} strokeWidth={0.8} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-[22px] leading-[1.25] font-bold mb-3">
            Pasos hacia la circularidad
          </h1>
          <p className="text-[14px] leading-[1.7] text-white/90 max-w-2xl">
            Guía de lectura del simulador — {MODULE_COUNT} módulos en {CHAPTER_COUNT} capítulos.
            Pregunta central: ¿puede{' '}
            {municipiosActivos.length === 1 ? municipioNarrativa : 'un municipio mexicano'}{' '}
            convertir RSU en valor económico, empleos y calidad de vida?
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/75 max-w-2xl">
            Esta pantalla orienta el recorrido. Cada capítulo abre con su propia portada e índice de
            rubros y módulos — ahí verás el detalle antes de entrar al contenido.
          </p>
        </div>
      </section>

      <NarrativaIntroBridge />

      <EditorialSection
        title="¿Por qué el RSU es un problema de política pública?"
        accentColor="#3B6D11"
      >
        <div className="text-[13px] leading-[1.85] text-gray-600c space-y-4">
          <p>
            México genera más de <strong>120,000 toneladas de RSU al día</strong>. Menos del 6% se
            recicla formalmente. El resto va a rellenos saturados, tiraderos abiertos o cauces que
            terminan en el mar.
          </p>
          <p>
            Las tecnologías de separación existen desde hace décadas. El cuello de botella es{' '}
            <strong>institucional</strong>: los municipios — responsables del RSU (Art. 115) —
            carecen de diagnóstico, planeación financiera y seguimiento operativo integrados.
          </p>
        </div>
      </EditorialSection>

      <EditorialSection
        title="Los cuatro capítulos del recorrido"
        accentColor="#1A5FA8"
      >
        <p className="text-[13px] leading-[1.75] text-gray-600c mb-5">
          Vista de conjunto — al entrar a cada capítulo verás su portada con el índice completo de
          rubros y módulos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {CHAPTERS.map(ch => {
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
      </EditorialSection>

      <section className="pl-5 border-l-[3px] border-red-500a/40 py-1">
        <p className="text-[14px] font-semibold text-gray-900c mb-3">Lo que ALQUIMIA no es</p>
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
          {M01_NEXT_ACTION.replace('Abrir ', 'Abra ')} — verá primero la portada del capítulo Diagnóstico
          con el índice de módulos, luego la línea base de{' '}
          {municipiosActivos.length === 1 ? municipioNarrativa : 'su municipio'}.
        </p>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('city_baseline')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-green-500a text-white text-[13px] font-semibold hover:bg-green-600a transition-colors mx-auto"
          >
            <ArrowRight size={15} />
            {M01_NEXT_ACTION}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-green-500a">
            <ArrowRight size={16} />
            <span>Siguiente: {M01_NEXT_ACTION.replace('Abrir ', '')}</span>
          </div>
        )}
      </section>
    </div>
  )
}
