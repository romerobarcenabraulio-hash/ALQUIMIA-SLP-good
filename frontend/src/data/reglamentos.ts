/**
 * Fuente primaria de reglamentos (Blueprint 26) — datos estáticos hasta endpoint futuro.
 * Los PDF se guardan en `ADENDOS: LEGAL/pdfs/reglamentos/`; bajo `public/reglamentos/` hay symlinks con el mismo nombre
 * para servir `/reglamentos/...`. Los .doc siguen en `public/reglamentos/`. Vigencia frente a terceros = fuente oficial (URL).
 */

export type ZmReglamentoId = 'SLP' | 'MTY' | 'QRO' | 'GDL' | 'EXT'

export interface ReglamentoFuente {
  zm_id: ZmReglamentoId
  municipio_id: string
  nombre: string
  anio_version: number
  /** URL oficial o página de transparencia donde debe solicitarse el PDF cuando no hay URL directa estable */
  url_fuente: string
  /** Texto o fecha de publicación en POE/DOF/gaceta según verificación local (no certificada por ALQUIMIA). */
  fecha_publicacion?: string
  /** Rutas `/reglamentos/...` (PDF vía symlink → `ADENDOS: LEGAL/pdfs/reglamentos/`). */
  archivo_local?: string[]
  captura_url?: string
  articulos_clave?: string[]
  estado_verificacion: 'vigente' | 'en_revision' | 'no_localizado'
  fecha_verificacion: string
  hint_ancla_adendo?: string
}

const ANCLA_STD =
  'Para adendo o derogación: ubicar al final del instrumento el bloque de REFORMAS (si existe) y DISPOSICIONES TRANSITORIAS; usar búsqueda «Transitor» o «deroga» en el PDF/DOC.'

/** True si hay URL no vacía apta para abrir en nueva pestaña. */
export function tieneUrlFuentePrimaria(reg: ReglamentoFuente): boolean {
  return Boolean(reg.url_fuente?.trim())
}

