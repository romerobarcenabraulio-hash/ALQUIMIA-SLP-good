import { NextResponse } from 'next/server'
import { buildOperationalMetrics, buildWeeklyDigest, enqueueWeeklyDigest, getDigestOutbox } from '@/lib/archivoFull'
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

export async function POST(request: Request) {
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

  const providerConfigured = Boolean(process.env.POSTMARK_SERVER_TOKEN || process.env.RESEND_API_KEY)
  const entry = enqueueWeeklyDigest(tenantId, Number.isFinite(digestCount) ? digestCount : 0, providerConfigured)
  return NextResponse.json({
    outbox_entry: entry,
    outbox_size: getDigestOutbox(tenantId).length,
    warning: providerConfigured
      ? 'Digest encolado para proveedor configurado; revisar bitácora humana antes del envío externo.'
      : 'Digest guardado como preview interno porque no hay proveedor de email configurado.',
  })
}
