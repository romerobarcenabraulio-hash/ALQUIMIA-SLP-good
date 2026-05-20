'use client'

import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, BookOpen } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { generarTransicion, type ModuloId } from '@/lib/narrativaSpine'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { cn } from '@/lib/utils'

interface ChapterDef {
  num: 1 | 2 | 3 | 4
  label: string
  question: string
  color: string
  bgColor: string
  borderColor: string
  firstModuleId: string
}

const CHAPTERS: ChapterDef[] = [
  {
    num: 1, label: 'Diagnóstico', question: '¿Cuál es el punto de partida real?',
    color: '#3B6D11', bgColor: '#EAF3DE', borderColor: '#C9DDB1',
    firstModuleId: 'city_baseline',
  },
  {
    num: 2, label: 'Planificación', question: '¿Qué necesitamos construir?',
    color: '#1A5FA8', bgColor: '#E8F0FA', borderColor: '#BDD7F5',
    firstModuleId: 'future_goals',
  },
  {
    num: 3, label: 'Modelo', question: '¿Quién paga, quién opera y es viable?',
    color: '#D4881E', bgColor: '#FEF7E7', borderColor: '#F5DCA0',
    firstModuleId: 'esquema_concesion',
  },
  {
    num: 4, label: 'Control', question: '¿Cómo arrancamos y cómo medimos?',
    color: '#4A1C7A', bgColor: '#F5EFF9', borderColor: '#D8C4E8',
    firstModuleId: 'inspeccion_predios',
  },
]

// Map module_id to chapter number
const MODULE_CHAPTER: Record<string, 1 | 2 | 3 | 4> = {
  city_baseline: 1, social_study: 1, municipal_context: 1,
  future_goals: 2, infrastructure_operations: 2, logistica_operativa: 2, costos_programa: 2, market_traceability: 2,
  esquema_concesion: 3, scenarios_export: 3, risk_trends: 3,
  inspeccion_predios: 4, monitoreo_real: 4, doble_materialidad: 4, source_traceability: 4,
}

export { MODULE_CHAPTER }

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
          <p className="text-[15px] font-semibold text-[#1C1B18] mb-1">{toChapter.question}</p>
          <p className="text-[12px] text-[#6B6760]">
            {toChapterNum === 2 && 'Aquí cuantificamos cuánta infraestructura, logística, personal y dinero se necesita.'}
            {toChapterNum === 3 && 'Aquí diseñamos el modelo de negocio que se lleva al voto del cabildo.'}
            {toChapterNum === 4 && 'Aquí definimos cómo arrancar la operación y demostrar que el programa funciona.'}
          </p>
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
