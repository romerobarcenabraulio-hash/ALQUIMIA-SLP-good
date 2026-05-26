import {
  CHAPTERS,
  getChapterForModule,
  moduleNumber,
  type ChapterDef,
} from '@/lib/chapterConfig'

export interface ChapterNarrativeContext {
  municipio: string
  rsuTonDia: number
  pctCaptura: number
  empleos: number
  ingresosMunicipio: number
  co2e: number
  horizonte: number
  nCAs: number
  tir: number
}

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)
const fmtMxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

export const CHAPTER_SUBQUESTIONS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Entender el municipio antes de proponer soluciones',
  2: '¿Cuánta infraestructura, logística, personal y dinero se requiere?',
  3: 'Qué le presentamos al Cabildo para que vote',
  4: 'Cómo se opera y se demuestra que funciona',
}

export const CHAPTER_HERO_GRADIENT: Record<1 | 2 | 3 | 4, string> = {
  1: 'from-[#1C2B15] to-[#2D4A1A]',
  2: 'from-[#0F2440] to-[#1A5FA8]',
  3: 'from-[#3D2808] to-[#8B5A12]',
  4: 'from-[#2A1045] to-[#4A1C7A]',
}

/** Breve orientación por rubro dentro de cada capítulo. */
export const RUBRO_HINTS: Record<number, Record<string, string>> = {
  1: {
    ambiental: 'Cuánto RSU genera el municipio y qué impacto tiene no actuar.',
    antecedentes: 'Qué programas, concesiones y operadores precedieron al diagnóstico numérico.',
    social: 'Disposición ciudadana, actores clave y encuesta de aceptación.',
    gobernanza_operativa: 'Quién opera el servicio hoy y cómo está organizado.',
    institucional_normativo: 'Reglamento, brechas normativas y cobertura territorial.',
    financiero_economico: 'Costo de la omisión y balance socioeconómico del programa.',
    cierre_diagnostico: 'Teoría de cambio que conecta diagnóstico con planificación.',
  },
  2: {
    implementacion: 'Fases, oleadas y calendario territorial de despliegue.',
    estrategico: 'Plan maestro, ruta crítica y metas de captura.',
    operativo: 'Centros de acopio, organigrama objetivo, logística y educación.',
    economico: 'Costos del programa y mercado de materiales recuperados.',
  },
  3: {
    institucional: 'Esquema de concesión y reparto de roles.',
    financiero: 'Escenarios financieros, Monte Carlo y riesgos del modelo.',
    gobernanza: 'Expediente consolidado para sesión de Cabildo.',
  },
  4: {
    cumplimiento: 'Inspección escalonada alineada al reglamento.',
    monitoreo: 'Desempeño proyectado versus medido en operación.',
    reporteo: 'Doble materialidad y trazabilidad de fuentes.',
    control_presupuestal: 'EVM y conciliación mensual del presupuesto.',
    gestion_riesgos: 'Tableros de riesgo y gate de cierre del expediente.',
  },
}

export const CHAPTER_NARRATIVES: Record<
  1 | 2 | 3 | 4,
  { body: (ctx: ChapterNarrativeContext) => string; learns: string[] }
