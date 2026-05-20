// ── Single source of truth for chapter/module structure ───────────────────────
// Consumed by: ModuleNav (sidebar), ChapterSeparator, GuiaCircularidadStack,
//              ModuleContextHeader, MobileModuleSelect

export interface ChapterDef {
  num: 1 | 2 | 3 | 4
  label: string
  question: string
  color: string
  bgColor: string
  borderColor: string
  modulos: string[]
  firstModuleId: string
}

export const CHAPTERS: ChapterDef[] = [
  {
    num: 1,
    label: 'Diagnóstico',
    question: '¿Cuál es el punto de partida real?',
    color: '#3B6D11',
    bgColor: '#EAF3DE',
    borderColor: '#C9DDB1',
    modulos: ['city_baseline', 'social_study', 'municipal_context', 'costo_omision'],
    firstModuleId: 'city_baseline',
  },
  {
    num: 2,
    label: 'Planificación',
    question: '¿Qué necesitamos construir?',
    color: '#1A5FA8',
    bgColor: '#E8F0FA',
    borderColor: '#BDD7F5',
    modulos: ['future_goals', 'infrastructure_operations', 'organigrama_programa', 'logistica_operativa', 'costos_programa', 'market_traceability'],
    firstModuleId: 'future_goals',
  },
  {
    num: 3,
    label: 'Modelo',
    question: '¿Quién paga, quién opera y es viable?',
    color: '#D4881E',
    bgColor: '#FEF7E7',
    borderColor: '#F5DCA0',
    modulos: ['esquema_concesion', 'scenarios_export', 'arbol_financiamiento', 'risk_trends', 'expediente_cabildo'],
    firstModuleId: 'esquema_concesion',
  },
  {
    num: 4,
    label: 'Control',
    question: '¿Cómo arrancamos y cómo medimos?',
    color: '#4A1C7A',
    bgColor: '#F5EFF9',
    borderColor: '#D8C4E8',
    modulos: ['inspeccion_predios', 'monitoreo_real', 'doble_materialidad', 'source_traceability'],
    firstModuleId: 'inspeccion_predios',
  },
]

/** Map module_id → chapter number (1-4). Returns undefined for M00 and non-chapter modules. */
export const MODULE_CHAPTER: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries(
  CHAPTERS.flatMap(ch => ch.modulos.map(id => [id, ch.num])),
) as Record<string, 1 | 2 | 3 | 4>

/** Get the ChapterDef for a given module_id, or null if not in a chapter (M00, entrepreneur). */
export function getChapterForModule(moduleId: string): ChapterDef | null {
  const num = MODULE_CHAPTER[moduleId]
  return num ? CHAPTERS.find(c => c.num === num) ?? null : null
}

/** Module number labels (00-20 for functionary, E1-E3 for entrepreneur). */
export const MODULE_NUMBERS: Record<string, string> = {
  guia_circularidad:        '00',
  city_baseline:            '01',
  social_study:             '02',
  municipal_context:        '03',
  costo_omision:            '04',
  future_goals:             '05',
  infrastructure_operations:'06',
  organigrama_programa:     '07',
  logistica_operativa:      '08',
  costos_programa:          '09',
  market_traceability:      '10',
  esquema_concesion:        '11',
  scenarios_export:         '12',
  arbol_financiamiento:     '13',
  risk_trends:              '14',
  expediente_cabildo:       '15',
  inspeccion_predios:       '16',
  monitoreo_real:           '17',
  doble_materialidad:       '18',
  source_traceability:      '19',
  citizen_inputs:           '02',
  impact_finance:           '·',
  organization_profile:     'E1',
  containers_provider:      'E2',
  organization_report:      'E3',
}

export function moduleNumber(id: string): string {
  return MODULE_NUMBERS[id] ?? '??'
}
