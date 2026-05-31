import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { buildBibliography, citationForMetric, hasMinimumEvidence, metricCitationLabel } from '@/lib/citations'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { auditMetricsForExport } from '@/lib/standardsCompliance'

const exportState = globalThis as typeof globalThis & {
  __alquimiaPreliminaryExportCounts?: Record<string, number>
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callerTenant = _request.headers.get('x-tenant-id')
  if (callerTenant && callerTenant !== id) {
    return NextResponse.json({ detail: 'Acceso cross-tenant bloqueado' }, { status: 403 })
  }

  const data = getTenantArchiveData(id)
  if (data.status !== 'official') {
    exportState.__alquimiaPreliminaryExportCounts ??= {}
    const countKey = `${id}:${currentMonthKey()}`
    const currentCount = exportState.__alquimiaPreliminaryExportCounts[countKey] ?? 0
    if (currentCount >= 3) {
      return NextResponse.json(
        { detail: 'Límite MVP de 3 exportaciones preliminares por mes alcanzado. Requiere revisión humana.' },
        { status: 429 },
      )
    }
    exportState.__alquimiaPreliminaryExportCounts[countKey] = currentCount + 1
  }
  const zip = new JSZip()
  const watermark = data.status === 'official'
    ? ''
    : `ALQUIMIA · Diagnóstico inicial · Versión ${data.version} · ${data.generated_at}\n\n`
  const methodologicalMarker = 'Documento preliminar elaborado con metodología ALQUIMIA · Fuentes y confianza visibles · Revisión humana requerida antes de uso oficial.'
  const bibliography = buildBibliography(data.metrics)
  const exportAudit = auditMetricsForExport(data.metrics)
  const missingEvidence = data.metrics.filter(metric => !hasMinimumEvidence(metric) || !citationForMetric(metric))
  const standardsSection = [
    '## Cumplimiento de estándares',
    '',
    '- GRI, ISO, PMI, CSRD, NMX y SDG se usan como referencias metodológicas salvo que exista evidencia completa.',
    '- Este paquete no declara cumplimiento completo de ningún estándar.',
    `- Estado pre-export: ${exportAudit.label}.`,
    `- Cumplimiento completo declarado: ${exportAudit.canClaimFullCompliance ? 'permitido' : 'bloqueado'}.`,
    '- Si faltan campos obligatorios, el claim se mantiene como referencia metodológica, cumplimiento parcial o queda removido.',
    ...exportAudit.warnings.map(warning => `- ${warning}`),
    missingEvidence.length
      ? `- Métricas sin evidencia completa: ${missingEvidence.map(metric => metric.label).join(', ')}.`
      : '- Las métricas incluidas tienen fuente, fecha, método, confianza y cita o brecha explícita.',
  ].join('\n')

  function metricLine(metric: typeof data.metrics[number]) {
    const value = metric.value ?? 'Brecha crítica'
    const citation = citationForMetric(metric)
    const citationLabel = citation ? `[${metricCitationLabel(metric, data.metrics)}]` : '[sin cita]'
    const validation = metric.status === 'verificado' ? 'dato con fuente revisable' : 'no oficial / requiere validación'
    return `- ${metric.label}: ${value} ${metric.unit} ${citationLabel} · ${metric.confidence} · ${validation} · Fuente: ${metric.source} · Fecha: ${metric.source_date} · Método: ${metric.method} · Alcance: ${metric.territorial_scope}`
  }

  function documentarySection() {
    const gaps = data.document_gaps.map(gap => (
      `- ${gap.label}: ${gap.status} · Fecha: ${gap.updated_at} · Responsable: revisión humana municipal/ALQUIMIA · Efecto en claims: condiciona o bloquea módulo ${gap.module_id} · Razón: ${gap.reason}`
    ))
    const documents = data.tenant_documents.map(document => (
      `- ${document.original_filename}: documento recibido · pendiente de validación humana · módulo ${document.module_id} · Fecha: ${document.uploaded_at} · Responsable: ${document.uploaded_by_user_id}`
    ))
    return [
      '## Brechas documentales y documentos pendientes',
      '',
      gaps.length ? gaps.join('\n') : '- Sin brechas documentales activas.',
      '',
      '## Documentos recibidos',
      '',
      documents.length ? documents.join('\n') : '- Sin documentos cargados.',
      '',
      'Nota: un documento recibido no se convierte automáticamente en dato validado.',
    ].join('\n')
  }

  function bibliographySection() {
    return [
      '## Bibliografía mínima',
      '',
      bibliography.length ? bibliography.map((entry, index) => `${index + 1}. ${entry}`).join('\n') : '- Sin bibliografía; las cifras deben mostrarse como brecha o pendiente.',
    ].join('\n')
  }

  zip.file('00_INDICE.md', `${watermark}# Índice documental\n\n${methodologicalMarker}\n\n${data.document_index.map((doc, idx) => `${idx + 1}. ${doc.title} — ${doc.status} · ${doc.documentary_status ?? 'complete'}`).join('\n')}\n\n${standardsSection}\n\n${bibliographySection()}\n`)
  for (const doc of data.document_index) {
    zip.file(`${doc.id}.md`, `${watermark}# ${doc.title}\n\n${methodologicalMarker}\n\nMunicipio: ${data.municipality}\nEstado: ${data.state}\n\n${documentarySection()}\n\n## Fuentes, citas y confianza\n\n${data.metrics.map(metricLine).join('\n')}\n\n${standardsSection}\n\n${bibliographySection()}\n`)
  }
  zip.file('README_SEGURIDAD.md', 'Paquete preliminar. No sustituye revisión humana, estudio local ni decisión pública. Si se comparte externamente, link y contraseña deben enviarse por canales separados.\n')
  zip.file('CONTROL_EXPORTACION.md', [
    '# Control de exportación',
    '',
    `Tenant: ${data.tenant_id}`,
    `Municipio: ${data.municipality}`,
    `Estado: ${data.state}`,
    'Límite MVP: máximo 3 exportaciones preliminares por mes.',
    'Si se genera contraseña para envío externo, link y contraseña no deben enviarse en el mismo correo.',
    'Este export conserva el mismo índice documental para todas las ciudades probadas.',
  ].join('\n'))

  const body = await zip.generateAsync({ type: 'arraybuffer' })
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="alquimia-${id}-preliminar.zip"`,
      'X-Alquimia-Export-Limit': 'preliminary-max-3-per-month',
    },
  })
}
