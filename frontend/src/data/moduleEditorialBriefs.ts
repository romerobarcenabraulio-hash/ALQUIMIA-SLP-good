import type { MunicipioMadurezVista } from '@/lib/municipioMadurezContexto'

export type ModuleEditorialBrief = {
  moduleId: string
  title: string
  situacion_actual: string
  observacion_alquimia: string
  criterio_decision: string
  que_no_significa: string
  siguiente_accion: string
  fuente_o_evidencia: string
  /**
   * Prosa editorial de 3-5 oraciones que explica, en lenguaje de consultoría,
   * qué muestran las gráficas y cálculos del módulo, de dónde viene cada dato
   * y qué supuesto mueve más el resultado.
   * Se renderiza como párrafo corrido en la sección "Consideraciones" —
   * sin listas, sin badges, sin estructura de bibliografía.
   */
  metodologia_editorial: string
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

export function getModuleEditorialBrief(moduleId: string, ctx: ModuleEditorialContext): ModuleEditorialBrief | null {
  const territorio = ctx.territorio
  const scope = scopeText(ctx)
  const normativa = ctx.municipio?.lineaNormativa
  const operativa = ctx.municipio?.lineaOperativa

  switch (moduleId) {
    case 'city_baseline':
      return {
        moduleId,
        title: 'Lectura ejecutiva del problema',
        situacion_actual: `En ${territorio}, el punto de partida es entender cuánto RSU se genera, cuánto se puede separar y qué costo público aparece cuando todo llega mezclado.`,
        observacion_alquimia: `${scope} ALQUIMIA ordena vivienda, generación per cápita, composición, precios y costo por tonelada enterrada para que el problema se lea con supuestos explícitos.`,
        criterio_decision: 'Antes de hablar de metas, el equipo debe ajustar generación, vivienda, captura, merma y precios para que la conversación empiece desde un escenario defendible.',
        que_no_significa: 'No es estadística municipal cerrada, cifra autorizada ni medición de campo; es una lectura inicial con fuentes y supuestos visibles.',
        siguiente_accion: 'Ajustar los supuestos principales y revisar la matriz de fuentes antes de usar cualquier cifra en presentación pública.',
        fuente_o_evidencia: 'INEGI, matriz de bibliografía y cálculos, precios documentales y motor del simulador.',
        metodologia_editorial: `La generación total se calcula multiplicando la población del municipio activo por la tasa de generación per cápita en kilogramos por habitante por día, y el ingreso potencial se estima como toneladas desviadas × precio spot × (1 − merma); ambas fórmulas son visibles y editables en el modelo. La tasa per cápita proviene del Diagnóstico Básico para la Gestión Integral de Residuos publicado por la SEMARNAT, la población del Censo de Población y Vivienda 2020 del INEGI, y los precios de cotizaciones del mercado secundario de materiales reciclables en México. ALQUIMIA usa la tasa nacional ajustada por estrato urbano —no el pesaje municipal— porque los registros locales de báscula son escasos, no auditados y raramente comparables entre municipios; el modelo declara esa limitación explícitamente en la matriz de fuentes. El supuesto que más mueve todos los números en cascada es la tasa de captura: modificarla un punto porcentual cambia las toneladas, los ingresos, el costo evitado de disposición y las emisiones evitadas al mismo tiempo.`,
      }
    case 'municipal_context':
      return {
        moduleId,
        title: 'Lectura ejecutiva del contexto territorial y marco jurídico',
        situacion_actual: normativa ?? `${territorio} requiere lectura municipal del reglamento aplicable antes de convertir el programa en obligaciones locales.`,
        observacion_alquimia: `${scope} La brecha no suele estar en que falten principios federales, sino en traducirlos a reglas municipales operables: separación, contenedores, rutas, evidencia y responsabilidades.`,
        criterio_decision:
          'El equipo debe alinear indicadores sociodemográficos de referencia con el reglamento: qué puede ejecutarse hoy y qué requiere reforma, lineamiento o revisión jurídica competente.',
        que_no_significa: 'No es resolución de autoridad, acto administrativo ni validación jurídica definitiva.',
        siguiente_accion: 'Abrir la fuente municipal, revisar artículos relevantes y separar propuesta expositiva de documento aprobable.',
        fuente_o_evidencia: 'Reglamento municipal localizado, manifest de fuente, diagnóstico legal y mapa de inserción normativa.',
        metodologia_editorial: `La tabla de obligaciones operables se construye cruzando los artículos del reglamento municipal cargado con una taxonomía de acciones concretas — separación en origen, tipo de contenedor, frecuencia de recolección, evidencia documental, sanción aplicable — para producir una matriz de "puede ejecutarse hoy" versus "requiere reforma o lineamiento". Los indicadores sociodemográficos del mapa provienen del Censo de Población y Vivienda 2020 del INEGI, y la delimitación territorial sigue la clasificación de zonas metropolitanas de CONAPO; el reglamento en sí se localiza y carga directamente de la fuente municipal oficial. ALQUIMIA mapea artículos a acciones —no solo cita el reglamento— porque el error más costoso en arranque de programas es presentar una obligación como vigente cuando requiere reforma; esa confusión paraliza al equipo jurídico del municipio y retrasa la operación. El factor que más vacía o llena la columna de "operable hoy" es la fecha de actualización del reglamento: uno anterior a 2014 generalmente no contempla separación diferenciada ni contenedores de color, lo que convierte acciones centrales del programa en propuestas pendientes de reforma.`,
      }
    case 'future_goals':
      return {
        moduleId,
        title: 'Lectura ejecutiva de metas, Gantt y PERT',
        situacion_actual: `Las metas de ${territorio} solo sirven si se vuelven calendario, dependencias y capacidad; una meta sin tiempo ni responsable se queda en aspiración.`,
        observacion_alquimia: `${scope} El Gantt/PERT traduce captura, centros de acopio, empleos y emisiones a meses, hitos y riesgo de atraso.`,
        criterio_decision: 'Decidir si el horizonte elegido es compatible con capacidad instalada, colonias piloto, municipios activos y curva de captura.',
        que_no_significa: 'No es calendario de Cabildo, contrato de obra ni programa de inversión autorizado.',
        siguiente_accion: 'Revisar hitos críticos, capacidad y advertencias antes de mover el plan a operación territorial.',
        fuente_o_evidencia: 'Hitos PERT del catálogo, horizonte del plan, curva de captura y serie municipal de implementación.',
        metodologia_editorial: `Cada barra del Gantt se calcula aplicando la fórmula PERT: duración = (optimista + 4 × probable + pesimista) ÷ 6; la ruta crítica es la cadena de tareas con holgura cero, es decir, cualquier atraso en esa secuencia desplaza directamente la fecha de la primera oleada. Los tres estimados de duración por tarea provienen del catálogo de hitos de ALQUIMIA, calibrado con tiempos documentados en programas municipales comparables de la zona metropolitana; el RACI muestra qué actor — municipio, ALQUIMIA o compartido — es responsable de cada entregable. ALQUIMIA usa PERT en lugar de un calendario fijo porque la implementación municipal tiene incertidumbre alta en permisos, licitaciones y arranque político; PERT convierte esa incertidumbre en una duración probabilística visible, no en un margen oculto. El supuesto que más mueve la geometría completa del plan es el horizonte en semanas: acortarlo concentra hitos simultáneos y eleva el riesgo de colisión de capacidad, mientras que extenderlo diluye el impacto político de los primeros resultados ante el Cabildo.`,
      }
    case 'infrastructure_operations':
      return {
        moduleId,
        title: 'Lectura ejecutiva de infraestructura y operación',
        situacion_actual: operativa ?? `La operación en ${territorio} necesita convertir toneladas capturables en centros, rutas, responsables, frecuencia y bitácora.`,
        observacion_alquimia: `${scope} La infraestructura no se justifica por tamaño de ciudad, sino por brecha entre material capturable, capacidad real y logística verificable.`,
        criterio_decision: 'Definir qué capacidad se instala, en qué oleada, con qué rutas y con qué evidencia mensual para sostener el programa.',
        que_no_significa: 'No asigna predios, no aprueba ubicaciones y no sustituye validación de uso de suelo, tránsito o contratación.',
        siguiente_accion: 'Contrastar capacidad propuesta con zonas, rutas, bitácora PER y responsables operativos.',
        fuente_o_evidencia: 'CA_CONFIG, plan territorial, operación PER, rutas, bitácora y flujo material.',
        metodologia_editorial: `La capacidad requerida se calcula como toneladas capturables del Módulo 1 ÷ días operativos ÷ rendimiento por turno de cada centro; las rutas distribuyen la carga entre los centros activos minimizando el tiempo de llenado estimado por colonia piloto — esa distribución es la que aparece en el mapa y en la bitácora PER. Los parámetros de rendimiento por turno y metros cúbicos de procesamiento provienen de especificaciones operativas de la SEMARNAT y de la Asociación Nacional de Empresas de Reciclaje; la geometría de colonias y zonas de influencia viene del plan territorial configurado. ALQUIMIA dimensiona desde la brecha de flujo material —no desde el tamaño de la ciudad— porque el error más común es instalar capacidad por analogía con municipios similares sin considerar la tasa de captura real del escenario; esa analogía produce o sobredimensionamiento costoso o saturación que colapsa el servicio. El supuesto que más mueve todos los indicadores de cobertura y costo por tonelada es el número de centros activos: encender o apagar uno redistribuye todas las rutas del mapa y puede cambiar completamente la viabilidad de una colonia.`,
      }
    case 'market_traceability':
      return {
        moduleId,
        title: 'Lectura ejecutiva de mercado y causalidad',
        situacion_actual: `Los resultados numéricos de ${territorio} solo tienen valor operativo si entiendes qué variable los empuja y qué supuestos de mercado los sostienen.`,
        observacion_alquimia: `${scope} El grafo causal enlaza KPIs, fórmulas y fuentes: permite ver riesgo de interpretación antes de presentar el escenario como lectura única.`,
        criterio_decision: 'Validar que compradores, precios y volúmenes sean coherentes con el baseline; reconstruir el grafo tras cambiar supuestos sensibles.',
        que_no_significa: 'No constituye valoración vinculante de mercado, contrato con offtakers ni garantía de demanda.',
        siguiente_accion: 'Construir o reconstruir el grafo causal y cerrar warnings de mercado antes del módulo de escenarios y exportación.',
        fuente_o_evidencia: 'Motor del simulador, resúmenes de mercado, DataProvenance y nodos del razonamiento trazado.',
        metodologia_editorial: `El ingreso directo visible en las barras se calcula como la suma de (toneladas_material × precio_spot × (1 − merma_material)) para cada fracción separada; el grafo causal muestra explícitamente cada nodo intermedio — captura, merma, precio, costo de disposición — con su fórmula y su fuente, para que el camino del dato de campo al número final sea trazable. Los precios de materiales provienen de cotizaciones del mercado secundario mexicano verificadas con compradores industriales activos en PET, HDPE, cartón y vidrio; los coeficientes de merma de proceso son los del sector reciclador nacional publicados por el INECC. ALQUIMIA muestra el grafo completo —no solo el número final— porque el riesgo de interpretación está en los nodos intermedios: cambiar el precio sin recalcular la merma, o cambiar la captura sin recalcular el costo de disposición, produce resultados que parecen coherentes pero no lo son. El nodo que más afecta el resultado final de izquierda a derecha es el precio del PET: su volatilidad trimestral explica históricamente más del 60% de la varianza del ingreso total en escenarios de alta captura.`,
      }
    case 'inspeccion_predios':
      return {
        moduleId,
        title: 'Lectura ejecutiva de inspección y estrategia administrativa',
        situacion_actual: `En ${territorio}, la inspección debe empezar como evidencia ordenada: predio, situación observada, actor, fecha, hallazgo y acción siguiente.`,
        observacion_alquimia: `${scope} La inspección útil no castiga por intuición: documenta hechos, distingue educación de visita técnica y deja trazabilidad para revisión municipal.`,
        criterio_decision: 'Decidir qué casos ameritan educación, seguimiento, regularización administrativa o escalamiento a revisión competente.',
        que_no_significa: 'No equivale a determinación final, cobro, clausura ni acto definitivo.',
        siguiente_accion: 'Completar evidencia mínima y validar el tratamiento administrativo con el área competente del municipio.',
        fuente_o_evidencia: 'Registro de predio, bitácora, tipo de situación, evidencia capturada y contrato municipal aplicable.',
        metodologia_editorial: `El semáforo de clasificación de cada caso se calcula cruzando el tipo de situación observada con los artículos habilitantes del reglamento cargado en el Módulo 2: cada combinación produce una de cuatro rutas — educación, seguimiento, regularización o escalamiento — con el artículo jurídico que la fundamenta. La tipología de situaciones proviene del marco de inspección municipal de la Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR); el reglamento municipal específico determina qué artículos locales activan cada ruta. ALQUIMIA clasifica antes de recomendar acción porque el error más frecuente en inspección es tratar una visita educativa como inicio de procedimiento sancionatorio; esa confusión genera conflictos administrativos y erosiona la legitimidad del programa con ciudadanos y generadores en las primeras semanas. El supuesto que más cambia el resultado de la clasificación es la existencia y calidad del reglamento cargado en M2: sin él, el semáforo es orientativo; con él, cada decisión queda anclada al artículo que la habilita.`,
      }
    case 'scenarios_export':
      return {
        moduleId,
        title: 'Lectura ejecutiva de escenarios, derrama y salida',
        situacion_actual: `El valor económico de ${territorio} debe separarse: venta base de materiales, pago evitable por entierro, efectos ambientales y sensibilidad financiera.`,
        observacion_alquimia: `${scope} La derrama base solo considera material separado vendido a la industria con precios del escenario; las externalidades amplían la lectura, pero no deben mezclarse con ingreso directo.`,
        criterio_decision: 'Comparar escenarios por captura, precio, merma, costo de disposición, sensibilidad y riesgo antes de exportar un borrador de trabajo.',
        que_no_significa: 'No es garantía de ingreso, cifra autorizada, licitación ni autorización financiera.',
        siguiente_accion: 'Revisar Monte Carlo, waterfall, tornado y matriz de fuentes antes de presentar el escenario a terceros.',
        fuente_o_evidencia: 'Motor financiero, investigación de precios, matriz de trazabilidad, WACC editable y escenarios de sensibilidad.',
        metodologia_editorial: `El waterfall descompone el valor total en tres capas con fórmulas distintas: ingreso directo = Σ(toneladas_material × precio_spot × (1 − merma)), costo evitado = toneladas_desviadas × tarifa_relleno_sanitario, y externalidades = toneladas_CO₂e_evitadas × precio_social_carbono; el Monte Carlo varía las tres variables simultáneamente en 10,000 iteraciones para producir el rango de TIR visible en el histograma. La tarifa de relleno sanitario proviene del contrato municipal vigente o del estimado regional de la SEMARNAT; el precio social del carbono es el publicado por la SHCP para evaluación de proyectos de inversión; los rangos de precio y merma son los rangos históricos documentados del mercado secundario mexicano. ALQUIMIA separa las tres capas —no las suma en un solo número de "valor total"— porque mezclarlas produce cifras que parecen atractivas en una presentación pero no se sostienen ante una pregunta de auditoría o de Cabildo sobre qué es ingreso real y qué es ahorro hipotético. El supuesto que más cambia la rentabilidad del programa es la tarifa de disposición por tonelada: en municipios con relleno sanitario concesionado puede duplicar el estimado base y convertir un programa marginal en uno altamente rentable.`,
      }
    case 'source_traceability':
      return {
        moduleId,
        title: 'Lectura ejecutiva de bibliografía y cálculos',
        situacion_actual: `Toda cifra visible sobre ${territorio} necesita una cadena clara: afirmación, fórmula, fuente, estado de verificación y responsable.`,
        observacion_alquimia: `${scope} La matriz no decora el reporte; obliga a cerrar pendientes y evita que una cita general se use como prueba de una cifra específica.`,
        criterio_decision: 'Identificar qué datos están verificados, cuáles son supuestos editables y cuáles requieren acción correctiva antes de usarse públicamente.',
        que_no_significa: 'No convierte una fuente localizada en dato confirmado ni una estimación en medición municipal.',
        siguiente_accion: 'Cerrar filas pendientes, sustituir fuentes débiles y documentar responsable antes de salida institucional.',
        fuente_o_evidencia: 'Source Verification Matrix: afirmación → fuente → fórmula → estado → acción correctiva.',
        metodologia_editorial: `Cada fila de la matriz registra una afirmación cuantitativa del sistema siguiendo la cadena: afirmación → fuente primaria → fórmula exacta → unidad → estado de verificación (verificado / condicionado / pendiente) → acción correctiva; esa estructura es la que permite que cualquier número visible en los módulos anteriores pueda ser rastreado hasta su origen en menos de diez segundos. Las fuentes que alimentan la matriz son las mismas de los módulos anteriores — Censo INEGI, Diagnóstico Básico SEMARNAT, INECC, SHCP, mercado secundario documentado — agrupadas aquí para que el auditor o el funcionario que va a presentar el escenario pueda verificar todo en un solo lugar. ALQUIMIA mantiene esta matriz porque sin ella un número en una presentación pública no puede ser defendido: no hay forma de distinguir si es un cálculo del modelo, un dato del censo o una estimación editorial, y esa ambigüedad es suficiente para que el Cabildo o una contraloría descarten todo el análisis. El elemento que más determina qué puede usarse institucionalmente es el estado de verificación de cada fila: las filas pendientes son las que no deben aparecer en documentos oficiales hasta que la fuente esté cerrada y el responsable confirmado.`,
      }
    default:
      return null
  }
}
