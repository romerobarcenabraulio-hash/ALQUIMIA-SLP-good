/** Contratos Q-016 — predios / expediente (sprint sin mapa). */

export type TipoInfraccionPredia =
  | 'basura_clandestina'
  | 'ca_sin_permiso'
  | 'mezcla_residuos_no_autorizada'
  | 'vertedero_no_autorizado'
  | 'otro'

export type NivelSancion =
  | 'aviso'
  | 'advertencia'
  | 'multa_menor'
  | 'multa_media'
  | 'multa_maxima'
  | 'clausura'

export interface EscaleraSancionDto {
  municipio_id: string
  articulo_reglamento: string
  descripcion_infraccion: TipoInfraccionPredia
  nivel: NivelSancion
  uma_minimo: number
  uma_maximo: number
  genera_clausura: boolean
  fuente_reglamento: string
  verificado_clc: boolean
}

export interface PredioRegistroDto {
  predio_id: string
  municipio_id: string
  direccion_texto: string
  lat: number | null
  lon: number | null
  uso_suelo_declarado: string | null
  area_m2: number | null
  notas: string | null
}

export interface InspeccionPrediaDto {
  inspeccion_id: string
  predio_id: string
  fecha_inspeccion: string
  tipo_infraccion: TipoInfraccionPredia
  descripcion_hallazgo: string
  tiene_permiso_ca: boolean
  permiso_ca_vigente: boolean | null
  inspector_nombre: string | null
  inspector_cargo: string | null
  municipio_id: string
  status: string
}

/** Respuesta GET /predios/catalogo/sanciones-slp — el valor UMA sale del backend únicamente. */
export interface CatalogoEscalerasSlpDto {
  valor_uma_referencia_mxn: number
  escaleras: EscaleraSancionDto[]
}

export interface ExpedienteSancionDto {
  expediente_id: string
  inspeccion_id: string
  predio_id: string
  municipio_id: string
  fecha_generacion: string
  tipo_infraccion: TipoInfraccionPredia
  articulo_reglamento: string
  nivel_sancion: NivelSancion
  uma_aplicado: number
  valor_uma_mxn: number
  monto_min_mxn: number
  monto_max_mxn: number
  genera_clausura: boolean
  reglamento_verificado_clc: boolean
  disclaimer: string
}
