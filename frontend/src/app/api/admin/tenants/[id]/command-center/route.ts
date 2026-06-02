import { NextResponse } from 'next/server'
import { buildCityConsultingContextForTenant } from '@/lib/cityConsultingContext'
import type { ClientPlatformStage } from '@/lib/platformRouting'
import { tenantMunicipalContextFromHeaders } from '@/lib/tenantMunicipalContextHeaders'

function normalizeStage(value: string | null): ClientPlatformStage {
  if (value === 'planning' || value === 'execution') return value
  return 'validation'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  const stage = normalizeStage(url.searchParams.get('stage'))
  const context = buildCityConsultingContextForTenant(id, stage, tenantMunicipalContextFromHeaders(request.headers))
  return NextResponse.json({
    tenant_id: id,
    stage,
    command_center: {
      city: `${context.municipality}, ${context.state}`,
      regulation: context.regulation,
      document_gaps: context.evidence_gaps,
      api_coverage: context.api_sources,
      readiness: context.readiness,
      stage_workspace: context.stage_workspace,
      package_summary: context.package_summary,
      operational_events: context.operational_events,
    },
  })
}
