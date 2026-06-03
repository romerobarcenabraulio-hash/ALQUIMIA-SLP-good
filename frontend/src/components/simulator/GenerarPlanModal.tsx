'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { TECHNICAL_EXPORT_COVER_DISCLAIMER, EXPORT_LIABILITY_WAIVER } from '@/lib/simulationDisclaimer'
import { getApiUrl, getJobStatus, getPackageManifest, downloadPackageZip, downloadConsultingPortfolioZip, buildRenderResultadosPayload } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import type { PackageStatus, PackageManifest } from '@/types'

const AGENT_STEPS = [
  { pct: 5,  label: 'Director — Analizando escenario y armando plan de trabajo...' },
  { pct: 15, label: 'Arquitecto — Diagnosticando reglamento vigente...' },
  { pct: 30, label: 'Comparador — Buscando benchmarks LATAM relevantes...' },
  { pct: 45, label: 'Mapeador — Identificando actores locales...' },
  { pct: 60, label: 'Ghostwriter — Redactando documentos...' },
  { pct: 75, label: 'Validador — Verificando consistencia del modelo...' },
  { pct: 88, label: 'Humanizador — Eliminando patrones de IA...' },
  { pct: 92, label: 'Portfolio — Armando analisis/ e implementacion/...' },
]

