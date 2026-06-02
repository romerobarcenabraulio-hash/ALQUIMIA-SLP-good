import { NextRequest, NextResponse } from 'next/server'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'
import { canUseLocalAdminFallback, stateIdFromName } from '../../_shared'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!await canUseLocalAdminFallback()) {
    return NextResponse.json({ detail: 'Solo admins o analistas internos' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const estadoId = params.get('estado_id') ?? ''
  const q = (params.get('q') ?? '').toLowerCase().trim()
  const limit = Math.min(Number(params.get('limit') ?? 80), 200)
  const municipalities = Object.values(TENANT_DIAGNOSTIC_FIXTURES)
    .map(tenant => ({
      clave_inegi: tenant.clave_inegi ?? tenant.tenant_id,
      nombre: tenant.municipality,
      estado_id: stateIdFromName(tenant.state),
      estado_nombre: tenant.state,
      municipio_id: tenant.municipio_id ?? tenant.tenant_id,
      zm: tenant.zm ?? '',
      datos_estimados: false,
      source: 'next_local_city_consulting_index',
    }))
    .filter(row => !estadoId || row.estado_id === estadoId)
    .filter(row => !q || `${row.nombre} ${row.estado_nombre} ${row.clave_inegi}`.toLowerCase().includes(q))
    .slice(0, limit)

  return NextResponse.json({
    municipalities,
    source: 'next_local_admin_fallback',
    territorial_rule: 'municipio y ZM se exponen como campos separados; ZM no soporta claim municipal.',
  })
}