/** Catálogo por municipio del simulador (`frontend/src/lib/constants.ts`) + Cadereyta (EXT). */
export const REGLAMENTOS_FUENTE: ReglamentoFuente[] = [
  {
    zm_id: 'SLP',
    municipio_id: 'slp',
    nombre:
      'San Luis Potosí (capital) · Reglamento de Aseo Público (RSU / limpia municipal) — espejo PDF pendiente',
    anio_version: 2018,
    url_fuente: 'https://sitio.sanluis.gob.mx/SanLuisPotoSi/DispocisionReglamentaria',
    fecha_publicacion:
      'Consultar fecha exacta en Periódico Oficial del Estado y en el portal municipal; catálogo ALQUIMIA usa versión 2018 como referencia.',
    captura_url: '/reglamentos/slp/portada.svg',
    articulos_clave: ['Definiciones', 'Obligaciones', 'Sanciones', 'Disposiciones transitorias'],
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo:
      `${ANCLA_STD} Auditoría ALQUIMIA (2026-05-05): el espejo previo era Ley de Ingresos 2023 (mal etiquetado); archivo archivado en ADENDOS: LEGAL/pdfs/reglamentos/_espejo_catalogo_erroneo/. Pendiente cargar el PDF oficial del Reglamento de Aseo Público vigente como ADENDOS: LEGAL/pdfs/reglamentos/SLP_slp_reglamento_aseo_publico.pdf y ` +
      'enlace simbólico en frontend/public/reglamentos/ hacia ese archivo.',
  },
  {
    zm_id: 'SLP',
    municipio_id: 'sol',
    nombre: 'Soledad de Graciano Sánchez · reglamento municipal de limpia / RSU (pendiente URL estable)',
    anio_version: 0,
    url_fuente: 'https://soledad.gob.mx/transparencia/',
    fecha_publicacion: 'Consultar instrumento vigente en sitio municipal o POE.',
    articulos_clave: [],
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'SLP',
    municipio_id: 'csp',
    nombre: 'Cerro de San Pedro · ordenamiento en materia de residuos / limpia (pendiente)',
    anio_version: 0,
    url_fuente: 'https://cerrosanpedro.gob.mx/transparencia/',
    fecha_publicacion: 'Consultar instrumento vigente en sitio municipal o POE.',
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'SLP',
    municipio_id: 'vip',
    nombre: 'Villa de Pozos · instrumentos municipales aplicables (confirmar competencia vs capital)',
    anio_version: 0,
    url_fuente: '',
    fecha_publicacion: 'Por localizar en fuente oficial; confirmar competencia y título respecto de la capital.',
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'mty',
    nombre: 'Monterrey · Reglamento de limpia municipal',
    anio_version: 2021,
    url_fuente:
      'https://www.monterrey.gob.mx/pdf/reglamentos/1/Reglamento_de_Limpia_Municipal_de_Monterrey.pdf',
    articulos_clave: ['Definiciones', 'Obligaciones', 'Disposiciones transitorias'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'spg',
    nombre:
      'San Pedro Garza García · candidato SISTEC de limpia + reglamentos ambientales de contexto',
    anio_version: 0,
    url_fuente: 'https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC-F0108-07-M020011171-01.pdf',
    archivo_local: [
      '/reglamentos/MTY_spg_san_pedro_reglamento_limpia_sistec_candidate.pdf',
      '/reglamentos/MTY_spg_san_pedro_reglamento_ambiental_gaceta118_2009.pdf',
      '/reglamentos/MTY_spg_san_pedro_reglamento_zonificacion_usos_suelo.pdf',
    ],
    articulos_clave: ['Limpia municipal (candidato)', 'Título', 'Disposiciones transitorias'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-07',
    hint_ancla_adendo:
      `${ANCLA_STD} CSA (2026-05-07): no declarar vigencia; el PDF SISTEC corto es candidato de limpia y debe cotejarse contra POE/gaceta SPGG y reglamentos ambientales de contexto.`,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'snl',
    nombre: 'San Nicolás de los Garza · Reglamento del servicio de limpieza municipal (Compilación NL)',
    anio_version: 2016,
    url_fuente:
      'http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=6913&ambito=MUNICIPAL',
    archivo_local: ['/reglamentos/MTY_snl_san_nicolas_servicio_limpieza_fuentestatal.doc'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'gua',
    nombre: 'Guadalupe · Reglamento de limpia municipal',
    anio_version: 2019,
    url_fuente:
      'https://webguadalupe.s3.amazonaws.com/wp-content/uploads/2023/01/REGLAMENTO-DE-LIMPIA-DEL-MUNICIPIO-DE-GUADALUPE-NUEVO-LEON.pdf',
    archivo_local: ['/reglamentos/MTY_gua_guadalupe_reglamento_limpia.pdf'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'apo',
    nombre: 'Apodaca · Reglamento de protección ambiental (referencia expediente SISTEC NL)',
    anio_version: 2009,
    url_fuente:
      'https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC_0001_0008_0168498-0000001.pdf',
    archivo_local: ['/reglamentos/MTY_apo_apodaca_reglamento_proteccion_ambiente_sistec.pdf'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'sca',
    nombre: 'Santa Catarina · Reglamento de limpia y recolección (Compilación NL)',
    anio_version: 2013,
    url_fuente:
      'http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=7027&ambito=MUNICIPAL',
    archivo_local: ['/reglamentos/MTY_sca_santa_catarina_reglamento_limpia_recoleccion_fuentestatal.doc'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'gar',
    nombre:
      'García · documento R-IRMG-3-40 (instrucción interna / mesa de reglas; validar reglamento maestro de limpia)',
    anio_version: 2022,
    url_fuente: 'https://www.garcia.gob.mx/wp-content/uploads/2022/08/R-IRMG-3-40.pdf',
    archivo_local: ['/reglamentos/MTY_gar_garcia_R-IRMG-3-40_instruccion_interna.pdf'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'esc',
    nombre: 'General Escobedo · Reglamento de limpia (Compilación NL)',
    anio_version: 2016,
    url_fuente:
      'http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=6968&ambito=MUNICIPAL',
    archivo_local: ['/reglamentos/MTY_esc_escobedo_reglamento_limpia_fuentestatal.doc'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'MTY',
    municipio_id: 'jua',
    nombre: 'Juárez (NL) · Reglamento de limpia (Compilación NL)',
    anio_version: 2025,
    url_fuente:
      'http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=105171&ambito=MUNICIPAL',
    archivo_local: ['/reglamentos/MTY_jua_juarez_reglamento_limpia_fuentestatal.doc'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'QRO',
    municipio_id: 'qro',
    nombre:
      'Querétaro capital · Reglamento de Limpia y Aseo Público / gestión de residuos — espejo PDF pendiente en repo',
    anio_version: 2021,
    url_fuente: 'https://municipiodequeretaro.gob.mx/reglamento/',
    articulos_clave: [],
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo:
      `${ANCLA_STD} CLC (2026-05-07): existe **marco municipal propio** de obligaciones y sanciones; la brecha es de instrumentación (5 fracciones condominio, tabulador acotado). Corregir espejo: el archivo LOMEQ estatal está en _espejo_catalogo_erroneo/; cargar PDF oficial municipal (Limpia/Aseo o GIRS vigente) como ADENDOS: LEGAL/pdfs/reglamentos/QRO_qro_reglamento_municipal.pdf + symlink en frontend/public/reglamentos/.`,
  },
  {
    zm_id: 'QRO',
    municipio_id: 'cor',
    nombre: 'Corregidora · referencia normativa ambiental (validar titulación exacta en PDF SEGOB QRO)',
    anio_version: 2012,
    url_fuente: 'https://lasombradearteaga.segobqueretaro.gob.mx/getfile.php?p1=20121059-01.pdf',
    archivo_local: ['/reglamentos/QRO_cor_reglamento_ambiente_segob_queretaro_reference.pdf'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'QRO',
    municipio_id: 'mar',
    nombre: 'El Marqués · ordenamiento en materia de residuos / servicios (pendiente espejo)',
    anio_version: 0,
    url_fuente: 'https://www.marques.gob.mx/transparencia/',
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'QRO',
    municipio_id: 'hui',
    nombre: 'Huimilpan · ordenamiento municipal aplicable (pendiente espejo)',
    anio_version: 0,
    url_fuente: 'https://huimilpan.gob.mx/category/transparencia/',
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
  {
    zm_id: 'GDL',
    municipio_id: 'gdl',
    nombre: 'Guadalajara · Reglamento de Gestión Integral del Municipio de Guadalajara',
    anio_version: 2016,
    url_fuente:
      'https://transparencia.guadalajara.gob.mx/sites/default/files/reglamentos/Reg.GestionIntegralMunicipioGuadalajara.pdf',
    fecha_publicacion:
      'Gaceta base 2016-07-15 + reformas posteriores por cotejar; servidor Last-Modified 2025-05-13.',
    archivo_local: ['/reglamentos/GDL_gdl_guadalajara_reglamento_gestion_integral_municipio.pdf'],
    articulos_clave: ['Objeto', 'Definiciones', 'Obligaciones', 'Sanciones', 'Desarrollo urbano articulado'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-07',
    hint_ancla_adendo:
      `${ANCLA_STD} CSA (2026-05-07): PDF descargado y SHA256 verificado contra portal; vigencia jurídica y técnica de reforma siguen sujetas a revisión competente.`,
  },
  {
    zm_id: 'GDL',
    municipio_id: 'zap',
    nombre: 'Zapopan · Reglamento de Prevención y Gestión Integral de Residuos del Municipio de Zapopan, Jalisco',
    anio_version: 2024,
    url_fuente:
      'https://servicios.zapopan.gob.mx:8000/wwwportal/publicfiles/descargasEnlaces/10-2024/Reglamento%20de%20Prevenci%C3%B3n%20y%20Gesti%C3%B3n%20Integral%20de%20Residuos%20del%20Municipio%20de%20Zapopan%2C%20Jalisco.pdf',
    fecha_publicacion: 'Versión oficial de archivo 2024-10-15; gaceta origen 2021-09-02.',
    archivo_local: ['/reglamentos/GDL_zap_zapopan_reglamento_gestion_integral_residuos.pdf'],
    articulos_clave: ['Disposiciones generales', 'Gestión integral de residuos', 'Obligaciones', 'Infracciones'],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-07',
    hint_ancla_adendo:
      `${ANCLA_STD} CSA (2026-05-07): PDF Oct 2024 descargado desde portal oficial y SHA256 verificado; no sustituye validación jurídica municipal.`,
  },
  {
    zm_id: 'GDL',
    municipio_id: 'tla',
    nombre: 'San Pedro Tlaquepaque · reglamento municipal RSU / limpia (pendiente localización directa)',
    anio_version: 0,
    url_fuente: 'https://www.tlaquepaque.gob.mx/transparencia/',
    fecha_publicacion: 'Portal TLS / índice normativo sin PDF RSU fijado en CSA.',
    estado_verificacion: 'no_localizado',
    fecha_verificacion: '2026-05-07',
    hint_ancla_adendo: `${ANCLA_STD} Requiere captura humana, fuente directa o solicitud INFOMEX Jalisco.`,
  },
  {
    zm_id: 'EXT',
    municipio_id: 'cad',
    nombre:
      'Cadereyta Jiménez · desarrollo urbano (portal) + reglamento de equilibrio ecológico y protección al ambiente (Compilación NL)',
    anio_version: 2023,
    url_fuente:
      'http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=104426&ambito=MUNICIPAL',
    archivo_local: [
      '/reglamentos/EXT_cad_cadereyta_reglamento_desarrollo_urbano_portalmunicipal.pdf',
      '/reglamentos/EXT_cad_cadereyta_reglamento_equilibrio_ecologico_ambiente_fuentestatal.doc',
    ],
    estado_verificacion: 'en_revision',
    fecha_verificacion: '2026-05-05',
    hint_ancla_adendo: ANCLA_STD,
  },
]

export function reglamentoFuentePorMunicipio(municipioId: string): ReglamentoFuente | undefined {
  const key = municipioId.toLowerCase()
  return REGLAMENTOS_FUENTE.find(r => r.municipio_id === key)
}

export function reglamentosPorZona(zm: ZmReglamentoId): ReglamentoFuente[] {
  return REGLAMENTOS_FUENTE.filter(r => r.zm_id === zm)
}
