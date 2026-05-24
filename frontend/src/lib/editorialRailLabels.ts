import { MODULE_CHAPTER, type ChapterDef } from '@/lib/chapterConfig'

export type RailActionLabel =
  | 'cabildo'
  | 'juridico'
  | 'operativo'
  | 'recorrido'
  | 'financiero'

const FINANCIAL_MODULES = new Set([
  'city_baseline',
  'costo_omision',
  'evaluacion_socioeconomica',
  'costos_programa',
  'escenarios_financieros',
  'arbol_financiamiento',
  'esquema_concesion',
  'riesgos_modelo',
  'expediente_cabildo',
  'evm_dashboard',
  'conciliacion_mensual',
])

const LEGAL_MODULES = new Set([
  'marco_legal',
  'dictamen_tecnico',
  'capacidad_institucional',
  'cobertura_territorial',
  'inspeccion',
])

const GUIDE_MODULES = new Set(['guia_circularidad'])

export function getRailActionLabel(moduleId: string): string {
  const kind = getRailActionKind(moduleId)
  switch (kind) {
    case 'recorrido':
      return 'Siguiente paso en el recorrido'
    case 'juridico':
      return 'Antes de publicar en Periódico Oficial'
    case 'operativo':
      return 'Antes de comprometer operación'
    case 'financiero':
      return 'Antes de usar esta cifra en Cabildo'
    case 'cabildo':
    default:
      return 'Antes de usar esta cifra en Cabildo'
  }
}

export function getRailActionKind(moduleId: string): RailActionLabel {
  if (GUIDE_MODULES.has(moduleId)) return 'recorrido'
  if (LEGAL_MODULES.has(moduleId)) return 'juridico'
  if (FINANCIAL_MODULES.has(moduleId)) return 'financiero'
  const chapter = MODULE_CHAPTER[moduleId] as ChapterDef['num'] | undefined
  if (chapter === 4) return 'operativo'
  if (chapter === 2) return 'operativo'
  return 'cabildo'
}

/** Handoff canónico al primer módulo técnico. */
export const M01_NEXT_ACTION = 'Abrir M01 — Línea base territorial y RSU'

export const M00_EVIDENCE_TEMPLATE = (moduleCount: number, chapterCount: number) =>
  `${chapterCount} capítulos consultivos · ${moduleCount} módulos de análisis con fuentes documentadas.`
