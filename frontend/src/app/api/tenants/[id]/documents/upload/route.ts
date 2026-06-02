import { NextResponse } from 'next/server'
import { registerTenantDocument } from '@/lib/documentArchiveStore'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callerTenant = request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const uploadedByUserId = String(form.get('uploaded_by_user_id') ?? 'mvp_user')
  const moduleId = form.get('module_id')
  const documentType = form.get('document_type')
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: 'Archivo requerido' }, { status: 400 })
  }

  try {
    const result = await registerTenantDocument(id, file, uploadedByUserId, {
      module_id: typeof moduleId === 'string' && moduleId ? moduleId : undefined,
      document_type: typeof documentType === 'string' && documentType ? documentType : undefined,
    })
    return NextResponse.json({
      ...result,
      warning: 'Documento integrado como fuente del tenant. La plataforma usará lo extraíble con fuente, alcance, método, confianza y límites de uso.',
    })
  } catch (exc) {
    return NextResponse.json({ detail: exc instanceof Error ? exc.message : 'Archivo rechazado' }, { status: 400 })
  }
}
