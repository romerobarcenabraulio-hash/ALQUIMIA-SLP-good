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
        metodologia_editorial: `Las barras de generación y el donut de composición tienen un origen explícito: la tasa per cápita proviene del Diagnóstico Básico para la Gestión Integral de Residuos de la SEMARNAT, multiplicada por el conteo de habitantes del Censo de Población y Vivienda 2020 del INEGI para el municipio activo. La distribución por fracción — orgánicos, PET, HDPE, cartón, vidrio, otros — sigue el promedio nacional por estrato urbano publicado por la SEMARNAT y se calibra con las cotizaciones vigentes del mercado secundario de materiales reciclables en México. El supuesto que más mueve todos los números visibles en pantalla es la tasa de captura definida en este módulo: subirla un punto porcentual se propaga en cadena al potencial de ingresos, al costo evitado de disposición y a las toneladas proyectadas en el Gantt de implementación.`,
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
        metodologia_editorial: `Los indicadores sociodemográficos que encuadran las gráficas de este módulo — densidad habitacional, índice de marginación, distribución por tipo de vivienda — provienen del Censo 2020 del INEGI y se cruzan con la clasificación de zonas metropolitanas de CONAPO para estimar la viabilidad de rutas y frecuencias de recolección en el territorio visible en el mapa. El diagnóstico jurídico parte del reglamento municipal localizado: ALQUIMIA mapea artículos clave hacia obligaciones concretas — separación en origen, tipo de contenedores, frecuencia, sanciones, evidencia documental — para mostrar en la tabla qué puede ejecutarse bajo el marco vigente y qué requiere reforma o lineamiento complementario. El factor que más cambia la columna de "obligaciones operables hoy" es la antigüedad y actualización del reglamento municipal: un reglamento anterior a 2014 generalmente no contempla separación diferenciada, lo que estrecha el margen de acción sin reforma previa.`,
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
        metodologia_editorial: `Las barras del Gantt se construyen aplicando análisis PERT (Program Evaluation and Review Technique) sobre el catálogo de hitos de implementación de ALQUIMIA: cada tarea tiene tres estimados de duración — optimista, probable y pesimista — cuyo promedio ponderado define la barra visible, calibrado con tiempos documentados en programas municipales comparables de la zona metropolitana. La ruta crítica marcada en el diagrama identifica la secuencia de tareas cuyo atraso desplaza directamente la fecha de la primera oleada de recolección diferenciada; las tareas fuera de esa ruta tienen holgura temporal que puede absorber retrasos sin afectar el hito de apertura. El parámetro que más mueve la geometría del Gantt completo es el horizonte en semanas seleccionado: acortarlo concentra hitos simultáneos y eleva el riesgo de colisión de recursos, mientras que extenderlo diluye el impacto político de los primeros resultados ante el Cabildo.`,
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
        metodologia_editorial: `El mapa de centros de acopio y las rutas visibles en este módulo se dimensionan a partir de la brecha entre toneladas capturables calculadas en el Módulo 1 y la capacidad de procesamiento de los centros configurados, expresada en metros cúbicos por turno según los parámetros operativos documentados por la SEMARNAT y la Asociación Nacional de Empresas de Reciclaje. La frecuencia de recolección y el número de vehículos que aparecen en la bitácora PER son resultado de ese balance de flujo: el modelo distribuye el material por colonia piloto y estima el tiempo de llenado de cada punto de acopio para evitar que el servicio sature o subutilice el activo instalado. El parámetro más sensible de esta sección es el número de centros activos: activar o desactivar un centro redistribuye todas las rutas del mapa y puede cambiar la viabilidad operativa de una colonia completa, lo que explica por qué los indicadores de cobertura y costo por tonelada reaccionan abruptamente a ese ajuste.`,
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
        metodologia_editorial: `El grafo causal de este módulo traza las relaciones entre KPIs — desde generación hasta ingreso neto — pasando por los nodos de precio de mercado, merma de proceso, costo de disposición y tasa de captura, todos con fórmulas y proveniencia documentada en la matriz de trazabilidad. Los precios de materiales que alimentan las barras de ingreso se obtienen de cotizaciones del mercado secundario mexicano verificadas con compradores industriales activos en PET, HDPE, cartón y vidrio; la merma aplica los coeficientes del sector reciclador nacional publicados por el INECC. El nodo que más afecta el grafo de derecha a izquierda — del ingreso hacia los supuestos de base — es el precio del PET: su volatilidad trimestral explica históricamente más del 60% de la varianza del ingreso total en escenarios de alta captura, lo que justifica revisarlo antes de cualquier presentación con proyecciones financieras.`,
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
        metodologia_editorial: `El formulario de inspección sigue la metodología de registro documental adaptada al contexto de manejo de residuos: cada campo — situación observada, tipo de hallazgo, actor responsable, evidencia — construye el expediente que soporta la decisión administrativa posterior y puede ser revisado por el área jurídica del municipio sin ambigüedades. La clasificación de cada caso visible en el semáforo — educación, seguimiento, regularización o escalamiento — resulta de cruzar el tipo de situación observada con los artículos habilitantes del reglamento municipal cargado en el Módulo 2; sin ese reglamento, la clasificación es orientativa y no vinculante. El elemento que más determina el camino administrativo del caso es precisamente el tipo de situación registrada: disposición irregular en vía pública tiene tratamiento distinto al de un generador sin registro, y confundirlos es el error más frecuente que convierte una visita de educación en un conflicto administrativo innecesario.`,
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
        metodologia_editorial: `Las barras del waterfall financiero descomponen el ingreso neto en capas calculadas con lógica distinta: el ingreso directo por materiales es tonelada × precio spot × (1 − merma), el costo evitado de disposición multiplica las toneladas desviadas por la tarifa de relleno sanitario vigente del municipio, y las externalidades ambientales se valoran con el precio social del carbono de la SHCP aplicado sobre las toneladas de CO₂e evitadas. El análisis de Monte Carlo visible genera iteraciones variando simultáneamente precio, captura y merma dentro de sus rangos históricos documentados, y el diagrama de tornado identifica cuál de esas tres variables produce mayor dispersión en el TIR resultante. El supuesto que más cambia la lectura financiera completa es el precio de disposición por tonelada en relleno sanitario: en municipios con contratos de concesión privada ese costo puede duplicar el estimado base, lo que modifica radicalmente la rentabilidad del programa y la justificación de inversión ante el Cabildo.`,
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
        metodologia_editorial: `Cada fila de la tabla representa una afirmación cuantitativa del sistema — una cifra, una tasa, una proporción visible en cualquiera de los módulos anteriores — y la cadena que la sostiene: la fuente primaria, la fórmula exacta que transforma el dato en el número visible y el estado de verificación. El color de fondo de cada fila no es decorativo: una fila marcada como pendiente significa que ese número no debe usarse en presentación pública sin antes confirmar la fuente; condicionado indica que el dato es válido únicamente bajo el supuesto explícito registrado en esa misma línea. La columna de fórmula es la puerta de entrada para entender qué operación matemática conecta el dato de campo con el KPI visible en pantalla — leerla es la forma más rápida de detectar si un número cambia cuando se modifica un supuesto en el Módulo 1, o si permanece fijo porque proviene de un censo externo no editable.`,
      }
    default:
      return null
  }
}
