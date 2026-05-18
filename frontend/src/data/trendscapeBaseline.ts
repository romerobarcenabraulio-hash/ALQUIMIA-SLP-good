/**
 * Snapshot curado ALQUIMIA — tendencias agregadas cuando no hay proveedor externo
 * (TRENDSCAPE_UPSTREAM_URL). Orientación consultiva; no sustituye estudios sectoriales oficiales.
 */

export type TrendscapeAxis =
  | 'salud_publica'
  | 'calidad_vida_urbana'
  | 'gestion_residuos'
  | 'agua_aire_suelo'
  | 'gobernanza'

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile'

export interface TrendscapeTrendItem {
  id: string
  title: string
  summary: string
  axis: TrendscapeAxis
  direction: TrendDirection
  relevance_for_rsu: 'alta' | 'media' | 'baja'
}

export interface TrendscapeBaselineResponse {
  source: 'alquimia_baseline'
  generated_at: string
  nota_fuente: string
  trends: TrendscapeTrendItem[]
}

export function getTrendscapeBaseline(): TrendscapeBaselineResponse {
  return {
    source: 'alquimia_baseline',
    generated_at: new Date().toISOString(),
    nota_fuente:
      'Curación interna ALQUIMIA para orientación en sala de mando. Sustituye con API de tendencias configurando TRENDSCAPE_UPSTREAM_URL (servidor).',
    trends: [
      {
        id: 'cv-aseo-salud',
        title: 'Calidad de vida y aseo urbano',
        summary:
          'Presión creciente por espacio público limpio, manejo de puntos negros y percepción de salud en entorno urbano denso.',
        axis: 'calidad_vida_urbana',
        direction: 'up',
        relevance_for_rsu: 'alta',
      },
      {
        id: 'rsu-seg-reg',
        title: 'Cumplimiento normativo RSU',
        summary:
          'Las obligaciones de separación en origen y trazabilidad documental ganan peso en auditorías y compras públicas de servicios.',
        axis: 'gestion_residuos',
        direction: 'up',
        relevance_for_rsu: 'alta',
      },
      {
        id: 'aire-emisiones',
        title: 'Calidad del aire y emisiones asociadas',
        summary:
          'Vinculación visible entre quema/relleno inadecuado, transporte de residuos y métricas de exposición poblacional.',
        axis: 'agua_aire_suelo',
        direction: 'volatile',
        relevance_for_rsu: 'media',
      },
      {
        id: 'agua-leac',
        title: 'Agua residual y lixiviados',
        summary:
          'Mayor escrutinio sobre infiltración y cuerpos receptores cercanos a sitios de disposición o transferencia.',
        axis: 'agua_aire_suelo',
        direction: 'up',
        relevance_for_rsu: 'media',
      },
      {
        id: 'participacion',
        title: 'Participación ciudadana y transparencia',
        summary:
          'Expectativas de datos abiertos sobre rutas, toneladas y costos en programas municipales de limpieza.',
        axis: 'gobernanza',
        direction: 'up',
        relevance_for_rsu: 'alta',
      },
      {
        id: 'salud-vector',
        title: 'Salud pública y vectores',
        summary:
          'Residuos mal confinados incrementan riesgos de plagas y focos de contaminación con impacto en primer nivel de atención.',
        axis: 'salud_publica',
        direction: 'up',
        relevance_for_rsu: 'media',
      },
    ],
  }
}
