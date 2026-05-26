import type { MunicipioMadurezVista } from '@/lib/municipioMadurezContexto'
import { getCatalogChartBrief } from '@/data/chartBriefCatalog'
import {
  FUNCTIONARY_MODULE_ORDER,
  moduleNumber,
  resolveModuleId,
} from '@/lib/chapterConfig'
import { M00B_NEXT_ACTION, M01_NEXT_ACTION } from '@/lib/editorialRailLabels'

/**
 * Guía de estilo editorial (simulador funcionario):
 * - Cabildo = órgano colegiado; cabildo = sesión donde se presenta el expediente.
 * - Español institucional (usted); inglés solo en siglas normativas con glosa.
 * - Máx. 2 oraciones por párrafo en rail; evitar punto y coma encadenado.
 */
const MODULE_COUNT = FUNCTIONARY_MODULE_ORDER.length

function moduleRangeLabel(): string {
  const first = moduleNumber(FUNCTIONARY_MODULE_ORDER[0]!)
  const last = moduleNumber(FUNCTIONARY_MODULE_ORDER[MODULE_COUNT - 1]!)
  return `M${first}–M${last}`
}

/** Metodología estructurada en 4 secciones. Cada campo: 2–4 oraciones completas. */
export type MetodologiaEditorial = {
  como_se_calcula: string
  origen_datos: string
  por_que_este_enfoque: string
  supuesto_critico: string
}

/** Referencia académica o institucional que sustenta un cálculo específico. */
export type ChartReference = {
  clave: string      // "[SEMARNAT 2020]"
  texto: string      // autor/institución, año, título corto
  url?: string       // link público si existe
  tipo: 'oficial' | 'academico' | 'mercado' | 'normativo'
}

/** Brief metodológico por gráfica específica dentro de un módulo. */
export type ChartBrief = {
  chart_id: string                // debe coincidir con data-chart-id en el JSX
  chart_label: string             // "Composición del RSU"
  metodologia: MetodologiaEditorial
  referencias?: ChartReference[]
}

export type ModuleEditorialBrief = {
  moduleId: string
  title: string
  pregunta_guia: string           // pregunta que el usuario responde al completar el módulo
  subtitulo_catchy: string        // 1 línea descriptiva, lenguaje accesible
  situacion_actual: string
  observacion_alquimia: string
  criterio_decision: string
  que_no_significa: string
  siguiente_accion: string
  fuente_o_evidencia: string
  metodologia_editorial: MetodologiaEditorial
  chart_briefs: ChartBrief[]
}

export type ModuleEditorialContext = {
  territorio: string
  scope: 'sin_municipio' | 'municipio' | 'zm'
  municipio?: MunicipioMadurezVista | null
  municipiosCount: number
}

function scopeText(ctx: ModuleEditorialContext): string {
  if (ctx.scope === 'municipio' && ctx.municipio) {
    return `${ctx.municipio.nombre} se lee como municipio propio: reglamento, población, generación y madurez no se copian de otro ayuntamiento.`
  }
  if (ctx.scope === 'municipio') {
    return `${ctx.territorio} se lee como municipio propio: reglamento, población, generación y madurez no se copian de otro ayuntamiento.`
  }
  if (ctx.scope === 'zm') {
    return `${ctx.territorio} coordina una lectura territorial, pero cada municipio conserva reglamento, operación y responsabilidad propia.`
  }
  return 'Primero debe elegirse municipio para fijar reglamento, población y supuestos territoriales.'
}


export function getChartBrief(
  brief: ModuleEditorialBrief | null,
  chartId: string | null,
): ChartBrief | null {
  if (!chartId) return null
  const fromModule = brief?.chart_briefs.find((c) => c.chart_id === chartId)
  if (fromModule) return fromModule
  return getCatalogChartBrief(chartId)
}

