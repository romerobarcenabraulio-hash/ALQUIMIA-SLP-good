/**
 * Plantilla de diagnóstico organizacional RSU — estado actual (as-is).
 * Etiquetado explícito: referencia metodológica hasta validación en campo.
 */

export type VerificacionOrg = 'confirmado' | 'pendiente' | 'desconocido' | 'referencia'

export interface NodoOrganigrama {
  id: string
  titulo: string
  subtitulo: string
  ambito: 'municipio' | 'concesionario' | 'interfaz'
  verificacion: VerificacionOrg
  preguntaCampo: string
}

export interface PasoCadenaContacto {
  orden: number
  quien: string
  rol: string
  canal: string
  queResuelve: string
  verificacion: VerificacionOrg
}

export interface VacioOrganizacional {
  id: string
  tipo: 'sin_titular' | 'duplicidad' | 'no_documentado' | 'interfaz_rota'
  descripcion: string
  impacto: string
}

export const VERIFICACION_LABEL: Record<VerificacionOrg, string> = {
  confirmado: 'Confirmado en campo',
  pendiente: 'Pendiente de validar',
  desconocido: 'Desconocido — investigar',
  referencia: 'Referencia metodológica',
}

export const VERIFICACION_STYLE: Record<VerificacionOrg, { bg: string; text: string; border: string }> = {
  confirmado: { bg: '#EAF3DE', text: '#23470A', border: '#C9DDB1' },
  pendiente: { bg: '#FEF7E7', text: '#6B4800', border: '#F5DCA0' },
  desconocido: { bg: '#FDE8E8', text: '#7A1212', border: '#FCA5A5' },
  referencia: { bg: '#F4F2ED', text: '#5A4A2A', border: '#E8E4DC' },
}

/** Cadena desde primer contacto ciudadano hasta decisión de cabildo. */
export const CADENA_CONTACTO_RSU: PasoCadenaContacto[] = [
  {
    orden: 1,
    quien: 'Ciudadano / generador',
    rol: 'Reporte, queja o solicitud de servicio',
    canal: 'App 911 municipal, teléfono, redes, ventanilla',
    queResuelve: '¿A quién llamo cuando no pasa el camión o hay tiradero clandestino?',
    verificacion: 'referencia',
  },
  {
    orden: 2,
    quien: 'Centro de atención / quejas',
    rol: 'Registro y triage',
    canal: 'Mesa de control, CRM municipal',
    queResuelve: '¿Existe bitácora única o cada área lleva la suya?',
    verificacion: 'pendiente',
  },
  {
    orden: 3,
    quien: 'Supervisor de ruta / jefe de turno',
    rol: 'Operación diaria de recolección',
    canal: 'Radio, WhatsApp operativo, PER',
    queResuelve: '¿Quién autoriza desvíos de ruta o recolección especial?',
    verificacion: 'pendiente',
  },
  {
    orden: 4,
    quien: 'Jefe de recolección / limpia',
    rol: 'Coordinación de flota y rutas',
    canal: 'Dirección de Servicios Públicos (o equivalente)',
    queResuelve: '¿Es servidor público o personal del concesionario?',
    verificacion: 'desconocido',
  },
  {
    orden: 5,
    quien: 'Director de Servicios Públicos / Medio Ambiente',
    rol: 'Titular técnico del servicio',
    canal: 'Organigrama municipal, oficio',
    queResuelve: '¿Quién firma convenios, multas y reportes a SEMARNAT?',
    verificacion: 'referencia',
  },
  {
    orden: 6,
    quien: 'Síndico / asesor jurídico',
    rol: 'Dictaminación legal y contratos',
    canal: 'Expediente de contrato de limpia',
    queResuelve: '¿El contrato vigente obliga separación o solo recolección mixta?',
    verificacion: 'pendiente',
  },
  {
    orden: 7,
    quien: 'Tesorería / finanzas',
    rol: 'Pago a concesionario, ISN, derechos',
    canal: 'Presupuesto, egresos, facturación',
    queResuelve: '¿Cómo se paga hoy: tonelada enterrada, viaje, tarifa fija?',
    verificacion: 'pendiente',
  },
  {
    orden: 8,
    quien: 'Presidencia / cabildo',
    rol: 'Decisión política y rendición de cuentas',
    canal: 'Sesión de cabildo, informe trimestral',
    queResuelve: '¿Qué indicador recibe hoy: toneladas, quejas, costo?',
    verificacion: 'referencia',
  },
]

