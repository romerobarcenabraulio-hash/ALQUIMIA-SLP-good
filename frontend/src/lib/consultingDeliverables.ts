/**
 * Catálogo de entregables ALQUIMIA — fuente de verdad frontend.
 * Documento maestro: cursor-rules/CATALOGO_ENTREGABLES_CONSULTORIA.md
 */

export type DeliverableFormat = 'pdf' | 'docx' | 'xlsx' | 'md' | 'zip'
export type DeliverableTier = 'borrador' | 'profesional' | 'cabildo'

export interface ConsultingDeliverable {
  id: string
  titulo: string
  audiencia: string
  formato: DeliverableFormat[]
  tier: DeliverableTier
  descripcion: string
  /** Ruta de generación en producto */
  generacion: 'agora_zip' | 'professional_render' | 'executive_pdf' | 'hub' | 'modulo'
}

/** Paquete estándar RSU — servicio sectorial activo */
export const ENTREGABLES_RSU: ConsultingDeliverable[] = [
  {
    id: '01_ejecutivo',
    titulo: 'Resumen ejecutivo municipal',
    audiencia: 'Alcalde · Cabildo · Tesorería',
    formato: ['pdf', 'docx'],
    tier: 'profesional',
    descripcion: '≤4 páginas · decisión en 5 minutos · Times New Roman · semáforo de viabilidad',
    generacion: 'executive_pdf',
  },
  {
    id: '02_financiero',
    titulo: 'Modelo técnico-financiero',
    audiencia: 'Tesorería · Finanzas · Inversionistas',
    formato: ['xlsx', 'pdf'],
    tier: 'profesional',
    descripcion: 'CAPEX/OPEX · escenarios · sensibilidad · trazabilidad de supuestos',
    generacion: 'professional_render',
  },
  {
    id: '03_juridico',
    titulo: 'Diagnóstico jurídico y reforma reglamentaria',
    audiencia: 'Jurídico municipal · Cabildo',
    formato: ['docx', 'md'],
    tier: 'profesional',
    descripcion: 'Por municipio · ancla en PDF del reglamento cargado',
    generacion: 'agora_zip',
  },
  {
    id: '05_operativo',
    titulo: 'Manual operativo 90 días',
    audiencia: 'Dirección de Aseo · Concesionario · PMO',
    formato: ['docx', 'pdf'],
    tier: 'borrador',
    descripcion: 'Arranque piloto · roles · KPIs de campo',
    generacion: 'agora_zip',
  },
  {
    id: '07_trazabilidad',
    titulo: 'Matriz de fuentes y trazabilidad',
    audiencia: 'Auditor · PMO · Equipo técnico',
    formato: ['md', 'pdf'],
    tier: 'borrador',
    descripcion: 'Provenance de cada KPI · advertencias activas',
    generacion: 'agora_zip',
  },
  {
    id: 'paquete_completo',
    titulo: 'Paquete integral ÁGORA (ZIP)',
    audiencia: 'Equipo municipal completo',
    formato: ['zip'],
    tier: 'cabildo',
    descripcion: 'Markdown base + manifest · opcional ZIP profesional DOCX/XLSX/PDF',
    generacion: 'professional_render',
  },
]

export const EXPORT_DISCLAIMER =
  'Documento de consultoría generado por ALQUIMIA. No sustituye actos de autoridad municipal ni certificación legal/financiera.'
