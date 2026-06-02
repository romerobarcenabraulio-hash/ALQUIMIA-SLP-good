'use client'

import { useMemo, useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { DocumentGap, TenantReceivedDocument } from '@/lib/tenantDiagnosticData'
import { moduleMatches } from '@/lib/documentArchiveStore'

type Props = {
  tenantId: string
  moduleId: string | null
  gaps: DocumentGap[]
  documents: TenantReceivedDocument[]
  onChanged: () => void
}

export function DocumentGapBanner({ tenantId, moduleId, gaps, documents, onChanged }: Props) {
  const [selectedGap, setSelectedGap] = useState<DocumentGap | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const moduleGaps = useMemo(
    () => gaps.filter(gap => moduleMatches(gap.module_id, moduleId) && gap.status === 'pending' && !gap.marked_not_applicable),
    [gaps, moduleId],
  )
  const moduleDocuments = useMemo(
    () => documents.filter(document => moduleMatches(document.module_id, moduleId)),
    [documents, moduleId],
  )

  if (!moduleId || (!moduleGaps.length && !moduleDocuments.length)) return null

  async function uploadDocument() {
    if (!selectedGap || !file) return
    setBusy(true)
    setError(null)
    setMessage(null)
    const form = new FormData()
    form.set('file', file)
    form.set('uploaded_by_user_id', 'mvp_session_user')
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/documents/upload`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
      body: form,
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(body.detail ?? 'No se pudo recibir el documento')
      return
    }
    setMessage('Documento integrado automáticamente · se usará con fuente, alcance y límites visibles')
    setFile(null)
    setSelectedGap(null)
    onChanged()
  }

  async function markNotApplicable(gap: DocumentGap) {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/document-gaps/${encodeURIComponent(gap.id)}/not-applicable`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(body.detail ?? 'No se pudo marcar como no aplicable')
      return
    }
    setMessage('Brecha marcada como no aplicable sin borrar trazabilidad')
    onChanged()
  }

  return (
    <section className="mx-6 mt-4 rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-4 text-[#2F2B22]">
      {moduleGaps.map(gap => (
        <div key={gap.id} className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[760px]">
            <p className="text-[13px] font-semibold">Documento pendiente para completar este módulo</p>
            <p className="mt-1 text-[12px] leading-5 text-[#5F584A]">
              La plataforma no pudo acceder a {gap.label}. Si tu municipio lo tiene, súbelo aquí para mejorar la trazabilidad del diagnóstico. Si no aplica, puedes marcarlo como no aplicable.
            </p>
            <p className="mt-2 text-[11px] text-[#756C5A]">
              Estado: pendiente documental · Responsable humano: equipo municipal y equipo ALQUIMIA · Módulo afectado: {gap.module_id}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setSelectedGap(gap)}
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#1C2B15] px-3 py-2 text-[12px] font-semibold text-white"
            >
              <Upload size={14} /> Subir documento
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => markNotApplicable(gap)}
              className="rounded-[8px] border border-[#B8A676] px-3 py-2 text-[12px] font-semibold text-[#3B3326]"
            >
              Marcar como no aplica
            </button>
          </div>
        </div>
      ))}
      {moduleDocuments.length > 0 && (
        <div className="mt-3 rounded-[8px] border border-[#D8D2C5] bg-white p-3">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Documento integrado automáticamente</p>
          {moduleDocuments.map(document => (
            <p key={document.id} className="mt-1 text-[11px] text-[#6B6760]">
              {document.original_filename} · {document.uploaded_at} · fuente disponible para cálculos y claims con límites de uso
            </p>
          ))}
        </div>
      )}
      {message && <p className="mt-3 text-[12px] text-[#3B6D11]">{message}</p>}
      {error && <p className="mt-3 text-[12px] text-[#A8322A]">{error}</p>}

      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[540px] rounded-[8px] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Carga documental</p>
                <h2 className="mt-1 font-serif text-[24px] text-[#1C1B18]">{selectedGap.label}</h2>
              </div>
              <button type="button" onClick={() => setSelectedGap(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-[13px] text-[#4A4740]">
              <p>Módulo: {selectedGap.module_id}</p>
              <p>Clasificación sugerida: {selectedGap.document_type.replaceAll('_', ' ')}</p>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png"
                onChange={event => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-[8px] border border-[#D8D2C5] px-3 py-2"
              />
              <p className="rounded-[8px] bg-[#F7F3EA] p-3 text-[12px] leading-5">
                La plataforma integrará el documento como fuente del módulo y usará lo extraíble según jerarquía de evidencia, citas y límites de uso.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedGap(null)} className="rounded-[8px] border border-[#D8D2C5] px-4 py-2 text-[13px]">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!file || busy}
                onClick={uploadDocument}
                className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
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
