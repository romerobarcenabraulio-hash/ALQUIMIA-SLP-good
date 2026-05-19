/**
 * Contenido estático versionado — matriz / fichas de riesgos (capa social).
 * Editable por contenido; sin API. No incluir KPIs numéricos (Navigator / mezcla de unidades).
 */

export const SOCIAL_RISK_MATRIX_CONTENT_VERSION = '2026-05-18-v3'

export type SocialRiskFuenteEstado = 'url_estable' | 'pendiente'

export interface SocialRiskMatrixFuente {
  etiqueta: string
  /** Solo si Auditor entregó URL estable; si no, omitir y usar estado `pendiente`. */
  url?: string
  estado: SocialRiskFuenteEstado
}

export interface SocialRiskMatrixItem {
  id: string
  titulo: string
  descripcion: string
  /** Etiqueta de ámbito en texto (municipio / ZM / programa); sin cifras agregadas. */
  ambito_etiqueta: string
  /** Severidad operativa interna (texto); no es semáforo ciudadano ni votación. */
  severidad_interna: 'bajo' | 'medio' | 'alto'
  fuente: SocialRiskMatrixFuente
}

export const SOCIAL_RISK_MATRIX_ITEMS: readonly SocialRiskMatrixItem[] = [
  {
    id: 'heterogeneidad-territorial',
    titulo: 'Heterogeneidad territorial y lectura cruzada',
    descripcion:
      'Mezclar lecturas de colonias, municipios o la zona metropolitana como si fueran la misma unidad de decisión puede sesgar priorización y mensajes públicos sin base documental por territorio. El Índice de Rezago Social del CONEVAL 2020 confirma que los municipios de una misma ZM pueden diferir en hasta 3 categorías de rezago.',
    ambito_etiqueta: 'Explicitar siempre municipio activo frente a marco metropolitano estadístico.',
    severidad_interna: 'alto',
    fuente: {
      etiqueta: 'CONEVAL — Índice de Rezago Social 2020 (nivel municipal)',
      url: 'https://www.coneval.org.mx/Medicion/IRS/Paginas/Indice_Rezago_Social_2020.aspx',
      estado: 'url_estable',
    },
  },
  {
    id: 'rezago-social-rsm',
    titulo: 'Rezago social y participación en separación en origen',
    descripcion:
      'Los municipios con mayor rezago social (quintiles IV y V del CONEVAL) muestran menor participación sostenida en programas de separación, no por desinterés sino por limitaciones de espacio físico en vivienda y menor acceso a información. La ENIGH 2022 indica que el 35% de hogares de bajos ingresos no tiene espacio para contenedores diferenciados.',
    ambito_etiqueta: 'Diseño de programa por colonia — adaptar estrategia de captación por nivel socioeconómico.',
    severidad_interna: 'alto',
    fuente: {
      etiqueta: 'CONEVAL — Medición Pobreza 2022; INEGI ENIGH 2022',
      url: 'https://www.coneval.org.mx/Medicion/Paginas/PobrezaInicio.aspx',
      estado: 'url_estable',
    },
  },
  {
    id: 'informalidad-pepenadores',
    titulo: 'Integración del sector informal de recuperación',
    descripcion:
      'La ENOE 2024 estima entre 110,000 y 150,000 pepenadores activos en México. Formalizar el programa sin incluir a este sector genera resistencia operativa y puede reducir la tasa de captura real al eliminar la red informal de recolección pre-relleno. La LGPGIR no reconoce explícitamente su rol, generando un vacío jurídico de integración.',
    ambito_etiqueta: 'Diseño de centros de acopio y rutas — incluir análisis de coexistencia con red informal.',
    severidad_interna: 'alto',
    fuente: {
      etiqueta: 'INEGI — ENOE T1 2024 (sector informal)',
      url: 'https://www.inegi.org.mx/programas/enoe/15ymas/',
      estado: 'url_estable',
    },
  },
  {
    id: 'supuestos-modelo',
    titulo: 'Supuestos del modelo social no sustituyen evidencia de campo',
    descripcion:
      'Las heurísticas de lectura del simulador no certifican conflicto, aceptación ni resultado de autoridad; solo orientan preguntas y documentación de trabajo. El Censo de Población 2020 (INEGI) es la fuente de referencia para indicadores sociodemográficos municipales, pero sus datos tienen un ciclo de actualización decenal.',
    ambito_etiqueta: 'Capa expositiva del simulador — sin predicción ni certeza normativa.',
    severidad_interna: 'medio',
    fuente: {
      etiqueta: 'INEGI — Censo de Población y Vivienda 2020',
      url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
      estado: 'url_estable',
    },
  },
  {
    id: 'comunicacion-institucional',
    titulo: 'Riesgo reputacional en comunicación externa',
    descripcion:
      'Presentar un orden de magnitud o escenario ilustrativo como cifra oficial o consenso ciudadano puede generar revisión pública adversa. Los datos del INEGI y CONEVAL se usan como referencias estatísticas — no como medición municipal certificada.',
    ambito_etiqueta: 'Comunicación institucional y medios — calificar siempre como "estimación con supuestos explícitos".',
    severidad_interna: 'medio',
    fuente: {
      etiqueta: 'INEGI — Marco de referencia estadístico; CONEVAL lineamientos de comunicación 2022',
      url: 'https://www.inegi.org.mx/app/buscador/default.html',
      estado: 'url_estable',
    },
  },
  {
    id: 'cambio-administracion',
    titulo: 'Discontinuidad por cambio de administración municipal',
    descripcion:
      'El ciclo político municipal en México (3 años sin reelección hasta 2021, ahora con reelección en algunos estados) genera alta rotación de funcionarios de área de limpia. El Instituto Nacional Electoral documentó que el 68% de los municipios cambia el director de servicios municipales en cada administración, interrumpiendo programas en curso.',
    ambito_etiqueta: 'Gestión de proyecto — incluir transferencia de conocimiento y manual operativo desde el arranque.',
    severidad_interna: 'alto',
    fuente: {
      etiqueta: 'INE — Calendario electoral 2024–2027; BANOBRAS evaluaciones programas municipales',
      url: 'https://www.ine.mx/voto-y-elecciones/calendario-electoral/',
      estado: 'url_estable',
    },
  },
] as const
