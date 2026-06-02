'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, FileUp, MapPin } from 'lucide-react'
import { getEstadosMx, getLegalSourceManifest, getMunicipiosMx, registerMunicipioNacional, uploadLegalReglamentoPdf } from '@/lib/api'
import { isPlatformDeveloper } from '@/lib/authSession'
import { notifyLegalPdfUploaded, pdfListoParaAnalisis } from '@/lib/legalPdfGate'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { EstadoMxOption, MunicipioMxApi } from '@/types'

export function ClientOnboardingGate() {
  const {
    municipiosActivos,
    seleccionMunicipioCatalog,
    applyMunicipioCatalog,
    completeClientSetup,
    setMunicipioPdfHabilitado,
    refreshResearchFindings,
  } = useSimulatorStore()

  const [estados, setEstados] = useState<EstadoMxOption[]>([])
  const [estadoId, setEstadoId] = useState('')
  const [municipiosApi, setMunicipiosApi] = useState<MunicipioMxApi[]>([])
  const [municipioPick, setMunicipioPick] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState(false)
  const [checkingPdf, setCheckingPdf] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeMid = municipiosActivos[0] ?? null

  const refreshPdfStatus = useCallback(async (mid: string) => {
    setCheckingPdf(true)
    try {
      const manifest = await getLegalSourceManifest(mid)
      setPdfReady(pdfListoParaAnalisis(manifest))
    }
    catch {
      setPdfReady(false)
    }
    finally {
      setCheckingPdf(false)
    }
  }, [])

  useEffect(() => {
    getEstadosMx()
      .then(setEstados)
      .catch(err => setCatalogError(err instanceof Error ? err.message : 'Catálogo no disponible'))
      .finally(() => setLoadingCatalog(false))
  }, [])

  useEffect(() => {
    if (!estadoId) {
      setMunicipiosApi([])
      setMunicipioPick('')
      return
    }
    let active = true
    setLoadingMunicipios(true)
    getMunicipiosMx(estadoId)
      .then(rows => { if (active) setMunicipiosApi(rows) })
      .catch(err => {
        if (active) setCatalogError(err instanceof Error ? err.message : 'Municipios no disponibles')
      })
      .finally(() => { if (active) setLoadingMunicipios(false) })
    return () => { active = false }
  }, [estadoId])

  useEffect(() => {
    if (activeMid) void refreshPdfStatus(activeMid)
    else setPdfReady(false)
  }, [activeMid, refreshPdfStatus])

  const onSelectMunicipio = (cve: string) => {
    setMunicipioPick(cve)
    setUploadError(null)
    setUploadMessage(null)
    const row = municipiosApi.find(m => m.clave_inegi === cve)
    if (!row) return
    void (async () => {
      try {
        const registered = await registerMunicipioNacional(row)
        applyMunicipioCatalog(registered)
      }
      catch {
        applyMunicipioCatalog(row)
      }
    })()
  }

  const handleUpload = async (file: File) => {
    if (!activeMid) return
    setUploading(true)
    setUploadError(null)
    setUploadMessage(null)
    try {
      const res = await uploadLegalReglamentoPdf(activeMid, file)
      setPdfReady(res.analysis_ready)
      setMunicipioPdfHabilitado(res.analysis_ready)
      setUploadMessage(res.message)
      notifyLegalPdfUploaded(activeMid)
      void refreshResearchFindings({ refresh: true })
    }
    catch (e) {
      setUploadError(e instanceof Error ? e.message : 'No se pudo subir el PDF')
      setPdfReady(false)
    }
    finally {
      setUploading(false)
    }
  }

  const canContinue = Boolean(activeMid && seleccionMunicipioCatalog && pdfReady && !uploading)

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col" style={{ background: '#F4F2ED' }}>
      <div className="bg-[#1C2B15] px-6 py-10 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6A9A50] mb-3 font-medium">
          ALQUIMIA · Configuración inicial
        </p>
        <h1 className="font-serif text-[32px] sm:text-[40px] text-white leading-[1.05] mb-4 max-w-2xl">
          ¿Dónde quieres que analicemos tu reglamento?
        </h1>
        <p className="text-[14px] text-[#7AAB60] leading-[1.7] max-w-2xl">
          Antes de entrar al paquete consultivo, elige el estado y municipio de trabajo y sube el PDF del reglamento
          de aseo o limpia. El reglamento es el único bloqueo formal para emitir plan; los demás documentos elevan
          confianza, alcance y precisión sin detener toda la plataforma.
        </p>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-12 py-8 max-w-3xl">
        <div className="space-y-4">
          {/* Paso 1 — Territorio */}
          <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#3B6D11]" />
              <h2 className="text-[14px] font-semibold text-[#1C1B18]">1 · Estado y municipio</h2>
            </div>

            {catalogError && (
              <p className="mb-3 text-[12px] text-red-800 bg-red-50 border border-red-200 rounded-[6px] px-3 py-2">
                {catalogError}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-medium text-[#6B6760]">Estado</span>
                <select
                  value={estadoId}
                  disabled={loadingCatalog}
                  onChange={e => setEstadoId(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] focus:outline-none focus:border-[#3B6D11]"
                >
                  <option value="">{loadingCatalog ? 'Cargando…' : 'Selecciona entidad'}</option>
                  {estados.map(ed => (
                    <option key={ed.estado_id} value={ed.estado_id}>{ed.nombre}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-medium text-[#6B6760]">Municipio</span>
                <select
                  value={municipioPick}
                  disabled={!estadoId || loadingMunicipios}
                  onChange={e => onSelectMunicipio(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] focus:outline-none focus:border-[#3B6D11]"
                >
                  <option value="">
                    {!estadoId ? 'Primero elige estado' : loadingMunicipios ? 'Cargando…' : 'Selecciona municipio'}
                  </option>
                  {municipiosApi.map(m => (
                    <option key={m.clave_inegi} value={m.clave_inegi}>{m.nombre}</option>
                  ))}
                </select>
              </label>
            </div>

            {seleccionMunicipioCatalog && (
              <div className="mt-3 rounded-[8px] border border-[#C9DDB1] bg-[#EAF3DE]/60 px-3 py-2 text-[11px] text-[#23470A]">
                <span className="font-medium">{seleccionMunicipioCatalog.nombre}</span>
                {' · '}
                Clave INEGI municipal: <span className="font-mono">{seleccionMunicipioCatalog.claveInegi}</span>
                <span className="text-[#3B6D11]"> · Municipio y ZM se analizan por separado.</span>
              </div>
            )}
          </section>

          {/* Paso 2 — PDF */}
          <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-4 h-4 text-[#1A5FA8]" />
              <h2 className="text-[14px] font-semibold text-[#1C1B18]">2 · Reglamento en PDF</h2>
            </div>

            {!activeMid ? (
              <p className="text-[12px] text-[#6B6760]">Selecciona un municipio para habilitar la carga del PDF.</p>
            ) : (
              <>
                <p className="text-[12px] text-[#6B6760] mb-3">
                  Sube el reglamento de aseo, limpia o gestión integral de residuos del municipio{' '}
                  <span className="font-medium text-[#1C1B18]">{seleccionMunicipioCatalog?.nombre ?? activeMid}</span>.
                  Al confirmarse la carga se dispara el análisis jurídico base. Si falta otro documento, el sistema
                  seguirá calculando sólo hasta donde exista evidencia investigada, calculada o provista por el cliente.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) void handleUpload(file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploading || checkingPdf}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-[12px] font-medium',
                      uploading
                        ? 'border-[#E8E4DC] text-[#A8A49C] cursor-wait'
                        : 'border-[#1A5FA8]/30 bg-[#EBF3FB] text-[#1A5FA8] hover:bg-[#DCEAF8]',
                    )}
                  >
                    {uploading ? 'Subiendo PDF…' : pdfReady ? 'Reemplazar PDF' : 'Subir PDF del reglamento'}
                  </button>
                  {checkingPdf && <span className="text-[11px] text-[#A8A49C]">Verificando…</span>}
                  {pdfReady && !checkingPdf && (
                    <span className="text-[11px] font-medium text-[#3B6D11]">PDF listo · análisis habilitado</span>
                  )}
                </div>

                {uploadMessage && <p className="mt-2 text-[11px] text-[#3B6D11]">{uploadMessage}</p>}
                {uploadError && <p className="mt-2 text-[11px] text-red-800">{uploadError}</p>}
              </>
            )}
          </section>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => completeClientSetup()}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-[14px] font-medium transition-all',
              canContinue
                ? 'bg-[#3B6D11] text-white hover:opacity-90'
                : 'bg-[#E8E4DC] text-[#A8A49C] cursor-not-allowed',
            )}
          >
            Continuar al paquete consultivo
            <ArrowRight className="w-4 h-4" />
          </button>

          {isPlatformDeveloper() && (
            <p className="text-[10px] text-[#A8A49C] text-center">
              Vista equipo ALQUIMIA: puedes omitir este paso si ya tienes PDF integrado en catálogo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