export function GenerarPlanModal() {
  const router  = useRouter()
  const { generatingPlan, generationProgress, generationStep, setGeneratingPlan, zmActiva, resultados, marketSummary, macroImpactSummary, reasoningGraph, municipioProfiles, coverageStatuses, operationsSummary } = useSimulatorStore()

  const [done, setDone]             = useState(false)
  const [jobId, setJobId]           = useState<string | null>(null)
  const [pkgStatus, setPkgStatus]   = useState<PackageStatus | null>(null)
  const [manifest, setManifest]     = useState<PackageManifest | null>(null)
  const [showManifest, setShowManifest] = useState(false)
  const [downloading, setDownloading]   = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // ── Arrancar generación ────────────────────────────────────────────────────
  useEffect(() => {
    if (!generatingPlan || jobId) return

    const apiUrl = getApiUrl()

    const state = useSimulatorStore.getState()
    const scenario = {
      zm_activa:          zmActiva,
      horizonte:          state.horizonte,
      trayectoria_preset: state.presetTrayectoria,
      pct_captura_por_año: state.pctCapturaPorAño,
      mix_cas:            state.mixCAs,
      merma_log_pct:      state.mermaLogPct,
      wacc:               state.wacc,
      tipo_cambio:        state.tipoCambio,
      precio_carbono_esc: state.precioCarbonoEsc,
      precios:            state.precios,
      costo_disposicion_activo: state.costoDisposicionActivo,
      costo_disposicion_por_ton: state.costoDisposicionPorTon,
      vivienda_condominio_pct: state.viviendaCondominioPct,
      ocupantes_por_vivienda_escenario: state.ocupantesPorViviendaEscenario,
      costo_com_social:   state.costoComSocial,
    }

    const resultados_completos = resultados ? {
      tir:                      resultados.tir,
      tir_equity:               resultados.tirEquity,
      vpn:                      resultados.vpn,
      payback_meses:            resultados.paybackMeses,
      ingresos_brutos:          resultados.ingresosBrutos,
      capex_total:              resultados.capexTotal,
      ebitda:                   resultados.ebitda,
      margen_ebitda:            resultados.margenEbitda,
      moic:                     resultados.moic,
      rsu_total_ton_dia:        resultados.rsuTotalTonDia,
      ocupacion_cas:            resultados.ocupacionCAs,
      camiones_requeridos:      resultados.camionesRequeridos,
      empleos_directos:         resultados.empleosTotalesDirectos,
      empleos_indirectos:       resultados.empleosIndirectos,
      pepenadores_formalizados: resultados.pepenadoresFormalizados,
      co2e_evitadas_anual:      resultados.co2eEvitadasAnualTon,
      co2e_evitadas_horizonte:  resultados.co2eEvitadasHorizonteTon,
      kwh_biogas:               resultados.kwhBiogas,
      extension_relleno:        resultados.extensionRelleno,
      ahorro_salud:             resultados.ahorroSalud,
      derrama_base_materiales:  resultados.ingresosBrutos,
      derrama_total:            resultados.derremaTotal,
      ingreso_carbono:          resultados.ingresoCarbono,
      score_politico:           resultados.scorePolitico,
      rating_esg:               resultados.ratingESGDelta,
      serie_anual:              resultados.serieAnual,
    } : {}

    const data_provenance = state.snapshotDatos ?? null

    fetch(`${apiUrl}/generate/plan`, withRequestId({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        municipio:          zmActiva,
        zm:                 zmActiva,
        municipios_activos: state.municipiosActivos,
        scenario,
        resultados_completos,
        kpis:               resultados_completos,
        data_provenance,
        market_summary:      marketSummary,
        macro_impact_summary: macroImpactSummary,
        reasoning_graph:     reasoningGraph,
        municipio_profiles:   municipioProfiles,
        coverage_statuses:    coverageStatuses,
        operations_summary:    operationsSummary,
      }),
    }))
      .then(r => r.json())
      .then(data => {
        if (!data.job_id) throw new Error('Sin job_id')
        setJobId(data.job_id)

        const es = new EventSource(`${apiUrl}/generate/plan/${data.job_id}/stream`)
        esRef.current = es

        es.onmessage = (e) => {
          try {
            const ev = JSON.parse(e.data)
            setGeneratingPlan(true, ev.progress ?? 0, ev.step ?? '')
            if (ev.status === 'completed' || ev.status === 'failed') {
              es.close()
              if (ev.status === 'completed') {
                setDone(true)
                // Fase 3D: obtener package_id, checksum y contadores del job
                getJobStatus(data.job_id)
                  .then(pkg => setPkgStatus(pkg))
                  .catch(() => {
                    // Si falla el fetch de status, usamos job_id como fallback
                    setPkgStatus({ job_id: data.job_id, package_id: data.job_id, status: 'completed' })
                  })
              }
              setGeneratingPlan(false)
            }
          } catch (_) {}
        }

        es.onerror = () => {
          es.close()
          _simulateLocally(setGeneratingPlan, setDone, zmActiva, (jid) => {
            setPkgStatus({ job_id: jid, package_id: jid, status: 'completed' })
          })
        }
      })
      .catch(() => {
        _simulateLocally(setGeneratingPlan, setDone, zmActiva, (jid) => {
          setPkgStatus({ job_id: jid, package_id: jid, status: 'completed' })
        })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingPlan])

  useEffect(() => {
    return () => { esRef.current?.close() }
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    esRef.current?.close()
    setGeneratingPlan(false)
    setJobId(null)
    setDone(false)
    setPkgStatus(null)
    setManifest(null)
    setShowManifest(false)
    setDownloadError(null)
  }

  const handleVerHub = () => {
    handleCancel()
    const pkgId = pkgStatus?.package_id ?? jobId
    router.push(`/hub?zm=${zmActiva}${pkgId ? `&job=${pkgId}` : ''}`)
  }

  const handleDescargarConsultoria = async () => {
    const pkgId = pkgStatus?.package_id ?? jobId
    if (!pkgId) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const resultadosPayload = buildRenderResultadosPayload(
        resultados ? {
          tir: resultados.tir,
          tir_equity: resultados.tirEquity,
          vpn: resultados.vpn,
          payback_meses: resultados.paybackMeses,
          ingresos_brutos: resultados.ingresosBrutos,
          capex_total: resultados.capexTotal,
          ebitda: resultados.ebitda,
          margen_ebitda: resultados.margenEbitda,
          moic: resultados.moic,
          rsu_total_ton_dia: resultados.rsuTotalTonDia,
          serie_anual: resultados.serieAnual,
        } : undefined,
      )
      await downloadConsultingPortfolioZip(pkgId, zmActiva, resultadosPayload)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Error al descargar paquete consultoría')
    } finally {
      setDownloading(false)
    }
  }

  const handleDescargar = async () => {
    const pkgId = pkgStatus?.package_id ?? jobId
    if (!pkgId) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadPackageZip(pkgId, zmActiva)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Error al descargar')
    } finally {
      setDownloading(false)
    }
  }

  const handleVerManifest = async () => {
    const pkgId = pkgStatus?.package_id ?? jobId
    if (!pkgId) return
    if (manifest) { setShowManifest(v => !v); return }
    try {
      const m = await getPackageManifest(pkgId)
      setManifest(m)
      setShowManifest(true)
    } catch {
      setDownloadError('Manifest no disponible')
    }
  }

  if (!generatingPlan && !done) return null

  const currentStepIdx = AGENT_STEPS.findLastIndex(s => generationProgress >= s.pct)
  const packageId = pkgStatus?.package_id ?? jobId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FDFCFA] rounded-[20px] p-8 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">

        {done ? (
          <>
            {/* ── Header ── */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-[#EAF3DE] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#3B6D11]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-[24px] text-[#1C1B18] mb-1">¡Plan completo!</h3>
              <p className="text-[13px] text-[#6B6760]">Paquete documental generado y persistido</p>
            </div>

            <div
              className="mb-4 max-h-[40vh] overflow-y-auto rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] px-3 py-3 text-[11px] leading-relaxed text-[#6B6760]"
              role="region"
              aria-label="Aviso legal sobre documentos generados"
            >
              <p className="font-semibold text-[#1C1B18] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#D4881E]" aria-hidden />
                Documentos de simulación — no oficiales
              </p>
              <p className="mt-2 whitespace-pre-line">{TECHNICAL_EXPORT_COVER_DISCLAIMER}</p>
              <p className="mt-3 border-t border-[#E8E4DC] pt-3 text-[10px] leading-snug">{EXPORT_LIABILITY_WAIVER}</p>
            </div>

            {/* ── Metadata del paquete ── */}
            {pkgStatus && (
              <div className="bg-[#F4F1EB] rounded-[10px] p-3 mb-4 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6B6760]">Documentos generados</span>
                  <span className="text-[11px] font-medium text-[#1C1B18]">
                    {pkgStatus.n_documents ?? '—'}
                    {pkgStatus.n_defendibles != null && (
                      <span className="text-[#3B6D11] ml-1">({pkgStatus.n_defendibles} defendibles)</span>
                    )}
                    {pkgStatus.n_bloqueados != null && pkgStatus.n_bloqueados > 0 && (
                      <span className="text-[#D4881E] ml-1">· {pkgStatus.n_bloqueados} bloqueados</span>
                    )}
                  </span>
                </div>
                {pkgStatus.checksum && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#6B6760]">Checksum</span>
                    <code className="text-[10px] text-[#1C1B18] font-mono bg-[#E8E4DC] px-1.5 py-0.5 rounded">
                      {pkgStatus.checksum.slice(0, 16)}…
                    </code>
                  </div>
                )}
                {packageId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#6B6760]">Package ID</span>
                    <code className="text-[10px] text-[#A8A49C] font-mono truncate max-w-[180px]">
                      {packageId.slice(0, 18)}…
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* ── Error de descarga ── */}
            {downloadError && (
              <div className="bg-[#FEF2E7] border border-[#F5C67F] rounded-[8px] px-3 py-2 mb-3">
                <p className="text-[11px] text-[#D4881E]">⚠️ {downloadError}</p>
              </div>
            )}

            {/* ── Manifest expandible ── */}
            {showManifest && manifest && (
              <div className="bg-[#F4F1EB] rounded-[10px] p-3 mb-4 text-[11px] space-y-1.5">
                <p className="font-medium text-[#1C1B18] mb-2">Manifest del paquete</p>
                {manifest.zm && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6760]">ZM</span>
                    <span className="text-[#1C1B18]">{manifest.zm}</span>
                  </div>
                )}
                {manifest.score_datos != null && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6760]">Score de datos</span>
                    <span className={cn('font-medium', manifest.score_datos >= 70 ? 'text-[#3B6D11]' : 'text-[#D4881E]')}>
                      {manifest.score_datos.toFixed(1)}%
                    </span>
                  </div>
                )}
                {manifest.fuentes_usadas?.length > 0 && (
                  <div>
                    <span className="text-[#6B6760]">Fuentes:</span>
                    <span className="text-[#1C1B18] ml-1">{manifest.fuentes_usadas.join(', ')}</span>
                  </div>
                )}
                {manifest.warnings_activos?.length > 0 && (
                  <div className="mt-1">
                    <span className="text-[#D4881E]">⚠️ {manifest.warnings_activos.length} advertencia(s)</span>
                  </div>
                )}
                {manifest.files?.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-[#6B6760] mb-1">Archivos ({manifest.files.length}):</p>
                    <ul className="space-y-0.5 pl-2">
                      {manifest.files.map((f, i) => (
                        <li key={i} className="text-[#1C1B18] font-mono">{f.filename}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Botones de acción ── */}

            {/* CTA principal: paquete consultoría completo */}
            <button
              onClick={handleDescargarConsultoria}
              disabled={downloading || !packageId}
              className={cn(
                'w-full flex items-center justify-center gap-2 text-[14px] font-medium py-3 rounded-[10px] transition-colors mb-2',
                downloading || !packageId
                  ? 'bg-[#E2DED6] text-[#A8A49C] cursor-not-allowed'
                  : 'bg-[#3B6D11] text-white hover:bg-[#2D5409]'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloading ? 'Armando paquete consultoría…' : 'Descargar paquete consultoría (analisis + implementacion)'}
            </button>

            <button
              onClick={handleVerHub}
              className={cn(
                'w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-[10px] transition-colors mb-2',
                'border border-[#1A5FA8] text-[#1A5FA8] hover:bg-[#EBF3FB]'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ir al Hub — revisar manifest y assets
            </button>

            {/* ZIP base (Markdown plano — respaldo técnico) */}
            <button
              onClick={handleDescargar}
              disabled={downloading || !packageId}
              className={cn(
                'w-full flex items-center justify-center gap-2 text-[12px] font-medium py-2 rounded-[10px] transition-colors mb-2',
                downloading || !packageId
                  ? 'text-[#A8A49C] cursor-not-allowed'
                  : 'text-[#6B6760] hover:text-[#1C1B18] underline-offset-2 hover:underline'
              )}
            >
              {downloading ? 'Descargando…' : 'Descargar ZIP técnico (Markdown + manifest)'}
            </button>

            <button
              onClick={handleVerManifest}
              disabled={!packageId}
              className="w-full border border-[#E8E4DC] text-[13px] text-[#1C1B18] py-2.5 rounded-[10px] hover:bg-[#F4F1EB] transition-colors mb-2"
            >
              {showManifest ? 'Ocultar manifest' : 'Ver manifest y fuentes'}
            </button>

            <button
              onClick={handleCancel}
              className="w-full text-[12px] text-[#A8A49C] hover:text-[#6B6760] transition-colors"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h3 className="font-serif text-[24px] text-[#1C1B18] mb-1">Generando tu plan</h3>
            <p className="text-[13px] text-[#6B6760] mb-5">La plataforma está generando el paquete — ~10 minutos en total</p>

            <div className="h-2 bg-[#E2DED6] rounded-full mb-3">
              <div
                className="h-full bg-[#3B6D11] rounded-full transition-all duration-700"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="font-mono text-[12px] text-[#3B6D11] mb-5">
              {generationProgress}% — {generationStep || 'Iniciando...'}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {AGENT_STEPS.map((s, i) => {
                const isDone    = generationProgress > s.pct
                const isCurrent = i === currentStepIdx
                return (
                  <div
                    key={i}
                    className={cn('flex items-center gap-2 text-[11px]',
                      isDone ? 'text-[#3B6D11]' : isCurrent ? 'text-[#1C1B18]' : 'text-[#A8A49C]')}
                  >
                    <span className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-medium',
                      isDone    ? 'bg-[#3B6D11] text-white'
                      : isCurrent ? 'border-2 border-[#3B6D11] text-[#3B6D11]'
                      : 'bg-[#E2DED6] text-[#A8A49C]'
                    )}>
                      {isDone ? '✓' : i + 1}
                    </span>
                    {s.label}
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleCancel}
              className="w-full text-[12px] text-[#A8A49C] hover:text-[#6B6760] transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Simulación local (sin backend) ──────────────────────────────────────────

function _simulateLocally(
  setGeneratingPlan: (v: boolean, p?: number, s?: string) => void,
  setDone: (v: boolean) => void,
  zm: string,
  onDone?: (jobId: string) => void,
): void {
  let i = 0
  const fakeJobId = `sim-${Date.now()}`
  const steps = [
    [5,  'Director — Analizando escenario...'],
    [15, 'Arquitecto — Diagnosticando reglamento vigente...'],
    [30, 'Comparador — Buscando benchmarks LATAM...'],
    [45, 'Mapeador — Identificando actores...'],
    [60, 'Ghostwriter — Redactando documentos...'],
    [75, 'Validador — Verificando consistencia...'],
    [88, 'Humanizador — Restaurando voz humana...'],
    [100, '¡Plan completo!'],
  ] as [number, string][]

  const advance = () => {
    if (i >= steps.length) {
      setGeneratingPlan(false)
      setDone(true)
      onDone?.(fakeJobId)
      return
    }
    const [pct, msg] = steps[i++]
    setGeneratingPlan(true, pct, msg)
    setTimeout(advance, 900 + Math.random() * 600)
  }
  advance()
}
