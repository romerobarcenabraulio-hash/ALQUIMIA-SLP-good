'use client'

import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import { Citation } from '@/components/Citation'
import { MetricConfidencePill } from '@/components/MetricConfidencePill'
import { ModuleDiagram } from '@/components/ModuleDiagram'
import { ModuleEvidenceFooter } from '@/components/ModuleEvidenceFooter'
import { moduleMatches } from '@/lib/documentArchiveStore'
import { moduleSubtitle, moduleTitle } from '@/lib/moduleTitles'
import type { DocumentGap, TenantDiagnosticData, TenantMetric, TenantReceivedDocument } from '@/lib/tenantDiagnosticData'
import type { PlatformModule } from '@/lib/platformRouting'

const PILLAR_MODULE_IDS = new Set([
  'city_baseline',
  'marco_legal',
  'costo_omision',
  'escenarios_financieros',
  'riesgos_modelo',
  'expediente_cabildo',
  'risk_dashboard',
])

const MODULE_METRIC_IDS: Record<string, string[]> = {
  city_baseline: ['rsu_generation', 'field_characterization'],
  marco_legal: ['field_characterization'],
  costo_omision: ['rsu_generation', 'field_characterization'],
  escenarios_financieros: ['rsu_generation', 'routes_time_study'],
  riesgos_modelo: ['rsu_generation', 'routes_time_study', 'field_characterization', 'psp_acceptance'],
  expediente_cabildo: ['rsu_generation', 'field_characterization', 'psp_acceptance'],
  risk_dashboard: ['rsu_generation', 'routes_time_study', 'field_characterization', 'psp_acceptance'],
}

const MODULE_CONCLUSION: Record<string, string> = {
  city_baseline: 'El diagnóstico RSU queda abierto con evidencia municipal separada de benchmarks y brechas críticas visibles.',
  marco_legal: 'El marco normativo puede revisarse, pero no se cierra como dictamen sin reglamento vigente y revisión humana.',
  costo_omision: 'El costo de no actuar se mantiene como lectura preliminar cuando la línea base local aún tiene brechas.',
  escenarios_financieros: 'Los escenarios financieros son sensibles a documentos presupuestales y estudios locales pendientes.',
  riesgos_modelo: 'El riesgo principal es metodológico: decidir con cifras incompletas o documentos no validados.',
  expediente_cabildo: 'El expediente conserva estructura completa, pero bloquea claims sin evidencia mínima defendible.',
  risk_dashboard: 'Los gates de ejecución quedan condicionados a evidencia trazable, revisión humana y separación territorial.',
}

const MODULE_BLOCKED_CLAIMS: Record<string, string[]> = {
  city_baseline: [
    'No afirmar composición municipal sin estudio local de cuarteo.',
    'No convertir generación estimada en dato oficial.',
  ],
  marco_legal: [
    'No presentar análisis preliminar como opinión jurídica firmada.',
    'No afirmar obligación reglamentaria sin reglamento vigente trazable.',
  ],
  costo_omision: [
    'No prometer ahorro, captura o impacto sin fuente, fecha, método y confianza.',
  ],
  escenarios_financieros: [
    'No defender TIR, CAPEX u OPEX como cifra contractual sin presupuesto y cotizaciones validadas.',
  ],
  riesgos_modelo: [
    'No suavizar una brecha crítica como pendiente menor.',
    'No esconder impugnabilidad por falta de estudio local.',
  ],
  expediente_cabildo: [
    'No llevar a Cabildo un claim bloqueado por evidencia insuficiente.',
    'No decir que la plataforma aprueba decisiones públicas.',
  ],
  risk_dashboard: [
    'No cerrar gates por automatización o por recomendación asistida.',
    'No activar ejecución si faltan evidencia mínima, responsable humano o decisión documentada.',
  ],
}

function metricValue(metric: TenantMetric) {
  if (metric.value === null || metric.status === 'brecha_critica') return 'Brecha crítica'
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
}

function metricsForModule(moduleId: string, data: TenantDiagnosticData): TenantMetric[] {
  const wanted = MODULE_METRIC_IDS[moduleId] ?? []
  const selected = wanted
    .map(id => data.metrics.find(metric => metric.id === id))
    .filter(Boolean) as TenantMetric[]
  return selected.length ? selected : data.metrics.slice(0, 2)
}

function gapsForModule(moduleId: string, gaps: DocumentGap[]) {
  return gaps.filter(gap => moduleMatches(gap.module_id, moduleId) && gap.status === 'pending' && !gap.marked_not_applicable)
}

function documentsForModule(moduleId: string, documents: TenantReceivedDocument[]) {
  return documents.filter(document => moduleMatches(document.module_id, moduleId))
}