export function getModuleEditorialBrief(moduleId: string, ctx: ModuleEditorialContext): ModuleEditorialBrief | null {
  const resolvedId = resolveModuleId(moduleId)
  const territorio = ctx.territorio
  const scope = scopeText(ctx)
  const normativa = ctx.municipio?.lineaNormativa
  const operativa = ctx.municipio?.lineaOperativa

  switch (resolvedId) {
    case 'guia_circularidad':
      return {
        moduleId: resolvedId,
        title: 'Pasos hacia la circularidad — Guía de lectura',
        pregunta_guia: '¿Sabe leer el simulador antes de usar sus cifras?',
        subtitulo_catchy: `Mapa de los ${MODULE_COUNT} módulos antes de entrar al diagnóstico técnico.`,
        situacion_actual: `ALQUIMIA aplica a cualquier municipio de México. Esta guía presenta los ${MODULE_COUNT} módulos del recorrido funcionario en cuatro capítulos, antes de elegir territorio en M01.`,
        observacion_alquimia: 'No hay gráficas ni cálculos aquí. Los ejemplos numéricos del cuerpo usan el escenario activo solo como ilustración. Cada módulo posterior trae su metodología en el panel lateral.',
        criterio_decision: 'Lectura recomendada antes del M01. No requiere decisión técnica ni territorio definido.',
        que_no_significa: 'No sustituye los módulos técnicos. Es el índice del expediente.',
        siguiente_accion: M00B_NEXT_ACTION,
        fuente_o_evidencia: 'Estructura modular ALQUIMIA (chapterConfig), estándares GRI 306 y ESRS E5.',
        metodologia_editorial: {
          como_se_calcula: 'Sin cálculos. Los números del hero (RSU, ingresos, CO₂e) se leen del estado actual del simulador.',
          origen_datos: `Datos en tiempo real de los módulos ${moduleRangeLabel()} una vez definido el territorio en M00B/M01.`,
          por_que_este_enfoque: 'Sin esta guía, las cifras del diagnóstico carecen de marco para Cabildo y financiadores.',
          supuesto_critico: 'Ninguno en este módulo. Los supuestos viven en cada módulo de cálculo.',
        },
        chart_briefs: [],
      }
    case 'antecedentes_municipales':
      return {
        moduleId: resolvedId,
        title: 'Qué intentó el municipio antes de este programa',
        pregunta_guia: '¿Qué legado RSU deja la administración previa — operadores, concesiones y programas?',
        subtitulo_catchy: 'Cronología documentada antes de abrir la línea base numérica.',
        situacion_actual: `En ${territorio}, conviene saber qué concesiones, campañas o conflictos precedieron al diagnóstico actual. Sin ese contexto, el Cabildo repite errores ya pagados.`,
        observacion_alquimia: 'ALQUIMIA investiga automáticamente al elegir municipio: hitos con tier de fuente (T1–T3), lecciones explícitas y vacíos marcados para verificación en archivo municipal.',
        criterio_decision: 'Use este módulo para contextualizar la propuesta: qué heredar, qué cerrar y qué verificar antes de comprometer esquema operativo.',
        que_no_significa: 'No es dictamen legal, crónica periodística sin URL ni sustituto del reglamento vigente (M03B).',
        siguiente_accion: M01_NEXT_ACTION,
        fuente_o_evidencia: 'Research Serper + tiers T1–T3 (Navigator). Cada hito lleva URL o marca VERIFICAR.',
        metodologia_editorial: {
          como_se_calcula: 'Sin modelado numérico. El reportaje agrega eventos de fuentes públicas clasificadas por tier y confianza.',
          origen_datos: 'Consultas automáticas al cambiar municipio activo; prioridad a `.gob.mx`, INEGI, SEMARNAT y medios locales citables.',
          por_que_este_enfoque: 'La línea base (M01) mide el presente; los antecedentes evitan proponer lo que el municipio ya descartó o fracasó.',
          supuesto_critico: 'Un antecedente sin fuente citada es anécdota — no entra al argumento de Cabildo hasta verificarse.',
        },
        chart_briefs: [],
      }
    case 'city_baseline':
      return {
        moduleId: resolvedId,
        title: 'El problema en números: cuánto generamos y cuánto perdemos',
        pregunta_guia: '¿Cuánto RSU genera el municipio y cuánto valor se pierde hoy?',
        subtitulo_catchy: '¿Cuántos kilos genera este municipio y qué valor deja de capturarse hoy?',
        situacion_actual: `En ${territorio}, el punto de partida es entender cuánto RSU se genera, cuánto se puede separar y qué costo público aparece cuando todo llega mezclado.`,
        observacion_alquimia: `${scope} El simulador cruza vivienda INEGI, generación per cápita SEMARNAT, composición, precios spot y costo de disposición. Cada supuesto es editable y visible.`,
        criterio_decision: 'Antes de hablar de metas, el equipo debe ajustar generación, vivienda, captura, merma y precios para que la conversación empiece desde un escenario defendible.',
        que_no_significa: 'No es estadística municipal cerrada, cifra autorizada ni medición de campo. Es una lectura inicial con fuentes y supuestos visibles.',
        siguiente_accion: 'Ajustar los supuestos principales y revisar la matriz de fuentes antes de usar cualquier cifra en presentación pública.',
        fuente_o_evidencia: 'INEGI, matriz de bibliografía y cálculos, precios documentales y motor del simulador.',
        metodologia_editorial: {
          como_se_calcula: 'La generación total = población × tasa per cápita (kg/hab/día). El ingreso potencial = toneladas desviadas × precio spot × (1 − merma). Ambas fórmulas son visibles y editables en los sliders del panel superior.',
          origen_datos: 'La tasa per cápita viene del Diagnóstico Básico SEMARNAT 2020. La población viene del Censo INEGI 2020. Los precios provienen de cotizaciones del mercado secundario mexicano verificadas con compradores industriales activos.',
          por_que_este_enfoque: 'ALQUIMIA usa la tasa nacional ajustada por estrato urbano —no el pesaje municipal— porque los registros locales de báscula son escasos, no auditados y raramente comparables entre municipios.',
          supuesto_critico: 'La tasa de captura es el supuesto que más mueve todos los números en cascada. Modificarla un punto porcentual cambia toneladas, ingresos, costo evitado de disposición y emisiones evitadas al mismo tiempo.',
        },
        chart_briefs: [
          {
            chart_id: 'volumen-rsu',
            chart_label: 'Volumen y derrama económica',
            metodologia: {
              como_se_calcula: 'RSU total/día = población activa × gen_percapita. Material capturable/día = RSU total × tasa_captura × (1 − merma). Ingreso anual = material capturable × precio_promedio_ponderado × 365.',
              origen_datos: 'Población: INEGI Censo 2020. Tasa per cápita: SEMARNAT DBGIR 2020, estrato ciudad media 0.90 kg/hab/día. Precios: cotizaciones mercado secundario México 2025.',
              por_que_este_enfoque: 'El estrato urbano importa: una ciudad grande genera hasta 15% más por habitante que una ciudad media. Usar la tasa nacional sin estratificación sobreestima el potencial de municipios rurales y subestima el de zonas metropolitanas.',
              supuesto_critico: 'La tasa de captura. Actualmente pre-cargada al escenario activo. Subirla 5 puntos puede duplicar el ingreso proyectado — por eso es el primer número que un auditor debe preguntar.',
            },
            referencias: [
              { clave: '[SEMARNAT 2020]', texto: 'SEMARNAT. Diagnóstico Básico para la Gestión Integral de los Residuos. México, 2020.', url: 'https://www.gob.mx/semarnat/documentos/diagnostico-basico-para-la-gestion-integral-de-los-residuos', tipo: 'oficial' },
              { clave: '[INEGI 2020]', texto: 'INEGI. Censo de Población y Vivienda 2020.', url: 'https://www.inegi.org.mx/programas/ccpv/2020/', tipo: 'oficial' },
            ],
          },
          {
            chart_id: 'trayectoria-captura',
            chart_label: 'Trayectoria de captura',
            metodologia: {
              como_se_calcula: 'La curva muestra el % de captura por año del horizonte seleccionado. Cada punto = pctCapturaPorAño[año] configurado en el plan. La línea sube gradualmente porque los programas municipales requieren tiempo para instalación, sensibilización y hábito ciudadano.',
              origen_datos: 'Curva de adopción basada en análisis comparativo de programas RSU en ciudades medias de México documentados por SEMARNAT 2018–2023.',
              por_que_este_enfoque: 'Un arranque lineal (mismo % cada año) sobreestima resultados tempranos y subestima el efecto de masa crítica en años 3–4. La curva en S refleja mejor la realidad operativa municipal.',
              supuesto_critico: 'El porcentaje de captura al final del horizonte. Los primeros años son lentos. El salto ocurre cuando la separación en origen ya es hábito en la colonia piloto.',
            },
          },
          {
            chart_id: 'composicion-rsu',
            chart_label: 'Composición del RSU',
            metodologia: {
              como_se_calcula: 'El donut muestra la distribución porcentual por fracción del RSU. Es una referencia nacional fija (SEMARNAT), no una medición de campo del municipio activo. Se usa para calcular el volumen por material y su precio en mercado secundario.',
              origen_datos: 'SEMARNAT. Diagnóstico Básico para la Gestión Integral de los Residuos 2020. Composición nacional promedio para ciudades medias mexicanas.',
              por_que_este_enfoque: 'La composición varía ±5–8% entre municipios. Sin caracterización de residuos local, la referencia SEMARNAT es la fuente más defendible y comparable. El modelo lo declara explícitamente en la matriz de fuentes.',
              supuesto_critico: 'El % de orgánicos (52%). Si el municipio tiene menos orgánicos y más plástico, el ingreso potencial sube porque plástico vale más por kg que composta.',
            },
            referencias: [
              { clave: '[SEMARNAT 2020]', texto: 'SEMARNAT. Diagnóstico Básico para la Gestión Integral de los Residuos. México, 2020.', url: 'https://www.gob.mx/semarnat/documentos/diagnostico-basico-para-la-gestion-integral-de-los-residuos', tipo: 'oficial' },
              { clave: '[Rodríguez-Salinas 2020]', texto: 'Rodríguez-Salinas, M.A. et al. Municipal solid waste characterization in Mexican medium cities. Waste Management & Research, 2020.', tipo: 'academico' },
            ],
          },
          {
            chart_id: 'impactos-acumulados',
            chart_label: 'Impactos acumulados',
            metodologia: {
              como_se_calcula: 'CO₂e evitadas = toneladas_desviadas × factor_emision_disposicion × GWP_CH4. Factor de emisión para relleno sanitario típico México: 0.52 tCO₂e/ton RSU (INECC 2024). GWP₁₀₀ CH₄ = 27.9 (IPCC AR6 2021).',
              origen_datos: 'INECC. Factores de emisión para residuos sólidos urbanos, México, 2024. IPCC Sixth Assessment Report (AR6), 2021.',
              por_que_este_enfoque: 'El CO₂e es la métrica internacional estándar para reportar impacto ambiental. Permite comparar el programa con metas climáticas municipales y eventualmente acceder a mercados de carbono voluntario.',
              supuesto_critico: 'El factor de emisión del relleno sanitario. Si el relleno tiene captura de biogás activa, el factor baja hasta 0.18 tCO₂e/ton y el beneficio ambiental se reduce significativamente.',
            },
            referencias: [
              { clave: '[INECC 2024]', texto: 'INECC. Factores de emisión para residuos sólidos urbanos, México, 2024.', url: 'https://www.gob.mx/inecc', tipo: 'oficial' },
              { clave: '[IPCC AR6 2021]', texto: 'IPCC. Sixth Assessment Report (AR6). Chapter 7: The Earth\'s Energy Budget. GWP₁₀₀ CH₄ = 27.9. 2021.', url: 'https://www.ipcc.ch/report/ar6/wg1/', tipo: 'academico' },
            ],
          },
        ],
      }

    case 'social_encuesta':
      return {
        moduleId: resolvedId,
        title: 'Encuesta de aceptación y preparación ciudadana',
        pregunta_guia: '¿La ciudadanía está lista para separar y en qué colonias no?',
        subtitulo_catchy: 'IPC y barreras reales — con o sin datos de campo del municipio',
        situacion_actual: `El diseño de participación en ${territorio} requiere medir disposición a separar, no asumirla homogénea en toda la ZM.`,
        observacion_alquimia: `${scope} Sin encuesta local, el IPC usa benchmark nacional documentado. Con encuesta, los valores de campo sustituyen el proxy con trazabilidad explícita.`,
        criterio_decision: 'Priorizar colonias y mensajes según IPC segmentado antes de fijar metas de captura ante Cabildo.',
        que_no_significa: 'No es consulta ciudadana vinculante ni padrón de beneficiarios del programa.',
        siguiente_accion: 'Cargar resultados de campo o documentar que se usa benchmark hasta tener n≥30 respuestas.',
        fuente_o_evidencia: 'Endpoint encuesta ALQUIMIA, SEMARNAT 2022, matriz de riesgos sociales.',
        metodologia_editorial: {
          como_se_calcula: 'IPC global y por segmento (condominio vs vía pública) desde respuestas ponderadas o benchmark 70 si null.',
          origen_datos: 'Encuesta municipal o benchmark SEMARNAT documentado en el módulo.',
          por_que_este_enfoque: 'La aceptación condiciona la curva de captura más que la infraestructura en años 1–2.',
          supuesto_critico: 'Representatividad de la muestra — una encuesta en colonias de alto ingreso no generaliza al municipio.',
        },
        chart_briefs: [],
      }

    case 'mapeo_actores':
      return {
        moduleId: resolvedId,
        title: 'Mapa de actores y legitimidad política',
        pregunta_guia: '¿Quién debe estar en la mesa antes de comprometer el programa?',
        subtitulo_catchy: 'Pepenadores, concesionario, Cabildo y sociedad civil — mapa previo al arranque',
        situacion_actual: `En ${territorio}, los programas RSU fracasan con frecuencia por actores ausentes o en conflicto, no por falta de tecnología.`,
        observacion_alquimia: `${scope} El mapeo es cualitativo y editable. No sustituye análisis político ni convenios formales.`,
        criterio_decision: 'Identificar bloqueadores y aliados con estrategia de incorporación antes de licitar o reformar reglamento.',
        que_no_significa: 'No es registro de partidos, ni diagnóstico electoral oficial, ni acta de Cabildo.',
        siguiente_accion: 'Completar fichas de actores críticos y definir primer encuentro facilitado.',
        fuente_o_evidencia: 'Proyecto Vivo ALQUIMIA, literatura de programas RSU LATAM 2010–2024.',
        metodologia_editorial: {
          como_se_calcula: 'Matriz poder/interés + rutas de influencia documentadas por el equipo consultor.',
          origen_datos: 'Entrevistas de campo, actas públicas, contratos de limpia visibles.',
          por_que_este_enfoque: 'El riesgo político pondera 40% en el score de riesgo del simulador por evidencia histórica municipal.',
          supuesto_critico: 'Honestidad del equipo al marcar resistencia interna — omitir al concesionario invalida el mapa.',
        },
        chart_briefs: [],
      }

    case 'organigrama_diagnostico':
      return {
        moduleId: resolvedId,
        title: 'Organigrama actual — gobernanza operativa as-is',
        pregunta_guia: '¿Quién decide hoy desde la queja ciudadana hasta Cabildo?',
        subtitulo_catchy: 'Municipio y concesionario sin suposiciones — checklist de campo persistido',
        situacion_actual: `Antes de diseñar el organigrama objetivo (M07), ${territorio} debe documentar titularidades reales de limpia, ecología, tesorería y operador.`,
        observacion_alquimia: `${scope} Las verificaciones y checklist se guardan en el simulador. Hasta validar en campo, la plantilla es referencia metodológica, no organigrama oficial.`,
        criterio_decision: 'Cerrar vacíos de titular y de interfaz municipio–operador antes de comprometer CAPEX o reforma reglamentaria.',
        que_no_significa: 'No es el organigrama aprobado por RH ni la estructura objetivo del programa.',
        siguiente_accion: 'Completar checklist de campo y marcar nodos confirmados. Luego abrir M07 Planificación.',
        fuente_o_evidencia: 'Plantilla ALQUIMIA M02D, organigramas PDF municipio/concesionario, contrato de limpia.',
        metodologia_editorial: {
          como_se_calcula: 'KPI % confirmados = nodos con estatus confirmado / total nodos mapeados. Checklist = ítems marcados por el equipo.',
          origen_datos: 'Validación en campo. Persistencia local del simulador.',
          por_que_este_enfoque: 'Sin dueño operativo identificado, el programa no tiene quién firme bitácora PER ni reportes GRI.',
          supuesto_critico: 'Actualización del contrato de concesión — define si el operador puede o no ejecutar separación.',
        },
        chart_briefs: [],
      }

    case 'capacidad_institucional':
      return {
        moduleId: resolvedId,
        title: 'Capacidad institucional y habilitación ÁGORA',
        pregunta_guia: '¿El municipio puede ejecutar y generar plan hoy?',
        subtitulo_catchy: 'Madurez institucional, diagnóstico jurídico y bloqueos antes de planear',
        situacion_actual: `${territorio} puede tener diagnóstico técnico sólido y aun así carecer de capacidad administrativa o marco habilitante para operar.`,
        observacion_alquimia: `${scope} El semáforo ÁGORA refleja el diagnóstico jurídico cargado — no es dictamen de autoridad.`,
        criterio_decision: 'Desbloquear requisitos jurídicos mínimos antes de prometer fechas de arranque ante Cabildo.',
        que_no_significa: 'No certifica madurez institucional ni autoriza erogaciones.',
        siguiente_accion: 'Completar diagnóstico jurídico y revisar madurez institucional documentada.',
        fuente_o_evidencia: 'DiagnosticoJuridico, reglamento municipal, LGPGIR.',
        metodologia_editorial: {
          como_se_calcula: 'Gate legal = checklist de artículos operables vs vacíos detectados en M03B.',
          origen_datos: 'Reglamento cargado, manifest de fuentes.',
          por_que_este_enfoque: 'Evita generar planes ÁGORA sobre supuestos que el área jurídica aún no habilita.',
          supuesto_critico: 'Vigencia y completitud del reglamento municipal analizado.',
        },
        chart_briefs: [],
      }

    case 'marco_legal':
    case 'municipal_context':
      return {
        moduleId: resolvedId,
        title: 'El reglamento que habilita o bloquea el programa',
        pregunta_guia: '¿El reglamento actual permite operar el programa o necesita reforma?',
        subtitulo_catchy: 'El marco legal que lo frena o lo habilita todo — qué dice el reglamento hoy',
        situacion_actual: normativa ?? `${territorio} requiere lectura municipal del reglamento aplicable antes de convertir el programa en obligaciones locales.`,
        observacion_alquimia: `${scope} La brecha no suele estar en que falten principios federales, sino en traducirlos a reglas municipales operables: separación, contenedores, rutas, evidencia y responsabilidades.`,
        criterio_decision: 'El equipo debe alinear indicadores sociodemográficos de referencia con el reglamento: qué puede ejecutarse hoy y qué requiere reforma, lineamiento o revisión jurídica competente.',
        que_no_significa: 'No es resolución de autoridad, acto administrativo ni validación jurídica definitiva.',
        siguiente_accion: 'Abrir la fuente municipal, revisar artículos relevantes y separar propuesta expositiva de documento aprobable.',
        fuente_o_evidencia: 'Reglamento municipal localizado, manifest de fuente, diagnóstico legal y mapa de inserción normativa.',
        metodologia_editorial: {
          como_se_calcula: 'La tabla de obligaciones operables se construye cruzando los artículos del reglamento municipal con una taxonomía de acciones concretas: separación en origen, contenedor, frecuencia, evidencia documental y sanción. El resultado es una matriz "puede ejecutarse hoy" vs "requiere reforma".',
          origen_datos: 'Los indicadores sociodemográficos provienen del Censo INEGI 2020 y la delimitación de zonas metropolitanas de CONAPO. El reglamento se carga directamente desde la fuente municipal oficial.',
          por_que_este_enfoque: 'ALQUIMIA mapea artículos a acciones concretas —no solo cita el reglamento— porque presentar una obligación como vigente cuando requiere reforma paraliza al equipo jurídico y retrasa la operación.',
          supuesto_critico: 'La fecha de actualización del reglamento. Uno anterior a 2014 generalmente no contempla separación diferenciada ni contenedores de color, convirtiendo acciones centrales del programa en propuestas pendientes.',
        },
        chart_briefs: [
          {
            chart_id: 'diagnostico-juridico',
            chart_label: 'Diagnóstico jurídico',
            metodologia: {
              como_se_calcula: 'Cada vacío jurídico = artículo del reglamento que no cubre una obligación operativa del LGPGIR. La cobertura normativa % = artículos operables / total artículos revisados × 100.',
              origen_datos: 'LGPGIR (DOF 2003, última reforma 2022). Reglamento municipal activo cargado en el módulo.',
              por_que_este_enfoque: 'Identificar vacíos antes de operar evita conflictos administrativos. Un vacío no detectado puede invalidar una multa o un convenio de separación.',
              supuesto_critico: 'La completitud del reglamento cargado. Si el documento está desactualizado o incompleto, la cobertura se sobreestima.',
            },
          },
          {
            chart_id: 'cobertura-normativa',
            chart_label: 'Cobertura normativa',
            metodologia: {
              como_se_calcula: 'Arco de cobertura = suma de artículos con obligación operable ÷ total de artículos clave LGPGIR × 100. Meta mínima recomendada: 85%.',
              origen_datos: 'Artículos clave del LGPGIR: 10, 17, 18, 19, 22, 25, 28, 36, 95–103. Lista actualizada con la última reforma DOF 2022.',
              por_que_este_enfoque: 'El porcentaje convierte el análisis jurídico en un KPI comparable entre municipios y entre años, facilitando el seguimiento del avance normativo.',
              supuesto_critico: 'El criterio de "operable": un artículo se clasifica operable solo si tiene resolución, lineamiento o reglamento de aplicación vigente en el municipio.',
            },
          },
        ],
      }

    case 'cobertura_territorial':
      return {
        moduleId: resolvedId,
        title: 'Cobertura territorial y alcance del programa',
        pregunta_guia: '¿Dónde aplica el programa y con qué delimitación oficial?',
        subtitulo_catchy: 'Municipio propio vs ZM — sin mezclar jurisdicciones en una sola decisión',
        situacion_actual: `La lectura territorial de ${territorio} debe usar límites y fuentes oficiales antes de fijar colonias piloto o inversión.`,
        observacion_alquimia: `${scope} INEGI MGN es referencia para límites. OSM no sustituye documentos oficiales. Métricas de área en SLP/NL/QRO usan EPSG:6369, no 3857.`,
        criterio_decision: 'Fijar alcance municipal explícito para sanción y operación. Usar ZM solo para coordinación, no para mezclar reglamentos.',
        que_no_significa: 'No redefine límites municipales ni sustituye plan de desarrollo urbano.',
        siguiente_accion: 'Confirmar municipio ancla y colonias dentro del polígono oficial antes de oleadas territoriales.',
        fuente_o_evidencia: 'INEGI Marco Geoestadístico, CONAPO ZM, capas ALQUIMIA.',
        metodologia_editorial: {
          como_se_calcula: 'Superposición de polígonos municipales y capas de cobertura de servicio documentadas.',
          origen_datos: 'INEGI MGN, selección municipio catálogo ALQUIMIA.',
          por_que_este_enfoque: 'El simulador marca incoherencia cuando se mezclan decisiones de Municipio y ZM sin etiquetar alcance.',
          supuesto_critico: 'Municipio activo en el selector — sin ancla, los supuestos son proxy ZM.',
        },
        chart_briefs: [],
      }

    case 'dictamen_tecnico':
      return {
        moduleId: resolvedId,
        title: 'Por qué esta reforma y no otra',
        pregunta_guia: '¿Por qué 5 fracciones, multas graduadas y condominios primero — y no alternativas más simples?',
        subtitulo_catchy: 'El dictamen que convierte propuesta en evidencia — lo que el regidor preguntará en Cabildo',
        situacion_actual: `${territorio} propone adendos concretos al reglamento. Sin dictamen técnico la reforma carece de sustento formal ante Cabildo.`,
        observacion_alquimia: `${scope} Cada adendo tiene un "por qué" documentado: contaminación de la corriente, economía del material, proporcionalidad constitucional y precedentes internacionales.`,
        criterio_decision: 'El síndico y la Dirección de Ecología deben poder defender cada artículo propuesto con al menos una fuente verificable y una objeción anticipada respondida.',
        que_no_significa: 'No es resolución administrativa, dictamen jurídico vinculante ni pronunciamiento de autoridad competente.',
        siguiente_accion: 'Anexar al punto de acuerdo de Cabildo junto con los textos de adendo del M03B.',
        fuente_o_evidencia: 'NOM-161, WRAP/ISWA, Kahneman, Lally et al., benchmarks Ljubljana/SF/Bogotá/CDMX, materialPriceResearch.ts.',
        metodologia_editorial: {
          como_se_calcula: 'Cada sección vincula un adendo (1–6) con evidencia técnica o social. El delta económico 5 vs. 3 fracciones = volumen capturable × precio por material × (1 − tasa de contaminación) × 365 días.',
          origen_datos: 'Precios de materialPriceResearch.ts; volúmenes del escenario activo (resultados.volCapturablePorMat); benchmarks de dictamenTecnicoEvidence.ts.',
          por_que_este_enfoque: 'Un regidor no vota texto legal sin saber por qué 5 fracciones y no 3. El dictamen anticipa objeciones y las responde con fuente documentada.',
          supuesto_critico: 'La calidad del escenario activo. Sin cálculo en M01, el argumento económico queda genérico. Con escenario, se personaliza por composición RSU del municipio.',
        },
        chart_briefs: [
          {
            chart_id: 'dictamen-captura-5v3',
            chart_label: 'Valor de captura: 5 vs. 3 fracciones',
            metodologia: {
              como_se_calcula: 'Compara ingreso anual por material valorizable aplicando tasa de contaminación del 12% (5 fracciones) vs. 25% (3 fracciones) sobre volCapturablePorMat × precio/kg × 365.',
              origen_datos: 'materialPriceResearch.ts + resultados del simulador activo.',
              por_que_este_enfoque: 'Traduce la decisión normativa en pesos — el lenguaje que entiende el tesorero y el regidor de hacienda.',
              supuesto_critico: 'Precios de mercado documentales, no cotizaciones en vivo. Requieren validación local antes de presupuesto.',
            },
            referencias: [
              { clave: '[WRAP 2019]', texto: 'WRAP. Contamination in Recyclables Collections.', tipo: 'academico' },
            ],
          },
          {
            chart_id: 'dictamen-benchmarks',
            chart_label: 'Benchmarks internacionales',
            metodologia: {
              como_se_calcula: 'Tabla comparativa de ciudades con esquema de separación, tasa de desvío documentada y nota de cumplimiento.',
              origen_datos: 'SNAGA, SF Environment, UAESP Bogotá, SEDEMA CDMX, gobiernos locales.',
              por_que_este_enfoque: 'Demuestra que la propuesta no se inventó en vacío — adapta lecciones de ciudades comparables.',
              supuesto_critico: 'Las tasas de desvío incluyen definiciones distintas de "recuperación". No son comparables 1:1 sin ajuste metodológico.',
            },
          },
        ],
      }

    case 'roadmap_implementacion':
      return {
        moduleId: resolvedId,
        title: 'Las 5 fases que gobiernan la implementación municipal',
        pregunta_guia: '¿En qué fase institucional estamos y qué actividades y prerequisitos corresponden?',
        subtitulo_catchy: 'G1–G5: de Cabildo a cobertura total en 24 meses',
        situacion_actual: `Sin una narrativa de fases clara, ${territorio} mezcla hitos políticos (Cabildo, concesión) con tareas operativas (obra, rutas) y pierde el hilo de control.`,
        observacion_alquimia: `${scope} KRONOS unifica gates G1–G5 con actividades T01–T15 y riesgos R01–R06 por fase.`,
        criterio_decision: 'Confirmar gate actual, prerequisitos abiertos y actividades de la fase antes de avanzar al detalle Gantt o a operación.',
        que_no_significa: 'No sustituye el acta de Cabildo, contrato de concesión ni reporte EVM — es la brújula de implementación.',
        siguiente_accion: 'Revisar prerequisitos de la fase seleccionada y validar en M21B antes de cerrar el gate.',
        fuente_o_evidencia: 'GATE_DEFINITIONS KRONOS, Gantt builder T01–T15, registro de riesgos R01–R06.',
        metodologia_editorial: {
          como_se_calcula: 'Cada fase G1–G5 merge definiciones institucionales con actividades T01–T15 (campo fase_gate) y riesgos por gate_afectado.',
          origen_datos: 'backend/app/planning/narrative.py, gate_tracker.py, builder.py, risk_register.py.',
          por_que_este_enfoque: 'Una sola vista evita confundir gates institucionales (G1–G5) con actividades Gantt (G01–G14).',
          supuesto_critico: 'El gate actual se infiere del primer gate no cruzado; en Fase 0–1 todos pueden estar NO_INICIADO.',
        },
        chart_briefs: [],
      }

    case 'plan_maestro':
      return {
        moduleId: resolvedId,
        title: 'El calendario que convierte las metas en acciones concretas',
        pregunta_guia: '¿Cuándo arranca cada fase y cuáles hitos son críticos para el programa?',
        subtitulo_catchy: 'Del diagnóstico al calendario: cuándo, quién y cuánto cuesta arrancar',
        situacion_actual: `Las metas de ${territorio} solo sirven si se vuelven calendario, dependencias y capacidad. Una meta sin tiempo ni responsable se queda en aspiración.`,
        observacion_alquimia: `${scope} El Gantt/PERT traduce captura, centros de acopio, empleos y emisiones a meses, hitos y riesgo de atraso.`,
        criterio_decision: 'Decidir si el horizonte elegido es compatible con capacidad instalada, colonias piloto, municipios activos y curva de captura.',
        que_no_significa: 'No es calendario de Cabildo, contrato de obra ni programa de inversión autorizado.',
        siguiente_accion: 'Revisar hitos críticos, capacidad y advertencias antes de mover el plan a operación territorial.',
        fuente_o_evidencia: 'Hitos PERT del catálogo, horizonte del plan, curva de captura y serie municipal de implementación.',
        metodologia_editorial: {
          como_se_calcula: 'Cada tarea del Gantt usa la fórmula β-PERT: duración esperada = (t_optimista + 4 × t_probable + t_pesimista) ÷ 6. La desviación estándar = (t_pesimista − t_optimista) ÷ 6. La ruta crítica es la cadena de tareas con holgura cero.',
          origen_datos: 'Los tres estimados de duración por tarea provienen del catálogo de hitos de ALQUIMIA, calibrado con tiempos documentados en programas municipales comparables. El RACI sigue la estructura estándar PMBOK 6ª ed.',
          por_que_este_enfoque: 'ALQUIMIA usa PERT en lugar de un calendario fijo porque la implementación municipal tiene incertidumbre alta en permisos, licitaciones y arranque político. PERT convierte esa incertidumbre en duración probabilística visible.',
          supuesto_critico: 'El horizonte en semanas. Acortarlo concentra hitos simultáneos y eleva el riesgo de colisión de capacidad. Extenderlo diluye el impacto político de los primeros resultados ante el Cabildo.',
        },
        chart_briefs: [
          {
            chart_id: 'gantt-maestro',
            chart_label: 'Gantt maestro',
            metodologia: {
              como_se_calcula: 'Las barras representan duración esperada (β-PERT). Las barras rojas = ruta crítica (holgura = 0). El costo de cada tarea = fracción del CAPEX total: diseño 5%, infraestructura 55%, flota 25%, sensibilización 5%, tecnología 10%.',
              origen_datos: 'Catálogo de hitos ALQUIMIA. Fracciones de costo calibradas con proyectos SEMARNAT-BID en ciudades medias 2018–2023.',
              por_que_este_enfoque: 'La distribución de costos por fase permite detectar si el municipio puede financiar la fase crítica sin esperar el desembolso completo.',
              supuesto_critico: 'El número de centros de acopio activos. Cada CA agrega 3 semanas a la fase de infraestructura según la fórmula: dur_infra = max(8, n_cas × 3).',
            },
          },
          {
            chart_id: 'pert-ruta-critica',
            chart_label: 'PERT — Ruta crítica',
            metodologia: {
              como_se_calcula: 'Red de precedencias con cálculo hacia adelante (ES, EF) y hacia atrás (LS, LF). Holgura = LS − ES. Tareas con holgura ≤ 0 son críticas. La varianza total del proyecto = Σ(sigma²) de tareas críticas.',
              origen_datos: 'Dependencias definidas en el catálogo de hitos. Estimados t_o / t_m / t_p documentados por tipo de tarea municipal.',
              por_que_este_enfoque: 'PERT cuantifica el riesgo de retraso en lugar de ignorarlo. Permite al municipio enfocar supervisión en las tareas críticas y negociar plazos con mayor información.',
              supuesto_critico: 'Los estimados pesimistas (t_p). Si los trámites de permiso o licitación toman el doble de lo previsto —común en municipios con capacidad administrativa baja— el proyecto se desplaza 4–8 semanas.',
            },
          },
        ],
      }

    case 'infraestructura':
      return {
        moduleId: resolvedId,
        title: 'Infraestructura y operación: dónde, con qué y con quién',
        pregunta_guia: '¿Cuántos centros de acopio se necesitan y dónde deben ubicarse?',
        subtitulo_catchy: 'Dónde van los centros, qué flota los mueve y quién responde por cada colonia',
        situacion_actual: operativa ?? `La operación en ${territorio} necesita convertir toneladas capturables en centros, rutas, responsables, frecuencia y bitácora.`,
        observacion_alquimia: `${scope} La infraestructura no se justifica por tamaño de ciudad, sino por brecha entre material capturable, capacidad real y logística verificable.`,
        criterio_decision: 'Definir qué capacidad se instala, en qué oleada, con qué rutas y con qué evidencia mensual para sostener el programa.',
        que_no_significa: 'No asigna predios, no aprueba ubicaciones y no sustituye validación de uso de suelo, tránsito o contratación.',
        siguiente_accion: 'Contrastar capacidad propuesta con zonas, rutas, bitácora PER y responsables operativos.',
        fuente_o_evidencia: 'CA_CONFIG, plan territorial, operación PER, rutas, bitácora y flujo material.',
        metodologia_editorial: {
          como_se_calcula: 'Capacidad requerida = toneladas capturables del M01 ÷ días operativos ÷ rendimiento por turno por CA. Las rutas distribuyen la carga entre centros activos minimizando el tiempo de llenado estimado por colonia piloto.',
          origen_datos: 'Parámetros de rendimiento por turno y metros cúbicos de procesamiento: especificaciones operativas SEMARNAT y Asociación Nacional de Empresas de Reciclaje.',
          por_que_este_enfoque: 'ALQUIMIA dimensiona desde la brecha de flujo material —no desde el tamaño de la ciudad— porque el error más común es instalar capacidad por analogía sin considerar la tasa de captura real del escenario.',
          supuesto_critico: 'El número de centros activos. Encender o apagar un CA redistribuye todas las rutas del mapa y puede cambiar completamente la viabilidad de una colonia.',
        },
        chart_briefs: [
          {
            chart_id: 'mapa-centros-acopio',
            chart_label: 'Mapa de centros de acopio',
            metodologia: {
              como_se_calcula: 'Cada punto en el mapa = un centro de acopio con coordenadas lat/lon. El radio de influencia = sqrt(toneladas_por_dia / (densidad_poblacional × tasa_captura × π)). Los puntos con datos reales vienen de Google Places o DENUE. Los demás son propuestas del modelo.',
              origen_datos: 'Google Places API (fuente=places_api) o INEGI DENUE (fuente=denue) para centros existentes. Coordenadas propuestas calculadas por el motor de optimización ALQUIMIA.',
              por_que_este_enfoque: 'La ubicación geográfica afecta la tasa de captura directamente: un CA a más de 2km de la zona de generación reduce la participación ciudadana hasta un 40% según estudios de accesibilidad.',
              supuesto_critico: 'La fuente de los puntos del mapa. Los puntos de propuesta son simulación —no predios confirmados. La leyenda indica qué es verificado y qué es simulado.',
            },
          },
        ],
      }

    case 'mercado_materiales':
      return {
        moduleId: resolvedId,
        title: 'El mercado secundario: compradores, precios y riesgo documentado',
        pregunta_guia: '¿A quién se le vende el material recuperado y a qué precio documentado?',
        subtitulo_catchy: 'A quién le vendemos, a qué precio real y con qué riesgo de mercado',
        situacion_actual: `Los resultados numéricos de ${territorio} requieren identificar qué variable los mueve y qué supuestos de mercado los sostienen.`,
        observacion_alquimia: `${scope} El grafo causal enlaza KPIs, fórmulas y fuentes: permite ver riesgo de interpretación antes de presentar el escenario como lectura única.`,
        criterio_decision: 'Validar que compradores, precios y volúmenes sean coherentes con el baseline. Reconstruir el grafo tras cambiar supuestos sensibles.',
        que_no_significa: 'No constituye valoración vinculante de mercado, contrato con offtakers ni garantía de demanda.',
        siguiente_accion: 'Construir o reconstruir el grafo causal y cerrar warnings de mercado antes del módulo de escenarios y exportación.',
        fuente_o_evidencia: 'Motor del simulador, resúmenes de mercado, DataProvenance y nodos del razonamiento trazado.',
        metodologia_editorial: {
          como_se_calcula: 'Ingreso directo = Σ(toneladas_material × precio_spot × (1 − merma_material)) para cada fracción separada. El grafo causal muestra cada nodo intermedio con su fórmula y fuente.',
          origen_datos: 'Precios: cotizaciones del mercado secundario mexicano con compradores industriales activos en PET, HDPE, cartón y vidrio. Coeficientes de merma: INECC sector reciclador nacional.',
          por_que_este_enfoque: 'ALQUIMIA muestra el grafo completo —no solo el número final— porque el riesgo está en los nodos intermedios: cambiar el precio sin recalcular la merma produce resultados que parecen coherentes pero no lo son.',
          supuesto_critico: 'El precio del PET. Su volatilidad trimestral explica históricamente más del 60% de la varianza del ingreso total en escenarios de alta captura.',
        },
        chart_briefs: [
          {
            chart_id: 'precio-materiales',
            chart_label: 'Precios por material',
            metodologia: {
              como_se_calcula: 'Los rangos de precio (min/max) por material provienen de `PRECIOS_RANGO` en constants.ts. El slider permite editar el precio dentro del rango documentado. Precio × toneladas = ingreso bruto antes de merma.',
              origen_datos: 'Investigación de precios RSU México 2025 documentada en fuentes de calculo/Investigacion_Precios_RSU_SLP.xlsx. Actualización trimestral recomendada.',
              por_que_este_enfoque: 'Los precios del mercado secundario fluctúan ±20–35% anualmente. Usar un precio fijo sin rango subestima el riesgo financiero del programa.',
              supuesto_critico: 'El precio del PET y HDPE. Juntos representan el 65–70% del ingreso por materiales. Una caída de 20% en PET reduce el ingreso total ~15%.',
            },
          },
          {
            chart_id: 'riesgo-mercado',
            chart_label: 'Riesgo de mercado',
            metodologia: {
              como_se_calcula: 'R_mercado = (1 − tasa_colocacion) × volumen_ton × precio_promedio × 0.35. Donde 0.35 es el factor de descuento por incertidumbre de offtaker no contratado.',
              origen_datos: 'Reglas de placement documentadas en market/placement.py. Benchmarks de tasa de colocación en programas municipales RSU México 2019–2024.',
              por_que_este_enfoque: 'El riesgo de mercado suele ignorarse en modelos financieros municipales. ALQUIMIA lo cuantifica porque un programa con gran volumen y sin comprador confirmado es más riesgoso que uno pequeño con contrato.',
              supuesto_critico: 'La tasa de colocación. Por defecto se asume que el 85% del material separado tiene comprador. Si baja a 60%, el riesgo financiero se triplica.',
            },
          },
        ],
      }

    case 'riesgos_modelo':
      return {
        moduleId: resolvedId,
        title: 'Los cuatro riesgos que determinan si el programa llega al Cabildo',
        pregunta_guia: '¿Qué puede salir mal y cómo se mitiga cada riesgo crítico?',
        subtitulo_catchy: 'Los riesgos que pueden hundir el programa — y cómo medimos cada uno',
        situacion_actual: `${territorio} enfrenta cuatro dimensiones de riesgo que deben medirse antes de comprometer inversión o presentar el programa al Cabildo.`,
        observacion_alquimia: `${scope} El score de riesgo no es una opinión — es una fórmula documentada con cuatro dimensiones ponderadas por relevancia política en el contexto municipal mexicano.`,
        criterio_decision: 'Identificar qué dimensión de riesgo es más alta y diseñar mitigaciones específicas antes de avanzar a la fase de implementación.',
        que_no_significa: 'No es una garantía de éxito ni un análisis exhaustivo de riesgos empresariales. Es un diagnóstico de los riesgos específicos de programas RSU municipales en México.',
        siguiente_accion: 'Priorizar la dimensión con score más alto y definir al menos una acción de mitigación concreta con responsable y fecha.',
        fuente_o_evidencia: 'Datos de placement (riesgo mercado), mapa de actores (riesgo político), PERT slack (riesgo operativo), compliance LGPGIR (riesgo regulatorio).',
        metodologia_editorial: {
          como_se_calcula: 'Score total = 0.30·R_mercado + 0.40·R_político + 0.20·R_operativo + 0.10·R_regulatorio. Cada dimensión se calcula con su propia fórmula documentada. El score va de 0 (sin riesgo) a 100 (riesgo crítico).',
          origen_datos: 'R_mercado: datos del M10. R_político: mapa de actores (M02C). R_operativo: holgura PERT del M05. R_regulatorio: checklist LGPGIR del M03B.',
          por_que_este_enfoque: 'ALQUIMIA pondera el riesgo político al 40% —la ponderación más alta— porque históricamente es el factor que más cancela programas municipales exitosos técnicamente. Los proyectos públicos no mueren por falta de tecnología sino por falta de actores en la mesa correcta.',
          supuesto_critico: 'La tasa de colocación del mercado secundario (R_mercado). Es la variable más volátil y la que más rápido puede cambiar el score total de un trimestre a otro.',
        },
        chart_briefs: [
          {
            chart_id: 'score-riesgo-total',
            chart_label: 'Score de riesgo total',
            metodologia: {
              como_se_calcula: 'R_total = 0.30·R_mkt + 0.40·R_pol + 0.20·R_op + 0.10·R_reg. Escala semáforo: bajo < 25, medio 25–50, alto 50–75, crítico > 75.',
              origen_datos: 'Ponderaciones basadas en análisis de fracasos de programas RSU municipales México 2010–2023 (BANOBRAS, BID, SEMARNAT evaluaciones).',
              por_que_este_enfoque: 'Un score compuesto es más honesto que una lista de riesgos sin jerarquía. Obliga a priorizar en lugar de gestionar todos los riesgos con igual intensidad.',
              supuesto_critico: 'Las ponderaciones (0.30/0.40/0.20/0.10). Son ajustables por municipio si hay evidencia de que el contexto local invierte la jerarquía típica.',
            },
          },
        ],
      }

    case 'inspeccion':
      return {
        moduleId: resolvedId,
        title: 'Inspección y predios: evidencia ordenada antes de la acción',
        pregunta_guia: '¿Qué predios cumplen condiciones para operar y cuáles necesitan intervención?',
        subtitulo_catchy: 'Evidencia del predio seleccionado antes de la acción administrativa',
        situacion_actual: `En ${territorio}, la inspección debe empezar como evidencia ordenada: predio, situación observada, actor, fecha, hallazgo y acción siguiente.`,
        observacion_alquimia: `${scope} La inspección útil no castiga por intuición: documenta hechos, distingue educación de visita técnica y deja trazabilidad para revisión municipal.`,
        criterio_decision: 'Decidir qué casos ameritan educación, seguimiento, regularización administrativa o escalamiento a revisión competente.',
        que_no_significa: 'No equivale a determinación final, cobro, clausura ni acto definitivo.',
        siguiente_accion: 'Completar evidencia mínima y validar el tratamiento administrativo con el área competente del municipio.',
        fuente_o_evidencia: 'Registro de predio, bitácora, tipo de situación, evidencia capturada y contrato municipal aplicable.',
        metodologia_editorial: {
          como_se_calcula: 'El semáforo de clasificación cruza el tipo de situación observada con los artículos habilitantes del reglamento cargado en M02. Cada combinación produce una de cuatro rutas: educación, seguimiento, regularización o escalamiento.',
          origen_datos: 'Tipología de situaciones: marco de inspección municipal LGPGIR. Artículos locales: reglamento municipal específico cargado en el módulo.',
          por_que_este_enfoque: 'ALQUIMIA clasifica antes de recomendar acción porque el error más frecuente es tratar una visita educativa como inicio de procedimiento sancionatorio. Esa confusión erosiona la legitimidad del programa en las primeras semanas.',
          supuesto_critico: 'La existencia y calidad del reglamento cargado en M03B. Sin él, el semáforo es orientativo. Con él, cada decisión queda anclada al artículo que la habilita.',
        },
        chart_briefs: [
          {
            chart_id: 'criterios-aptitud',
            chart_label: 'Criterios de aptitud del predio',
            metodologia: {
              como_se_calcula: 'Score de aptitud = suma ponderada de: acceso vial (20%), uso de suelo compatible (30%), área disponible vs. requerida (25%), servicios básicos (15%), distancia a zona de generación (10%).',
              origen_datos: 'Criterios de sitio para instalaciones de manejo de residuos: NOM-161-SEMARNAT-2011 y reglamentos municipales de uso de suelo.',
              por_que_este_enfoque: 'Un predio con score < 60% raramente logra permiso. Evaluar antes de proponer al Cabildo evita el desgaste político de una propuesta que será rechazada en revisión técnica.',
              supuesto_critico: 'El criterio de uso de suelo (30% del score). Es el único criterio no negociable: si el uso no es compatible, no hay proyecto posible en ese predio, y proponerlo al Cabildo genera desgaste político sin salida técnica.',
            },
          },
        ],
      }

    case 'escenarios_financieros':
      return {
        moduleId: resolvedId,
        title: 'El expediente de Cabildo: escenarios, derrama y sustento',
        pregunta_guia: '¿Qué escenario financiero es viable para llevar a sesión de Cabildo?',
        subtitulo_catchy: 'El expediente listo para el Cabildo — números, supuestos y sensibilidad',
        situacion_actual: `El valor económico de ${territorio} debe separarse: venta base de materiales, pago evitable por entierro, efectos ambientales y sensibilidad financiera.`,
        observacion_alquimia: `${scope} La derrama base solo considera material separado vendido a la industria con precios del escenario. Las externalidades amplían la lectura, pero no deben mezclarse con ingreso directo.`,
        criterio_decision: 'Comparar escenarios por captura, precio, merma, costo de disposición, sensibilidad y riesgo antes de exportar un borrador de trabajo.',
        que_no_significa: 'No es garantía de ingreso, cifra autorizada, licitación ni autorización financiera.',
        siguiente_accion: 'Revisar Monte Carlo, waterfall, tornado y matriz de fuentes antes de presentar el escenario a terceros.',
        fuente_o_evidencia: 'Motor financiero, investigación de precios, matriz de trazabilidad, WACC editable y escenarios de sensibilidad.',
        metodologia_editorial: {
          como_se_calcula: 'El waterfall descompone el valor en tres capas: (1) ingreso directo = Σ(ton_material × precio_spot × (1−merma)), (2) costo evitado = ton_desviadas × tarifa_relleno, (3) externalidades = tCO₂e × precio_social_carbono.',
          origen_datos: 'Tarifa relleno sanitario: contrato municipal vigente o estimado SEMARNAT. Precio social del carbono: SHCP para evaluación de inversión pública. Rangos de precio y merma: mercado secundario mexicano documentado.',
          por_que_este_enfoque: 'ALQUIMIA separa las tres capas en lugar de sumarlas en un "valor total" porque mezclarlas produce cifras que no se sostienen ante una auditoría de Cabildo que pregunte qué es ingreso real y qué es ahorro hipotético.',
          supuesto_critico: 'La tarifa de disposición por tonelada. En municipios con relleno concesionado puede duplicar el estimado base y convertir un programa marginal en uno altamente rentable.',
        },
        chart_briefs: [
          {
            chart_id: 'resumen-ejecutivo',
            chart_label: 'Resumen ejecutivo de escenarios',
            metodologia: {
              como_se_calcula: 'Tabla comparativa de los tres escenarios activos: TIR, VPN, payback, empleos y CO₂e. TIR calculada con método estándar sobre flujos anuales del horizonte seleccionado.',
              origen_datos: 'Todos los inputs vienen de los módulos anteriores. TIR/VPN: cálculo propio del motor financiero ALQUIMIA.',
              por_que_este_enfoque: 'Presentar tres escenarios —no uno— obliga al equipo municipal a decidir con información de sensibilidad, no solo con el escenario optimista.',
              supuesto_critico: 'El WACC utilizado como tasa de descuento. La referencia pre-cargada es 12% (SHCP proyectos públicos México). Un alcalde puede considerar una tasa diferente según el costo de financiamiento municipal.',
            },
          },
        ],
      }

    case 'impacto_ambiental':
      return {
        moduleId: resolvedId,
        title: 'Impacto ambiental y sanitario del programa',
        pregunta_guia: '¿Qué externalidades evita el programa y con qué supuestos?',
        subtitulo_catchy: 'CO₂e, salud pública y vida útil del relleno — sin mezclar con ingresos de mercado',
        situacion_actual: `En ${territorio}, las externalidades del RSU (emisiones, salud, saturación de relleno) suelen quedar fuera del expediente para Cabildo si solo se presentan ingresos por material.`,
        observacion_alquimia: `${scope} Los KPIs salen del motor con factores INECC/IPCC documentados. No son medición de campo ni inventario oficial de GEI.`,
        criterio_decision: 'Separar beneficio ambiental de ingreso directo antes de presentar el programa a finanzas o financiadores verdes.',
        que_no_significa: 'No es inventario GEI oficial, ni aval de PROFEPA o SEMARNAT sobre emisiones evitadas.',
        siguiente_accion: 'Revisar factores de emisión y contrafactual sin programa antes de anexar cifras a un informe ESG.',
        fuente_o_evidencia: 'INECC factores RSU, IPCC AR6, motor ALQUIMIA M01.',
        metodologia_editorial: {
          como_se_calcula: 'CO₂e = toneladas desviadas × factor emisión relleno × GWP. Salud = funciones documentadas sobre fracción orgánica y clima local.',
          origen_datos: 'Factores INECC 2024, parámetros del escenario activo (M01).',
          por_que_este_enfoque: 'El Cabildo necesita ver el costo sanitario y climático de la omisión, no solo la derrama de venta de material.',
          supuesto_critico: 'Factor de captura de biogás en el relleno local — cambia el CO₂e evitado hasta en 60%.',
        },
        chart_briefs: [],
      }

    case 'social_diagnostico':
    case 'social_study':
      return {
        moduleId: resolvedId,
        title: 'Estudio demográfico y contexto social',
        pregunta_guia: '¿Quiénes son las personas que deben participar y qué barreras enfrentan?',
        subtitulo_catchy: 'Quiénes son las personas que deben separar — sin inventar cifras municipales',
        situacion_actual: `En ${territorio}, el diseño del programa de separación requiere leer el contexto sociodemográfico antes de comprometer metas de participación. La heterogeneidad de rezago social, el tamaño del sector informal de recuperación y los riesgos reputacionales no son homogéneos en la ZM.`,
        observacion_alquimia: `${scope} Los indicadores son referencias INEGI/CONEVAL/ENOE, no diagnóstico municipal validado. Deben declararse como estimación con supuestos explícitos en comunicación pública.`,
        criterio_decision: 'Identificar grupos prioritarios, colonias de rezago, pepenadores a integrar y riesgos de reputación antes de cerrar el diseño de la estrategia de participación ciudadana.',
        que_no_significa: 'No equivale a encuesta de aceptación ciudadana, diagnóstico sociológico validado por instituto ni padrón de beneficiarios.',
        siguiente_accion: 'Revisar la matriz de riesgos sociales, documentar supuestos en la bitácora y cerrar brechas con evidencia de campo antes de presentar el programa a Cabildo.',
        fuente_o_evidencia: 'INEGI Censo de Población y Vivienda 2020; CONEVAL Índice de Rezago Social 2022; INEGI ENOE T1 2024 (sector informal); INEGI ENIGH 2022; INE calendario electoral 2024–2027.',
        metodologia_editorial: {
          como_se_calcula: 'Los indicadores cuantitativos (población, viviendas, ocupantes, rezago social) se leen directamente de los tabulados INEGI cargados en el sistema. Los indicadores de riesgo social son heurísticas documentadas. No provienen de fórmulas de campo sino de estudios nacionales escalados.',
          origen_datos: 'INEGI Censo 2020: variables de vivienda, población y ocupantes. CONEVAL 2022: Índice de Rezago Social por municipio. ENOE T1 2024: estimación del sector informal de recuperación. ENIGH 2022: porcentaje de hogares sin espacio para contenedores.',
          por_que_este_enfoque: 'Un programa de separación sin lectura sociodemográfica diseña para la población promedio, no para la real. El error más frecuente es planear la misma estrategia para colonias con rezago IV y colonias residenciales — eso garantiza baja adopción en los segmentos más vulnerables.',
          supuesto_critico: 'El ciclo de actualización decenal del Censo INEGI. En municipios con alta movilidad poblacional (periferia metropolitana), los datos 2020 pueden subestimar densidad, rezago o sector informal hasta en un 15-20%.',
        },
        chart_briefs: [
          {
            chart_id: 'social-risk-matrix',
            chart_label: 'Matriz de riesgos sociales',
            metodologia: {
              como_se_calcula: 'Fichas cualitativas; no hay fórmula numérica. Severidad interna (bajo/medio/alto) basada en frecuencia de aparición en literatura de programas RSU LATAM 2010-2024 y en evaluaciones de CONEVAL de programas municipales.',
              origen_datos: 'CONEVAL evaluaciones de programas municipales; INE calendario electoral; LGPGIR DOF 2022; INEGI ENOE 2024.',
              por_que_este_enfoque: 'La matriz de riesgo permite al equipo técnico identificar los tres riesgos más críticos antes de iniciar el diseño operativo. Sin esta lectura previa, los riesgos emergen durante la implementación, cuando el costo de cambio es 5-10x mayor.',
              supuesto_critico: 'La ausencia de encuesta de aceptación ciudadana local. Sin ella, la severidad de riesgo "comunicación institucional" es estimada, no medida.',
            },
          },
        ],
      }

    case 'logistica':
      return {
        moduleId: resolvedId,
        title: 'Logística operativa: del papel a la ruta real',
        pregunta_guia: '¿Cuántas rutas, vehículos y turnos se necesitan para cubrir las colonias piloto?',
        subtitulo_catchy: '¿Cómo se organizan los camiones, rutas y colonias para que el material llegue al CA?',
        situacion_actual: `La implementación del programa en ${territorio} exige diseñar rutas de recolección diferenciada antes del primer arranque. Sin un piloto bien definido, el riesgo operativo del primer mes puede comprometer la credibilidad del programa.`,
        observacion_alquimia: `${scope} La logística define si el programa opera o colapsa en temporada alta. Rutas mal diseñadas elevan costo de combustible y quejas ciudadanas.`,
        criterio_decision: 'Definir la zona piloto con criterios objetivos (no políticos), dimensionar la flota necesaria y establecer el protocolo operativo antes del primer arranque.',
        que_no_significa: 'Este módulo no sustituye un estudio VRP completo (Vehicle Routing Problem). Para municipios de +50,000 hab. con topografía compleja, se recomienda contratar especialista SIG con Google OR-Tools o ArcGIS Network Analyst.',
        siguiente_accion: 'Validar zona piloto con el equipo de campo, confirmar disponibilidad de camiones y establecer protocolo de bitácora desde el día 1.',
        fuente_o_evidencia: 'GIZ/PSR 2012 — Módulo 5: Gestión de Residuos Sólidos. SEMARNAT Guía Técnica para Centros de Acopio 2022 §4.3. ITDP México 2023: Recolección diferenciada en ciudades medias.',
        metodologia_editorial: {
          como_se_calcula: 'N° de zonas = ceil(hogares_piloto / capacidad_ruta_camion). Km estimados/ruta = hogares_ruta × 0.15 km/hogar (promedio urbano México, ITDP 2023). Tiempo de ciclo = km_ruta / velocidad_promedio (15 km/h en zonas urbanas densas).',
          origen_datos: 'Capacidad de ruta por camión: 400 hogares/ruta (referencia operadores municipales SLP/NL/QRO, 2023). Factor tortuga (desvíos y maniobras): 1.3×. SEMARNAT 2021: frecuencias por fracción.',
          por_que_este_enfoque: 'El modelo simplificado de rutas permite al funcionario visualizar la operación sin necesidad de software SIG. Genera los inputs estructurados (hogares/ruta, km, tiempo) que un especialista puede optimizar en VRP real.',
          supuesto_critico: 'La homogeneidad de densidad habitacional en la zona piloto. En colonias con alta variación densidad, el modelo puede sobre o sub-estimar los km por ruta en ±30%.',
        },
        chart_briefs: [
          {
            chart_id: 'logistica-estacionalidad',
            chart_label: 'Estacionalidad de demanda RSU por mes',
            metodologia: {
              como_se_calcula: 'Factor estacional = generación_mes / generación_promedio. Diciembre: +15%, enero: +12%, julio: +8% (festividades y vacaciones). Fuente: INEGI ENIGH 2022 + registros operadores.',
              origen_datos: 'SEMARNAT Diagnóstico sobre RSU en México 2020. INEGI ENIGH 2022. Registros operativos de SIDUE NL y SEMAG SLP (promedio 5 municipios 2021-2023).',
              por_que_este_enfoque: 'La estacionalidad afecta la dimensión de la flota. Diseñar solo para el promedio anual deja sin capacidad en picos, generando incumplimiento justo cuando hay más escrutinio ciudadano.',
              supuesto_critico: 'La diferencia real entre municipios pequeños (±5%) y zonas metropolitanas (±20%). Este módulo usa el factor metropolitano como escenario más exigente.',
            },
          },
        ],
      }

    case 'esquema_concesion':
      return {
        moduleId: resolvedId,
        title: 'Quién opera y cuánto recibe el municipio: el núcleo del modelo de negocio',
        pregunta_guia: '¿Quién debe operar el servicio: el municipio, un concesionario privado o una APP?',
        subtitulo_catchy: '¿Cuánto entra al municipio y quién carga con el riesgo operativo?',
        situacion_actual: `La pregunta que el Cabildo de ${territorio} realmente vota no es la tasa de captura. Es cuánto dinero entra al municipio, cuántos empleos se crean y cuál industria local se beneficia. Sin modelar el esquema de concesión, el simulador no puede responder ninguna de estas tres preguntas de forma diferenciada.`,
        observacion_alquimia: `${scope} El Artículo 78 LOM-SLP (Art. 23 en NL, Art. 91 en QRO) permite al ayuntamiento concesionar servicios públicos por acuerdo de Cabildo. El adendo que crea la obligación de separar en origen es el instrumento que hace viable la inversión privada en el CA. Sin adendo, no hay certeza jurídica. Sin certeza, ningún privado invierte.`,
        criterio_decision: 'Seleccionar el esquema que maximice el valor al municipio según su capacidad presupuestal. Si no hay presupuesto, el esquema B (concesionado) permite arrancar sin capital municipal.',
        que_no_significa: 'El esquema de concesión no define automáticamente los términos del contrato. El instrumento legal específico (concesión, contrato de servicios, APP) requiere revisión por el síndico municipal y asesor legal externo.',
        siguiente_accion: 'Presentar el árbol de decisión a presidencia y síndico municipal. Seleccionar esquema. Iniciar borrador de instrumento legal con asesoría jurídica especializada en servicios municipales.',
        fuente_o_evidencia: 'LAASSP (umbrales de licitación). Ley Orgánica Municipal SLP Art. 78 / NL Art. 23 / QRO Art. 91. BANOBRAS Catálogo de Programas 2024 (CCA — tasa 8.5%). CANACERO Informe 2023. SAGARPA/SADER SIAP 2023.',
        metodologia_editorial: {
          como_se_calcula: 'Esquema A: ingresos_municipio = ingresos_brutos × 100%. Esquema B: ingresos_operativo = ingresos_brutos × pct_cuota (5-15%). ISN = empleos × salario_bruto × tasa_ISN_estado. Derechos = n_CAs × $15,000/año.',
          origen_datos: 'Tasas ISN: Leyes de Hacienda estatales 2025 (SLP 2%, NL 3%, QRO 2%). Derechos operación: SEMARNAT Guía Técnica CAs 2022 §7.3. Empleo acerero: CANACERO 2023. Empleo agrícola: SIAP 2023.',
          por_que_este_enfoque: 'El multiplicador plano (16%) del modelo anterior era indefendible ante el síndico. El modelo diferenciado por esquema permite una justificación artículo por artículo del cálculo de beneficios al municipio.',
          supuesto_critico: 'El porcentaje de cuota de concesión (default 10%). En licitaciones reales, este porcentaje se negocia según el riesgo del mercado local y la competitividad del proceso. Un operador con mercado asegurado puede ofrecer hasta 15%; en mercados incipientes, 5% puede ser el techo.',
        },
        chart_briefs: [],
      }

    case 'doble_materialidad':
      return {
        moduleId: resolvedId,
        title: 'Doble materialidad: de programa municipal a activo ESG reportable',
        pregunta_guia: '¿El programa es reportable bajo estándares ESG y cuáles brechas tiene?',
        subtitulo_catchy: '¿Cómo le digo a un banco verde o al BID cuánto vale el programa?',
        situacion_actual: `Los resultados del programa en ${territorio} — toneladas desviadas, CO₂e evitadas, empleos creados — deben reportarse en formato GRI 306 y ESRS E5 para fondos verdes (BANOBRAS, BID, FVC).`,
        observacion_alquimia: `${scope} La "doble materialidad" es el estándar europeo CSRD/ESRS E5 y está siendo adoptado en México por BANOBRAS y la CNBV como requisito de reporte para deuda verde. Un municipio que reporta GRI 306 con datos reales tiene acceso a tasas preferenciales que pueden reducir el costo de deuda en 200-400 pb.`,
        criterio_decision: 'Generar el informe GRI 306 con datos reales cuando el M17 tenga datos de campo. Hasta entonces, usar proyecciones del simulador como referencia.',
        que_no_significa: 'Este módulo no reemplaza una auditoría de sostenibilidad externa. Para solicitudes de crédito verde formales, los datos del GRI 306 deben ser verificados por un tercero acreditado (ej. Bureau Veritas, KPMG Sustentabilidad).',
        siguiente_accion: 'Enviar el reporte GRI 306 proyectado a BANOBRAS como primer contacto para el Programa CCA. Mientras se acumula data real, el simulador sirve como pre-evaluación de elegibilidad.',
        fuente_o_evidencia: 'GRI 306: Residuos 2020. ESRS E5 — Uso de Recursos y Economía Circular (EFRAG 2023). PNPGIR 2022-2024 — meta 30% desvío de relleno. BANOBRAS Programa CCA 2024. CNBV Taxonomía Verde México 2022.',
        metodologia_editorial: {
          como_se_calcula: 'GRI 306-3 = rsuTotalTonDia × 300 días. GRI 306-4a = (vol_plastico + vol_papel + vol_vidrio + vol_aluminio) × 300. GRI 306-4b = vol_organico × 300 × 0.35 (factor compostaje SEMARNAT 2020). GRI 306-5 = 306-3 - 306-4a - 306-4b.',
          origen_datos: 'Factor compostaje 0.35: SEMARNAT Guía Compostaje Municipal 2020 p.44. Tasa de desvío meta 30%: PNPGIR 2022-2024. CO₂e por tonelada en relleno: IPCC 2006 Guidelines for National GHG Inventories, Vol.5 §3.',
          por_que_este_enfoque: 'GRI 306 es el estándar más aceptado internacionalmente para residuos sólidos. BANOBRAS y el BID lo exigen como parte de los requisitos de elegibilidad para financiamiento de proyectos de economía circular municipal.',
          supuesto_critico: 'La pureza de las fracciones separadas. GRI 306 requiere reportar la fracción efectivamente valorizada, no la separada. Sin laboratorio de caracterización, el modelo asume 80% de pureza por fracción — lo que puede sobrestimar el volumen real en ±15%.',
        },
        chart_briefs: [
          {
            chart_id: 'doble-materialidad-grid',
            chart_label: 'Matriz de doble materialidad',
            metodologia: {
              como_se_calcula: 'Las posiciones en la matriz son juicios de experto basados en revisión de literatura (CSRD/ESRS E5, GRI, literatura académica de RSU en LATAM). No son valores calculados — son rangos cualitativos convertidos a escala 1-5.',
              origen_datos: 'EFRAG ESRS E5 Guidance 2023. Faber, M. et al. (2023) "Double Materiality in Circular Economy". GRI 306: Residuos 2020. SEMARNAT Diagnóstico RSU México 2020.',
              por_que_este_enfoque: 'La matriz de doble materialidad permite identificar qué temas son estratégicamente prioritarios tanto por su impacto ambiental/social como por su relevancia financiera para el programa.',
              supuesto_critico: 'La posición de "resistencia ciudadana" es el tema con mayor incertidumbre y mayor impacto en la viabilidad financiera. Un IPC bajo cambia su posición drásticamente.',
            },
          },
        ],
      }

    case 'costos_programa':
      return {
        moduleId: resolvedId,
        title: 'Costos del programa — CAPEX y OPEX',
        pregunta_guia: '¿Cuánto cuesta arrancar (CAPEX) y cuánto sostener (OPEX) el programa mensualmente?',
        subtitulo_catchy: 'Cada peso de inversión tiene nombre, precio verificado y plazo de recuperación.',
        situacion_actual: `El programa para ${territorio} requiere una inversión inicial (CAPEX) en centros de acopio, equipos y capital de trabajo, más un costo operativo mensual (OPEX) que incluye nómina, energía, renta e insumos. Este módulo desglosa cada línea con trazabilidad de fuente.`,
        observacion_alquimia: 'Los precios de equipamiento fueron verificados contra mercado mexicano en mayo 2026 (grupozuma.com.mx, reciclamas.com.mx, losmontacargas.mx, rte.mx, cocoisa.mx). Los salarios siguen tabulador IMSS Rama 37 con factor de prestaciones de 1.35×. La contingencia del 10% sigue estándar AACE International Class 4.',
        criterio_decision: 'El tesorero municipal necesita saber exactamente cuánto cuesta el programa por fase, qué equipos se compran, cuántas personas se contratan y en cuánto tiempo se recupera la inversión antes de llevar el presupuesto al Cabildo.',
        que_no_significa: 'No es una cotización formal. Es un modelo parametrizado que debe validarse con proveedores locales antes de comprometer presupuesto público.',
        siguiente_accion: 'Solicitar cotizaciones formales a proveedores locales para los 3–5 equipos de mayor impacto en el CAPEX.',
        fuente_o_evidencia: 'Centros_Acopio_v2.xlsx (modelo CFO ALQUIMIA). Precios de mercado verificados mayo 2026. Salarios: INEGI ENOE T1 2025, Computrabajo 2025. Factor prestaciones: IMSS Rama 37.',
        metodologia_editorial: {
          como_se_calcula: 'CAPEX = equipamiento + adecuación de nave + gastos preoperativos + contingencia 10% + capital de trabajo (3 meses OPEX). OPEX = nómina con prestaciones + renta + energía + combustible + mantenimiento + insumos + seguros.',
          origen_datos: 'Precios de equipos verificados en marketplaces mexicanos (mayo 2026). Salarios base tabulador IMSS Rama 37. Renta zona industrial SLP $65/m².',
          por_que_este_enfoque: 'Un modelo CAPEX/OPEX transparente es requisito para que el municipio apruebe presupuesto en sesión de cabildo y para que BID/BANOBRAS evalúen solicitudes de crédito.',
          supuesto_critico: 'Los precios de mercado son referencia (mayo 2026). Inflación, tipo de cambio y disponibilidad local pueden variar. El factor de contingencia del 10% absorbe variaciones moderadas.',
        },
        chart_briefs: [],
      }

    case 'monitoreo_operativo':
      return {
        moduleId: resolvedId,
        title: 'Monitoreo — proyectado vs. real',
        pregunta_guia: '¿El programa está cumpliendo las metas proyectadas o requiere ajuste?',
        subtitulo_catchy: 'Proyección vs. real — semáforo de desempeño operativo',
        situacion_actual: `Una vez en operación, ${territorio} necesita comparar las proyecciones del simulador con los datos reales de campo para detectar desviaciones y corregir el rumbo antes de que se conviertan en pérdidas.`,
        observacion_alquimia: 'Este módulo está diseñado para recibir datos de campo una vez que el programa esté operando. Hasta entonces, muestra las métricas proyectadas como línea base de referencia para el equipo de campo.',
        criterio_decision: 'El director de servicios públicos necesita un semáforo claro: verde si la operación está dentro de las proyecciones, amarillo si hay desviaciones moderadas, rojo (alerta crítica) si se requiere intervención directiva.',
        que_no_significa: 'No sustituye un sistema de monitoreo en tiempo real. Es una herramienta de comparación periódica (mensual/trimestral) entre lo proyectado y lo medido.',
        siguiente_accion: 'Definir el protocolo de captura de datos de campo (frecuencia, responsable, formato) antes del arranque del piloto.',
        fuente_o_evidencia: `Proyecciones: motor del simulador ALQUIMIA (módulos ${moduleRangeLabel()}). Datos reales: captura manual o integración con sistema de pesaje en CAs.`,
        metodologia_editorial: {
          como_se_calcula: 'Desviación = (valor_real − valor_proyectado) / valor_proyectado × 100. Semáforo: verde ≤10%, amarillo 10–25%, rojo >25%.',
          origen_datos: 'Proyecciones: motor del simulador. Datos reales: captura de campo (pendiente de implementación en campo).',
          por_que_este_enfoque: 'La Teoría de Cambio (Theory of Change) requiere verificación empírica. Sin monitoreo, el programa pierde credibilidad ante financiadores y Cabildo en la evaluación de medio término.',
          supuesto_critico: 'Los datos de campo deben capturarse con la misma metodología y frecuencia que las proyecciones para que la comparación sea válida y auditable.',
        },
        chart_briefs: [],
      }

    case 'trazabilidad':
      return {
        moduleId: resolvedId,
        title: 'Cadena de evidencia: de dónde viene cada número',
        pregunta_guia: '¿Cada cifra del análisis tiene fuente, fórmula y nivel de certeza documentados?',
        subtitulo_catchy: 'De dónde vienen todos los números — la cadena completa de cada cifra',
        situacion_actual: `Toda cifra visible sobre ${territorio} necesita una cadena clara: afirmación, fórmula, fuente, estado de verificación y responsable.`,
        observacion_alquimia: `${scope} La matriz no decora el reporte. Obliga a cerrar pendientes y evita que una cita general se use como prueba de una cifra específica.`,
        criterio_decision: 'Identificar qué datos están verificados, cuáles son supuestos editables y cuáles requieren acción correctiva antes de usarse públicamente.',
        que_no_significa: 'No convierte una fuente localizada en dato confirmado ni una estimación en medición municipal.',
        siguiente_accion: 'Cerrar filas pendientes, sustituir fuentes débiles y documentar responsable antes de salida institucional.',
        fuente_o_evidencia: 'Source Verification Matrix: afirmación → fuente → fórmula → estado → acción correctiva.',
        metodologia_editorial: {
          como_se_calcula: 'Cada fila registra: afirmación cuantitativa → fuente primaria → fórmula exacta → unidad → estado de verificación → acción correctiva. Estados posibles: verificado, condicionado, corregido, pendiente.',
          origen_datos: 'Las fuentes son las mismas de los módulos anteriores: Censo INEGI 2020, SEMARNAT DBGIR 2020, INECC 2024, SHCP, mercado secundario documentado.',
          por_que_este_enfoque: 'Sin esta matriz, un número en una presentación pública no puede ser defendido. No hay forma de distinguir si es un cálculo del modelo, un dato del censo o una estimación editorial — ambigüedad suficiente para que una contraloría descarte todo el análisis.',
          supuesto_critico: 'El estado de verificación de cada fila. Las filas pendientes no deben aparecer en documentos oficiales hasta que la fuente esté cerrada y el responsable confirmado.',
        },
        chart_briefs: [],
      }

    case 'evaluacion_socioeconomica':
      return {
        moduleId: resolvedId,
        title: 'Evaluación socioeconómica y alivio fiscal estatal',
        pregunta_guia: '¿Cuántos empleos se traducen en reducción de pobreza y alivio fiscal proxy?',
        subtitulo_catchy: 'CONEVAL/SHCP como referencia — no certificación estatal',
        situacion_actual: `El argumento social-fiscal de ${territorio} conecta empleos del programa con pobreza municipal y canales de alivio estatal documentados.`,
        observacion_alquimia: `${scope} Etiquetado honesto: estimación con supuestos CONEVAL 2022 y referencias SHCP. No es cifra autorizada de Secretaría de Finanzas.`,
        criterio_decision: 'Usar escenario conservador/base/optimista antes de citar reducción de pobreza en foro público.',
        que_no_significa: 'No es resolución oficial de CONEVAL ni impacto fiscal avalado por SHCP.',
        siguiente_accion: 'Seleccionar municipio en catálogo y revisar waterfall de canales con ProvenanceBadge.',
        fuente_o_evidencia: 'CONEVAL 2022, baselines estatales ALQUIMIA, motor empleos M01–M09.',
        metodologia_editorial: {
          como_se_calcula: 'Personas beneficiadas = empleos efectivos × factor hogar × formalización. Alivio = ISN + salud estatal + rescate + spread deuda verde.',
          origen_datos: 'stateFiscalBaselines.ts, resultados.ingresosMunicipioFiscal, ahorroSalud.',
          por_que_este_enfoque: 'Permite al gobernador ver co-beneficios fiscales sin confundirlos con ingreso municipal directo.',
          supuesto_critico: 'Tasa de formalización del escenario — mueve personas en pobreza y alivio rescate.',
        },
        chart_briefs: [],
      }

    case 'teoria_cambio':
      return {
        moduleId: resolvedId,
        title: 'Teoría de cambio — cierre del diagnóstico',
        pregunta_guia: '¿Cómo se conectan insumos, actividades y resultados del capítulo 1?',
        subtitulo_catchy: 'Del problema a la hipótesis de intervención antes de planificar',
        situacion_actual: `El diagnóstico de ${territorio} dispersa hallazgos en seis rubros. La teoría de cambio los articula en una cadena verificable.`,
        observacion_alquimia: `${scope} Es síntesis narrativa de módulos anteriores — no introduce cifras nuevas sin fuente.`,
        criterio_decision: 'Validar que cada outcome tenga indicador y responsable antes de pasar a Planificación.',
        que_no_significa: 'No sustituye evaluación de impacto ex post ni M&E operativo (M17).',
        siguiente_accion: 'Revisar eslabones débiles y abrir Capítulo 2 con plan maestro.',
        fuente_o_evidencia: 'Outputs M01–M04C, estándar Theory of Change en programas públicos.',
        metodologia_editorial: {
          como_se_calcula: 'Cadena inputs → actividades → outputs → outcomes → impacto con vínculo a variables del store.',
          origen_datos: 'Módulos Cap 1 completados.',
          por_que_este_enfoque: 'Cabildo y BID piden teoría de cambio explícita, no solo tablas sueltas.',
          supuesto_critico: 'Completitud del diagnóstico — eslabones vacíos indican módulos pendientes.',
        },
        chart_briefs: [],
      }

    case 'ruta_critica':
      return {
        moduleId: resolvedId,
        title: 'Ruta crítica y holgura del programa',
        pregunta_guia: '¿Qué tareas no pueden retrasarse sin mover todo el calendario?',
        subtitulo_catchy: 'PERT con varianza — dónde concentrar supervisión',
        situacion_actual: `El calendario de ${territorio} solo es defendible si identifica la cadena de tareas sin holgura.`,
        observacion_alquimia: `${scope} La ruta crítica sale del PERT del plan maestro. No es fecha de sesión de cabildo ni de licitación cerrada.`,
        criterio_decision: 'Asignar recursos y supervisión a tareas con holgura cero antes de comprometer fechas públicas.',
        que_no_significa: 'No es cronograma de obra autorizado ni programa de inversión federal.',
        siguiente_accion: 'Revisar tareas críticas y validar estimados optimista/probable/pesimista con área operativa.',
        fuente_o_evidencia: 'Catálogo de hitos ALQUIMIA, PMBOK 6, experiencia SEMARNAT-BID.',
        metodologia_editorial: {
          como_se_calcula: 'Duración esperada β-PERT; holgura = LS − ES; ruta crítica = tareas con holgura ≤ 0.',
          origen_datos: 'Estimados por tipo de tarea municipal en FutureGoalsModule.',
          por_que_este_enfoque: 'El retraso en permisos o licitación suele estar en la ruta crítica — no en tareas paralelas.',
          supuesto_critico: 'Estimado pesimista de trámites — subestimarlo desplaza el arranque político del programa.',
        },
        chart_briefs: [],
      }

    case 'oleadas_territoriales':
      return {
        moduleId: resolvedId,
        title: 'Oleadas territoriales de despliegue',
        pregunta_guia: '¿En qué colonias y en qué orden arranca el piloto?',
        subtitulo_catchy: 'Secuencia territorial — no todo el municipio el día uno',
        situacion_actual: `Desplegar en todo ${territorio} a la vez suele colapsar operación y comunicación.`,
        observacion_alquimia: `${scope} Las oleadas priorizan rezago social, densidad y viabilidad logística — no solo criterio político.`,
        criterio_decision: 'Fijar oleada 1 con colonias defendibles antes de escalar captura en todo el territorio.',
        que_no_significa: 'No es mapa de distritación electoral ni padrón de beneficiarios.',
        siguiente_accion: 'Validar lista de colonias piloto con logística M08 y social M02.',
        fuente_o_evidencia: 'Plan maestro, CONEVAL rezago, cobertura territorial M03C.',
        metodologia_editorial: {
          como_se_calcula: 'Priorización por score compuesto: rezago, densidad, distancia a CA propuesto.',
          origen_datos: 'INEGI, CONEVAL, motor de infraestructura.',
          por_que_este_enfoque: 'La adopción ciudadana es local — un piloto mal elegido invalida el programa entero.',
          supuesto_critico: 'Disponibilidad real de flota y personal en oleada 1.',
        },
        chart_briefs: [],
      }

    case 'plan_educativo':
      return {
        moduleId: resolvedId,
        title: 'Plan educativo y sensibilización ciudadana',
        pregunta_guia: '¿Cuánto cuesta enseñar a separar y en qué segmentos?',
        subtitulo_catchy: 'IPC, condominios y vía pública — costos distintos',
        situacion_actual: `La captura en ${territorio} depende de hábitos. El costo educativo no es uniforme por tipo de vivienda.`,
        observacion_alquimia: `${scope} El módulo usa IPC del store (encuesta o benchmark SEMARNAT) y factor vía pública del M02B.`,
        criterio_decision: 'Dimensionar brigadas y presupuesto de comunicación antes de fijar meta de captura año 1.',
        que_no_significa: 'No sustituye campaña de comunicación social aprobada por Cabildo.',
        siguiente_accion: 'Cargar IPC de encuesta o documentar uso de benchmark 70 con ProvenanceBadge.',
        fuente_o_evidencia: 'SEMARNAT 2022, ENIGH vivienda, calculator costoComSocial.',
        metodologia_editorial: {
          como_se_calcula: 'Costo educación = f(hogares, IPC, % vía pública, brigadas).',
          origen_datos: 'Store: casaViaPublicaPct, indicePreparacionCiudadana.',
          por_que_este_enfoque: 'Separar en condominio vs calle evita subestimar costo en zonas de rezago.',
          supuesto_critico: 'IPC real de campo — sin encuesta, el benchmark puede sobrestimar preparación.',
        },
        chart_briefs: [],
      }

    case 'costo_omision':
      return {
        moduleId: resolvedId,
        title: 'El costo acumulado de no hacer nada en los próximos 10 años',
        pregunta_guia: '¿Cuánto le cuesta al municipio cada año que pasa sin un programa de RSU?',
        subtitulo_catchy: 'La omisión tiene precio — y crece con la inflación sin fecha de fin',
        situacion_actual: `Sin programa de separación, ${territorio} seguirá pagando la tarifa de disposición sobre el 100% del RSU generado, con inflación compuesta y sin recuperar valor de los materiales.`,
        observacion_alquimia: `${scope} La pérdida acumulada suma disposición en relleno, daño sanitario, multas LGPGIR y pérdida de elegibilidad para financiamiento verde.`,
        criterio_decision: 'Reencuadrar la conversación presupuestal: el programa no es un gasto, es el mecanismo para evitar un costo mayor y creciente.',
        que_no_significa: 'No es una amenaza política. Es un análisis financiero del escenario de omisión, calculado con las mismas fuentes del simulador.',
        siguiente_accion: 'Presentar el análisis contrafactual como el primer argumento ante el Cabildo antes de mostrar el CAPEX del programa.',
        fuente_o_evidencia: 'Tarifa media relleno sanitario nacional (SEMARNAT). Costo salud OPS/INSP México. INPC BANXICO. LGPGIR sanciones Art. 10.',
        metodologia_editorial: {
          como_se_calcula: 'Costo acumulado = Σ(RSU_año × costo_disposición × factor_INPC^año) + daño_salud. Daño salud = fracción_orgánica × costo_OPS_ton. Saturación relleno = capacidad_residual ÷ ritmo_disposición.',
          origen_datos: 'RSU generado del M01. Tarifas de disposición: SEMARNAT DBGIR. Costo salud: OPS/INSP México 2021. Inflación: BANXICO proyección media 2024–2026.',
          por_que_este_enfoque: 'Mostrar lo que se pierde cada año sin actuar suele convencer al Cabildo antes que la promesa de ingresos futuros.',
          supuesto_critico: 'Tarifa de disposición local puede diferir de la media nacional. Solicitar al municipio la tarifa contractual con el operador del relleno para recalibrar.',
        },
        chart_briefs: [],
      }

    case 'organigrama':
      return {
        moduleId: resolvedId,
        title: 'La estructura de quién es responsable de cada decisión en el programa',
        pregunta_guia: '¿Quién opera cada centro, quién firma la bitácora y quién aprueba el gasto?',
        subtitulo_catchy: 'Sin estructura orgánica aprobada, el programa no tiene responsable — y sin responsable, no hay programa',
        situacion_actual: `${territorio} necesita definir la estructura de personal antes de aprobar el CAPEX. El Cabildo siempre pregunta: "¿quién es el responsable?" antes de votar.`,
        observacion_alquimia: `${scope} La plantilla está parametrizada por tipo de CA (P/M/G) con datos de referencia ANIPAC e IMSS. El RACI asigna un único Aprobador por actividad, eliminando ambigüedad de responsabilidades.`,
        criterio_decision: 'Aprobar la estructura de personal y el presupuesto mensual de nómina antes de comprometer inversión en infraestructura.',
        que_no_significa: 'No es el organigrama de la dirección municipal. Es el organigrama específico del Programa de CAs dentro de la estructura municipal existente.',
        siguiente_accion: 'Validar el tabulador salarial del municipio contra el benchmark sectorial y ajustar el costo de nómina antes de la presentación a Cabildo.',
        fuente_o_evidencia: 'Plantilla: ANIPAC, CEMPRE México. Salarios referencia: IMSS Ramo 37, 2025. Factor prestaciones: 1.35×.',
        metodologia_editorial: {
          como_se_calcula: 'Nómina total = Σ(cantidad_por_puesto × salario_bruto × 1.35). OPEX nómina = nómina / OPEX_total × 100 (varía por tipo: 42–52%).',
          origen_datos: 'Estructura de personal basada en benchmarks de CAs operativos en México (ANIPAC 2023, CEMPRE México 2022). Salarios: IMSS Tabla de Riesgos Rama 37.',
          por_que_este_enfoque: 'El RACI no es un ejercicio de administración — es el documento que define quién firma la bitácora PER (obligatorio para trazabilidad GRI 306-4) y quién responde ante la contraloría.',
          supuesto_critico: 'Tabulador salarial municipal. Algunos municipios tienen categorías específicas que no coinciden con el benchmark sectorial.',
        },
        chart_briefs: [],
      }

    case 'arbol_financiamiento':
      return {
        moduleId: resolvedId,
        title: 'El camino viable para financiar el programa — siempre existe uno',
        pregunta_guia: '¿Cómo financiamos el programa si el municipio no tiene presupuesto disponible?',
        subtitulo_catchy: '"No tenemos presupuesto" no es el fin del análisis — es el inicio del árbol de decisión',
        situacion_actual: `La restricción más frecuente en ${territorio} es la disponibilidad de CAPEX. Este módulo demuestra que existen 6 caminos de financiamiento estructurados, cada uno con requisitos y costos de capital distintos.`,
        observacion_alquimia: `${scope} La elección del vehículo financiero determina el costo real del programa, la distribución de riesgos y la viabilidad política. Un préstamo BID al 6% vs. banca comercial al 18% puede representar más de $30M MXN en intereses a 10 años sobre el mismo proyecto.`,
        criterio_decision: 'Elegir el vehículo financiero que maximiza la viabilidad del programa dado el perfil fiscal, la disposición política y la capacidad de reporte ESG del municipio.',
        que_no_significa: 'No es una recomendación de estructuración legal. La elección definitiva requiere asesoría jurídica y financiera especializada.',
        siguiente_accion: 'Responder las 3 preguntas del árbol (presupuesto, operador privado, capacidad ESG) para identificar el camino más viable y solicitar asistencia técnica correspondiente.',
        fuente_o_evidencia: 'LAASSP, LFPPP, Ley de Disciplina Financiera, BANOBRAS Programa Economía Circular, BID Ciudades Sostenibles — criterios de elegibilidad publicados 2023.',
        metodologia_editorial: {
          como_se_calcula: 'Costo de capital: tasa de interés efectiva anual. Tiempo de cierre: promedio de cierre de operaciones equivalentes documentadas. Los rangos son referencias de mercado 2024–2025.',
          origen_datos: 'Criterios de elegibilidad: publicaciones oficiales BID, CAF, BANOBRAS. Marcos legales: DOF versiones vigentes a 2025.',
          por_que_este_enfoque: 'El municipio necesita ver que existe un camino viable antes de que la conversación de CAPEX bloquee la decisión de política pública. El árbol de decisión convierte una barrera percibida en una selección técnica.',
          supuesto_critico: 'La disponibilidad real de cada vehículo depende del perfil crediticio municipal y del ciclo de aprobación presupuestal federal. Los tiempos son referenciales.',
        },
        chart_briefs: [],
      }

    case 'expediente_cabildo':
      return {
        moduleId: resolvedId,
        title: 'El paquete completo para la sesión de Cabildo que autoriza la inversión',
        pregunta_guia: '¿El expediente tiene todo lo que el Cabildo necesita para votar con información?',
        subtitulo_catchy: 'Del simulador al salón de sesiones — el expediente que convierte el análisis en decisión',
        situacion_actual: `El análisis de ${territorio} está completo. Este módulo genera el paquete institucional que condensa los ${MODULE_COUNT} módulos anteriores en un expediente presentable ante Cabildo, Contraloría y financiadores.`,
        observacion_alquimia: `${scope} El expediente incluye análisis financiero documentado, cotización recomendada, plan de gobernanza, checklist de arranque y documentos exportables (PDF, Excel, URL). Cada documento tiene trazabilidad a su fuente en el simulador.`,
        criterio_decision: 'Confirmar que el expediente responde las 6 preguntas que todo regidor hace: ¿cuánto cuesta?, ¿quién paga?, ¿quién opera?, ¿cuál es el riesgo?, ¿cuál es el beneficio?, ¿cuándo empezamos?',
        que_no_significa: 'No es el dictamen técnico oficial. Es el pre-expediente de análisis que respalda la solicitud formal al área jurídica.',
        siguiente_accion: 'Exportar el paquete ZIP y presentarlo en la sesión previa al Cabildo para validar supuestos con el tesorero municipal.',
        fuente_o_evidencia: `Todos los módulos del simulador ${moduleRangeLabel()}. Documentos generados por flujo AGORA.`,
        metodologia_editorial: {
          como_se_calcula: 'No aplica. Este módulo consolida y exporta, no calcula.',
          origen_datos: 'Store del simulador (Zustand) y flujo AGORA para generación de documentos.',
          por_que_este_enfoque: 'Sin un expediente ordenado, el análisis pierde frente a resúmenes simplificados en sesión de Cabildo.',
          supuesto_critico: 'La completitud depende de que los módulos anteriores estén configurados con datos del municipio.',
        },
        chart_briefs: [],
      }

    case 'gate_status':
      return {
        moduleId: resolvedId,
        title: 'Estado de gates G1–G5 — cierre del expediente',
        pregunta_guia: '¿Puede el proyecto avanzar al siguiente gate?',
        subtitulo_catchy: 'Prerequisitos verificados contra el estado real de cada módulo.',
        situacion_actual: `${territorio} debe confirmar que los gates G1–G5 tienen sus prerequisitos cerrados antes de declarar el expediente listo.`,
        observacion_alquimia: `${scope} Cada gate valida un bloque del recorrido: diagnóstico, planificación, modelo, operación y cierre documental.`,
        criterio_decision: 'No avanzar de gate con prerequisitos abiertos que afecten la validez del expediente.',
        que_no_significa: 'No sustituye la resolución de Cabildo ni la autorización presupuestal.',
        siguiente_accion: 'Revisar prerequisitos del gate actual y cerrar los pendientes antes de la fecha límite.',
        fuente_o_evidencia: 'Estado de módulos en el simulador y checklist de gates KRONOS.',
        metodologia_editorial: {
          como_se_calcula: 'Cada gate evalúa booleanos de completitud por módulo prerequisito.',
          origen_datos: 'Store del simulador y reglas de gate definidas en chapterConfig.',
          por_que_este_enfoque: 'Evita presentar un expediente incompleto ante Cabildo o financiadores.',
          supuesto_critico: 'Los prerequisitos deben coincidir con la normativa interna del municipio.',
        },
        chart_briefs: [],
      }

    case 'evm_dashboard':
      return {
        moduleId: resolvedId,
        title: 'Valor ganado (EVM) — control presupuestal',
        pregunta_guia: '¿El avance físico corresponde al presupuesto ejercido?',
        subtitulo_catchy: 'CPI, SPI y proyección de costo al cierre desde el CAPEX del simulador.',
        situacion_actual: `${territorio} necesita comparar planificado vs. real en el CAPEX del programa de RSU.`,
        observacion_alquimia: `${scope} El tablero calcula índices de valor ganado (EVM) a partir del CAPEX configurado y los costos reales ingresados.`,
        criterio_decision: 'Corregir desviaciones antes de solicitar ampliaciones presupuestales.',
        que_no_significa: 'No reemplaza la contabilidad municipal ni la conciliación con tesorería.',
        siguiente_accion: 'Ingresar porcentaje de avance real y costos acumulados para actualizar el semáforo.',
        fuente_o_evidencia: 'CAPEX del simulador, PMBOK 6.ª ed. (EVM), partidas presupuestales municipales.',
        metodologia_editorial: {
          como_se_calcula: 'CPI = EV/AC. SPI = EV/PV. EAC proyectado según desempeño actual.',
          origen_datos: 'CAPEX del M09 y avance reportado por el PMO.',
          por_que_este_enfoque: 'Cabildo y financiadores piden evidencia de control presupuestal, no solo proyecciones.',
          supuesto_critico: 'La calidad del PV depende de que el CAPEX esté validado con cotizaciones locales.',
        },
        chart_briefs: [],
      }

    case 'conciliacion_mensual':
      return {
        moduleId: resolvedId,
        title: 'Conciliación mensual de presupuesto',
        pregunta_guia: '¿El ejercicio del mes coincide con el avance físico?',
        subtitulo_catchy: 'Partidas presupuestales vs. costos reales del PMO.',
        situacion_actual: `${territorio} debe conciliar mensualmente el presupuesto ejercido con el avance del programa.`,
        observacion_alquimia: `${scope} La tabla compara partidas del presupuesto autorizado contra costos capturados en el simulador.`,
        criterio_decision: 'Documentar desviaciones antes del cierre contable mensual.',
        que_no_significa: 'No es dictamen de la Contraloría ni acta de tesorería.',
        siguiente_accion: 'Cargar costos del mes en curso y comparar contra el PV del cronograma PERT.',
        fuente_o_evidencia: 'Partidas presupuestales, bitácora PMO, cronograma del M05.',
        metodologia_editorial: {
          como_se_calcula: 'Variación = costo real − presupuesto devengado del periodo.',
          origen_datos: 'Captura mensual del PMO y PV del plan maestro.',
          por_que_este_enfoque: 'La conciliación mensual detecta desvíos antes de que afecten el gate de cierre.',
          supuesto_critico: 'Las partidas deben mapearse 1:1 con categorías del CAPEX del simulador.',
        },
        chart_briefs: [],
      }

    case 'risk_dashboard':
      return {
        moduleId: resolvedId,
        title: 'Registro de riesgos del programa',
        pregunta_guia: '¿Cuáles riesgos pueden comprometer la viabilidad del programa?',
        subtitulo_catchy: 'Probabilidad × impacto con responsable y plan de mitigación.',
        situacion_actual: `${territorio} debe mantener visible el registro de riesgos críticos del programa RSU.`,
        observacion_alquimia: `${scope} El tablero muestra riesgos R01–R06 con score derivado de probabilidad e impacto (matriz PMBOK).`,
        criterio_decision: 'Asignar responsable y mitigación a riesgos en semáforo rojo.',
        que_no_significa: 'No es auditoría externa ni dictamen de PROFEPA.',
        siguiente_accion: 'Documentar plan de mitigación para cada riesgo en rojo.',
        fuente_o_evidencia: 'Registro de riesgos, M14 riesgos del modelo, actas de seguimiento.',
        metodologia_editorial: {
          como_se_calcula: 'Score = probabilidad × impacto en escala 1–5.',
          origen_datos: 'Evaluación del M14 (riesgos del modelo) y actualizaciones del PMO.',
          por_que_este_enfoque: 'Financiadores y Cabildo exigen registro vivo de riesgos, no solo análisis inicial.',
          supuesto_critico: 'La probabilidad debe revisarse cada trimestre con datos de operación.',
        },
        chart_briefs: [],
      }

    default:
      return null
  }
}
