import { buildConsultingExportManifest } from '@/lib/archivoFull'
import { buildChicagoBibliography, formatChicagoCitationSource } from '@/lib/citations'
import { CONSULTING_API_LAYER_CONTRACTS } from '@/lib/consultingApiLayerContracts'
import {
  buildConsultingPackage,
} from '@/lib/consultingPackageEngine'
import type { EvidenceRecommendation } from '@/lib/bibliographyIntelligence'
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

interface RegistryEvidenceRecommendation {
  id?: string
  tag?: string
  score?: number | { total?: number }
  supported_claim?: string
  unsupported_claim?: string
  explanation?: string
  record?: {
    id?: string
    institution?: string
    title?: string
    url?: string | null
    published_at?: string | null
    source_date?: string | null
    consulted_at?: string | null
    claim_can_support?: string
    claim_cannot_support?: string
  }
}

function compatibleBibliographyRows(
  recommendations: EvidenceRecommendation[],
) {
  return recommendations.map(recommendation => ({
    id: recommendation.id,
    tag: recommendation.tag,
    score: recommendation.score.total,
    supported_claim: recommendation.supported_claim,
    unsupported_claim: recommendation.unsupported_claim,
    citation: formatChicagoCitationSource(recommendation.record),
  }))
}

function compatibleRegistryBibliographyRows(
  tenantId: string,
  recommendations: RegistryEvidenceRecommendation[],
) {
  return recommendations.map(recommendation => {
    const record = recommendation.record ?? {}
    const score = typeof recommendation.score === 'number'
      ? recommendation.score
      : recommendation.score?.total ?? 0
    return {
      id: `${tenantId}:registry:${record.id ?? recommendation.id ?? 'evidence'}`,
      tag: recommendation.tag ?? 'solo_contexto',
      score,
      supported_claim: recommendation.supported_claim ?? record.claim_can_support ?? 'Contexto o cálculo trazable, según etiqueta.',
      unsupported_claim: recommendation.unsupported_claim ?? record.claim_cannot_support ?? 'No convierte evidencia comparable o benchmark en estudio local.',
      citation: formatChicagoCitationSource({
        institution: record.institution ?? 'Fuente pendiente',
        title: record.title ?? 'Referencia bibliográfica',
        url: record.url ?? undefined,
        source_date: record.source_date ?? record.published_at ?? undefined,
        consulted_at: record.consulted_at ?? new Date().toISOString().slice(0, 10),
      }),
    }
  })
}

export function buildTenantConsultingPackageResponse(
  tenantId: string,
  context: TenantMunicipalContextOverride = {},
) {
  const tenantData = withTenantMunicipalContext(getTenantArchiveData(tenantId), context)
  const bibliographyTenants = Object.values(TENANT_DIAGNOSTIC_FIXTURES)
  const consultingPackage = buildConsultingPackage({ tenantData, bibliographyTenants })
  const exportManifest = buildConsultingExportManifest(tenantData)
  const apiContextStatus = buildTenantConsultingApiContext(tenantData)
  const compatibleBibliographyChicago = compatibleBibliographyRows(consultingPackage.evidence_recommendations)

  return {
    tenant_id: tenantData.tenant_id,
    municipality: tenantData.municipality,
    state: tenantData.state,
    source: 'tenant_archive_data',
    status: tenantData.status,
    version: tenantData.version,
    generated_at: tenantData.generated_at,
    human_review_required: false,
    officiality: tenantData.status === 'official' ? 'official_source_package' : 'preliminary_not_official',
    api_layer_contracts: CONSULTING_API_LAYER_CONTRACTS,
    bibliography_chicago: buildChicagoBibliography(tenantData.metrics),
    compatible_bibliography_chicago: compatibleBibliographyChicago,
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
): Promise<RegistryEvidenceRecommendation[]> {
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
    const payload = await response.json() as { recommendations?: RegistryEvidenceRecommendation[] }
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
    bibliographyTenants: Object.values(TENANT_DIAGNOSTIC_FIXTURES),
  })
  const compatibleBibliographyChicago = [
    ...compatibleRegistryBibliographyRows(tenantId, evidenceRegistryRecommendations),
    ...compatibleBibliographyRows(consultingPackage.evidence_recommendations),
  ]

  return {
    ...buildTenantConsultingPackageResponse(tenantId, context),
    consulting_package: consultingPackage,
    compatible_bibliography_chicago: compatibleBibliographyChicago,
    api_layer_fetch_status: {
      enabled: true,
      reason: 'founder_admin_gate',
      fetched_layers: apiLayerPayloads.filter(payload => payload.available).map(payload => payload.layer),
      blocked_layers: apiLayerPayloads.filter(payload => !payload.available).map(payload => payload.layer),
      evidence_registry_recommendations: evidenceRegistryRecommendations.length,
    },
  }
}
