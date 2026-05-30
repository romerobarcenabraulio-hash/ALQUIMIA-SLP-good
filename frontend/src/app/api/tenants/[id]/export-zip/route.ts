import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = getTenantArchiveData(id)
  const zip = new JSZip()
  const watermark = data.status === 'official'
    ? ''
    : `ALQUIMIA · Diagnóstico inicial · Versión ${data.version} · ${data.generated_at}\n\n`

  zip.file('00_INDICE.md', `${watermark}# Índice documental\n\n${data.document_index.map((doc, idx) => `${idx + 1}. ${doc.title} — ${doc.status} · ${doc.documentary_status ?? 'complete'}`).join('\n')}\n`)
  for (const doc of data.document_index) {
    zip.file(`${doc.id}.md`, `${watermark}# ${doc.title}\n\nMunicipio: ${data.municipality}\nEstado: ${data.state}\n\n## Estado documental\n\n${data.document_gaps.map(gap => `- ${gap.label}: ${gap.status} · ${gap.reason}`).join('\n') || '- Sin brechas documentales activas.'}\n\n## Documentos recibidos\n\n${data.tenant_documents.map(document => `- ${document.original_filename}: documento recibido · pendiente de validación humana · módulo ${document.module_id}`).join('\n') || '- Sin documentos cargados.'}\n\n## Fuentes y confianza\n\n${data.metrics.map(metric => `- ${metric.label}: ${metric.value ?? 'Brecha crítica'} ${metric.unit} · ${metric.confidence} · ${metric.source} · ${metric.source_date} · ${metric.method}`).join('\n')}\n`)
  }
  zip.file('README_SEGURIDAD.md', 'Paquete preliminar. No sustituye revisión humana, estudio local ni decisión pública. Si se comparte externamente, link y contraseña deben enviarse por canales separados.\n')

  const body = await zip.generateAsync({ type: 'arraybuffer' })
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="alquimia-${id}-preliminar.zip"`,
      'X-Alquimia-Export-Limit': 'preliminary-max-3-per-month',
    },
  })
}
