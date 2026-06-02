import { buildConsultingExportManifest } from '@/lib/archivoFull'
import { CONSULTING_API_LAYER_CONTRACTS } from '@/lib/consultingApiLayerContracts'
import {
  buildConsultingPackage,
  type EvidenceRegistryRecommendation,
} from '@/lib/consultingPackageEngine'
import {
  fetchConsultingApiLayerPayloads,
  type ConsultingApiFetchOptions,
} from '@/lib/consultingApiLayerFetchers'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { buildTenantConsultingApiContext } from '@/lib/tenantConsultingApiContext'
import {
  withTenantMunicipalContext,
  TENANT_DIAGNOSTIC_FIXTURES,
  type TenantMunicipalContextOverride,
} from '@/lib/tenantDiagnosticData'

export function buildTenantConsultingPackageResponse(
  tenantId: string,
  context: TenantMunicipalContextOverride = {},
) {
  const tenantData = withTenantMunicipalContext(getTenantArchiveData(tenantId), context)
  const bibliographyTenants = Object.values(TENANT_DIAGNOSTIC_FIXTURES)
  const consultingPackage = buildConsultingPackage({ tenantData, bibliographyTenants })
  const exportManifest = buildConsultingExportManifest(tenantData)
  const apiContextStatus = buildTenantConsultingApiContext(tenantData)

  return {
    tenant_id: tenantData.tenant_id,
    municipality: tenantData.municipality,
    state: tenantData.state,
    source: 'tenant_archive_data',
    status: tenantData.status,
    version: tenantData.version,
    generated_at: tenantData.generated_at,
    human_review_required: true,
    officiality: tenantData.status === 'official' ? 'official_source_package' : 'preliminary_not_official',
    api_layer_contracts: CONSULTING_API_LAYER_CONTRACTS,
    api_request_context_status: apiContextStatus.ready
      ? { ready: true, missing: [], context: apiContextStatus.context }
      : { ready: false, missing: apiContextStatus.missing, context: null },
    consulting_package: consultingPackage,
    export_manifest: exportManifest,
  }
}

export type TenantConsultingPackageResponse = ReturnType<typeof buildTenantConsultingPackageResponse>

async function fetchEvidenceRegistryRecommendations(
  tenantId: string,
  context: TenantMunicipalContextOverride,
  options: ConsultingApiFetchOptions,
): Promise<EvidenceRegistryRecommendation[]> {
  const request = options.fetcher ?? fetch
  const baseUrl = options.baseUrl ?? 'http://localhost:8000'
  const municipioId = context.municipio_id
  if (!municipioId) return []
  const url = new URL('/research/bibliography/recommendations', baseUrl)
  url.searchParams.set('municipio_id', municipioId)
  if (context.zm) url.searchParams.set('zm_id', context.zm)
  try {
    const response = await request(url.toString(), { method: 'GET' })
    if (!response.ok) return []
    const payload = await response.json() as { recommendations?: EvidenceRegistryRecommendation[] }
    return Array.isArray(payload.recommendations) ? payload.recommendations : []
  } catch {
    return []
  }
}

export async function buildTenantConsultingPackageResponseWithApiLayers(
  tenantId: string,
  context: TenantMunicipalContextOverride = {},
  options: ConsultingApiFetchOptions = {},
) {
  const tenantData = withTenantMunicipalContext(getTenantArchiveData(tenantId), context)
  const apiContextStatus = buildTenantConsultingApiContext(tenantData)

  if (!apiContextStatus.ready || !apiContextStatus.context) {
    return {
      ...buildTenantConsultingPackageResponse(tenantId, context),
      api_layer_fetch_status: {
        enabled: false,
        reason: 'missing_municipal_context',
        fetched_layers: [],
        blocked_layers: [],
      },
    }
  }

  const apiLayerPayloads = await fetchConsultingApiLayerPayloads(apiContextStatus.context, options)
  const evidenceRegistryRecommendations = await fetchEvidenceRegistryRecommendations(tenantId, {
    ...context,
    municipio_id: apiContextStatus.context.municipioId,
    clave_inegi: apiContextStatus.context.claveInegi,
    zm: apiContextStatus.context.zm,
    municipality: apiContextStatus.context.municipioNombre,
  }, options)
  const consultingPackage = buildConsultingPackage({
    tenantData,
    apiLayerPayloads,
    evidenceRegistryRecommendations,
    bibliographyTenants: Object.values(TENANT_DIAGNOSTIC_FIXTURES),
  })

  return {
    ...buildTenantConsultingPackageResponse(tenantId, context),
    consulting_package: consultingPackage,
    api_layer_fetch_status: {
      enabled: true,
      reason: 'founder_admin_gate',
      fetched_layers: apiLayerPayloads.filter(payload => payload.available).map(payload => payload.layer),
      blocked_layers: apiLayerPayloads.filter(payload => !payload.available).map(payload => payload.layer),
      evidence_registry_recommendations: evidenceRegistryRecommendations.length,
    },
  }
}
