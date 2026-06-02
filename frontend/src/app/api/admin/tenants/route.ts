import { NextResponse } from 'next/server'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'
import { localAdminAuthContext } from '../_shared'

export const dynamic = 'force-dynamic'

function regulationStatusForTenant(tenantId: string) {
  const data = getTenantArchiveData(tenantId)
  const regulationGap = data.document_gaps.find(gap => gap.document_type === 'reglamento_limpia' && !gap.marked_not_applicable)
  if (!regulationGap) return 'available'
  return regulationGap.status === 'pending' ? 'missing' : 'available'
}

export async function GET() {
  const auth = await localAdminAuthContext()

  if (!auth.allowed) {
    return NextResponse.json(
      {
        detail: 'Solo admins o analistas internos',
        auth_debug: auth,
      },
      { status: 403 },
    )
  }

  const tenants = Object.values(TENANT_DIAGNOSTIC_FIXTURES).map(tenant => ({
    id: tenant.tenant_id,
    nombre: tenant.municipality,
    estado_mx: tenant.state,
    municipio_id: tenant.municipio_id ?? tenant.tenant_id,
    inegi_clave: tenant.clave_inegi ?? '',
    tier_comercial: 'diagnostico',
    state: {
      current_stage: 'validation',
      transition_mode: 'human_gate',
      fecha_ingreso: tenant.generated_at,
      fecha_cambio_stage: tenant.generated_at,
    },
    regulation_status: regulationStatusForTenant(tenant.tenant_id),
    source: 'next_city_consulting_index',
  }))

  return NextResponse.json({
    tenants,
    source: 'next_city_consulting_index',
    cross_tenant_private_data_exposed: false,
  })
}
