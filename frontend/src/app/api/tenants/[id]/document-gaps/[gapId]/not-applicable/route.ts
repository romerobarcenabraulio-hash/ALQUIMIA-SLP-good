import { NextResponse } from 'next/server'
import { markGapNotApplicable } from '@/lib/documentArchiveStore'

export async function POST(request: Request, { params }: { params: Promise<{ id: string; gapId: string }> }) {
  const { id, gapId } = await params
  const callerTenant = request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }
  try {
    const gap = markGapNotApplicable(id, gapId)
    return NextResponse.json({ gap })
  } catch (exc) {
    return NextResponse.json({ detail: exc instanceof Error ? exc.message : 'No se pudo marcar no aplica' }, { status: 400 })
  }
}
