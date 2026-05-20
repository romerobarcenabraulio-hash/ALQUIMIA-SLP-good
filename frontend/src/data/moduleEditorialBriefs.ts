import type { MunicipioMadurezVista } from '@/lib/municipioMadurezContexto'

/** Metodología estructurada en 4 secciones. Cada campo: 2–4 oraciones, sin punto y coma encadenados. */
export type MetodologiaEditorial = {
  como_se_calcula: string        // "¿Cómo?" — la fórmula o proceso paso a paso
  origen_datos: string           // "¿De dónde?" — fuentes oficiales usadas
  por_que_este_enfoque: string   // "¿Por qué?" — justificación metodológica
  supuesto_critico: string       // "¿Qué mueve más el resultado?"
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
  if (!brief || !chartId) return null
  return brief.chart_briefs.find((c) => c.chart_id === chartId) ?? null
}

export function getModuleEditorialBrief(moduleId: string, ctx: ModuleEditorialContext): ModuleEditorialBrief | null {
  const territorio = ctx.territorio
  const scope = scopeText(ctx)
  const normativa = ctx.municipio?.lineaNormativa
  const operativa = ctx.municipio?.lineaOperativa

  switch (moduleId) {
    case 'city_baseline':
      return {
        moduleId,
        title: 'El problema en números: cuánto generamos y cuánto perdemos',
        subtitulo_catchy: '¿Cuántos kilos genera este municipio y cuánto dinero está dejando ir?',
        situacion_actual: `En ${territorio}, el punto de partida es entender cuánto RSU se genera, cuánto se puede separar y qué costo público aparece cuando todo llega mezclado.`,
        observacion_alquimia: `${scope} ALQUIMIA ordena vivienda, generación per cápita, composición, precios y costo por tonelada enterrada para que el problema se lea con supuestos explícitos.`,
        criterio_decision: 'Antes de hablar de metas, el equipo debe ajustar generación, vivienda, captura, merma y precios para que la conversación empiece desde un escenario defendible.',
        que_no_significa: 'No es estadística municipal cerrada, cifra autorizada ni medición de campo; es una lectura inicial con fuentes y supuestos visibles.',
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
              supuesto_critico: 'El porcentaje de captura al final del horizonte. Los primeros años son lentos; el salto ocurre cuando la separación en origen ya es hábito en la colonia piloto.',
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

    case 'municipal_context':
      return {
        moduleId,
        title: 'El reglamento que habilita o bloquea el programa',
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

    case 'future_goals':
      return {
        moduleId,
        title: 'El calendario que convierte las metas en acciones concretas',
        subtitulo_catchy: 'Del diagnóstico al calendario: cuándo, quién y cuánto cuesta arrancar',
        situacion_actual: `Las metas de ${territorio} solo sirven si se vuelven calendario, dependencias y capacidad; una meta sin tiempo ni responsable se queda en aspiración.`,
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

    case 'infrastructure_operations':
      return {
        moduleId,
        title: 'Infraestructura y operación: dónde, con qué y con quién',
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
              como_se_calcula: 'Cada punto en el mapa = un centro de acopio con coordenadas lat/lon. El radio de influencia = sqrt(toneladas_por_dia / (densidad_poblacional × tasa_captura × π)). Los puntos con datos reales vienen de Google Places o DENUE; los demás son propuestas del modelo.',
              origen_datos: 'Google Places API (fuente=places_api) o INEGI DENUE (fuente=denue) para centros existentes. Coordenadas propuestas calculadas por el motor de optimización ALQUIMIA.',
              por_que_este_enfoque: 'La ubicación geográfica afecta la tasa de captura directamente: un CA a más de 2km de la zona de generación reduce la participación ciudadana hasta un 40% según estudios de accesibilidad.',
              supuesto_critico: 'La fuente de los puntos del mapa. Los puntos de propuesta son simulación —no predios confirmados. La leyenda indica qué es verificado y qué es simulado.',
            },
          },
        ],
      }

    case 'market_traceability':
      return {
        moduleId,
        title: 'El mercado secundario: compradores, precios y riesgo documentado',
        subtitulo_catchy: 'A quién le vendemos, a qué precio real y con qué riesgo de mercado',
        situacion_actual: `Los resultados numéricos de ${territorio} solo tienen valor operativo si entiendes qué variable los empuja y qué supuestos de mercado los sostienen.`,
        observacion_alquimia: `${scope} El grafo causal enlaza KPIs, fórmulas y fuentes: permite ver riesgo de interpretación antes de presentar el escenario como lectura única.`,
        criterio_decision: 'Validar que compradores, precios y volúmenes sean coherentes con el baseline; reconstruir el grafo tras cambiar supuestos sensibles.',
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

    case 'risk_trends':
      return {
        moduleId,
        title: 'Los cuatro riesgos que determinan si el programa llega al Cabildo',
        subtitulo_catchy: 'Los riesgos que pueden hundir el programa — y cómo medimos cada uno',
        situacion_actual: `${territorio} enfrenta cuatro dimensiones de riesgo que deben medirse antes de comprometer inversión o presentar el programa al Cabildo.`,
        observacion_alquimia: `${scope} El score de riesgo no es una opinión — es una fórmula documentada con cuatro dimensiones ponderadas por relevancia política en el contexto municipal mexicano.`,
        criterio_decision: 'Identificar qué dimensión de riesgo es más alta y diseñar mitigaciones específicas antes de avanzar a la fase de implementación.',
        que_no_significa: 'No es una garantía de éxito ni un análisis exhaustivo de riesgos empresariales; es un diagnóstico de los riesgos específicos de programas RSU municipales en México.',
        siguiente_accion: 'Priorizar la dimensión con score más alto y definir al menos una acción de mitigación concreta con responsable y fecha.',
        fuente_o_evidencia: 'Datos de placement (riesgo mercado), mapa de actores (riesgo político), PERT slack (riesgo operativo), compliance LGPGIR (riesgo regulatorio).',
        metodologia_editorial: {
          como_se_calcula: 'Score total = 0.30·R_mercado + 0.40·R_político + 0.20·R_operativo + 0.10·R_regulatorio. Cada dimensión se calcula con su propia fórmula documentada. El score va de 0 (sin riesgo) a 100 (riesgo crítico).',
          origen_datos: 'R_mercado: datos de placement del M05. R_político: mapa de actores del módulo Proyecto Vivo. R_operativo: slack del PERT del M03. R_regulatorio: checklist LGPGIR del M02.',
          por_que_este_enfoque: 'ALQUIMIA pondera el riesgo político al 40% —la ponderación más alta— porque históricamente es el factor que más cancela programas municipales exitosos técnicamente. Los proyectos públicos no mueren por falta de tecnología sino por falta de stakeholders en la mesa correcta.',
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

    case 'inspeccion_predios':
      return {
        moduleId,
        title: 'Inspección y predios: evidencia ordenada antes de la acción',
        subtitulo_catchy: 'El predio que elegiste: ¿sirve o no? La evidencia ordenada antes de actuar',
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
          supuesto_critico: 'La existencia y calidad del reglamento cargado en M02. Sin él, el semáforo es orientativo; con él, cada decisión queda anclada al artículo que la habilita.',
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

    case 'scenarios_export':
      return {
        moduleId,
        title: 'El expediente de Cabildo: escenarios, derrama y sustento',
        subtitulo_catchy: 'El expediente listo para el Cabildo — números, supuestos y sensibilidad',
        situacion_actual: `El valor económico de ${territorio} debe separarse: venta base de materiales, pago evitable por entierro, efectos ambientales y sensibilidad financiera.`,
        observacion_alquimia: `${scope} La derrama base solo considera material separado vendido a la industria con precios del escenario; las externalidades amplían la lectura, pero no deben mezclarse con ingreso directo.`,
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
              como_se_calcula: 'Tabla comparativa de los tres escenarios activos: TIR, VPN, payback, empleos y CO₂e. TIR calculada con IRR estándar sobre flujos anuales del horizonte seleccionado.',
              origen_datos: 'Todos los inputs vienen de los módulos anteriores. TIR/VPN: cálculo propio del motor financiero ALQUIMIA.',
              por_que_este_enfoque: 'Presentar tres escenarios —no uno— obliga al equipo municipal a decidir con información de sensibilidad, no solo con el escenario optimista.',
              supuesto_critico: 'El WACC utilizado como tasa de descuento. La referencia pre-cargada es 12% (SHCP proyectos públicos México). Un alcalde puede considerar una tasa diferente según el costo de financiamiento municipal.',
            },
          },
        ],
      }

    case 'social_study':
      return {
        moduleId,
        title: 'Estudio demográfico y contexto social',
        subtitulo_catchy: 'Quiénes son las personas que deben separar — sin inventar cifras municipales',
        situacion_actual: `En ${territorio}, el diseño del programa de separación requiere leer el contexto sociodemográfico antes de comprometer metas de participación. La heterogeneidad de rezago social, el tamaño del sector informal de recuperación y los riesgos reputacionales no son homogéneos en la ZM.`,
        observacion_alquimia: `${scope} Los indicadores de este módulo son referencias estadísticas trazables (INEGI Censo 2020, CONEVAL 2022, ENOE 2024), no diagnósticos municipales certificados. Cada cifra citada aquí debe declararse como "estimación con supuestos explícitos" en comunicación pública.`,
        criterio_decision: 'Identificar grupos prioritarios, colonias de rezago, pepenadores a integrar y riesgos de reputación antes de cerrar el diseño de la estrategia de participación ciudadana.',
        que_no_significa: 'No equivale a encuesta de aceptación ciudadana, diagnóstico sociológico certificado ni padrón de beneficiarios.',
        siguiente_accion: 'Revisar la matriz de riesgos sociales, documentar supuestos en la bitácora y cerrar brechas con evidencia de campo antes de presentar el programa a Cabildo.',
        fuente_o_evidencia: 'INEGI Censo de Población y Vivienda 2020; CONEVAL Índice de Rezago Social 2022; INEGI ENOE T1 2024 (sector informal); INEGI ENIGH 2022; INE calendario electoral 2024–2027.',
        metodologia_editorial: {
          como_se_calcula: 'Los indicadores cuantitativos (población, viviendas, ocupantes, rezago social) se leen directamente de los tabulados INEGI cargados en el sistema. Los indicadores de riesgo social son heurísticas documentadas; no provienen de fórmulas de campo sino de estudios nacionales escalados.',
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

    case 'logistica_operativa':
      return {
        moduleId,
        title: 'Logística operativa: del papel a la ruta real',
        subtitulo_catchy: '¿Cómo se organizan los camiones, rutas y colonias para que el material llegue al CA?',
        situacion_actual: `La implementación del programa en ${territorio} exige diseñar rutas de recolección diferenciada antes del primer arranque. Sin un piloto bien definido, el riesgo operativo del primer mes puede comprometer la credibilidad del programa.`,
        observacion_alquimia: `${scope} La logística no es el módulo técnico aburrido — es donde la mayoría de los programas municipales fracasan. Rutas mal diseñadas generan quejas ciudadanas, sobrecoste de combustible y colapso de operación en el primer mes de diciembre.`,
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
        moduleId,
        title: 'Quién opera y cuánto recibe el municipio: el núcleo del modelo de negocio',
        subtitulo_catchy: '¿Cuánto entra al municipio y quién carga con el riesgo operativo?',
        situacion_actual: `La pregunta que el cabildo de ${territorio} realmente vota no es la tasa de captura. Es cuánto dinero entra al municipio, cuántos empleos se crean y cuál industria local se beneficia. Sin modelar el esquema de concesión, el simulador no puede responder ninguna de estas tres preguntas de forma diferenciada.`,
        observacion_alquimia: `${scope} El Artículo 78 LOM-SLP (Art. 23 en NL, Art. 91 en QRO) permite al ayuntamiento concesionar servicios públicos por acuerdo de cabildo. El adendo que crea la obligación de separar en origen es el instrumento que hace viable la inversión privada en el CA. Sin adendo, no hay certeza jurídica → sin certeza, ningún privado invierte.`,
        criterio_decision: 'Seleccionar el esquema que maximice el valor al municipio según su capacidad presupuestal. Si no hay presupuesto, el esquema B (concesionado) permite arrancar sin capital municipal.',
        que_no_significa: 'El esquema de concesión no define automáticamente los términos del contrato. El instrumento legal específico (concesión, contrato de servicios, APP) requiere revisión por el síndico municipal y asesor legal externo.',
        siguiente_accion: 'Presentar el árbol de decisión a presidencia y síndico municipal. Seleccionar esquema. Iniciar borrador de instrumento legal con asesoría jurídica especializada en servicios municipales.',
        fuente_o_evidencia: 'LAASSP (umbrales de licitación). Ley Orgánica Municipal SLP Art. 78 / NL Art. 23 / QRO Art. 91. BANOBRAS Catálogo de Programas 2024 (CCA — tasa 8.5%). CANACERO Informe 2023. SAGARPA/SADER SIAP 2023.',
        metodologia_editorial: {
          como_se_calcula: 'Esquema A: ingresos_municipio = ingresos_brutos × 100%. Esquema B: ingresos_operativo = ingresos_brutos × pct_cuota (5-15%). ISN = empleos × salario_bruto × tasa_ISN_estado. Derechos = n_CAs × $15,000/año.',
          origen_datos: 'Tasas ISN: Leyes de Hacienda estatales 2025 (SLP 2%, NL 3%, QRO 2%). Derechos operación: SEMARNAT Guía Técnica CAs 2022 §7.3. Empleo acerero: CANACERO 2023. Empleo agrícola: SIAP 2023.',
          por_que_este_enfoque: 'El multiplicador flat (16%) legacy del sistema era indefendible ante el síndico. El modelo diferenciado por esquema permite una justificación artículo por artículo del cálculo de beneficios al municipio.',
          supuesto_critico: 'El porcentaje de cuota de concesión (default 10%). En licitaciones reales, este porcentaje se negocia según el riesgo del mercado local y la competitividad del proceso. Un operador con mercado asegurado puede ofrecer hasta 15%; en mercados incipientes, 5% puede ser el techo.',
        },
        chart_briefs: [],
      }

    case 'doble_materialidad':
      return {
        moduleId,
        title: 'Doble materialidad: de programa municipal a activo ESG reportable',
        subtitulo_catchy: '¿Cómo le digo a un banco verde o al BID cuánto vale el programa?',
        situacion_actual: `Los resultados del programa en ${territorio} — toneladas desviadas, CO₂e evitadas, empleos creados — son exactamente lo que los instrumentos de financiamiento verde exigen cuantificado y certificado. Sin este módulo, el municipio deja dinero sobre la mesa: BANOBRAS CCA, BID FOMIN, Fondo Verde del Clima y bonos municipales ESG requieren todos este formato.`,
        observacion_alquimia: `${scope} La "doble materialidad" es el estándar europeo CSRD/ESRS E5 y está siendo adoptado en México por BANOBRAS y la CNBV como requisito de reporte para deuda verde. Un municipio que reporta GRI 306 con datos reales tiene acceso a tasas preferenciales que pueden reducir el costo de deuda en 200-400 pb.`,
        criterio_decision: 'Generar el informe GRI 306 con datos reales (no proyectados) tan pronto como el módulo de Monitoreo Real (M14) tenga datos de campo. Hasta entonces, los datos proyectados del simulador sirven como benchmark de referencia.',
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

    case 'source_traceability':
      return {
        moduleId,
        title: 'Cadena de evidencia: de dónde viene cada número',
        subtitulo_catchy: 'De dónde vienen todos los números — la cadena completa de cada cifra',
        situacion_actual: `Toda cifra visible sobre ${territorio} necesita una cadena clara: afirmación, fórmula, fuente, estado de verificación y responsable.`,
        observacion_alquimia: `${scope} La matriz no decora el reporte; obliga a cerrar pendientes y evita que una cita general se use como prueba de una cifra específica.`,
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

    default:
      return null
  }
}
