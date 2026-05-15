/**
 * Contenido estático versionado — matriz / fichas de riesgos (capa social).
 * Editable por contenido; sin API. No incluir KPIs numéricos (Navigator / mezcla de unidades).
 */

export const SOCIAL_RISK_MATRIX_CONTENT_VERSION = '2026-05-06-pr2'

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
      'Mezclar lecturas de colonias, municipios o la zona metropolitana como si fueran el mismo unidad de decisión puede sesgar priorización y mensajes públicos sin base documental por territorio.',
    ambito_etiqueta: 'Explicitar siempre municipio activo frente a marco metropolitano estadístico.',
    severidad_interna: 'alto',
    fuente: {
      etiqueta: 'Lineamiento Navigator — separación Municipality / MetropolitanZone',
      estado: 'pendiente',
    },
  },
  {
    id: 'supuestos-modelo',
    titulo: 'Supuestos del modelo social no sustituyen evidencia',
    descripcion:
      'Las heurísticas de lectura no certifican conflicto, aceptación ni resultado de autoridad; solo orientan preguntas y documentación de trabajo.',
    ambito_etiqueta: 'Capa expositiva del simulador — sin predicción ni certeza normativa.',
    severidad_interna: 'medio',
    fuente: {
      etiqueta: 'Checklist copy capa social (Auditoría ALQUIMIA)',
      estado: 'pendiente',
    },
  },
  {
    id: 'comunicacion-institucional',
    titulo: 'Riesgo reputacional en comunicación externa',
    descripcion:
      'Presentar orden de magnitud o escenario ilustrativo como cifra oficial o como consenso ciudadano puede generar revisión pública adversa.',
    ambito_etiqueta: 'Comunicación institucional y medios — calificar como ilustrativo.',
    severidad_interna: 'medio',
    fuente: {
      etiqueta: 'Guía de redacción pública (módulo sociodemográfico)',
      estado: 'pendiente',
    },
  },
] as const
