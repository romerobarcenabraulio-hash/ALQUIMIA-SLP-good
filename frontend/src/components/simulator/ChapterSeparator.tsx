'use client'

import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, BookOpen } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { generarTransicion, type ModuloId } from '@/lib/narrativaSpine'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { cn } from '@/lib/utils'
import { CHAPTERS, MODULE_CHAPTER, moduleNumber } from '@/lib/chapterConfig'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'

interface ChapterSeparatorProps {
  fromModuleId: string
  toModuleId: string
  onContinue: () => void
  onBack: () => void
}

export function ChapterSeparator({ fromModuleId, toModuleId, onContinue, onBack }: ChapterSeparatorProps) {
  const resultados        = useSimulatorStore(s => s.resultados)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const zmActiva          = useSimulatorStore(s => s.zmActiva)
  const municipioLabel    = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const briefCtx = useMemo((): import('@/data/moduleEditorialBriefs').ModuleEditorialContext => ({
    territorio: municipioLabel,
    scope: municipiosActivos.length === 0 ? 'sin_municipio' : municipiosActivos.length === 1 ? 'municipio' : 'zm',
    municipiosCount: municipiosActivos.length,
  }), [municipioLabel, municipiosActivos.length])

  const transicion = useMemo(
    () => generarTransicion(fromModuleId as ModuloId, resultados, municipioLabel),
    [fromModuleId, resultados, municipioLabel],
  )

  const fromChapterNum = MODULE_CHAPTER[fromModuleId] ?? null
  const toChapterNum   = MODULE_CHAPTER[toModuleId]   ?? null
  const fromChapter    = CHAPTERS.find(c => c.num === fromChapterNum) ?? null
  const toChapter      = CHAPTERS.find(c => c.num === toChapterNum)   ?? null

  if (!fromChapter || !toChapter) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 bg-[#FAFAF8]">
      {/* Chapter transition visualization */}
      <div className="w-full max-w-2xl space-y-6">

        {/* Completed chapter badge */}
        <div
          className="rounded-[12px] border p-4 flex items-start gap-3"
          style={{ borderColor: fromChapter.borderColor, backgroundColor: fromChapter.bgColor }}
        >
          <CheckCircle2 size={18} style={{ color: fromChapter.color }} className="shrink-0 mt-0.5" />
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5"
              style={{ color: fromChapter.color }}
            >
              Capítulo {fromChapter.num} completado · {fromChapter.label}
            </p>
            <p className="text-[13px] text-[#1C1B18]">{fromChapter.question}</p>
          </div>
        </div>

        {/* Narrative bridge — from narrativaSpine */}
        {transicion && (
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#A8A49C] font-semibold mb-2">
              {transicion.kicker}
            </p>
            {transicion.title && (
              <h2 className="font-serif text-[22px] font-bold text-[#1C1B18] mb-2 leading-tight">
                {transicion.title}
              </h2>
            )}
            {transicion.summary && (
              <p className="text-[13px] leading-[1.8] text-[#4A4740]">
                {transicion.summary}
              </p>
            )}
          </div>
        )}

        {/* Arrow connector */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-[#E8E4DC]" />
          <ArrowRight size={18} className="text-[#A8A49C]" />
          <div className="h-px flex-1 bg-[#E8E4DC]" />
        </div>

        {/* Next chapter preview */}
        <div
          className="rounded-[12px] border p-5"
          style={{ borderColor: toChapter.borderColor, backgroundColor: `${toChapter.bgColor}60` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} style={{ color: toChapter.color }} />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: toChapter.color }}
            >
              Próximo · Capítulo {toChapter.num}: {toChapter.label}
            </p>
          </div>
          <p className="text-[15px] font-semibold text-[#1C1B18] mb-3">{toChapter.question}</p>

          {/* Vista previa de módulos del capítulo */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#A8A49C]">
              Qué verás en este capítulo
            </p>
            <ul className="space-y-1.5">
              {toChapter.modulos.map(modId => {
                const brief = getModuleEditorialBrief(modId, briefCtx)
                const label = brief?.title ?? modId
                return (
                  <li
                    key={modId}
                    className="flex items-start gap-2 rounded-[8px] border border-[#E8E4DC]/80 bg-white/70 px-3 py-2"
                  >
                    <span
                      className="text-[10px] font-bold font-mono shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                      style={{ color: toChapter.color, backgroundColor: `${toChapter.bgColor}` }}
                    >
                      M{moduleNumber(modId)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#1C1B18] leading-snug">{label}</p>
                      {brief?.pregunta_guia && (
                        <p className="text-[11px] text-[#6B6760] leading-snug mt-0.5 line-clamp-2">
                          {brief.pregunta_guia}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-[8px] border border-[#E8E4DC] bg-white text-[12px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-white text-[13px] font-semibold transition-colors',
            )}
            style={{ backgroundColor: toChapter.color }}
          >
            Continuar al Cap. {toChapter.num}
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  )
}
