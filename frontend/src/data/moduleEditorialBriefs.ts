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
      }
    default:
      return null
  }
}
