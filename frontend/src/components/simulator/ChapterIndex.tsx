'use client'

import { useMemo } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ListTree,
  MapPin,
  Scale,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { cn } from '@/lib/utils'
import {
  getChapterForModule,
  getChapterModuleOrdinal,
  moduleNumber,
} from '@/lib/chapterConfig'
import { CLIENT_FUNCTIONARY_MODULES } from '@/lib/simulator/clientModuleRegistry'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import {
  CHAPTER_HERO_GRADIENT,
  CHAPTER_NARRATIVES,
  CHAPTER_SUBQUESTIONS,
  RUBRO_HINTS,
  chapterModuleRange,
  dismissChapterCover,
  type ChapterNarrativeContext,
} from '@/lib/chapterNarratives'

const CHAPTER_ICONS: Record<number, LucideIcon> = {
  1: MapPin,
  2: Target,
  3: Scale,
  4: BarChart3,
}

export type ChapterIndexMode = 'entry' | 'review'

interface ChapterIndexProps {
  /** Primer módulo del capítulo — ancla del índice */
  chapterAnchorId: string
  /** Módulo activo al reabrir el índice desde el capítulo */
  highlightModuleId?: string | null
  mode?: ChapterIndexMode
  onSelectModule: (moduleId: string) => void
  onBeginFromStart: () => void
  onBack: () => void
}

