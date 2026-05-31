import { NextResponse } from 'next/server'
import { processInboundEmailForTenant } from '@/lib/archivoFull'

export async function POST(request: Request) {
  const configuredSecret = process.env.POSTMARK_INBOUND_SECRET
  if (!configuredSecret) {
    return NextResponse.json(
      { detail: 'Postmark inbound no configurado. Requiere POSTMARK_INBOUND_SECRET y revisión founder/legal antes de operar.' },
      { status: 503 },
    )
  }

  const token = request.headers.get('x-postmark-token')
  if (token !== configuredSecret) {
    return NextResponse.json({ detail: 'Webhook no autorizado' }, { status: 401 })
  }

  const tenantId = request.headers.get('x-tenant-id')
  if (!tenantId) {
    return NextResponse.json({ detail: 'tenant_id requerido para enrutar correo entrante' }, { status: 400 })
  }

  try {
    const payload = await request.json()
    const result = await processInboundEmailForTenant(tenantId, payload)
    return NextResponse.json(result)
  } catch (exc) {
    return NextResponse.json({ detail: exc instanceof Error ? exc.message : 'No se pudo procesar correo entrante' }, { status: 400 })
  }
}
