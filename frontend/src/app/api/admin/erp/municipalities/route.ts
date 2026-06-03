import { NextRequest, NextResponse } from 'next/server'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { buildMunicipalityPreparationSummary } from '@/lib/municipalityPreparation'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'
import { canUseLocalAdminFallback, stateIdFromName } from '../../_shared'

export const dynamic = 'force-dynamic'

function regulationStatusForTenant(tenantId: string) {
  const data = getTenantArchiveData(tenantId)
  const regulationGap = data.document_gaps.find(gap => gap.document_type === 'reglamento_limpia' && !gap.marked_not_applicable)
  if (!regulationGap) return 'available'
  return regulationGap.status === 'pending' ? 'missing' : 'available'
}

export async function GET(request: NextRequest) {
  if (!await canUseLocalAdminFallback()) {
    return NextResponse.json({ detail: 'Solo admins o analistas internos' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const q = (params.get('q') ?? '').toLowerCase().trim()
  const estadoId = params.get('estado_id') ?? ''
  const status = params.get('status') ?? ''
  const rows = Object.values(TENANT_DIAGNOSTIC_FIXTURES)
    .map(tenant => {
      const preparation = buildMunicipalityPreparationSummary(getTenantArchiveData(tenant.tenant_id), {
        tenantLinked: true,
        userLinked: false,
      })
      return {
      clave_inegi: tenant.clave_inegi ?? '',
      municipio: tenant.municipality,
      estado: tenant.state,
      estado_id: stateIdFromName(tenant.state),
      municipio_id: tenant.municipio_id ?? tenant.tenant_id,
      zm: tenant.zm ?? '',
      tenant_id: tenant.tenant_id,
      tenant_nombre: tenant.municipality,
      stage: 'validation',
      tier: 'diagnostico',
      regulation_status: regulationStatusForTenant(tenant.tenant_id),
      users_count: 0,
      client_users_count: 0,
      admin_users_count: 0,
      primary_contact: null,
      link_status: 'tenant_sin_usuario',
      duplicate_tenants_count: 1,
      preparation_status: preparation.status,
      preparation_label: preparation.label,
      next_founder_action: preparation.nextAction,
    }
    })
    .filter(row => !estadoId || row.estado_id === estadoId)
    .filter(row => !status || row.link_status === status)
    .filter(row => !q || `${row.municipio} ${row.estado} ${row.clave_inegi}`.toLowerCase().includes(q))

  return NextResponse.json({
    rows,
    count: rows.length,
    source: 'next_local_admin_fallback',
    linking_method: 'clave_inegi primero; municipio_id como respaldo; sin mezclar ZM con municipio.',
    cross_tenant_private_data_exposed: false,
  })
}