export function ChapterIndex({
  chapterAnchorId,
  highlightModuleId = null,
  mode = 'entry',
  onSelectModule,
  onBeginFromStart,
  onBack,
}: ChapterIndexProps) {
  const resultados = useSimulatorStore(s => s.resultados)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const mixCAs = useSimulatorStore(s => s.mixCAs)

  const municipioLabel = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const chapter = getChapterForModule(chapterAnchorId)

  const briefCtx = useMemo(
    (): import('@/data/moduleEditorialBriefs').ModuleEditorialContext => ({
      territorio: municipioLabel,
      scope:
        municipiosActivos.length === 0
          ? 'sin_municipio'
          : municipiosActivos.length === 1
            ? 'municipio'
            : 'zm',
      municipiosCount: municipiosActivos.length,
    }),
    [municipioLabel, municipiosActivos.length],
  )

  const ctx: ChapterNarrativeContext = useMemo(
    () => ({
      municipio: municipioLabel,
      rsuTonDia: resultados?.rsuTotalTonDia ?? 0,
      pctCaptura: pctCapturaPorAño[horizonte - 1] ?? 70,
      empleos: resultados?.empleosTotalesDirectos ?? 0,
      ingresosMunicipio: resultados?.ingresosMunicipioTotal ?? 0,
      co2e: resultados?.co2eEvitadasAnualTon ?? 0,
      horizonte,
      nCAs: (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0),
      tir: resultados?.tir ?? 0,
    }),
    [municipioLabel, resultados, horizonte, pctCapturaPorAño, mixCAs],
  )

  if (!chapter) return null

  const narrative = CHAPTER_NARRATIVES[chapter.num]
  const Icon = CHAPTER_ICONS[chapter.num] ?? BookOpen
  const gradient = CHAPTER_HERO_GRADIENT[chapter.num]
  const rubroHints = RUBRO_HINTS[chapter.num] ?? {}
  const isReview = mode === 'review'

  const handleBeginFromStart = () => {
    dismissChapterCover(chapter.num)
    onBeginFromStart()
  }

  const handleSelectModule = (moduleId: string) => {
    dismissChapterCover(chapter.num)
    onSelectModule(moduleId)
  }

  return (
    <div
      className="min-h-[70vh] bg-[#FAFAF8]"
      data-testid="chapter-index"
      aria-label={`Índice del capítulo ${chapter.num}: ${chapter.label}`}
    >
      <section
        className={cn(
          'relative overflow-hidden bg-gradient-to-br px-6 py-8 text-white',
          gradient,
        )}
      >
        <Icon
          size={140}
          strokeWidth={0.7}
          className="pointer-events-none absolute right-4 top-2 opacity-10"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/95 bg-white/10">
              <ListTree size={12} aria-hidden />
              Índice del capítulo
            </span>
            <span
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ backgroundColor: `${chapter.bgColor}33`, color: chapter.bgColor }}
            >
              Cap. {chapter.num} · {chapter.label}
            </span>
            <span className="font-mono text-[10px] text-white/60">{chapterModuleRange(chapter)}</span>
          </div>
          <h1 className="mb-2 font-serif text-[26px] font-bold leading-tight">{chapter.question}</h1>
          <p className="text-[14px] leading-relaxed text-white/85">
            {CHAPTER_SUBQUESTIONS[chapter.num]}
          </p>
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-white/70">
            {isReview
              ? 'Mapa del capítulo: elige un rubro o salta directo al módulo que necesites revisar.'
              : 'Antes de entrar al contenido, repasa qué rubros y módulos componen este capítulo.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {!isReview && (
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(28,27,24,0.05)]">
            <p className="whitespace-pre-line text-[13px] leading-[1.85] text-[#4A4740]">
              {narrative.body(ctx)}
            </p>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#1C1B18]">Contenido del capítulo</p>
              <p className="mt-0.5 text-[11px] text-[#6B6760]">
                {chapter.rubros.length} rubros · {chapter.modulos.length} módulos
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[#E8E4DC] bg-white shadow-[0_2px_12px_rgba(28,27,24,0.04)]">
            {chapter.rubros.map((rubro, rubroIdx) => (
              <section
                key={rubro.id}
                className={cn(rubroIdx > 0 && 'border-t border-[#E8E4DC]')}
              >
                <div
                  className="px-4 py-3"
                  style={{ backgroundColor: `${chapter.bgColor}55` }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: chapter.color }}
                  >
                    {rubro.label}
                  </p>
                  {rubroHints[rubro.id] && (
                    <p className="mt-0.5 text-[11px] leading-snug text-[#5A5750]">
                      {rubroHints[rubro.id]}
                    </p>
                  )}
                </div>
                <ol className="divide-y divide-[#F0EDE5]">
                  {rubro.modulos.map(modId => {
                    const brief = getModuleEditorialBrief(modId, briefCtx)
                    const label =
                      brief?.title ??
                      CLIENT_FUNCTIONARY_MODULES[modId]?.label ??
                      modId
                    const ordinal = getChapterModuleOrdinal(chapter, modId)
                    const isActive = highlightModuleId === modId
                    const isStart = modId === chapter.firstModuleId

                    return (
                      <li key={modId}>
                        <button
                          type="button"
                          onClick={() => handleSelectModule(modId)}
                          className={cn(
                            'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                            isActive
                              ? 'bg-[#FAFAF8]'
                              : 'hover:bg-[#FDFCFA]',
                          )}
                          style={isActive ? { boxShadow: `inset 3px 0 0 ${chapter.color}` } : undefined}
                        >
                          <span
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                            style={{
                              color: chapter.color,
                              backgroundColor: chapter.bgColor,
                            }}
                          >
                            {ordinal}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-[#A8A49C]">
                                M{moduleNumber(modId)}
                              </span>
                              {isStart && (
                                <span
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                  style={{ color: chapter.color, backgroundColor: chapter.bgColor }}
                                >
                                  Inicio
                                </span>
                              )}
                              {isActive && (
                                <span className="rounded bg-[#1C1B18] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                  Actual
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[13px] font-medium leading-snug text-[#1C1B18]">
                              {label}
                            </span>
                            {brief?.pregunta_guia && (
                              <span className="mt-1 block text-[11px] leading-snug text-[#6B6760] line-clamp-2">
                                {brief.pregunta_guia}
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            size={14}
                            className="mt-1 shrink-0 text-[#A8A49C] transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B6760]"
                            aria-hidden
                          />
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E8E4DC] pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-[8px] border border-[#E8E4DC] bg-white px-4 py-2 text-[12px] text-[#6B6760] transition-colors hover:bg-[#F4F2ED]"
          >
            {isReview ? '← Volver al módulo' : '← Volver'}
          </button>
          <button
            type="button"
            onClick={handleBeginFromStart}
            className="inline-flex items-center gap-2 rounded-[10px] px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: chapter.color }}
          >
            {isReview ? 'Ir al inicio del capítulo' : `Comenzar capítulo ${chapter.num}`}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** @deprecated — usar ChapterIndex */
export { ChapterIndex as ChapterCover }
