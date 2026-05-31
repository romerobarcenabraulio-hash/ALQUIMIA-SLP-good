import { NextResponse } from 'next/server'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callerTenant = _request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }
  return NextResponse.json(getTenantArchiveData(id))
}
