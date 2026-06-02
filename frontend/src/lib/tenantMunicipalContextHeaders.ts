import type { TenantMunicipalContextOverride } from '@/lib/tenantDiagnosticData'

export const TENANT_CONTEXT_HEADER = {
  municipioId: 'x-municipio-id',
  claveInegi: 'x-clave-inegi',
  zm: 'x-zm',
  municipality: 'x-municipio-nombre',
  state: 'x-estado-mx',
} as const

export function tenantMunicipalContextFromHeaders(headers: Headers): TenantMunicipalContextOverride {
  return {
    municipio_id: headers.get(TENANT_CONTEXT_HEADER.municipioId),
    clave_inegi: headers.get(TENANT_CONTEXT_HEADER.claveInegi),
    zm: headers.get(TENANT_CONTEXT_HEADER.zm),
    municipality: headers.get(TENANT_CONTEXT_HEADER.municipality),
    state: headers.get(TENANT_CONTEXT_HEADER.state),
  }
}

export function tenantMunicipalContextToHeaders(context: TenantMunicipalContextOverride): Record<string, string> {
  return Object.fromEntries(
    [
      [TENANT_CONTEXT_HEADER.municipioId, context.municipio_id],
      [TENANT_CONTEXT_HEADER.claveInegi, context.clave_inegi],
      [TENANT_CONTEXT_HEADER.zm, context.zm],
      [TENANT_CONTEXT_HEADER.municipality, context.municipality],
      [TENANT_CONTEXT_HEADER.state, context.state],
    ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0) as Array<[string, string]>,
  )
}
