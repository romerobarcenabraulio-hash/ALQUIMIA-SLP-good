'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Lock, Upload } from 'lucide-react'
import { moduleTitle } from '@/lib/moduleTitles'
import type { DocumentGap, TenantMetric, TenantReceivedDocument } from '@/lib/tenantDiagnosticData'
import type { PlatformModule } from '@/lib/platformRouting'
import type {
  EvidenceOrigin,
  EvidenceScope,
  ValidationModuleSectionSpec,
  ValidationModuleSpec,
} from '@/lib/validationModuleSpecs'

const ORIGIN_LABEL: Record<EvidenceOrigin, string> = {
  investigated: 'Investigado',
  calculated: 'Calculado',
  client_provided: 'De tu documento',
  pending: 'Pendiente',
}

const ORIGIN_CLASS: Record<EvidenceOrigin, string> = {
  investigated: 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]',
  calculated: 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]',
  client_provided: 'border-[#BDD7F5] bg-[#E8F0FA] text-[#1A5FA8]',
  pending: 'border-[#D8D2C5] bg-[#F4F2ED] text-[#6B6760]',
}

const SCOPE_LABEL: Record<EvidenceScope, string> = {
  municipal: 'Municipal',
  state: 'Estatal',
  zm: 'ZM etiquetada',
  national: 'Nacional',
  comparable: 'Comparable',
  benchmark: 'Benchmark',
}

function originFromMetric(metric: TenantMetric): EvidenceOrigin {
  if (metric.status === 'brecha_critica' || metric.value === null) return 'pending'
  if (metric.formula || metric.status === 'inferido') return 'calculated'
  return metric.source.toLowerCase().includes('documento') || metric.validation_status === 'validated_human'
    ? 'client_provided'
    : 'investigated'
}

function scopeFromMetric(metric: TenantMetric): EvidenceScope {
  if (metric.territorial_scope === 'municipio') return 'municipal'
  if (metric.territorial_scope === 'estado') return 'state'
  if (metric.territorial_scope === 'zm') return 'zm'
  return 'national'
}

export function EvidenceScopeBadge({ scope }: { scope: EvidenceScope }) {
  const warn = scope !== 'municipal'
  return (
    <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
      warn ? 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]' : 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
    }`}>
      {SCOPE_LABEL[scope]}
    </span>
  )
}

export function DataPointDisplay({ metric }: { metric: TenantMetric }) {
  const origin = originFromMetric(metric)
  const scope = scopeFromMetric(metric)
  return (
    <article className="min-w-0 border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-[#1C1B18]">{metric.label}</p>
        <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${ORIGIN_CLASS[origin]}`}>
          {ORIGIN_LABEL[origin]}
        </span>
      </div>
      <p className="mt-3 font-serif text-[26px] leading-none text-[#1C1B18]">
        {metric.value ?? 'Pendiente'} <span className="font-sans text-[12px] text-[#6B6760]">{metric.unit}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <EvidenceScopeBadge scope={scope} />
        <span className="inline-flex border border-[#D8D2C5] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          {metric.confidence}
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#6B6760]">
        Fuente: {metric.source} · Fecha: {metric.source_date} · Método: {metric.method}
        {metric.formula ? ` · Fórmula: ${metric.formula}` : ''}
      </p>
    </article>
  )
}