> = {
  1: {
    body: ctx =>
      `${ctx.municipio} genera aproximadamente ${fmtN(ctx.rsuTonDia)} toneladas de RSU al día; hoy se recupera menos del 6%. Este capítulo recorre la línea base ambiental, el diagnóstico social, la gobernanza operativa actual, el marco normativo, el costo de no actuar y la teoría de cambio.\n\nLa secuencia importa: no conviene reformar el reglamento sin medir disposición ciudadana ni mapear quién opera el servicio hoy. Aquí construyes el punto de partida defendible ante Cabildo, financiadores y auditoría.`,
    learns: [
      'Generación diaria de RSU por material, con fuente SEMARNAT/INEGI',
      'Índice de Preparación Ciudadana y encuesta de aceptación por tipo de vivienda',
      'Brechas del reglamento vigente y dictamen técnico de la reforma',
      'Costo de no actuar en 10 años y evaluación socioeconómica',
      'Teoría de cambio que conecta diagnóstico con planificación',
    ],
  },
  2: {
    body: ctx =>
      `Con el diagnóstico cerrado, este capítulo define la solución operativa: plan maestro con curva de captura, ruta crítica y oleadas territoriales; infraestructura de centros de acopio (${ctx.nCAs} CAs en el escenario activo), organigrama objetivo, logística y plan educativo; CAPEX/OPEX desglosado y mercado de materiales.\n\nSin costos no hay presupuesto. Sin organigrama no hay responsables. Sin mercado no hay ingresos. Aquí respondes lo que finanzas pregunta primero: cuánto cuesta, quién opera y a quién se vende el material recuperado.`,
    learns: [
      'Curva de captura bajo escenarios ambicioso, moderado y conservador',
      'Ruta crítica, oleadas territoriales y mix de centros de acopio P/M/G',
      'Organigrama del programa con roles, RACI y plantilla por tipo de CA',
      'CAPEX y OPEX con desglose de equipos, personal y contingencia',
      'Compradores y precios spot por fracción: PET, aluminio, papel, vidrio, composta',
    ],
  },
  3: {
    body: ctx =>
      `El Cabildo no vota la técnica: vota el modelo de negocio. Aquí respondes quién opera bajo cuatro esquemas (municipal, concesionado, APP, fideicomiso), presentas escenarios financieros con Monte Carlo — bajo el escenario base el municipio proyecta ${fmtMxn(ctx.ingresosMunicipio)} anuales y TIR ${fmtN(ctx.tir)}% —, mapeas caminos de financiamiento, evalúas riesgos y consolidas el expediente para sesión de Cabildo.\n\nAquí se detienen muchos programas: nadie contestó quién pone el capital, quién asume el riesgo operativo y cómo se reparte el ingreso.`,
    learns: [
      'Cuatro esquemas de concesión: capital, operación y reparto de ingresos',
      'Escenarios P10/P50/P90 de TIR y VPN con tornado de sensibilidad',
      'Seis caminos de financiamiento con elegibilidad y costo de capital',
      'Riesgos del modelo rankeados por probabilidad × impacto',
      'Expediente consolidado listo para presentación ante Cabildo',
    ],
  },
  4: {
    body: ctx =>
      `Este capítulo cubre operación y reporteo: inspección escalonada (educación → advertencia → sanción), monitoreo proyectado vs. real, doble materialidad GRI 306 / ESRS E5, trazabilidad de fuentes, control presupuestal (EVM y conciliación mensual) y tableros de riesgo con gate de cierre.\n\nEl programa proyecta evitar ${fmtN(ctx.co2e)} t CO₂e/año — dato usable ante fondos verdes. Cada cifra del simulador lleva fórmula, fuente y estado de verificación.`,
    learns: [
      'Inspección alineada al reglamento municipal vigente',
      'Semáforo proyectado vs. real del desempeño operativo',
      'Reporte GRI 306 / ESRS E5 con KPIs del simulador',
      'Trazabilidad: fórmula, fuente y nivel de certeza por dato',
      'Control presupuestal EVM y conciliación mensual',
      'Tablero de riesgos y gate de cierre del expediente',
    ],
  },
}

export function chapterModuleRange(ch: ChapterDef): string {
  const modulos = ch.modulos
  if (!modulos.length) return ''
  return `M${moduleNumber(modulos[0]!)} – M${moduleNumber(modulos[modulos.length - 1]!)}`
}

const CHAPTER_INDEX_SESSION_PREFIX = 'alquimia-ch-cover-dismissed-'

export function isChapterIndexDismissed(chapterNum: number): boolean {
  try {
    return sessionStorage.getItem(`${CHAPTER_INDEX_SESSION_PREFIX}${chapterNum}`) === '1'
  } catch {
    return false
  }
}

export function dismissChapterIndex(chapterNum: number): void {
  try {
    sessionStorage.setItem(`${CHAPTER_INDEX_SESSION_PREFIX}${chapterNum}`, '1')
  } catch {
    /* ignore */
  }
}

export const CHAPTER_PORTADA_INTRO: Record<
  1 | 2 | 3 | 4,
  (ctx: ChapterNarrativeContext) => string
> = {
  1: ctx =>
    `Antes de planificar, necesitas una foto clara de ${ctx.municipio}: qué legado RSU dejó la administración previa, cuánto genera hoy, quién participa y cuánto cuesta no actuar. El índice ordena ese diagnóstico por rubros.`,
  2: ctx =>
    `Con el diagnóstico cerrado, aquí dimensionas infraestructura (${ctx.nCAs} centros de acopio en el escenario activo), operación, costos y mercado. Sigue el orden sugerido o salta al rubro que ya tengas resuelto.`,
  3: ctx =>
    `El Cabildo decide el modelo de negocio: quién pone capital, quién opera y cómo se reparte el ingreso. Este capítulo cierra con el expediente listo para sesión.`,
  4: _ctx =>
    `Operación, cumplimiento y reporteo: inspección, monitoreo, doble materialidad y control presupuestal. Usa el índice para ubicarte en el rubro que estés auditando.`,
}

export function shouldForceChapterIndexEntry(
  fromModuleId: string | undefined,
  toModuleId: string,
): boolean {
  if (fromModuleId !== 'guia_circularidad') return false
  const chapter = getChapterForModule(toModuleId)
  return !!chapter && chapter.firstModuleId === toModuleId
}

export function shouldOfferChapterIndex(toModuleId: string): boolean {
  const chapter = getChapterForModule(toModuleId)
  if (!chapter || chapter.firstModuleId !== toModuleId) return false
  return !isChapterIndexDismissed(chapter.num)
}


export const CHAPTER_COUNT = CHAPTERS.length