export function moduleDocumentStatus(moduleId: string, data: TenantDiagnosticData): 'complete' | 'received' | 'gap' | 'pending' {
  const gaps = gapsForModule(moduleId, data.document_gaps)
  if (gaps.length) return 'gap'
  const docs = documentsForModule(moduleId, data.tenant_documents)
  if (docs.length) return 'received'
  const hasCriticalMetric = metricsForModule(moduleId, data).some(metric => metric.confidence === 'critical_gap')
  return hasCriticalMetric ? 'pending' : 'complete'
}

export function moduleDocumentStatusLabel(status: ReturnType<typeof moduleDocumentStatus>) {
  if (status === 'complete') return 'Completo'
  if (status === 'received') return 'Pendiente de validación'
  if (status === 'gap') return 'Brecha documental'
  return 'Pendiente de validación'
}

export function PillarModulePanel({
  module,
  tenantData,
}: {
  module: PlatformModule | null
  tenantData: TenantDiagnosticData | null
}) {
  if (!module || !tenantData || !PILLAR_MODULE_IDS.has(module.module_id)) return null

  const metrics = metricsForModule(module.module_id, tenantData)
  const gaps = gapsForModule(module.module_id, tenantData.document_gaps)
  const docs = documentsForModule(module.module_id, tenantData.tenant_documents)
  const status = moduleDocumentStatus(module.module_id, tenantData)

  return (
    <section className="mx-4 mt-5 max-w-full overflow-hidden rounded-[8px] border border-[#D8D2C5] bg-white p-4 sm:mx-6 sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#D8D2C5] bg-[#F4F2ED] px-2 py-0.5 text-[11px] font-semibold text-[#6B6760]">
              {moduleSubtitle(module.module_id, module.nav_subtitle)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              status === 'gap'
                ? 'border border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]'
                : status === 'received'
                  ? 'border border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'
                  : 'border border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
            }`}>
              {moduleDocumentStatusLabel(status)}
            </span>
          </div>
          <h2 className="mt-3 max-w-3xl break-words font-serif text-[28px] leading-tight text-[#1C1B18] sm:text-[34px]">
            {moduleTitle(module.module_id, module.label)}
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#4A4740]">
            {MODULE_CONCLUSION[module.module_id]}
          </p>
          <p className="mt-3 max-w-3xl text-[12px] leading-6 text-[#6B6760]">
            Municipio: <span className="font-semibold text-[#1C1B18]">{tenantData.municipality}</span>. Alcance territorial de las métricas: municipio salvo que una fuente indique otra cosa. Zona metropolitana, estado y país no se mezclan con dato municipal.
          </p>
          <ModuleDiagram moduleId={module.module_id} metrics={metrics} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {metrics.slice(0, 3).map(metric => (
            <article key={metric.id} className="min-w-0 rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                <p className="min-w-0 max-w-[24ch] text-[12px] font-semibold leading-5 text-[#1C1B18] sm:flex-1 sm:max-w-none">{metric.label}</p>
                <MetricConfidencePill confidence={metric.confidence} />
              </div>
              <p className="mt-3 text-[22px] font-semibold leading-none text-[#1C1B18]">
                {metricValue(metric)}
                <Citation metric={metric} metrics={metrics} />
              </p>
            </article>
          ))}
        </div>
      </div>

      {(gaps.length > 0 || docs.length > 0) && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {gaps.map(gap => (
            <div key={gap.id} className="rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-4">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-[#3B3326]">
                <AlertTriangle size={14} /> Brecha documental visible
              </p>
              <p className="mt-2 text-[13px] font-semibold text-[#1C1B18]">{gap.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-[#5F584A]">{gap.reason}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#756C5A]">
                Efecto: condiciona o bloquea claims del módulo hasta revisión humana.
              </p>
            </div>
          ))}
          {docs.map(document => (
            <div key={document.id} className="rounded-[8px] border border-[#C9DDB1] bg-[#F2F8EA] p-4">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-[#2F5B0D]">
                <FileText size={14} /> Documento recibido
              </p>
              <p className="mt-2 text-[13px] font-semibold text-[#1C1B18]">{document.original_filename}</p>
              <p className="mt-1 text-[12px] leading-5 text-[#4A6740]">
                Recibido el {document.uploaded_at}. Queda pendiente de validación humana antes de alimentar claims.
              </p>
            </div>
          ))}
        </div>
      )}

      <ModuleEvidenceFooter
        metrics={metrics}
        blockedClaims={MODULE_BLOCKED_CLAIMS[module.module_id]}
      />

      <div className="mt-4 flex items-start gap-2 rounded-[8px] border border-[#E8E4DC] bg-[#F7F3EA] p-3 text-[12px] leading-5 text-[#5C574F]">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#3B6D11]" />
        <p>
          Este módulo conserva su lugar en el índice aunque falte evidencia. Las brechas se muestran como brechas, no como secciones eliminadas.
        </p>
      </div>
    </section>
  )
}
