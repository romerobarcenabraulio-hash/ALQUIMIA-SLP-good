/** Reportaje automático de antecedentes municipales (M01A). */

export type AntecedenteTipo =
  | 'concesion'
  | 'programa'
  | 'infraestructura'
  | 'norma'
  | 'conflicto'
  | 'campaña'
  | 'operador'
  | 'contexto'
  | 'indicador'

export interface AntecedenteFuente {
  url: string
  titulo?: string | null
  tier: 'T1' | 'T2' | 'T3' | 'T4'
  confianza: number
}

export interface AntecedenteEvento {
  evento_id: string
  anio?: number | null
  tipo: AntecedenteTipo
  titulo: string
  resumen: string
  fuentes: AntecedenteFuente[]
  confianza: number
  operador?: string | null
  verificar: boolean
}

export interface AntecedentesReportaje {
  municipio_id: string
  zm_id: string
  municipio_nombre: string
  estado: string
  generated_at: string
  sintesis: string
  eventos: AntecedenteEvento[]
  vacios_documentales: string[]
  lecciones: string[]
  score_completitud: number
  advertencias: string[]
  fuente_serper: boolean
  queries_ejecutadas: number
}
