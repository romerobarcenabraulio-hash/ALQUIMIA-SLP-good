import { NextResponse } from 'next/server'
import { buildOperationalMetrics, buildWeeklyDigest } from '@/lib/archivoFull'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tenantId = url.searchParams.get('tenantId')
  const digestCount = Number(url.searchParams.get('digestCount') ?? 0)
  if (!tenantId) {
    return NextResponse.json({ detail: 'tenantId requerido' }, { status: 400 })
  }

  const callerTenant = request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== tenantId) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }

  const data = getTenantArchiveData(tenantId)
  return NextResponse.json({
    digest: buildWeeklyDigest(data, Number.isFinite(digestCount) ? digestCount : 0),
    metrics: buildOperationalMetrics(data),
    sending_status: 'preview_only',
    warning: 'El envío automático requiere proveedor de email configurado y revisión humana; este endpoint no envía correos.',
  })
}