/** Organigrama municipal típico RSU — validar titular real por municipio. */
export const ORGANIGRAMA_MUNICIPAL_AS_IS: NodoOrganigrama[] = [
  { id: 'pres', titulo: 'Presidencia Municipal', subtitulo: 'Rector del servicio público', ambito: 'municipio', verificacion: 'referencia', preguntaCampo: '¿Quién encabeza la comisión de limpia en cabildo?' },
  { id: 'sind', titulo: 'Síndico / Procuraduría', subtitulo: 'Contratos y sanciones', ambito: 'municipio', verificacion: 'pendiente', preguntaCampo: '¿Existe expediente único del contrato de limpia?' },
  { id: 'dsp', titulo: 'Dirección Servicios Públicos', subtitulo: 'Área usuaria del servicio', ambito: 'municipio', verificacion: 'pendiente', preguntaCampo: '¿Nombre y correo del director actual?' },
  { id: 'amb', titulo: 'Medio Ambiente / Ecología', subtitulo: 'Norma, permisos, reportes', ambito: 'municipio', verificacion: 'desconocido', preguntaCampo: '¿Está fusionada con limpia o es dirección aparte?' },
  { id: 'ins', titulo: 'Inspección / Reglamentos', subtitulo: 'Cumplimiento ciudadano', ambito: 'municipio', verificacion: 'pendiente', preguntaCampo: '¿Inspecciona RSU o solo comercio?' },
  { id: 'tes', titulo: 'Tesorería', subtitulo: 'Pagos al operador', ambito: 'municipio', verificacion: 'pendiente', preguntaCampo: '¿Esquema de pago actual documentado?' },
  { id: 'com', titulo: 'Comunicación social', subtitulo: 'Campañas y quejas públicas', ambito: 'municipio', verificacion: 'desconocido', preguntaCampo: '¿Participa en campañas de separación?' },
]

/** Operador / concesionario — no asumir estructura; mapear interfaz. */
export const ORGANIGRAMA_CONCESIONARIO_AS_IS: NodoOrganigrama[] = [
  { id: 'rep', titulo: 'Representante legal / gerente general', subtitulo: 'Interlocutor con municipio', ambito: 'concesionario', verificacion: 'pendiente', preguntaCampo: '¿Quién firma addendas y actas administrativas?' },
  { id: 'ops', titulo: 'Gerente de operaciones', subtitulo: 'Rutas, flota, relleno', ambito: 'concesionario', verificacion: 'desconocido', preguntaCampo: '¿Opera bajo marca propia o white-label municipal?' },
  { id: 'disp', titulo: 'Jefe de disposición final', subtitulo: 'Relleno, transferencia, costo/ton', ambito: 'concesionario', verificacion: 'pendiente', preguntaCampo: '¿Contrato con relleno propio o tercero?' },
  { id: 'rec', titulo: 'Coordinación de reciclaje (si existe)', subtitulo: 'PEV, acopio, compradores', ambito: 'concesionario', verificacion: 'desconocido', preguntaCampo: '¿Hay área formal o es marginal?' },
  { id: 'if1', titulo: 'Interfaz: actas de supervisión', subtitulo: 'Municipio ↔ operador', ambito: 'interfaz', verificacion: 'pendiente', preguntaCampo: '¿Frecuencia y formato de supervisión?' },
  { id: 'if2', titulo: 'Interfaz: facturación y KPIs', subtitulo: 'Tesorería ↔ operador', ambito: 'interfaz', verificacion: 'pendiente', preguntaCampo: '¿KPIs en contrato o solo factura?' },
]

export const VACIOS_ORGANIZACIONALES: VacioOrganizacional[] = [
  {
    id: 'v1',
    tipo: 'no_documentado',
    descripcion: 'Organigrama actualizado del área de limpia no disponible públicamente',
    impacto: 'No se sabe quién autoriza cambios de ruta ni quién responde ante PROFEPA',
  },
  {
    id: 'v2',
    tipo: 'duplicidad',
    descripcion: 'Medio ambiente y servicios públicos reportan métricas RSU por separado',
    impacto: 'Cifras distintas en cabildo vs informe estatal',
  },
  {
    id: 'v3',
    tipo: 'interfaz_rota',
    descripcion: 'Quejas ciudadanas no llegan al supervisor de ruta del operador',
    impacto: 'Baja captura percibida; conflicto político en temporada electoral',
  },
  {
    id: 'v4',
    tipo: 'sin_titular',
    descripcion: 'Coordinación de reciclaje sin titular nombrado en organigrama',
    impacto: 'Programa de circularidad sin dueño operativo',
  },
]

export const CHECKLIST_CAMPO_ORG = [
  'Solicitar organigrama firmado de Servicios Públicos y área de limpia (PDF ≤ 12 meses).',
  'Pedir organigrama funcional del concesionario y tabla de interfaz municipal.',
  'Identificar titular de contrato vigente: número, vigencia, objeto, forma de pago.',
  'Recorrer cadena de quejas: simular reporte y documentar tiempos y responsables.',
  'Confirmar quién opera relleno y quién paga transporte de residuos reciclables.',
  'Entrevistar supervisor de ruta (primer escalón operativo) antes que dirección.',
]
