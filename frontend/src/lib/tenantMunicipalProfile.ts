import { getApiUrl } from '@/lib/api'

export type TenantProfileMode = 'carga_inicial' | 'operacion'

export interface TenantMunicipalProfile {
  mode: TenantProfileMode
  antecedentes: Record<string, unknown>
  mapa_social: { actores?: Array<Record<string, unknown>>; [key: string]: unknown }
  organigrama_servicio: Record<string, unknown>
  provenance_status: string
  automation?: {
    preliminary_notice?: string
    public_private_separation?: Record<string, unknown>
    inference?: Record<string, unknown>
    runtime?: {
      events?: Array<Record<string, unknown>>
      recalculation_log?: Array<Record<string, unknown>>
      recalculated_modules?: string[]
      discrepancies?: Array<Record<string, unknown>>
      recommendations?: Array<Record<string, unknown>>
      external_dispatches?: Array<Record<string, unknown>>
      automatic_gate_changes?: boolean
      automatic_stage_transitions?: boolean
      [key: string]: unknown
    }
    nous_suggestions?: Array<{
      suggestion_id: string
      pattern_id: string
      module_id: string
      conclusion: string
      evidence_summary: string
      observations_count: number
      confidence: string
      comparable_profile?: Record<string, unknown>
      limitation: string
      action_suggested: string
      source_traceability?: Record<string, unknown>
      wording_guardrail?: string
    }>
    nous_publication_notice?: string
    document_automation?: Record<string, unknown>
  }
  updated_by?: string
  updated_at?: string | null
}

export interface TenantMunicipalProfileResponse {
  tenant_id: string
  municipio: string
  estado: string
  municipio_id: string
  profile: TenantMunicipalProfile
}

export const MUNICIPIO_TENANT_MAP: Record<string, string> = {
  slp: 'slp-capital',
  'slp-capital': 'slp-capital',
  monterrey: 'monterrey',
  mty: 'monterrey',
  guanajuato: 'guanajuato-capital',
  'guanajuato-capital': 'guanajuato-capital',
}

export function tenantIdForMunicipio(municipioIds: string[]): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('alquimia.tenantId')
    if (stored) return stored
  }
  const first = municipioIds[0]?.toLowerCase()
  return (first && MUNICIPIO_TENANT_MAP[first]) || 'slp-capital'
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchTenantMunicipalProfile(tenantId: string): Promise<TenantMunicipalProfileResponse> {
  const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantId}/municipal-profile`, { headers: authHeaders() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Municipal profile HTTP ${res.status}`)
  return data as TenantMunicipalProfileResponse
}

export function profileModeLabel(mode?: string): string {
  return mode === 'operacion' ? 'Operación' : 'Carga inicial'
}

export function pendingText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value
  return 'Pendiente carga de datos del municipio'
}
