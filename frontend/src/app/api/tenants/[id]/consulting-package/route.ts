import { NextResponse } from 'next/server'
import {
  buildTenantConsultingPackageResponse,
  buildTenantConsultingPackageResponseWithApiLayers,
} from '@/lib/tenantConsultingPackageResponse'
import { tenantMunicipalContextFromHeaders } from '@/lib/tenantMunicipalContextHeaders'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callerTenant = request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }

  const context = tenantMunicipalContextFromHeaders(request.headers)
  const apiFetchGate = request.headers.get('x-consulting-api-fetch-gate')
  if (apiFetchGate === 'founder-admin-reviewed') {
    return NextResponse.json(
      await buildTenantConsultingPackageResponseWithApiLayers(id, context, {
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:8000',
      }),
    )
  }

  return NextResponse.json(buildTenantConsultingPackageResponse(id, context))
}
