/**
 * Catálogo de entregables ALQUIMIA — alineado con document_blueprints.py (00–12).
 * Auditoría: cursor-rules/AUDITORIA_ENTREGABLES_PDF_2026-05-22.md
 */

export type DeliverableFormat = 'pdf' | 'docx' | 'xlsx' | 'md' | 'zip'
export type DeliverableTier = 'borrador' | 'profesional' | 'cabildo'

export interface ConsultingDeliverable {
  id: string
  codigo: string
  titulo: string
  audiencia: string
  formato: DeliverableFormat[]
  tier: DeliverableTier
  descripcion: string
  generacion: 'agora_zip' | 'professional_render' | 'executive_pdf' | 'index_pdf' | 'expediente_pdf' | 'hub' | 'modulo'
  /** PDF borrador = portada+TOC; contenido completo en la plataforma/DOCX salvo 01 parcial y 12 completo */
  pdfContentLevel: 'completo' | 'parcial' | 'estructural' | 'meta'
}

export const ENTREGABLES_RSU: ConsultingDeliverable[] = [
  {
    id: '00_indice_maestro',
    codigo: '00',
    titulo: 'Índice maestro del paquete',
    audiencia: 'PMO · Auditor',
    formato: ['pdf'],
    tier: 'profesional',
    descripcion: 'Inventario 01–12 · orden de lectura Cabildo',
    generacion: 'index_pdf',
    pdfContentLevel: 'meta',
  },
  {
    id: '01_ejecutivo',
    codigo: '01',
    titulo: 'Resumen ejecutivo municipal',
    audiencia: 'Alcalde · Cabildo · Tesorería',
    formato: ['pdf', 'docx'],
    tier: 'profesional',
    descripcion: 'SCQA · §1/4/7 con KPIs · gráficas Exhibit pendientes',
    generacion: 'executive_pdf',
    pdfContentLevel: 'parcial',
  },
  {
    id: '02_financiero',
    codigo: '02',
    titulo: 'Modelo técnico-financiero',
    audiencia: 'Tesorería · Finanzas',
    formato: ['xlsx', 'pdf'],
    tier: 'profesional',
    descripcion: 'XLSX productivo · PDF estructural · charts en XLSX',
    generacion: 'professional_render',
    pdfContentLevel: 'estructural',
  },
  {
    id: '03_juridico',
    codigo: '03',
    titulo: 'Diagnóstico jurídico',
    audiencia: 'Jurídico municipal',
    formato: ['docx', 'md', 'pdf'],
    tier: 'profesional',
    descripcion: 'Por municipio · ancla PDF reglamento',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '04_metropolitano',
    codigo: '04',
    titulo: 'Coordinación metropolitana',
    audiencia: 'Presidentes ZM',
    formato: ['docx', 'md', 'pdf'],
    tier: 'profesional',
    descripcion: 'Convenio marco ZM · no es PPTX cabildo',
    generacion: 'executive_pdf',
    pdfContentLevel: 'estructural',
  },
  {
    id: '05_operativo',
    codigo: '05',
    titulo: 'Manual operativo 90 días',
    audiencia: 'Operaciones · Concesionario',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'Gantt en XLSX · PDF estructural',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '06_ciudadano',
    codigo: '06',
    titulo: 'Guía ciudadana',
    audiencia: 'Hogares · Comercio',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'Lenguaje secundaria · pictogramas pendientes en PDF',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '07_trazabilidad',
    codigo: '07',
    titulo: 'Fuentes y trazabilidad',
    audiencia: 'Auditor · PMO',
    formato: ['md', 'pdf'],
    tier: 'borrador',
    descripcion: 'Provenance KPI · advertencias',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '08_rutas',
    codigo: '08',
    titulo: 'Plan de rutas',
    audiencia: 'Recolección · datos operativos',
    formato: ['docx', 'md', 'pdf'],
    tier: 'borrador',
    descripcion: 'Logística Wave 1',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '09_flota',
    codigo: '09',
    titulo: 'Dimensionamiento flota',
    audiencia: 'Adquisiciones',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'CAPEX/OPEX vehicular',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '10_territorio',
    codigo: '10',
    titulo: 'Segmentación territorial',
    audiencia: 'Presidencia · Comunicación',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'Oleadas de arranque',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '11_supply',
    codigo: '11',
    titulo: 'Cadena de suministro',
    audiencia: 'Tesorería · CA',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'Compradores y off-take',
    generacion: 'agora_zip',
    pdfContentLevel: 'estructural',
  },
  {
    id: '12_expediente',
    codigo: '12',
    titulo: 'Acta de inspección predial',
    audiencia: 'Inspector · Jurídico',
    formato: ['pdf'],
    tier: 'borrador',
    descripcion: 'Expediente sancionatorio · texto tabular completo',
    generacion: 'expediente_pdf',
    pdfContentLevel: 'completo',
  },
  {
    id: 'paquete_completo',
    codigo: '—',
    titulo: 'Paquete integral la plataforma (ZIP)',
    audiencia: 'Equipo municipal completo',
    formato: ['zip'],
    tier: 'cabildo',
    descripcion: 'Markdown + manifest · ZIP profesional DOCX/XLSX/PDF ejecutivo',
    generacion: 'professional_render',
    pdfContentLevel: 'meta',
  },
]

export const EXPORT_DISCLAIMER =
  'Documento de consultoría generado por ALQUIMIA. Borrador estructural: el contenido sustantivo completo está en el paquete la plataforma/DOCX salvo doc 01 (parcial) y 12 (acta). No sustituye actos de autoridad municipal.'
