'use client'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import {
  documentosHub,
  type HubDocumentoCapitulo,
  HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO,
  conteoDocumentosIncluiblesEnZip,
} from '@/data/hubDocumentosCapitulo'
import { descargarBlob, generarPaqueteZipHub } from '@/lib/hubPaqueteZip'
import {
  getJobStatus,
  getPackageAssets,
  getPackageManifest,
  downloadPackageZip,
  downloadConsultingPortfolioZip,
  renderProfessionalPackage,
  getRenderReport,
} from '@/lib/api'
import type { PackageStatus, PackageAsset, PackageManifest } from '@/types'
import { AdendoViewer } from '@/components/hub/AdendoViewer'
import { AGORA_EXPORT_COVER_DISCLAIMER, EXPORT_LIABILITY_WAIVER } from '@/lib/simulationDisclaimer'
import { SimulatorGatewayHint } from '@/components/simulator/SimulatorGatewayHint'

// ─── Tipos locales ────────────────────────────────────────────────────────────

type DocEstadoHub = 'disponible_web' | 'en_elaboracion'
type AudienciaHub = 'ciudadano' | 'funcionario' | 'empresa'

const ZM_TABS_HUB = ['SLP', 'QRO', 'MTY'] as const
const HUB_SECTIONS = ['Documentos', 'Adendos reglamentarios'] as const
type HubSection = (typeof HUB_SECTIONS)[number]

const AUDIENCIA_LABELS: Record<AudienciaHub, string> = {
  ciudadano:  'Ciudadano',
  funcionario: 'Funcionario municipal',
  empresa:    'Empresa / operador',
}

const HUB_ESTADO_CARD: Record<
  DocEstadoHub,
  { label: string; bg: string; text: string }
> = {
  disponible_web: { label: 'Disponible', bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]' },
  en_elaboracion: { label: 'En elaboración', bg: 'bg-[#FEF7E7]', text: 'text-[#8B5A00]' },
}

function formatoIcon(f: HubDocumentoCapitulo['formato']): string {
  switch (f) {
    case 'PDF':
      return '📕'
    case 'XLSX':
      return '📊'
    case 'DOCX':
      return '📝'
    case 'HTML':
      return '🌐'
    default:
      return '📄'
  }
}

