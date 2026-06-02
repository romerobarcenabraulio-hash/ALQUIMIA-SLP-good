import type { ConsultingApiRequestContext } from '@/lib/consultingApiLayerFetchers'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

export interface TenantConsultingApiContextStatus {
  ready: boolean
  context: ConsultingApiRequestContext | null
  missing: string[]
}

export type TenantDiagnosticDataWithApiContext = TenantDiagnosticData & {
  municipio_id?: string
  clave_inegi?: string
  zm?: string
}

export function buildTenantConsultingApiContext(data: TenantDiagnosticData): TenantConsultingApiContextStatus {
  const withContext = data as TenantDiagnosticDataWithApiContext
  const fields: Array<[string, unknown]> = [
    ['municipio_id', withContext.municipio_id],
    ['clave_inegi', withContext.clave_inegi],
    ['zm', withContext.zm],
  ]
  const missing = fields.filter(([, value]) => !value).map(([key]) => key)

  if (missing.length > 0) {
    return { ready: false, context: null, missing }
  }

  return {
    ready: true,
    missing: [],
    context: {
      tenantId: data.tenant_id,
      municipioId: withContext.municipio_id as string,
      municipioNombre: data.municipality,
      claveInegi: withContext.clave_inegi as string,
      zm: withContext.zm as string,
      sourceDate: data.generated_at,
    },
  }
}
