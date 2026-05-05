/**
 * Fuente primaria de reglamentos (Blueprint 26) — datos estáticos hasta endpoint futuro.
 * No hospedar PDF si existe URL estable en sitio oficial; aquí sólo enlaces y metadatos.
 */

export interface ReglamentoFuente {
  municipio_id: string
  nombre: string
  anio_version: number
  url_fuente: string // URL oficial o vacío si no localizado
  captura_url?: string // /public/reglamentos/[municipio_id]/portada.*
  articulos_clave?: string[]
  estado_verificacion: 'vigente' | 'en_revision' | 'no_localizado'
  fecha_verificacion: string
}

/** Catálogo mínimo: capital SLP, Soledad, Querétaro capital, Monterrey. */
export const REGLAMENTOS_FUENTE: ReglamentoFuente[] = [
  {
    municipio_id: 'slp',
    nombre:
      'Reglamento de Limpia y Gestión Integral de Residuos Sólidos de San Luis Potosí',
    anio_version: 2018,
    url_fuente: 'https://ordenjuridico.gob.mx/municipalslp/limpia2018.pdf',
    captura_url: '/reglamentos/slp/portada.svg',
    articulos_clave: ['Art. 1', 'Art. 2', 'Art. 11'],
    estado_verificacion: 'vigente',
    fecha_verificacion: '2026-05-05',
  },
  {
    municipio_id: 'sol',
    nombre: 'Reglamento / instrumento municipal de limpia y RSU — Soledad de Graciano Sánchez',
    anio_version: 0,
    url_fuente: '',
    articulos_clave: ['Art. 11', 'Art. 12'],
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    // TODO(CSA): completar URL oficial del reglamento o acuerdo de cabildo cuando esté localizado en POE o portal municipal.
  },
  {
    municipio_id: 'qro',
    nombre:
      'Reglamento Municipal de Gestión Integral de Residuos Sólidos de Querétaro',
    anio_version: 2021,
    url_fuente: 'https://municipio.queretaro.gob.mx/reglamentos/residuos2021.pdf',
    articulos_clave: ['Art. 1', 'Art. 4', 'Art. 11'],
    estado_verificacion: 'vigente',
    fecha_verificacion: '2026-05-05',
    // TODO(CSA): validar URL canónica vigente si el ayuntamiento publicó nueva ruta en 2025–2026.
  },
  {
    municipio_id: 'mty',
    nombre: 'Reglamento de Gestión Integral de Residuos Sólidos del Municipio de Monterrey',
    anio_version: 2023,
    url_fuente: 'https://www.monterrey.gob.mx/reglamentos/residuos-solidos-2023.pdf',
    articulos_clave: ['Art. 4', 'Art. 6', 'Art. 11'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    // TODO(CSA): confirmar enlace en portal monterrey.gob.mx y año de última reforma registrada en POE.
  },
]

export function reglamentoFuentePorMunicipio(municipioId: string): ReglamentoFuente | undefined {
  const key = municipioId.toLowerCase()
  return REGLAMENTOS_FUENTE.find(r => r.municipio_id === key)
}
