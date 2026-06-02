import {
  tenantMunicipalContextToHeaders,
} from '@/lib/tenantMunicipalContextHeaders'
import type { TenantMunicipalContextOverride } from '@/lib/tenantDiagnosticData'

const STORAGE_KEY = 'alquimia.tenantMunicipalContext'
export const TENANT_MUNICIPAL_CONTEXT_EVENT = 'alquimia:tenant-municipal-context-change'

export function persistTenantMunicipalContext(context: TenantMunicipalContextOverride) {
  if (typeof window === 'undefined') return
  const payload = {
    municipio_id: context.municipio_id ?? undefined,
    clave_inegi: context.clave_inegi ?? undefined,
    zm: context.zm ?? undefined,
    municipality: context.municipality ?? undefined,
    state: context.state ?? undefined,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent(TENANT_MUNICIPAL_CONTEXT_EVENT))
}

export function readTenantMunicipalContext(): TenantMunicipalContextOverride {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function tenantMunicipalContextHeadersFromStorage(): Record<string, string> {
  return tenantMunicipalContextToHeaders(readTenantMunicipalContext())
}
