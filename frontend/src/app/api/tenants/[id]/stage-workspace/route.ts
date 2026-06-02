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
  const callerTenant = request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }
  const url = new URL(request.url)
  const stage = normalizeStage(url.searchParams.get('stage'))
  const context = buildCityConsultingContextForTenant(id, stage, tenantMunicipalContextFromHeaders(request.headers))
  return NextResponse.json({
    tenant_id: context.tenant_id,
    stage,
    city_consulting_context: context,
    stage_workspace: context.stage_workspace,
  })
}
