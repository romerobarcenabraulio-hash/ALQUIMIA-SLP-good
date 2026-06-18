import { NextResponse } from 'next/server'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { tenantMunicipalContextFromHeaders } from '@/lib/tenantMunicipalContextHeaders'
import { withTenantMunicipalContext } from '@/lib/tenantDiagnosticData'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callerTenant = _request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }
  const context = tenantMunicipalContextFromHeaders(_request.headers)
  const data = withTenantMunicipalContext(getTenantArchiveData(id), context)
  if (id === 'municipio-demo' && (context.municipio_id || context.clave_inegi || context.zm)) {
    return NextResponse.json({
      ...data,
      metrics: data.metrics.map(metric => ({
        ...metric,
        status: 'brecha_critica',
        confidence: 'critical_gap',
        validation_status: 'blocked_by_gap',
      })),
    })
  }
  return NextResponse.json(data)
}
