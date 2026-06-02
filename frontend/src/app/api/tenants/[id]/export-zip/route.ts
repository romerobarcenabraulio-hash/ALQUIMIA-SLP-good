import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { buildBibliography, citationForMetric, hasMinimumEvidence, metricCitationLabel } from '@/lib/citations'
import { getTenantArchiveData } from '@/lib/documentArchiveStore'
import { auditMetricsForExport } from '@/lib/standardsCompliance'
import {
  buildTenantConsultingPackageResponse,
  buildTenantConsultingPackageResponseWithApiLayers,
} from '@/lib/tenantConsultingPackageResponse'
import { tenantMunicipalContextFromHeaders } from '@/lib/tenantMunicipalContextHeaders'

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

  const context = tenantMunicipalContextFromHeaders(_request.headers)
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
  const apiFetchGate = _request.headers.get('x-consulting-api-fetch-gate')
  const consultingResponse = apiFetchGate === 'founder-admin-reviewed'
    ? await buildTenantConsultingPackageResponseWithApiLayers(id, context, {
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:8000',
      })
    : buildTenantConsultingPackageResponse(id, context)
  const consultingManifest = consultingResponse.export_manifest
  const exportNotice = {
    tenant_id: consultingResponse.tenant_id,
    municipality: consultingResponse.municipality,
    status: consultingResponse.status,
    officiality: consultingResponse.officiality,
    human_review_required: consultingResponse.human_review_required,
    client_controls_enabled: consultingResponse.consulting_package.scenario_set.client_controls_enabled,
    warning: consultingResponse.officiality === 'official_source_package'
      ? 'Paquete con fuentes oficiales integradas; las decisiones públicas siguen siendo humanas.'
      : 'Paquete preliminar no oficial; requiere revisión humana antes de uso institucional externo.',
    non_negotiables: [
      'Nada calculado o inferido se presenta como oficial.',
      'Benchmark no sustituye estudio local.',
      'Municipio y zona metropolitana no se mezclan.',
      'Toda afirmación fuerte requiere fuente, fecha, método, alcance, confianza y revisión humana.',
      'Si falta evidencia, se muestra brecha crítica.',
    ],
  }
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

  function compatibleBibliographySection() {
    const recommendations = consultingManifest.bibliography_recommendations ?? []
    return [
      '## Bibliografía compatible y límites de uso',
      '',
      recommendations.length
        ? recommendations.slice(0, 10).map((item, index) => [
            `${index + 1}. ${item.record.title} · ${item.tag} · score ${item.score.total}`,
            `   - Sí soporta: ${item.supported_claim}`,
            `   - No soporta: ${item.unsupported_claim}`,
            `   - Método: ${item.record.method}`,
            `   - Alcance: ${item.record.territorial_scope} · Confianza: ${item.confidence}`,
          ].join('\n')).join('\n')
        : '- Sin recomendaciones bibliográficas compatibles; conservar brechas y no elevar benchmarks a estudio local.',
      '',
      'Nota: la bibliografía comparable no sustituye estudio local, reglamento municipal ni revisión humana.',
    ].join('\n')
  }

  zip.file('00_INDICE.md', `${watermark}# Índice documental\n\n${methodologicalMarker}\n\n${data.document_index.map((doc, idx) => `${idx + 1}. ${doc.title} — ${doc.status} · ${doc.documentary_status ?? 'complete'}`).join('\n')}\n\n${standardsSection}\n\n${bibliographySection()}\n`)
  zip.file('consulting_manifest.json', JSON.stringify(consultingManifest, null, 2))
  zip.file('consulting_package.json', JSON.stringify(consultingResponse.consulting_package, null, 2))
  zip.file('bibliography_recommendations.json', JSON.stringify(consultingManifest.bibliography_recommendations ?? [], null, 2))
  zip.file('export_notice.json', JSON.stringify(exportNotice, null, 2))
  zip.file('api_layer_fetch_status.json', JSON.stringify(
    'api_layer_fetch_status' in consultingResponse
      ? consultingResponse.api_layer_fetch_status
      : { enabled: false, reason: 'gate_not_provided', fetched_layers: [], blocked_layers: [] },
    null,
    2,
  ))
  zip.file('claim_ledger.json', JSON.stringify(consultingManifest.claim_ledger, null, 2))
  zip.file('input_registry.json', JSON.stringify(consultingManifest.input_registry, null, 2))
  zip.file('scenario_set.json', JSON.stringify(consultingManifest.scenarios, null, 2))
  zip.file('01_PAQUETE_CONSULTIVO.md', [
    `${watermark}# Paquete de Consultoría RSU Gobierno`,
    '',
    methodologicalMarker,
    '',
    `Municipio: ${data.municipality}`,
    `Estado: ${data.state}`,
    `Oficialidad: ${exportNotice.officiality}`,
    `Revisión humana requerida: ${exportNotice.human_review_required ? 'sí' : 'no'}`,
    '',
    '## Decisión de lectura',
    '',
    '- Este paquete automatiza investigación, cotejo, diagnóstico, escenarios, riesgos y hoja de ruta.',
    '- No sustituye decisión humana, estudio local ni acto de autoridad.',
    '- No contiene sliders cliente ni precios oficiales.',
    '',
    '## Claims',
    '',
    `- Claims afirmables: ${consultingManifest.claim_ledger.affirmable_count}`,
    `- Claims bloqueados: ${consultingManifest.claim_ledger.blocked_count}`,
    '',
    '## Escenarios',
    '',
    consultingManifest.scenarios.map(scenario => (
      `- ${scenario.label}: ${scenario.capture_ton_day === null ? 'bloqueado' : `${scenario.capture_ton_day} t/día`} · confianza ${scenario.confidence}`
    )).join('\n'),
    '',
    '## Insumos críticos',
    '',
    consultingManifest.input_registry.sources
      .filter(source => source.status === 'blocked')
      .slice(0, 12)
      .map(source => `- ${source.label}: ${source.blocks.join(', ') || 'claim bloqueado'} · Fuente: ${source.source}`)
      .join('\n') || '- Sin bloqueos críticos registrados.',
    '',
    compatibleBibliographySection(),
  ].join('\n'))
  for (const doc of data.document_index) {
    zip.file(`${doc.id}.md`, `${watermark}# ${doc.title}\n\n${methodologicalMarker}\n\nMunicipio: ${data.municipality}\nEstado: ${data.state}\n\n${documentarySection()}\n\n## Fuentes, citas y confianza\n\n${data.metrics.map(metricLine).join('\n')}\n\n${standardsSection}\n\n${bibliographySection()}\n\n${compatibleBibliographySection()}\n`)
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
