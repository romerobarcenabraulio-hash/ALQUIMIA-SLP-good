/**
 * DataPoint V2 Schema
 * Canonical 7-category data model for all consulting modules
 * Core principle: Cero invención · toda cifra justificable con bibliografía
 */

/**
 * DataPointCategory: seven sources of truth + pending/gap
 * Each data point in a module must declare exactly one category
 */
export type DataPointCategory =
  | 'client_document'      // 01: Documento del cliente (PDF cargado por municipio)
  | 'municipal_research'   // 02: Investigación municipal (actas, estudios locales)
  | 'state_data'           // 03: Dato estatal (ley, estadística nivel estado)
  | 'metropolitan_zone'    // 04: Zona metropolitana (contexto regional oficial)
  | 'national_data'        // 05: Dato nacional (INEGI, SEMARNAT, federal)
  | 'comparable_city'      // 06: Ciudad comparable (benchmark metodológico)
  | 'calculated_model'     // 07: Modelo calculado (fórmula transparente)
  | 'pending'              // —: Brecha crítica (falta documento/fuente/cálculo)

/**
 * SourceStatus: confidence level of data point
 */
export type SourceStatus =
  | 'verificado'           // Official source, verified date, full citation
  | 'estimado'             // Best estimate, methodology known, uncertainty documented
  | 'no_disponible'        // Data required but not yet obtained

/**
 * DataPointMetadata: provenance & audit trail
 */
export interface DataPointMetadata {
  source_id: string                 // Unique identifier: 'doc_upload_{id}', 'inegi_{code}', 'calc_{formula_hash}'
  source_name: string               // Human-readable: 'Reglamento SLP 2024', 'INEGI Censo 2020', 'Cálculo RSU material'
  source_institution?: string       // 'Municipio de SLP', 'SEMARNAT', 'CONAPO'
  source_url?: string               // URL if external source
  source_year?: number              // Publication year
  retrieved_at?: Date               // When data was fetched/uploaded
  method?: string                   // How data was extracted: 'manual_entry', 'ocr_pdf', 'api_inegi', 'formula'
  scope?: string                    // Geographic scope: 'municipal', 'estatal', 'nacional', 'metropolitan'
}

/**
 * DataPoint: atomic unit of evidence
 * Every number, claim, or inference must be wrapped in a DataPoint
 */
export interface DataPoint {
  id: string                        // UUID or hash
  tenant_id: string                 // Which municipality/organization
  module_id: string                 // Which consulting module (e.g., 'antecedentes_municipales')
  field_key: string                 // Semantic key within module (e.g., 'poblacion_2020', 'art_5_vigente')

  category: DataPointCategory       // Source category
  status: SourceStatus              // Confidence level

  value: string | number | boolean  // The actual data point
  unit?: string                     // 'habitantes', '%', 'toneladas', 'sí/no'
  confidence: number                // 0-100, used to determine export completeness

  metadata: DataPointMetadata       // Provenance trail

  created_at: Date
  updated_at: Date
  created_by?: string               // User ID if manual entry

  conflict_id?: string              // If this point conflicts with another, reference the evidence_conflict

  notes?: string                    // Internal notes: methodological limits, caveats, assumptions
}

/**
 * DataPointHistory: audit trail for changes
 * Tracks every mutation to a DataPoint for compliance
 */
export interface DataPointHistory {
  id: string
  data_point_id: string

  old_value?: string | number | boolean
  new_value: string | number | boolean

  old_status?: SourceStatus
  new_status: SourceStatus

  old_confidence?: number
  new_confidence: number

  changed_by: string                // User ID
  changed_at: Date

  reason?: string                   // Why changed: 'document_upload', 'correction', 'recalculation'
}

/**
 * EvidenceConflict: when two DataPoints contradict each other
 * Documented and passed to founder for resolution
 */
export interface EvidenceConflict {
  id: string
  tenant_id: string

  data_point_1_id: string           // First conflicting point
  data_point_2_id: string           // Second conflicting point

  conflict_type: 'direct_contradiction' | 'temporal_obsolescence' | 'scope_mismatch'

  description: string               // What contradicts
  severity: 'critical' | 'warning' | 'informational'

  resolution_status: 'unresolved' | 'documented' | 'resolved'
  resolved_at?: Date
  resolved_by?: string              // Founder user ID
  resolution_note?: string

  created_at: Date
}

/**
 * ModuleCompletionStatus: gating logic for sequential progression
 * Determines which modules are locked/unlocked in sidebar
 */
export interface ModuleCompletionStatus {
  tenant_id: string
  module_id: string

  percent_complete: number          // 0-100, based on data_point count vs required count
  blocking_gate?: string            // If set, module is locked and this explains why
  blocking_gate_resolution?: string // What must happen to unblock

  required_data_points: number      // How many DataPoints needed for "complete"
  current_data_points: number       // How many exist now

  minimum_confidence: number        // e.g., 70% = don't export if average confidence < 70%

  unblocked_at?: Date
  dependencies?: string[]           // module IDs that must complete first

  updated_at: Date
}

/**
 * BibliographyEntry: reference source for data
 * Populated by ARQUIVO from PDFs, APIs, manual entry
 */
export interface BibliographyEntry {
  id: string
  tenant_id: string                 // Which municipality (empty if national/estatal)

  source_id: string                 // Link to DataPoint.metadata.source_id

  title: string
  authors?: string[]
  institution: string               // 'INEGI', 'SEMARNAT', 'Municipio de SLP'
  year: number

  url?: string
  document_type: 'official' | 'study' | 'regulation' | 'publication' | 'report' | 'dataset'

  scope: 'municipal' | 'estatal' | 'nacional' | 'metropolitan'

  confidence_score: number          // 0-100, editorial assessment

  chicago_citation: string          // For exports

  retrieved_at: Date
  retrieved_by?: string

  notes?: string
}

/**
 * TenantDataSnapshot: current state of all data for a tenant
 * Rebuilt after each ARCHIVO processing
 */
export interface TenantDataSnapshot {
  tenant_id: string

  data_points_by_module: Record<string, DataPoint[]>  // module_id → [DataPoints]

  total_data_points: number
  total_points_by_category: Record<DataPointCategory, number>

  overall_confidence: number        // Average confidence across all data_points

  conflicts: EvidenceConflict[]

  completion_status: Record<string, ModuleCompletionStatus>  // module_id → status

  can_generate_plan: boolean        // = municipio has reglamento cargado
  can_generate_declaratoria: boolean  // = municipio has reglamento + validacion 80%+ confidence

  last_archivo_run?: Date
  last_manual_update?: Date

  created_at: Date
  updated_at: Date
}

/**
 * ClientPreviewDataPoint: safe version for export/sharing
 * Strips internal notes, confidence scores < threshold
 */
export interface ClientPreviewDataPoint {
  field_key: string
  value: string | number | boolean
  unit?: string

  category: DataPointCategory
  source_name: string
  source_institution?: string

  chicago_citation: string
  scope: string

  // Omitted: confidence score, internal notes, conflict resolution
}
