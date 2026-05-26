'use client'

import { useMemo } from 'react'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { cn } from '@/lib/utils'
import {
  getChapterForModule,
  getChapterModuleOrdinal,
  moduleNumber,
} from '@/lib/chapterConfig'
import { isModuleVisibleInJourneyMode } from '@/lib/journeyMode'
import { CLIENT_FUNCTIONARY_MODULES } from '@/lib/simulator/clientModuleRegistry'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import {
  CHAPTER_PORTADA_INTRO,
  CHAPTER_SUBQUESTIONS,
  RUBRO_HINTS,
  chapterModuleRange,
  dismissChapterIndex,
} from '@/lib/chapterNarratives'

export type ChapterIndexMode = 'entry' | 'review'

interface ChapterIndexProps {
  chapterAnchorId: string
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
  const journeyMode = useSimulatorStore(s => s.journeyMode)

  const municipioLabel = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const chapter = getChapterForModule(chapterAnchorId)

  const visibleModuleCount = useMemo(() => {
    if (!chapter) return 0
    return chapter.modulos.filter(id => isModuleVisibleInJourneyMode(id, journeyMode)).length
  }, [chapter, journeyMode])

  const portadaIntro = useMemo(() => {
    if (!chapter) return ''
    return CHAPTER_PORTADA_INTRO[chapter.num]({
      municipio: municipioLabel,
      rsuTonDia: resultados?.rsuTotalTonDia ?? 0,
      pctCaptura: pctCapturaPorAño[horizonte - 1] ?? 70,
      empleos: resultados?.empleosTotalesDirectos ?? 0,
      ingresosMunicipio: resultados?.ingresosMunicipioTotal ?? 0,
      co2e: resultados?.co2eEvitadasAnualTon ?? 0,
      horizonte,
      nCAs: (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0),
      tir: resultados?.tir ?? 0,
    })
  }, [chapter, municipioLabel, resultados, horizonte, pctCapturaPorAño, mixCAs])

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

  if (!chapter) return null

  const rubroHints = RUBRO_HINTS[chapter.num] ?? {}
  const isReview = mode === 'review'

  const handleBeginFromStart = () => {
    dismissChapterIndex(chapter.num)
    onBeginFromStart()
  }

  const handleSelectModule = (moduleId: string) => {
    dismissChapterIndex(chapter.num)
    onSelectModule(moduleId)
  }

  return (
    <div
      className="min-h-[70vh] bg-[#FAFAF8]"
      data-testid="chapter-index"
      aria-label={`Portada del capítulo ${chapter.num}: ${chapter.label}`}
    >
      <header className="border-b border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-[#A8A49C]">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={12} aria-hidden />
              Portada
            </span>
            <span aria-hidden>·</span>
            <span>
              Capítulo {chapter.num} — {chapter.label}
            </span>
            <span aria-hidden>·</span>
            <span className="font-mono normal-case tracking-normal text-[#C8C4BC]">
              {chapterModuleRange(chapter)}
            </span>
          </p>
          <h1 className="max-w-2xl font-serif text-[28px] font-semibold leading-[1.2] text-[#1C1B18]">
            {chapter.question}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-[#5A5750]">
            {CHAPTER_SUBQUESTIONS[chapter.num]}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        <p className="max-w-2xl text-[14px] leading-[1.9] text-[#4A4740]">{portadaIntro}</p>

        {isReview && (
          <p className="text-[13px] leading-relaxed text-[#6B6760]">
            Índice del capítulo: elija el módulo que quiera revisar.
          </p>
        )}

        <div>
          <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[#E8E4DC] pb-3">
            <h2 className="font-serif text-[17px] font-semibold text-[#1C1B18]">Rubros del capítulo</h2>
            <p className="text-[11px] text-[#A8A49C]">
              {chapter.rubros.length} rubros · {visibleModuleCount} módulos visibles
            </p>
          </div>

          <div className="space-y-10">
            {chapter.rubros.map(rubro => {
              const visibleModulos = rubro.modulos.filter(id =>
                isModuleVisibleInJourneyMode(id, journeyMode),
              )
              if (visibleModulos.length === 0) return null

              return (
                <section key={rubro.id}>
                  <h3 className="font-serif text-[16px] font-semibold text-[#1C1B18]">{rubro.label}</h3>
                  {rubroHints[rubro.id] && (
                    <p className="mt-2 max-w-2xl text-[13px] leading-[1.75] text-[#5A5750]">
                      {rubroHints[rubro.id]}
                    </p>
                  )}

                  <ol className="mt-4 divide-y divide-[#E8E4DC] border-t border-[#E8E4DC]">
                    {visibleModulos.map(modId => {
                      const brief = getModuleEditorialBrief(modId, briefCtx)
                      const label =
                        brief?.title ?? CLIENT_FUNCTIONARY_MODULES[modId]?.label ?? modId
                      const ordinal = getChapterModuleOrdinal(chapter, modId)
                      const isActive = highlightModuleId === modId
                      const isStart = modId === chapter.firstModuleId

                      return (
                        <li key={modId}>
                          <button
                            type="button"
                            onClick={() => handleSelectModule(modId)}
                            className={cn(
                              'group flex w-full items-start gap-4 py-3.5 text-left transition-colors hover:bg-[#FDFCFA]',
                              isActive && 'bg-[#FDFCFA]',
                            )}
                          >
                            <span className="mt-0.5 w-6 shrink-0 font-mono text-[11px] text-[#A8A49C]">
                              {String(ordinal).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-mono text-[10px] text-[#C8C4BC]">
                                  M{moduleNumber(modId)}
                                </span>
                                {isStart && (
                                  <span className="text-[10px] uppercase tracking-wide text-[#6B6760]">
                                    Inicio del capítulo
                                  </span>
                                )}
                                {isActive && (
                                  <span className="text-[10px] uppercase tracking-wide text-[#1C1B18]">
                                    Módulo actual
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-[14px] font-medium leading-snug text-[#1C1B18]">
                                {label}
                              </span>
                              {brief?.pregunta_guia && (
                                <span className="mt-1 block text-[12px] leading-snug text-[#6B6760] line-clamp-2">
                                  {brief.pregunta_guia}
                                </span>
                              )}
                            </span>
                            <ArrowRight
                              size={14}
                              className="mt-1 shrink-0 text-[#C8C4BC] transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B6760]"
                              aria-hidden
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E8E4DC] pt-6">
          <button
            type="button"
            onClick={onBack}
            className="text-[12px] text-[#6B6760] transition-colors hover:text-[#1C1B18]"
          >
            {isReview ? '← Volver al módulo' : '← Volver'}
          </button>
          <button
            type="button"
            onClick={handleBeginFromStart}
            className="inline-flex items-center gap-2 border border-[#1C1B18] bg-[#1C1B18] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {isReview ? 'Ir al inicio del capítulo' : `Comenzar capítulo ${chapter.num}`}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
