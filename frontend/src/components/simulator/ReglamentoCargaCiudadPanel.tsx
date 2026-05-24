'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLegalSourceManifest, uploadLegalReglamentoPdf } from '@/lib/api'
import { notifyLegalPdfUploaded, pdfListoParaAnalisis } from '@/lib/legalPdfGate'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { MunicipalLegalSourceManifest } from '@/types'

type RowState = {
  mid: string
  manifest: MunicipalLegalSourceManifest | null
  fetchError: string | null
  uploading: boolean
  uploadError: string | null
  uploadMessage: string | null
}

function chipForRow(row: RowState): { label: string; className: string } {
  if (row.uploading) {
    return { label: 'Subiendo PDF…', className: 'border-[#1A5FA8]/25 bg-[#EBF3FB] text-[#1A5FA8]' }
  }
  if (row.fetchError) {
    return { label: 'Error de consulta', className: 'border-red-300 bg-red-50 text-red-900' }
  }
  if (pdfListoParaAnalisis(row.manifest)) {
    return { label: 'Análisis habilitado', className: 'border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A]' }
  }
  if (!row.manifest) {
    return { label: 'Sin catálogo legal', className: 'border-[#C0392B]/30 bg-[#FBEAEA] text-[#C0392B]' }
  }
  switch (row.manifest.ingest_status) {
    case 'no_disponible':
      return { label: 'PDF requerido', className: 'border-[#C0392B]/30 bg-[#FBEAEA] text-[#C0392B]' }
    case 'localizado':
      return { label: 'Falta PDF en plataforma', className: 'border-[#D4881E]/35 bg-[#FEF7E7] text-[#B8730F]' }
    case 'descargado':
      return { label: 'Análisis habilitado', className: 'border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A]' }
    default:
      return { label: 'Pendiente', className: 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760]' }
  }
}

export function ReglamentoCargaCiudadPanel() {
  const { municipiosActivos, zmActiva, seleccionMunicipioCatalog } = useSimulatorStore()
  const [rows, setRows] = useState<RowState[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const depsKey = useMemo(() => [...municipiosActivos].sort().join('|'), [municipiosActivos])

  const refreshRows = useCallback(async () => {
    if (!depsKey) {
      setRows([])
      return
    }
    setLoading(true)
    try {
      const list = await Promise.all(
        municipiosActivos.map(async (mid) => {
          try {
            const manifest = await getLegalSourceManifest(mid)
            return { mid, manifest, fetchError: null as string | null, uploading: false, uploadError: null, uploadMessage: null }
          }
          catch (e) {
            return {
              mid,
              manifest: null as MunicipalLegalSourceManifest | null,
              fetchError: e instanceof Error ? e.message : 'Error desconocido',
              uploading: false,
              uploadError: null,
              uploadMessage: null,
            }
          }
        }),
      )
      setRows(list)
    }
    finally {
      setLoading(false)
    }
  }, [depsKey, municipiosActivos])

  useEffect(() => {
    void refreshRows()
  }, [refreshRows])

  useEffect(() => {
    const onUploaded = () => { void refreshRows() }
    window.addEventListener('alquimia:legal-pdf-uploaded', onUploaded)
    return () => window.removeEventListener('alquimia:legal-pdf-uploaded', onUploaded)
  }, [refreshRows])

  const handleUpload = async (mid: string, file: File) => {
    setRows(prev => prev.map(r => (
      r.mid === mid
        ? { ...r, uploading: true, uploadError: null, uploadMessage: null }
        : r
    )))
    try {
      const res = await uploadLegalReglamentoPdf(mid, file)
      useSimulatorStore.getState().setMunicipioPdfHabilitado(res.analysis_ready)
      setRows(prev => prev.map(r => (
        r.mid === mid
          ? {
              ...r,
              manifest: res.manifest,
              uploading: false,
              uploadError: null,
              uploadMessage: res.message,
            }
          : r
      )))
      notifyLegalPdfUploaded(mid)
    }
    catch (e) {
      setRows(prev => prev.map(r => (
        r.mid === mid
          ? {
              ...r,
              uploading: false,
              uploadError: e instanceof Error ? e.message : 'No se pudo subir el PDF',
            }
          : r
      )))
    }
  }

  return (
    <div id="panel-reglamento-ciudad" className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6760]">
            Alimentar reglamento · PDF municipal
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">
            <span className="font-medium text-[#1C1B18]">Regla de producto:</span> primero sube el PDF del reglamento.
            Eso habilita el municipio y dispara el análisis jurídico. Sin PDF no se puede analizar.
            {' '}ZM <span className="font-mono text-[11px]">{zmActiva}</span>.
          </p>
        </div>
        {loading && (
          <span className="text-[10px] text-[#A8A49C]">Consultando manifiestos…</span>
        )}
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const chip = chipForRow(row)
          const etiqueta = seleccionMunicipioCatalog?.municipioSimulatorId === row.mid
            ? seleccionMunicipioCatalog.nombre
            : row.mid.toUpperCase()
          const listo = pdfListoParaAnalisis(row.manifest)
          const pdfHref = row.manifest?.download_url?.startsWith('/')
            ? row.manifest.download_url
            : null

          return (
            <div
              key={row.mid}
              className="rounded-[8px] border border-[#EDE9E2] bg-[#FAF9F7] px-2 py-2 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#1C1B18] truncate">{etiqueta}</p>
                  <p className="font-mono text-[10px] text-[#A8A49C]">{row.mid}</p>
                  {row.fetchError && (
                    <p className="mt-1 text-[10px] text-red-800">{row.fetchError}</p>
                  )}
                  {!row.fetchError && row.manifest?.next_action && !listo && (
                    <p className="mt-1 text-[10px] text-[#6B6760]">{row.manifest.next_action}</p>
                  )}
                  {row.uploadMessage && (
                    <p className="mt-1 text-[10px] text-[#3B6D11]">{row.uploadMessage}</p>
                  )}
                  {row.uploadError && (
                    <p className="mt-1 text-[10px] text-red-800">{row.uploadError}</p>
                  )}
                  {listo && pdfHref && (
                    <a
                      href={pdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[10px] text-[#1A5FA8] underline"
                    >
                      Ver PDF en línea
                    </a>
                  )}
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0', chip.className)}>
                  {chip.label}
                </span>
              </div>

              {!listo && !row.fetchError && (
                <div className="flex flex-wrap items-center gap-2 border-t border-[#EDE9E2] pt-2">
                  <input
                    ref={(el) => { fileInputs.current[row.mid] = el }}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleUpload(row.mid, file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    disabled={row.uploading}
                    onClick={() => fileInputs.current[row.mid]?.click()}
                    className={cn(
                      'rounded-[6px] border px-2.5 py-1 text-[11px] font-medium transition-colors',
                      row.uploading
                        ? 'border-[#E8E4DC] bg-[#FDFCFA] text-[#A8A49C] cursor-wait'
                        : 'border-[#1A5FA8]/30 bg-[#EBF3FB] text-[#1A5FA8] hover:bg-[#DCEAF8]',
                    )}
                  >
                    {row.uploading ? 'Subiendo…' : 'Subir PDF del reglamento'}
                  </button>
                  <span className="text-[10px] text-[#8A857C]">Solo PDF · máx. uso institucional</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