export function PendingDataPointDisplay({ label }: { label: string }) {
  return (
    <article className="min-w-0 border border-[#D8D2C5] bg-[#F4F2ED] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-[#1C1B18]">{label}</p>
        <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${ORIGIN_CLASS.pending}`}>
          {ORIGIN_LABEL.pending}
        </span>
      </div>
      <p className="mt-3 font-serif text-[26px] leading-none text-[#6B6760]">Pendiente</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <EvidenceScopeBadge scope="municipal" />
        <span className="inline-flex border border-[#D8D2C5] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          critical_gap
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#6B6760]">
        Fuente: pendiente documental · Fecha: pendiente · Método: subir documento, fuente pública o cálculo trazable antes de afirmar.
      </p>
    </article>
  )
}

export function ModuleSection({
  section,
  index,
  total,
}: {
  section: ValidationModuleSectionSpec
  index: number
  total: number
}) {
  return (
    <section className="border-t border-[#E8E4DC] py-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.6fr)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            Sección {index + 1} de {total} · {section.required ? 'Obligatoria' : 'Complementaria'}
          </p>
          <h3 className="mt-2 font-serif text-[24px] leading-tight text-[#1C1B18]">{section.title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">{section.description}</p>
        </div>
        <div className="border-l border-[#E8E4DC] pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Campos obligatorios</p>
          <ul className="mt-2 space-y-1">
            {section.requiredFields.map(field => (
              <li key={field} className="flex gap-2 text-[12px] leading-5 text-[#4A4740]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8AA66F]" />
                {field}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {section.allowedOrigins.map(origin => (
              <span key={origin} className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${ORIGIN_CLASS[origin]}`}>
                {ORIGIN_LABEL[origin]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricValue({
  metric,
  fallback = 'Brecha',
}: {
  metric?: TenantMetric
  fallback?: string
}) {
  if (!metric || metric.value === null) return <span className="text-[#A8322A]">{fallback}</span>
  return (
    <span>
      {metric.value} <span className="font-sans text-[10px] text-[#6B6760]">{metric.unit}</span>
    </span>
  )
}

function DiagramStep({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="min-h-[84px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">{label}</p>
      <p className="mt-2 text-[12px] font-semibold leading-5 text-[#1C1B18]">{detail}</p>
    </div>
  )
}

function FlowDiagram({ steps }: { steps: Array<{ label: string; detail: string }> }) {
  return (
    <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
      {steps.map((step, index) => (
        <div key={step.label} className="contents">
          <DiagramStep label={step.label} detail={step.detail} />
          {index < steps.length - 1 && (
            <div className="hidden items-center justify-center text-[#8C8880] lg:flex">
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RsuSankeyPlaceholder({ metrics, gaps }: { metrics: TenantMetric[]; gaps: DocumentGap[] }) {
  const generation = metrics.find(metric => /generaci/i.test(metric.label))
  const hasCompositionGap = gaps.some(gap => /cuarteo|caracterizaci/i.test(`${gap.label} ${gap.reason}`))
  const rows = [
    { label: 'Orgánicos', width: hasCompositionGap ? 42 : 48, tone: 'bg-[#8AA66F]' },
    { label: 'Reciclables secos', width: hasCompositionGap ? 28 : 32, tone: 'bg-[#B8A676]' },
    { label: 'Rechazo', width: hasCompositionGap ? 22 : 20, tone: 'bg-[#A8A49C]' },
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
      <div className="border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Generación</p>
        <p className="mt-3 font-serif text-[24px] leading-none text-[#1C1B18]">
          <MetricValue metric={generation} fallback="Sin cifra" />
        </p>
      </div>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)_92px] md:items-center">
            <p className="text-[11px] font-semibold text-[#1C1B18]">{row.label}</p>
            <div className="h-8 border border-[#E8E4DC] bg-[#FDFCFA]">
              <div className={`h-full ${row.tone}`} style={{ width: `${row.width}%` }} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#765814]">
              {hasCompositionGap ? 'Brecha local' : 'Trazable'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatrixDiagram({ xLabel, yLabel, items }: { xLabel: string; yLabel: string; items: string[] }) {
  const cells = ['Bajo', 'Medio', 'Alto', 'Medio', 'Alto', 'Crítico', 'Alto', 'Crítico', 'Crítico']
  return (
    <div>
      <div className="grid grid-cols-3 gap-1">
        {cells.map((cell, index) => (
          <div key={`${cell}-${index}`} className={`min-h-[48px] p-2 text-center text-[10px] font-semibold ${
            cell === 'Crítico' ? 'bg-[#FBEAEA] text-[#A8322A]' : cell === 'Alto' ? 'bg-[#FFF9EA] text-[#765814]' : 'bg-[#EAF3DE] text-[#2F5B0D]'
          }`}>
            {cell}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">
        <span>{xLabel}</span>
        <span>{yLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="border border-[#D8D2C5] bg-[#FDFCFA] px-2 py-1 text-[10px] font-semibold text-[#4A4740]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ScenarioBars() {
  const scenarios = [
    ['Mínimo viable', 26],
    ['Conservador', 42],
    ['Base realista', 58],
    ['Optimizado', 74],
    ['Estrés', 18],
  ] as const
  return (
    <div className="space-y-3">
      {scenarios.map(([label, width]) => (
        <div key={label} className="grid gap-2 md:grid-cols-[130px_minmax(0,1fr)_90px] md:items-center">
          <p className="text-[11px] font-semibold text-[#1C1B18]">{label}</p>
          <div className="h-7 border border-[#E8E4DC] bg-[#FDFCFA]">
            <div className="h-full bg-[#8AA66F]" style={{ width: `${width}%` }} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#765814]">Escenario</p>
        </div>
      ))}
    </div>
  )
}

export function ModuleOperationalVisualization({
  spec,
  metrics,
  gaps,
}: {
  spec: ValidationModuleSpec
  metrics: TenantMetric[]
  gaps: DocumentGap[]
}) {
  const commonNotice = 'Si faltan datos, la figura queda estructural y marca brecha; no rellena números.'
  let content: JSX.Element

  if (spec.module_id === 'city_baseline') {
    content = <RsuSankeyPlaceholder metrics={metrics} gaps={gaps} />
  } else if (spec.module_id === 'social_diagnostico') {
    content = <MatrixDiagram xLabel="Interés" yLabel="Poder" items={['Cabildo', 'Ciudadanía', 'Privado urbano', 'Pepenadores']} />
  } else if (spec.module_id === 'riesgos_modelo') {
    content = <MatrixDiagram xLabel="Probabilidad" yLabel="Impacto" items={['Legal', 'Operativo', 'Social', 'Mercado']} />
  } else if (spec.module_id === 'escenarios_financieros') {
    content = <ScenarioBars />
  } else if (spec.module_id === 'marco_legal') {
    content = (
      <div className="grid gap-3 md:grid-cols-2">
        {['Reglamento vigente', 'Brecha detectada', 'Adendo propuesto', 'Revisión humana'].map(item => (
          <DiagramStep key={item} label={item} detail={item === 'Reglamento vigente' ? 'Único bloqueo formal para plan/declaratoria' : 'Requiere fuente, artículo y límite de uso'} />
        ))}
      </div>
    )
  } else if (spec.module_id === 'costo_omision') {
    content = <FlowDiagram steps={[
      { label: 'No actuar', detail: 'Costos y riesgos acumulados' },
      { label: 'Actuar', detail: 'Ruta con gates humanos' },
      { label: 'Cálculo', detail: 'Fórmula e inputs citables' },
      { label: 'Límite', detail: 'No es ahorro garantizado' },
    ]} />
  } else if (spec.module_id === 'expediente_cabildo') {
    content = <MatrixDiagram xLabel="Claim" yLabel="Evidencia" items={['Fuente', 'Método', 'Alcance', 'Estado humano']} />
  } else {
    content = <FlowDiagram steps={[
      { label: 'Investigar', detail: 'Documento cliente o fuente pública' },
      { label: 'Cotejar', detail: 'Alcance, fecha, método y confianza' },
      { label: 'Calcular', detail: 'Sólo con fórmula e inputs' },
      { label: 'Decidir', detail: 'Revisión humana y claim defendible' },
    ]} />
  }

  return (
    <section className="mt-6 border-y border-[#E8E4DC] py-4">
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Visualización operativa</p>
          <h3 className="mt-2 font-serif text-[22px] leading-tight text-[#1C1B18]">{spec.visualization}</h3>
          <p className="mt-2 text-[12px] leading-5 text-[#6B6760]">{commonNotice}</p>
        </div>
        <div className="min-w-0">{content}</div>
      </div>
    </section>
  )
}

export function ModuleDocumentUploadSection({
  tenantId,
  gaps,
  documents,
  onChanged,
}: {
  tenantId: string | null
  gaps: DocumentGap[]
  documents: TenantReceivedDocument[]
  onChanged?: () => void
}) {
  const [selectedGap, setSelectedGap] = useState<DocumentGap | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function uploadDocument() {
    if (!tenantId || !selectedGap || !file) return
    setBusy(true)
    setError(null)
    setMessage(null)
    const form = new FormData()
    form.set('file', file)
    form.set('uploaded_by_user_id', 'mvp_session_user')
    form.set('module_id', selectedGap.module_id)
    form.set('document_type', selectedGap.document_type)
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/documents/upload`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
      body: form,
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(typeof body.detail === 'string' ? body.detail : 'No se pudo recibir el documento')
      return
    }
    setMessage('Documento integrado automáticamente · disponible como fuente trazable del módulo')
    setFile(null)
    setSelectedGap(null)
    onChanged?.()
  }

  async function markNotApplicable(gap: DocumentGap) {
    if (!tenantId) return
    setBusy(true)
    setError(null)
    setMessage(null)
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/document-gaps/${encodeURIComponent(gap.id)}/not-applicable`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(typeof body.detail === 'string' ? body.detail : 'No se pudo marcar como no aplicable')
      return
    }
    setMessage('Brecha marcada como no aplicable sin borrar trazabilidad')
    onChanged?.()
  }

  return (
    <section className="border-t border-[#E8E4DC] py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Documentos del módulo</p>
      <div className="mt-3 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
        {gaps.length ? gaps.map(gap => (
          <div key={gap.id} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-[#1C1B18]">
                <AlertTriangle size={14} className="text-[#A8322A]" /> {gap.label}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#6B6760]">{gap.reason}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!tenantId || busy}
                onClick={() => setSelectedGap(gap)}
                className="inline-flex items-center gap-2 border border-[#D8D2C5] px-3 py-2 text-[12px] font-semibold text-[#3B3326] disabled:opacity-50"
              >
                <Upload size={13} /> Subir
              </button>
              <button
                type="button"
                disabled={!tenantId || busy}
                onClick={() => markNotApplicable(gap)}
                className="border border-[#D8D2C5] px-3 py-2 text-[12px] font-semibold text-[#6B6760] disabled:opacity-50"
              >
                No aplica
              </button>
            </div>
          </div>
        )) : (
          <div className="py-3 text-[12px] leading-5 text-[#5C574F]">
            No hay documentos pendientes críticos para este módulo. Los documentos recibidos se integran como fuente con alcance, confianza y límites de uso.
          </div>
        )}
        {documents.map(document => (
          <div key={document.id} className="py-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-[#2F5B0D]">
              <FileText size={14} /> {document.original_filename}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#5C574F]">Estado: {document.upload_status} · Recibido: {document.uploaded_at}</p>
          </div>
        ))}
      </div>
      {message && <p className="mt-3 text-[12px] text-[#2F5B0D]">{message}</p>}
      {error && <p className="mt-3 text-[12px] text-[#A8322A]">{error}</p>}

      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[540px] border border-[#D8D2C5] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Carga documental del módulo</p>
                <h3 className="mt-1 font-serif text-[24px] leading-tight text-[#1C1B18]">{selectedGap.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGap(null)}
                className="border border-[#D8D2C5] px-2 py-1 text-[12px] font-semibold text-[#6B6760]"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-3 text-[13px] text-[#4A4740]">
              <p>Módulo: {selectedGap.module_id}</p>
              <p>Clasificación sugerida: {selectedGap.document_type.replaceAll('_', ' ')}</p>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png"
                onChange={event => setFile(event.target.files?.[0] ?? null)}
                className="w-full border border-[#D8D2C5] px-3 py-2"
              />
              <p className="bg-[#F7F3EA] p-3 text-[12px] leading-5">
                La plataforma integrará el documento como fuente del módulo y usará lo extraíble con cita verificable, alcance, confianza y límites de uso.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedGap(null)} className="border border-[#D8D2C5] px-4 py-2 text-[13px]">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!file || busy}
                onClick={uploadDocument}
                className="bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Confirmar carga
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export function SectionCitations({ metrics }: { metrics: TenantMetric[] }) {
  return (
    <section className="border-t border-[#E8E4DC] py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Citas activas</p>
      <div className="mt-3 space-y-2">
        {metrics.length ? metrics.map((metric, index) => (
          <p key={metric.id} className="text-[11px] leading-5 text-[#6B6760]">
            {index + 1}. {metric.source}. {metric.label}. {metric.source_date}. Método: {metric.method}. Alcance: {metric.territorial_scope}.
          </p>
        )) : (
          <p className="text-[12px] text-[#6B6760]">Sin citas activas todavía; el módulo conserva brecha hasta recibir fuente.</p>
        )}
      </div>
    </section>
  )
}

export function ClaimEvidenceMatrix({
  blockedClaims,
  metrics,
}: {
  blockedClaims: string[]
  metrics: TenantMetric[]
}) {
  const rows = blockedClaims.length ? blockedClaims : ['No hay claim bloqueado registrado en el spec del módulo.']
  return (
    <section className="border-t border-[#E8E4DC] py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Matriz claim-evidencia</p>
      <div className="mt-3 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
        {rows.map((claim, index) => (
          <div key={`${claim}-${index}`} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_160px_120px]">
            <p className="text-[13px] font-semibold text-[#1C1B18]">{claim}</p>
            <p className="text-[12px] text-[#6B6760]">{metrics[index % Math.max(metrics.length, 1)]?.source ?? 'Sin fuente suficiente'}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A8322A]">Bloqueado</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ModuleCompletionFooter({
  spec,
  completedSections,
  onNavigateModule,
}: {
  spec: ValidationModuleSpec
  completedSections: number
  onNavigateModule?: (moduleId: string) => void
}) {
  const total = spec.sections.length
  const complete = completedSections >= total
  return (
    <footer className="border-t border-[#D8D2C5] py-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Criterio de completitud</p>
          <p className="mt-2 text-[13px] leading-6 text-[#4A4740]">{spec.completionCriterion}</p>
          <p className="mt-1 text-[12px] text-[#6B6760]">
            Progreso estructural: {completedSections} de {total} secciones con evidencia o brecha explícita.
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 border px-3 py-2 text-[12px] font-semibold ${
          complete ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]' : 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'
        }`}>
          {complete ? <CheckCircle2 size={14} /> : <Lock size={14} />}
          {complete ? 'Completo' : 'Condicionado'}
        </span>
      </div>
      {spec.nextModuleId && (
        <div className="mt-3 flex flex-col gap-3 border-t border-[#E8E4DC] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-[#6B6760]">
            Siguiente módulo: <span className="font-semibold text-[#1C1B18]">{moduleTitle(spec.nextModuleId, spec.nextModuleId)}</span>.
          </p>
          <button
            type="button"
            onClick={() => onNavigateModule?.(spec.nextModuleId as string)}
            className="w-fit border border-[#D8D2C5] bg-[#FDFCFA] px-3 py-2 text-[12px] font-semibold text-[#3B3326]"
          >
            Continuar
          </button>
        </div>
      )}
    </footer>
  )
}

export function ConsultingModuleShell({
  module,
  spec,
  metrics,
  gaps,
  documents,
  clientPreview,
  tenantId,
  onChanged,
  onNavigateModule,
}: {
  module: PlatformModule
  spec: ValidationModuleSpec
  metrics: TenantMetric[]
  gaps: DocumentGap[]
  documents: TenantReceivedDocument[]
  clientPreview: boolean
  tenantId: string | null
  onChanged?: () => void
  onNavigateModule?: (moduleId: string) => void
}) {
  const completedSections = spec.sections.filter(section => {
    if (section.id === 'philosophy' || section.id === 'badges') return true
    return metrics.length > 0 || gaps.length > 0 || documents.length > 0
  }).length
  const pendingDataPointLabels = spec.sections
    .flatMap(section => section.requiredFields)
    .filter((field, index, fields) => fields.indexOf(field) === index)
    .slice(0, 4)

  return (
    <section className="mx-4 mt-5 max-w-full overflow-hidden border-t border-[#D8D2C5] pt-5 sm:mx-6">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)]">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            {spec.subtitle}
          </p>
          <h2 className="mt-2 max-w-4xl font-serif text-[34px] leading-tight text-[#1C1B18]">
            {spec.title}
          </h2>
          <p className="mt-4 max-w-4xl text-[15px] leading-7 text-[#4A4740]">
            {spec.executiveConclusion}
          </p>
          <ModuleOperationalVisualization spec={spec} metrics={metrics} gaps={gaps} />
          {spec.sections.map((section, index) => (
            <ModuleSection key={section.id} section={section} index={index} total={spec.sections.length} />
          ))}
          <ModuleCompletionFooter spec={spec} completedSections={completedSections} onNavigateModule={onNavigateModule} />
        </div>

        <aside className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">DataPoints visibles</p>
          <div className="mt-3 grid gap-3">
            {metrics.slice(0, 4).map(metric => (
              <DataPointDisplay key={metric.id} metric={metric} />
            ))}
            {!metrics.length && (
              pendingDataPointLabels.map(label => (
                <PendingDataPointDisplay key={label} label={label} />
              ))
            )}
          </div>
          <ModuleDocumentUploadSection tenantId={tenantId} gaps={gaps} documents={documents} onChanged={onChanged} />
          {!clientPreview && <ClaimEvidenceMatrix blockedClaims={spec.blockedClaims} metrics={metrics} />}
          {!clientPreview && <SectionCitations metrics={metrics} />}
        </aside>
      </div>
    </section>
  )
}
