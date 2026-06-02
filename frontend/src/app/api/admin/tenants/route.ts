import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { TENANT_DIAGNOSTIC_FIXTURES } from '@/lib/tenantDiagnosticData'

export const dynamic = 'force-dynamic'

const TEMPORARY_ADMIN_EMAILS = new Set(['romero.barcena.braulio@gmail.com'])

function isAdminMetadata(metadata: Record<string, unknown> | null | undefined) {
  return (
    metadata?.role === 'founder'
    || metadata?.role === 'admin'
    || metadata?.has_admin_access === true
    || metadata?.bypass_payment_gates === true
  )
}

function normalizeEmail(email: string | null | undefined) {
  return email?.toLowerCase().trim() ?? ''
}

function userEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return []
  const all = [
    user.primaryEmailAddress?.emailAddress,
    ...user.emailAddresses.map(email => email.emailAddress),
  ]
  return Array.from(new Set(all.map(normalizeEmail).filter(Boolean)))
}

function regulationStatusForTenant(tenantId: string) {
  const data = getTenantArchiveData(tenantId)
  const regulationGap = data.document_gaps.find(gap => gap.document_type === 'reglamento_limpia' && !gap.marked_not_applicable)
  if (!regulationGap) return 'available'
  return regulationGap.status === 'pending' ? 'missing' : 'available'
}

export async function GET() {
  const user = await currentUser().catch(() => null)
  const emails = userEmails(user)
  const isTemporaryAdmin = emails.some(email => TEMPORARY_ADMIN_EMAILS.has(email))
  const canViewAdminIndex = isTemporaryAdmin || isAdminMetadata(user?.publicMetadata as Record<string, unknown> | undefined)

  if (!canViewAdminIndex) {
    return NextResponse.json(
      {
        detail: 'Solo admins',
        auth_debug: {
          signed_in: Boolean(user),
          email_count: emails.length,
          primary_email_detected: Boolean(user?.primaryEmailAddress?.emailAddress),
          admin_metadata_detected: isAdminMetadata(user?.publicMetadata as Record<string, unknown> | undefined),
        },
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
