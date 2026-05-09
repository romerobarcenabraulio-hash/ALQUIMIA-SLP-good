import { ZMS } from '@/lib/constants'

export interface MunicipalNarrative {
  title: string
  body: string
  maturity: string
}

const DEFAULT_NARRATIVE: MunicipalNarrative = {
  title: 'Lectura territorial del escenario',
  body: 'Cada municipio tiene una historia operativa y reglamentaria distinta. ALQUIMIA usa esa diferencia para separar educación, operación, propuesta normativa y fuente verificable; una zona metropolitana coordina territorio, pero no sustituye el municipio.',
  maturity: 'Revisar fuente local, capacidad operativa y madurez institucional antes de convertir el escenario en propuesta pública.',
}

const NARRATIVES: Record<string, MunicipalNarrative> = {
  SLP: {
    title: 'San Luis Potosí parte de una oportunidad estructural',
    body: 'El caso SLP no se entiende como una campaña aislada. La ciudad puede ordenar la separación desde vivienda, reconocer mejor el trabajo de recolectores de base y convertir toneladas mezcladas en rutas, centros de acopio y evidencia para política pública municipal.',
    maturity: 'Madurez media: existe investigación técnica amplia, pero precios, vivienda por clase y vigencia reglamentaria deben seguir trazándose.',
  },
  slp: {
    title: 'San Luis Potosí necesita pasar de diagnóstico a operación',
    body: 'La capital concentra volumen, población y presión de disposición final. El reto no es decir que hay basura: es mostrar cuánto cuesta, dónde se separa primero y qué regla local vuelve medible la conducta sin vender el borrador como acto oficial.',
    maturity: 'Madurez media-alta para propuesta técnica; faltan cotizaciones locales cerradas y validación jurídica competente.',
  },
  sol: {
    title: 'Soledad exige lectura municipal propia',
    body: 'Soledad comparte dinámica metropolitana con la capital, pero su operación, población y reglamento no se copian de San Luis Potosí. El escenario debe medir qué parte del RSU pertenece al municipio y qué capacidad real tendría para arrancar pilotos de separación.',
    maturity: 'Madurez media: buen caso para piloto territorial, condicionado a fuente municipal y ruta operativa propia.',
  },
  csp: {
    title: 'Cerro de San Pedro no debe modelarse como capital chica',
    body: 'Su escala es distinta. Aquí el valor está en evitar sobredimensionar infraestructura y proponer una ruta proporcional: educación, puntos de entrega y coordinación intermunicipal sin perder responsabilidad municipal.',
    maturity: 'Madurez inicial: conviene priorizar datos de campo y acuerdos operativos mínimos.',
  },
  vip: {
    title: 'Villa de Pozos requiere consolidar su propio punto de partida',
    body: 'Como municipio de reciente configuración institucional, el escenario debe ser cuidadoso: población, rutas, generación y regla municipal no pueden heredarse sin trazabilidad. ALQUIMIA debe ayudar a separar lo estimado de lo confirmado.',
    maturity: 'Madurez inicial: bloqueos y advertencias de fuente son parte del producto, no errores visuales.',
  },
  QRO: {
    title: 'Querétaro no necesita inventar sancionalidad',
    body: 'Querétaro ya cuenta con una base institucional más madura. El valor de ALQUIMIA aquí no es proponer castigos nuevos como si faltaran, sino ordenar evidencia, inspección, trazabilidad y operación para que la separación pueda medirse y sostenerse.',
    maturity: 'Madurez alta en marco; reto principal: evidencia operativa y consistencia municipal.',
  },
  qro: {
    title: 'Querétaro debe concentrarse en evidencia, no en sanción nueva',
    body: 'El municipio tiene una base normativa más cubierta que otros territorios. El escenario debe enfocarse en captura de evidencia, rutas, cumplimiento operativo y lectura ciudadana, manteniendo cualquier sanción como propuesta sujeta al proceso municipal.',
    maturity: 'Madurez alta: priorizar bitácora, inspección y datos auditables.',
  },
  cor: {
    title: 'Corregidora exige armonización fina',
    body: 'Corregidora forma parte de un ecosistema metropolitano con capacidades distintas. La propuesta debe leer su reglamento y sus colonias activas, no absorberse en una narrativa única de ZM Querétaro.',
    maturity: 'Madurez media-alta: buen candidato para ruta piloto por colonias con fuente municipal.',
  },
  MTY: {
    title: 'Monterrey demanda coordinación sin borrar municipios',
    body: 'La zona metropolitana de Monterrey tiene escala, mercado y complejidad institucional. ALQUIMIA debe ayudar a coordinar, pero cada municipio conserva responsabilidades, fuentes legales y condiciones operativas propias.',
    maturity: 'Madurez heterogénea: mercado fuerte, fuentes legales disparejas, operación por municipio.',
  },
  GDL: {
    title: 'Guadalajara necesita separar continuidad, fuente y ejecución',
    body: 'En Guadalajara y Zapopan existen instrumentos y antecedentes, pero una ZM no debe contarse como si tuviera una sola regla. La historia útil es distinguir qué municipio tiene fuente, qué programa dejó aprendizaje y qué falta para medir resultados verificables.',
    maturity: 'Madurez mixta: instrumentos localizados, Tlaquepaque pendiente y evidencia de implementación por cerrar.',
  },
  gdl: {
    title: 'Guadalajara debe probar medición y continuidad',
    body: 'El reto no es solo enunciar circularidad. Es conectar programas previos, fuente municipal, captura real y lectura ciudadana en un mismo expediente verificable, sin presentar la propuesta como documento oficial.',
    maturity: 'Madurez media-alta: requiere fuente oficial estable y métricas de campo.',
  },
  zap: {
    title: 'Zapopan aporta base documental, pero necesita trazabilidad operativa',
    body: 'Zapopan cuenta con fuente localizada y escala suficiente para modelar pilotos con evidencia. El énfasis debe estar en rutas, vivienda, comercios y captura medible, no en mezclar su caso con Guadalajara.',
    maturity: 'Madurez media-alta: fuente localizada; siguiente paso es operación verificable.',
  },
  tla: {
    title: 'Tlaquepaque debe quedar marcado como pendiente de fuente',
    body: 'Si no hay fuente municipal estable, el producto debe decirlo con claridad. ALQUIMIA puede educar y simular, pero no debe insinuar una propuesta normativa cerrada sin documento local verificable.',
    maturity: 'Madurez condicionada: fuente oficial pendiente antes de propuesta reglamentaria específica.',
  },
}

export function getMunicipalNarrative(zmId: string, municipioIds: string[]): MunicipalNarrative {
  if (municipioIds.length === 1) return NARRATIVES[municipioIds[0] ?? ''] ?? DEFAULT_NARRATIVE
  return NARRATIVES[zmId] ?? DEFAULT_NARRATIVE
}

export function getTerritoryName(zmId: string, municipioIds: string[]): string {
  const zm = ZMS.find(item => item.id === zmId)
  if (municipioIds.length === 1) {
    return zm?.municipios.find(m => m.id === municipioIds[0])?.nombre ?? municipioIds[0]?.toUpperCase() ?? 'tu municipio'
  }
  return zm?.nombre ?? 'tu ciudad'
}
