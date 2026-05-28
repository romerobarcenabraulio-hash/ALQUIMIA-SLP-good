// ── Single source of truth: capítulos → rubros → módulos ─────────────────────

export interface RubroDef {
  id: string
  label: string
  modulos: string[]
}

export interface ChapterDef {
  num: 1 | 2 | 3 | 4
  label: string
  question: string
  color: string
  bgColor: string
  borderColor: string
  rubros: RubroDef[]
  /** @deprecated use rubros.flatMap(r => r.modulos) */
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
    rubros: [
      {
        id: 'antecedentes',
        label: 'Antecedentes',
        modulos: ['antecedentes_municipales'],
      },
      {
        id: 'ambiental',
        label: 'Ambiental',
        modulos: ['city_baseline'],
      },
      {
        id: 'social',
        label: 'Social',
        modulos: ['social_diagnostico'],
      },
      {
        id: 'institucional_normativo',
        label: 'Institucional-normativo',
        modulos: ['capacidad_institucional', 'marco_legal'],
      },
      {
        id: 'financiero_economico',
        label: 'Financiero-económico',
        modulos: ['costo_omision'],
      },
    ],
    modulos: [] as string[],
    firstModuleId: 'antecedentes_municipales',
  },
  {
    num: 2,
    label: 'Planificación',
    question: '¿Qué necesitamos construir?',
    color: '#1A5FA8',
    bgColor: '#E8F0FA',
    borderColor: '#BDD7F5',
    rubros: [
      {
        id: 'implementacion',
        label: 'Implementación',
        modulos: ['roadmap_implementacion'],
      },
      {
        id: 'estrategico',
        label: 'Estratégico',
        modulos: [],
      },
      {
        id: 'operativo',
        label: 'Operativo',
        modulos: ['infraestructura', 'organigrama', 'logistica'],
      },
      {
        id: 'economico',
        label: 'Económico',
        modulos: ['costos_programa', 'mercado_materiales'],
      },
    ],
    modulos: [] as string[],
    firstModuleId: 'roadmap_implementacion',
  },
  {
    num: 3,
    label: 'Modelo de negocio',
    question: '¿Quién paga, quién opera y es viable?',
    color: '#D4881E',
    bgColor: '#FEF7E7',
    borderColor: '#F5DCA0',
    rubros: [
      {
        id: 'institucional',
        label: 'Institucional',
        modulos: ['esquema_concesion', 'arbol_financiamiento'],
      },
      {
        id: 'financiero',
        label: 'Financiero',
        modulos: ['escenarios_financieros', 'riesgos_modelo'],
      },
      {
        id: 'gobernanza',
        label: 'Gobernanza',
        modulos: ['expediente_cabildo'],
      },
    ],
    modulos: [] as string[],
    firstModuleId: 'esquema_concesion',
  },
  {
    num: 4,
    label: 'Control',
    question: '¿Cómo arrancamos y cómo medimos?',
    color: '#4A1C7A',
    bgColor: '#F5EFF9',
    borderColor: '#D8C4E8',
    rubros: [
      {
        id: 'cumplimiento',
        label: 'Cumplimiento',
        modulos: ['inspeccion'],
      },
      {
        id: 'monitoreo',
        label: 'Monitoreo',
        modulos: ['monitoreo_operativo'],
      },
      {
        id: 'reporteo',
        label: 'Reporteo',
        modulos: ['doble_materialidad', 'trazabilidad'],
      },
      {
        id: 'control_presupuestal',
        label: 'Control presupuestal',
        modulos: ['evm_dashboard'],
      },
      {
        id: 'gestion_riesgos',
        label: 'Gestión de riesgos',
        modulos: ['risk_dashboard'],
      },
    ],
    modulos: [] as string[],
    firstModuleId: 'inspeccion',
  },
]

for (const ch of CHAPTERS) {
  ch.modulos = ch.rubros.flatMap(r => r.modulos)
}

export const CHAPTER_MODULES: Record<1 | 2 | 3 | 4, string[]> = {
  1: CHAPTERS[0].modulos,
  2: CHAPTERS[1].modulos,
  3: CHAPTERS[2].modulos,
  4: CHAPTERS[3].modulos,
}

/** All functionary module IDs in journey order (excludes M00 guia). */
export const FUNCTIONARY_MODULE_ORDER: string[] = [
  ...CHAPTER_MODULES[1],
  ...CHAPTER_MODULES[2],
  ...CHAPTER_MODULES[3],
  ...CHAPTER_MODULES[4],
]

export const MODULE_CHAPTER: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries(
  CHAPTERS.flatMap(ch => ch.modulos.map(id => [id, ch.num])),
) as Record<string, 1 | 2 | 3 | 4>