function mimeIcon(mime: string, filename: string): string {
  if (filename.endsWith('.json'))  return '📋'
  if (filename.endsWith('.zip'))   return '🗜️'
  if (filename.endsWith('.docx'))  return '📝'
  if (filename.endsWith('.xlsx'))  return '📊'
  if (filename.endsWith('.pdf'))   return '📕'
  if (filename.toLowerCase().includes('juridic') || filename.toLowerCase().includes('reforma')) return '⚖️'
  if (filename.toLowerCase().includes('financiero') || filename.toLowerCase().includes('cfo')) return '📊'
  if (filename.toLowerCase().includes('operativo') || filename.toLowerCase().includes('manual')) return '⚙️'
  if (filename.toLowerCase().includes('ciudadana') || filename.toLowerCase().includes('guia')) return '📢'
  if (filename.toLowerCase().includes('trazabilidad') || filename.toLowerCase().includes('fuentes')) return '🔍'
  return '📄'
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

const JOB_ASSET_CHIP = { bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]' } as const

// ─── Componente principal (necesita Suspense para useSearchParams) ────────────

function HubContent() {
  const searchParams   = useSearchParams()
  const zmParam        = (searchParams.get('zm') ?? 'SLP').toUpperCase()
  const jobParam       = searchParams.get('job')

  const [zmActiva, setZmActiva]         = useState(zmParam)
  const [filtroTipo, setFiltroTipo]     = useState('Todos')
  const [zipLoading, setZipLoading]         = useState(false)
  const [zipPaqueteError, setZipPaqueteError] = useState<string | null>(null)
  const [seccionActiva, setSeccionActiva] = useState<HubSection>('Documentos')
  const [audiencia, setAudiencia] = useState<AudienciaHub>('funcionario')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZmActiva(zmParam)
  }, [zmParam])

  // Estado del paquete desde API
  const [pkgStatus, setPkgStatus]       = useState<PackageStatus | null>(null)
  const [assets, setAssets]             = useState<PackageAsset[] | null>(null)
  const [manifest, setManifest]         = useState<PackageManifest | null>(null)
  const [showManifest, setShowManifest] = useState(false)
  const [loadingPkg, setLoadingPkg]     = useState(false)
  const [pkgError, setPkgError]         = useState<string | null>(null)
  const [downloading, setDownloading]         = useState(false)
  const [downloadError, setDownloadError]     = useState<string | null>(null)
  const [rendering, setRendering]             = useState(false)
  const [renderResult, setRenderResult]       = useState<{
    qa_status: string; n_rendered: number; has_docx: boolean; has_xlsx: boolean; has_pdf: boolean
  } | null>(null)
  const [hasProfessional, setHasProfessional] = useState(false)

  // ── Cargar paquete si hay job param ──────────────────────────────────────
  useEffect(() => {
    if (!jobParam) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPkg(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPkgError(null)

    const pkgId = jobParam

    // Paralelo: status + assets + manifest
    Promise.allSettled([
      getJobStatus(pkgId),
      getPackageAssets(pkgId),
      getPackageManifest(pkgId),
      getRenderReport(pkgId),
    ]).then(([statusRes, assetsRes, manifestRes, renderRes]) => {
      if (statusRes.status === 'fulfilled')   setPkgStatus(statusRes.value)
      else setPkgError('No se pudo obtener el estado del paquete.')

      if (assetsRes.status === 'fulfilled') {
        const data = assetsRes.value as {
          assets: PackageAsset[]; has_professional?: boolean
        }
        setAssets(data.assets ?? [])
        setHasProfessional(data.has_professional ?? false)
      }
      if (manifestRes.status === 'fulfilled') setManifest(manifestRes.value)
      if (renderRes.status === 'fulfilled' && renderRes.value) {
        const rr = renderRes.value as {
          qa_status: string; n_rendered: number; has_docx: boolean;
          has_xlsx: boolean; has_pdf: boolean
        } | null
        if (rr) { setRenderResult(rr); setHasProfessional(true) }
      }
    }).finally(() => setLoadingPkg(false))
  }, [jobParam])

  const handleDescargarConsultoria = async () => {
    const pkgId = pkgStatus?.package_id ?? jobParam
    if (!pkgId) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadConsultingPortfolioZip(pkgId, zmActiva)
      setHasProfessional(true)
      const assetsData = await getPackageAssets(pkgId) as {
        assets: PackageAsset[]; has_professional?: boolean
      }
      setAssets(assetsData.assets ?? [])
      const rr = await getRenderReport(pkgId)
      if (rr) {
        setRenderResult({
          qa_status: String(rr.qa_status ?? 'ok'),
          n_rendered: Array.isArray(rr.rendered_assets) ? rr.rendered_assets.length : 0,
          has_docx: Boolean((rr.rendered_assets as Array<{ format?: string }> | undefined)?.some(a => a.format === 'docx')),
          has_xlsx: Boolean((rr.rendered_assets as Array<{ format?: string }> | undefined)?.some(a => a.format === 'xlsx')),
          has_pdf: Boolean((rr.rendered_assets as Array<{ format?: string }> | undefined)?.some(a => a.format === 'pdf')),
        })
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Error al descargar paquete consultoría')
    } finally {
      setDownloading(false)
    }
  }

  const handleDescargar = async (professional = false) => {
    const pkgId = pkgStatus?.package_id ?? jobParam
    if (!pkgId) return
    setDownloading(true)
    setDownloadError(null)
    try {
      if (professional) {
        await downloadConsultingPortfolioZip(pkgId, zmActiva)
      } else {
        await downloadPackageZip(pkgId, zmActiva)
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Error al descargar')
    } finally {
      setDownloading(false)
    }
  }

  const handleRender = async () => {
    const pkgId = pkgStatus?.package_id ?? jobParam
    if (!pkgId) return
    setRendering(true)
    setDownloadError(null)
    try {
      const result = await renderProfessionalPackage(pkgId)
      setRenderResult(result)
      setHasProfessional(true)
      // Refrescar assets
      const assetsData = await getPackageAssets(pkgId) as {
        assets: PackageAsset[]; has_professional?: boolean
      }
      setAssets(assetsData.assets ?? [])
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Error al generar exportación')
    } finally {
      setRendering(false)
    }
  }

  const usePackageAssets = !!jobParam && assets !== null
  const catalogoCapitulo = documentosHub(zmActiva)
  const nDocsZipListos = useMemo(
    () => conteoDocumentosIncluiblesEnZip(catalogoCapitulo),
    [catalogoCapitulo],
  )
  const cumpleQ023Zip = nDocsZipListos >= HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO
  const tiposCatalogo    = ['Todos', ...Array.from(new Set(catalogoCapitulo.map(d => d.tipo))).sort()]
  const docsCapituloFiltrados =
    filtroTipo === 'Todos'
      ? catalogoCapitulo
      : catalogoCapitulo.filter(d => d.tipo === filtroTipo)

  const handleDescargarPaqueteCapitulo = async () => {
    setZipLoading(true)
    setZipPaqueteError(null)
    try {
      const blob = await generarPaqueteZipHub(zmActiva)
      descargarBlob(blob, `alquimia_paquete_${zmActiva}.zip`)
    } catch (e) {
      setZipPaqueteError(e instanceof Error ? e.message : 'No se pudo generar el paquete ZIP')
    } finally {
      setZipLoading(false)
    }
  }

  // Filtrar assets (excluir ZIP del listado principal)
  const assetsDocumentos = (assets ?? []).filter(a => !a.filename.endsWith('.zip'))
  const assetZip         = (assets ?? []).find(a => a.filename.endsWith('.zip'))

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Cabecera */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">
            /hub — ÁGORA · Hub de documentos
          </p>
          <h1 className="font-serif text-[32px] text-[#1C1B18]">Documentos del programa</h1>
          <p className="text-[13px] text-[#6B6760] mt-2">
            {jobParam
              ? 'Paquete documental generado por ÁGORA — descarga, manifest y trazabilidad.'
              : 'Repositorio de documentos generados por ÁGORA.'}
          </p>
          {!jobParam && (
            <div className="mt-3 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3">
              <SimulatorGatewayHint variant="compact" />
            </div>
          )}
          {!jobParam && (
            <div className="mt-3 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] px-4 py-3 text-[12px] text-[#6B6760]">
              <strong className="text-[#1C1B18]">Simulación · no confundir con oficialidad.</strong>{' '}
              Inventario programa documental y control de acceso (blueprint&nbsp;17.1 + 26.B) declarado en{' '}
              <span className="font-mono text-[11px]">hubDocumentosCapitulo.ts</span>. Los estados{' '}
              <em>Disponible</em> / <em>En elaboración</em> describen entrega técnica en repo público, no publicación
              en periódico oficial.
            </div>
          )}
        </div>

        {/* ── Selector de sección + audiencia ── */}
        {!jobParam && (
          <div className="mb-5 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex gap-1.5">
              {HUB_SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSeccionActiva(s)}
                  className={cn(
                    'px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-colors',
                    seccionActiva === s
                      ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                      : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Selector de audiencia para demostración */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#A8A49C]">Vista:</span>
              <select
                value={audiencia}
                onChange={e => setAudiencia(e.target.value as AudienciaHub)}
                className="text-[11px] border border-[#E8E4DC] rounded-[6px] px-2 py-1 bg-white text-[#6B6760] focus:outline-none"
              >
                {(Object.keys(AUDIENCIA_LABELS) as AudienciaHub[]).map(k => (
                  <option key={k} value={k}>{AUDIENCIA_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Sección: Adendos reglamentarios ── */}
        {!jobParam && seccionActiva === 'Adendos reglamentarios' && (
          audiencia === 'ciudadano' ? (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-8 text-center">
              <p className="text-[13px] text-[#6B6760]">
                Esta sección está disponible únicamente para funcionarios municipales y operadores autorizados.
              </p>
            </div>
          ) : (
            <AdendoViewer ciudadId={zmActiva.toLowerCase()} adendoId={1} />
          )
        )}

        {/* ── Panel de paquete (cuando hay job_id) ── */}
        {jobParam && (
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[16px] p-5 mb-6">
            <div
              className="mb-4 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] px-3 py-3 text-[11px] leading-relaxed text-[#6B6760]"
              role="region"
              aria-label="Aviso legal — paquete ÁGORA"
            >
              <p className="font-semibold text-[#1C1B18] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#D4881E]" aria-hidden />
                Portada legal (toda exportación)
              </p>
              <p className="mt-2 whitespace-pre-line">{AGORA_EXPORT_COVER_DISCLAIMER}</p>
              <p className="mt-3 border-t border-[#E8E4DC] pt-3 text-[10px] leading-snug">{EXPORT_LIABILITY_WAIVER}</p>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#A8A49C] mb-1">Paquete documental</p>
                <p className="font-mono text-[12px] text-[#6B6760] truncate max-w-[280px]">
                  ID: {jobParam}
                </p>
              </div>

              {loadingPkg && (
                <span className="text-[12px] text-[#A8A49C] animate-pulse">Cargando paquete…</span>
              )}

              {pkgError && !loadingPkg && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#C0392B]" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Error:</span>
                  {pkgError}
                </span>
              )}

              {pkgStatus && !loadingPkg && (
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    'text-[11px] font-medium px-2.5 py-1 rounded-full',
                    pkgStatus.status === 'completed'
                      ? 'bg-[#EAF3DE] text-[#3B6D11]'
                      : pkgStatus.status === 'failed'
                        ? 'bg-[#FDE8E8] text-[#C0392B]'
                        : 'bg-[#FEF7E7] text-[#D4881E]'
                  )}>
                    {pkgStatus.status === 'completed' ? 'Documentos listos para descarga revisada' :
                     pkgStatus.status === 'failed'    ? 'Error en generación' :
                     'Generando…'}
                  </span>
                  {pkgStatus.checksum && (
                    <code className="text-[10px] text-[#A8A49C] font-mono">
                      SHA-256: {pkgStatus.checksum.slice(0, 16)}…
                    </code>
                  )}
                </div>
              )}
            </div>

            {/* Estadísticas del paquete */}
            {pkgStatus && (pkgStatus.n_documents != null) && (
              <div className="mt-3 pt-3 border-t border-[#E8E4DC] flex gap-6 flex-wrap">
                <div>
                  <p className="text-[10px] text-[#A8A49C]">Documentos</p>
                  <p className="text-[20px] font-serif text-[#1C1B18]">{pkgStatus.n_documents}</p>
                </div>
                {pkgStatus.n_defendibles != null && (
                  <div>
                    <p className="text-[10px] text-[#A8A49C]">Defendibles</p>
                    <p className="text-[20px] font-serif text-[#3B6D11]">{pkgStatus.n_defendibles}</p>
                  </div>
                )}
                {pkgStatus.n_bloqueados != null && pkgStatus.n_bloqueados > 0 && (
                  <div>
                    <p className="text-[10px] text-[#A8A49C]">Bloqueados</p>
                    <p className="text-[20px] font-serif text-[#C0392B]">{pkgStatus.n_bloqueados}</p>
                  </div>
                )}
                {manifest?.score_datos != null && (
                  <div>
                    <p className="text-[10px] text-[#A8A49C]">Score datos</p>
                    <p className={cn('text-[20px] font-serif',
                      manifest.score_datos >= 70 ? 'text-[#3B6D11]' : 'text-[#D4881E]'
                    )}>
                      {manifest.score_datos.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resultado de render (Fase 4) */}
            {renderResult && (
              <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-1 rounded-full',
                    renderResult.qa_status === 'ok'
                      ? 'bg-[#EAF3DE] text-[#3B6D11]'
                      : renderResult.qa_status === 'partial'
                        ? 'bg-[#FEF7E7] text-[#D4881E]'
                        : 'bg-[#FDE8E8] text-[#C0392B]'
                  )}>
                    Exportación {renderResult.qa_status === 'ok' ? 'completa' :
                      renderResult.qa_status === 'partial' ? 'parcial' : 'con errores'}
                  </span>
                  {renderResult.has_docx && <span className="text-[10px] bg-[#EBF3FB] text-[#1A5FA8] px-2 py-0.5 rounded">DOCX ✓</span>}
                  {renderResult.has_xlsx && <span className="text-[10px] bg-[#EBF3FB] text-[#1A5FA8] px-2 py-0.5 rounded">XLSX ✓</span>}
                  {renderResult.has_pdf  && <span className="text-[10px] bg-[#EBF3FB] text-[#1A5FA8] px-2 py-0.5 rounded">PDF ✓</span>}
                  {!renderResult.has_pdf && <span className="text-[10px] bg-[#F0EDE5] text-[#A8A49C] px-2 py-0.5 rounded">PDF bloqueado</span>}
                  <span className="text-[10px] text-[#A8A49C]">{renderResult.n_rendered} assets</span>
                </div>
              </div>
            )}

            {/* Botones del paquete */}
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Paquete consultoría (analisis + implementacion) */}
              <button
                onClick={() => void handleDescargarConsultoria()}
                disabled={downloading || !pkgStatus || pkgStatus.status !== 'completed'}
                className={cn(
                  'flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-[8px] transition-colors',
                  downloading || !pkgStatus || pkgStatus.status !== 'completed'
                    ? 'bg-[#E2DED6] text-[#A8A49C] cursor-not-allowed'
                    : 'bg-[#3B6D11] text-white hover:bg-[#2D5409]'
                )}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloading ? 'Armando paquete…' : 'Descargar paquete consultoría'}
              </button>

              {/* ZIP técnico Markdown */}
              <button
                onClick={() => handleDescargar(false)}
                disabled={downloading || !pkgStatus || pkgStatus.status !== 'completed'}
                className={cn(
                  'flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-[8px] transition-colors border',
                  downloading || !pkgStatus || pkgStatus.status !== 'completed'
                    ? 'border-[#E8E4DC] text-[#A8A49C] cursor-not-allowed'
                    : 'border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F1EB]'
                )}
              >
                {downloading ? 'Descargando…' : `ZIP técnico Markdown${assetZip ? ` (${fmtBytes(assetZip.size_bytes)})` : ''}`}
              </button>

              {!hasProfessional && (
                <button
                  onClick={handleRender}
                  disabled={rendering || !pkgStatus || pkgStatus.status !== 'completed'}
                  className={cn(
                    'flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-[8px] border transition-colors',
                    rendering || !pkgStatus || pkgStatus.status !== 'completed'
                      ? 'border-[#E8E4DC] text-[#A8A49C] cursor-not-allowed'
                      : 'border-[#1A5FA8] text-[#1A5FA8] hover:bg-[#EBF3FB]'
                  )}
                >
                  {rendering ? '⏳ Regenerando exportación…' : '📝 Regenerar exportación profesional'}
                </button>
              )}

              <button
                onClick={() => setShowManifest(v => !v)}
                disabled={!manifest}
                className={cn(
                  'text-[12px] px-4 py-2 rounded-[8px] border transition-colors',
                  !manifest
                    ? 'border-[#E8E4DC] text-[#A8A49C] cursor-not-allowed'
                    : 'border-[#E8E4DC] text-[#1C1B18] hover:bg-[#F4F1EB]'
                )}
              >
                {showManifest ? 'Ocultar manifest' : 'Ver manifest'}
              </button>
            </div>

            {downloadError && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[#C0392B]" role="alert">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{downloadError}</span>
              </p>
            )}

            {/* Manifest expandido */}
            {showManifest && manifest && (
              <div className="mt-4 pt-4 border-t border-[#E8E4DC] space-y-2 text-[11px]">
                <p className="font-medium text-[#1C1B18]">Manifest del paquete</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex justify-between col-span-2 sm:col-span-1">
                    <span className="text-[#6B6760]">ZM</span>
                    <span className="text-[#1C1B18]">{manifest.zm}</span>
                  </div>
                  <div className="flex justify-between col-span-2 sm:col-span-1">
                    <span className="text-[#6B6760]">Versión</span>
                    <span className="text-[#1C1B18]">{manifest.version ?? '—'}</span>
                  </div>
                </div>
                {manifest.fuentes_usadas?.length > 0 && (
                  <div>
                    <span className="text-[#6B6760] mr-1">Fuentes:</span>
                    <span className="text-[#1C1B18]">{manifest.fuentes_usadas.join(', ')}</span>
                  </div>
                )}
                {manifest.kpis_incluidos?.length > 0 && (
                  <div>
                    <span className="text-[#6B6760] mr-1">KPIs:</span>
                    <span className="text-[#1C1B18]">{manifest.kpis_incluidos.slice(0, 5).join(', ')}
                      {manifest.kpis_incluidos.length > 5 && ` +${manifest.kpis_incluidos.length - 5} más`}
                    </span>
                  </div>
                )}
                {manifest.warnings_activos?.length > 0 && (
                  <div className="flex items-start gap-1.5 bg-[#FEF7E7] rounded-[6px] px-2 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#D4881E] mt-0.5" aria-hidden="true" />
                    <span className="text-[#D4881E] text-[11px] leading-snug">
                      {manifest.warnings_activos.length} advertencia(s):{' '}
                      {manifest.warnings_activos.slice(0, 2).join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Selector ZM (cuando no hay paquete activo y sección Documentos) ── */}
        {!jobParam && seccionActiva === 'Documentos' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
              <div className="flex gap-2 flex-wrap">
              {ZM_TABS_HUB.map(m => (
                <button
                  key={m}
                  onClick={() => { setZmActiva(m); setFiltroTipo('Todos') }}
                  className={cn(
                    'px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-colors',
                    zmActiva === m
                      ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                      : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
                  )}
                >
                  {m}
                </button>
              ))}
              </div>
              <button
                type="button"
                onClick={() => void handleDescargarPaqueteCapitulo()}
                disabled={zipLoading}
                title="Solo archivos estáticos del repositorio — no es el paquete generado por ÁGORA"
                className={cn(
                  'flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-[8px] border transition-colors shrink-0',
                  zipLoading
                    ? 'border-[#E8E4DC] text-[#A8A49C] cursor-not-allowed'
                    : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:bg-[#F4F1EB]',
                )}
              >
                {zipLoading ? 'Generando ZIP…' : '📁 ZIP demo capítulo (estático)'}
              </button>
            </div>
            {zipPaqueteError && (
              <p className="mb-4 text-[11px] text-[#C0392B]" role="alert">{zipPaqueteError}</p>
            )}

            <div
              className={cn(
                'mb-4 rounded-[10px] border px-4 py-3 text-[11px] leading-relaxed',
                cumpleQ023Zip
                  ? 'border-[#B8D4A8] bg-[#F4FAF0] text-[#3B5F23]'
                  : 'border-[#E8E0D0] bg-[#FAFAF8] text-[#6B6760]',
              )}
              role="status"
              data-testid="hub-q023-zip-status"
            >
              <strong className="text-[#1C1B18]">Importante — dos tipos de ZIP distintos.</strong>{' '}
              El botón gris <em>ZIP demo capítulo</em> empaqueta archivos estáticos de{' '}
              <span className="font-mono">public/</span> (borradores de referencia).{' '}
              <strong>No sustituye</strong> el paquete consultoría de ÁGORA con carpetas{' '}
              <span className="font-mono">analisis/</span> e{' '}
              <span className="font-mono">implementacion/</span>: genere el plan en el simulador y descargue desde ahí o desde el Hub con un{' '}
              <span className="font-mono">job=</span> activo.
              {' '}Incluibles en demo estático: <strong>{nDocsZipListos}</strong> (objetivo Q-023 ≥{HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO}).
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {tiposCatalogo.map(t => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-[11px] border transition-colors',
                    filtroTipo === t
                      ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                      : 'bg-transparent text-[#6B6760] border-[#E8E4DC]'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Lista de documentos (sección Documentos o vista de paquete) ── */}
        {(jobParam != null || seccionActiva === 'Documentos') && <div className="flex flex-col gap-2">

          {/* Caso A: assets reales del paquete */}
          {usePackageAssets && assetsDocumentos.length > 0 && assetsDocumentos.map((asset, i) => (
            <div
              key={asset.asset_id ?? i}
              className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] px-5 py-4 flex items-center gap-4"
            >
              <div className="text-[20px] shrink-0">{mimeIcon(asset.mime_type, asset.filename)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1C1B18] truncate">{asset.filename}</p>
                <p className="text-[11px] text-[#A8A49C]">
                  {fmtBytes(asset.size_bytes)} · SHA-256: {asset.checksum.slice(0, 12)}…
                </p>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-2 py-1 rounded-full shrink-0',
                JOB_ASSET_CHIP.bg, JOB_ASSET_CHIP.text
              )}>
                Generado
              </span>
            </div>
          ))}

          {/* Estado: cargando */}
          {usePackageAssets && loadingPkg && (
            <div className="text-center py-8 text-[#A8A49C] text-[13px] animate-pulse">
              Cargando documentos del paquete…
            </div>
          )}

          {/* Estado: sin assets pero paquete cargado */}
          {usePackageAssets && !loadingPkg && assetsDocumentos.length === 0 && !pkgError && (
            <div className="text-center py-8">
              <p className="text-[#A8A49C] text-[13px]">Paquete sin assets disponibles.</p>
              <p className="text-[11px] text-[#A8A49C] mt-1">
                El paquete puede haberse generado sin contenido persistido.
              </p>
            </div>
          )}

          {/* Estado: error de paquete */}
          {usePackageAssets && pkgError && !loadingPkg && (
            <div className="bg-[#FDE8E8] border border-[#F5C6C6] rounded-[12px] p-4 text-center">
              <p className="text-[#C0392B] text-[13px] font-medium">Backend no respondió</p>
              <p className="text-[11px] text-[#C0392B] mt-1">{pkgError}</p>
              <p className="text-[11px] text-[#A8A49C] mt-2">
                Verifica que el backend esté corriendo y el job_id sea válido.
              </p>
            </div>
          )}

          {/* Caso B: catálogo capítulo (sin job) */}
          {!usePackageAssets && docsCapituloFiltrados.map(doc => {
            const entregaEstado: DocEstadoHub =
              doc.estadoEntrega === 'disponible' ? 'disponible_web' : 'en_elaboracion'
            const est = HUB_ESTADO_CARD[entregaEstado]
            const puedeAbrir = doc.estadoEntrega === 'disponible' && doc.publicRelPath
            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-start gap-4 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-4"
              >
                <div className="text-[20px] shrink-0">{formatoIcon(doc.formato)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1C1B18]">{doc.nombre}</p>
                  <p className="text-[11px] text-[#A8A49C]">
                    {doc.tipo} · {doc.formato} · ref. ver. {doc.versionFecha}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[#6B6760]">{doc.descripcionLinea}</p>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full shrink-0 self-center', est.bg, est.text)}>
                  {est.label}
                </span>
                <div className="flex shrink-0 flex-col items-end gap-1 self-center">
                  {puedeAbrir ? (
                    <a
                      href={`/${doc.publicRelPath}`}
                      className="text-[11px] font-medium text-[#3B6D11] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir archivo
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#A8A49C]">Archivo en repo pendiente</span>
                  )}
                </div>
              </div>
            )
          })}

          {!usePackageAssets && docsCapituloFiltrados.length === 0 && (
            <div className="text-center py-12 text-[#A8A49C]">
              <p>No hay documentos en esta categoría aún.</p>
              <p className="text-[12px] mt-1">Genera el plan de circularidad para producirlos.</p>
            </div>
          )}
        </div>}

        {/* Indicador de Drive (opcional, no como única fuente) */}
        {usePackageAssets && pkgStatus?.status === 'completed' && (
          <p className="text-center text-[11px] text-[#A8A49C] mt-6">
            La descarga directa no depende de Drive. Si Drive está configurado, los documentos también
            estarán disponibles allí como canal adicional.
          </p>
        )}
      </div>
    </AppShell>
  )
}

// ─── Page export con Suspense (requerido por useSearchParams en App Router) ───

export default function HubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2ED' }}>
        <p className="text-[#A8A49C] text-[13px]">Cargando Hub…</p>
      </div>
    }>
      <HubContent />
    </Suspense>
  )
}
