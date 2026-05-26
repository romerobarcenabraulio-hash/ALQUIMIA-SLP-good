/**
 * Modos de recorrido funcionario — activados desde M00.
 *
 * - validar: comprender situación + decidir (Cap. 1 + Cap. 3)
 * - implementar: diseñar y operar (puentes Cap. 1 + Cap. 2 + Cap. 4)
 */
import {
  CHAPTER_MODULES,
  FUNCTIONARY_MODULE_ORDER,
  resolveModuleId,
} from '@/lib/chapterConfig'

export type JourneyMode = 'validar' | 'implementar'

export const JOURNEY_MODE_STORAGE_KEY = 'alquimia.journeyMode' as const

/** Puentes mínimos en modo implementar — no rediagnosticar 14 módulos. */
export const IMPLEMENTAR_BRIDGE_MODULE_IDS = [
  'city_baseline',
  'marco_legal',
  'dictamen_tecnico',
] as const

/** Cap. 1 completo + Cap. 3 completo (decidir). */
export const VALIDAR_MODULE_IDS: readonly string[] = [
  ...CHAPTER_MODULES[1],
  ...CHAPTER_MODULES[3],
]

/** Puentes + Cap. 2 + Cap. 4 (diseño y operación). */
export const IMPLEMENTAR_MODULE_IDS: readonly string[] = [
  ...IMPLEMENTAR_BRIDGE_MODULE_IDS,
  ...CHAPTER_MODULES[2],
  ...CHAPTER_MODULES[4],
]

export const JOURNEY_MODE_META: Record<
  JourneyMode,
  {
    title: string
    subtitle: string
    question: string
    chapters: string
    cta: string
    startModuleId: string
  }
> = {
  validar: {
    title: 'Validar la propuesta',
    subtitle: 'Comprender el municipio y preparar la decisión de Cabildo',
    question: '¿Vale la pena? ¿Qué le presentamos al Cabildo?',
    chapters: 'Cap. 1 Diagnóstico + Cap. 3 Modelo de negocio',
    cta: 'Comenzar diagnóstico (M01)',
    startModuleId: 'city_baseline',
  },
  implementar: {
    title: 'Implementar y operar',
    subtitle: 'Diseñar infraestructura, logística y controles de operación',
    question: '¿Cómo lo construimos y lo medimos en campo?',
    chapters: 'Cap. 2 Planificación + Cap. 4 Control (+ puentes legales)',
    cta: 'Comenzar planificación (M05D)',
    startModuleId: 'roadmap_implementacion',
  },
}

export function isValidJourneyMode(value: unknown): value is JourneyMode {
  return value === 'validar' || value === 'implementar'
}

export function isModuleVisibleInJourneyMode(
  moduleId: string,
  mode: JourneyMode,
): boolean {
  const id = resolveModuleId(moduleId)
  if (id === 'guia_circularidad') return true
  if (mode === 'validar') {
    return (VALIDAR_MODULE_IDS as readonly string[]).includes(id)
  }
  return (IMPLEMENTAR_MODULE_IDS as readonly string[]).includes(id)
}

/** Filtra IDs preservando el orden del journey oficial. */
export function filterModuleIdsForJourneyMode(
  orderedIds: readonly string[],
  mode: JourneyMode,
): string[] {
  return orderedIds.filter(id => isModuleVisibleInJourneyMode(id, mode))
}

/** Módulos visibles en nav para el modo (sin M00). */
export function journeyModeModuleIds(mode: JourneyMode): readonly string[] {
  return mode === 'validar' ? VALIDAR_MODULE_IDS : IMPLEMENTAR_MODULE_IDS
}

export function countJourneyModeModules(mode: JourneyMode): number {
  return journeyModeModuleIds(mode).length + 1
}

export function getJourneyStartModuleId(mode: JourneyMode): string {
  return JOURNEY_MODE_META[mode].startModuleId
}

/** Primer módulo del modo dentro de una lista ya filtrada por audiencia. */
export function pickFirstVisibleModuleId(
  modules: ReadonlyArray<{ module_id: string }>,
  mode: JourneyMode,
): string | null {
  const prefer = ['guia_circularidad', getJourneyStartModuleId(mode)]
  for (const id of prefer) {
    if (modules.some(m => m.module_id === id)) return id
  }
  const hit = modules.find(m => isModuleVisibleInJourneyMode(m.module_id, mode))
  return hit?.module_id ?? modules[0]?.module_id ?? null
}

/** Sanity: todo el journey oficial está clasificado en algún modo (+ guía). */
export function unclassifiedFunctionaryModules(): string[] {
  const classified = new Set<string>([
    'guia_circularidad',
    ...VALIDAR_MODULE_IDS,
    ...IMPLEMENTAR_MODULE_IDS,
  ])
  return FUNCTIONARY_MODULE_ORDER.filter(id => !classified.has(id))
}
