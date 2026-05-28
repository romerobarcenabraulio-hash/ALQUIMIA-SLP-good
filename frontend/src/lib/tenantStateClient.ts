import { getApiUrl } from '@/lib/api'
import type { ClientPlatformStage, TenantStatePayload } from '@/lib/platformRouting'

export interface TenantPlatformAccess {
  access: 'allowed'
  tenant_id: string
  current_stage: string
  requested_stage: ClientPlatformStage
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return response.json().catch(() => ({} as Record<string, unknown>))
}

export async function fetchTenantState(tenantId: string): Promise<TenantStatePayload> {
  const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantId}/state`, { headers: authHeaders() })
  const data = await readJson(res)
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Tenant state HTTP ${res.status}`)
  return data as unknown as TenantStatePayload
}

export async function assertTenantPlatformAccess(
  tenantId: string,
  stage: ClientPlatformStage,
): Promise<TenantPlatformAccess> {
  const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantId}/platform-access/${stage}`, { headers: authHeaders() })
  const data = await readJson(res)
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Acceso denegado HTTP ${res.status}`)
  return data as unknown as TenantPlatformAccess
}
