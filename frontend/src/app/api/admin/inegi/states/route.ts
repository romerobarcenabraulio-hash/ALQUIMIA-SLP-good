import { NextResponse } from 'next/server'
import { canUseLocalAdminFallback, MX_STATES } from '../../_shared'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await canUseLocalAdminFallback()) {
    return NextResponse.json({ detail: 'Solo admins o analistas internos' }, { status: 403 })
  }

  return NextResponse.json({
    states: MX_STATES.map(([estado_id, estado_nombre]) => ({ estado_id, estado_nombre })),
    source: 'next_local_admin_fallback',
  })
}