export const MODULE_RUBRO: Record<string, string> = Object.fromEntries(
  CHAPTERS.flatMap(ch =>
    ch.rubros.flatMap(r => r.modulos.map(id => [id, r.id])),
  ),
)

export function getChapterForModule(moduleId: string): ChapterDef | null {
  const num = MODULE_CHAPTER[moduleId]
  return num ? CHAPTERS.find(c => c.num === num) ?? null : null
}

export function getRubroForModule(moduleId: string): RubroDef | null {
  const ch = getChapterForModule(moduleId)
  if (!ch) return null
  const rubroId = MODULE_RUBRO[moduleId]
  return ch.rubros.find(r => r.id === rubroId) ?? null
}

export const MODULE_NUMBERS: Record<string, string> = {
  guia_circularidad: '00',
  antecedentes_municipales: '00B',
  city_baseline: '01',
  social_diagnostico: '02',
  social_encuesta: '02B',
  mapeo_actores: '02C',
  organigrama_diagnostico: '02D',
  capacidad_institucional: '03',
  marco_legal: '03B',
  cobertura_territorial: '03C',
  dictamen_tecnico: '03D',
  costo_omision: '04',
  evaluacion_socioeconomica: '04B',
  teoria_cambio: '04C',
  roadmap_implementacion: '05D',
  plan_maestro: '05',
  ruta_critica: '05B',
  oleadas_territoriales: '05C',
  infraestructura: '06',
  organigrama: '07',
  logistica: '08',
  plan_educativo: '08B',
  costos_programa: '09',
  mercado_materiales: '10',
  esquema_concesion: '11',
  arbol_financiamiento: '12',
  escenarios_financieros: '13',
  riesgos_modelo: '14',
  expediente_cabildo: '15',
  inspeccion: '16',
  monitoreo_operativo: '17',
  doble_materialidad: '18',
  trazabilidad: '19',
  evm_dashboard: '20',
  conciliacion_mensual: '20B',
  risk_dashboard: '21',
  gate_status: '21B',
  // Legacy aliases (redirect in render)
  social_study: '02',
  municipal_context: '03B',
  future_goals: '05',
  infrastructure_operations: '06',
  organigrama_programa: '07',
  logistica_operativa: '08',
  market_traceability: '10',
  scenarios_export: '13',
  risk_trends: '14',
  inspeccion_predios: '16',
  monitoreo_real: '17',
  source_traceability: '19',
  citizen_inputs: '02',
  impact_finance: '·',
  organization_profile: 'E1',
  containers_provider: 'E2',
  organization_report: 'E3',
}

export function getChapterModuleOrdinal(chapter: ChapterDef, moduleId: string): number {
  const idx = chapter.modulos.indexOf(moduleId)
  return idx >= 0 ? idx + 1 : 0
}

export function getChapterIndexAnchor(moduleId: string): string | null {
  return getChapterForModule(moduleId)?.firstModuleId ?? null
}

export function moduleNumber(id: string): string {
  return MODULE_NUMBERS[id] ?? '??'
}

/** Legacy module_id → canonical module_id for redirects. */
export const LEGACY_MODULE_ALIASES: Record<string, string> = {
  social_encuesta: 'social_diagnostico',
  mapeo_actores: 'social_diagnostico',
  organigrama_diagnostico: 'social_diagnostico',
  cobertura_territorial: 'capacidad_institucional',
  dictamen_tecnico: 'capacidad_institucional',
  evaluacion_socioeconomica: 'costo_omision',
  teoria_cambio: 'costo_omision',
  plan_maestro: 'roadmap_implementacion',
  ruta_critica: 'roadmap_implementacion',
  oleadas_territoriales: 'roadmap_implementacion',
  plan_educativo: 'logistica',
  conciliacion_mensual: 'evm_dashboard',
  gate_status: 'risk_dashboard',
  social_study: 'social_diagnostico',
  municipal_context: 'marco_legal',
  future_goals: 'roadmap_implementacion',
  infrastructure_operations: 'infraestructura',
  organigrama_programa: 'organigrama',
  logistica_operativa: 'logistica',
  market_traceability: 'mercado_materiales',
  scenarios_export: 'escenarios_financieros',
  risk_trends: 'riesgos_modelo',
  inspeccion_predios: 'inspeccion',
  monitoreo_real: 'monitoreo_operativo',
  source_traceability: 'trazabilidad',
  impacto_ambiental: 'city_baseline',
}

export function resolveModuleId(id: string): string {
  return LEGACY_MODULE_ALIASES[id] ?? id
}
