'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { EXPORT_SIMULATION_FOOTER_LINE } from '@/lib/simulationDisclaimer'
import { fmt } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ExportStatusPanel } from '@/components/simulator/ExportStatusPanel'
import { useConsultingExport } from '@/hooks/useConsultingExport'

export function ExportarSection() {
  const resultados = useSimulatorStore(s => s.resultados)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const snapshotDatos = useSimulatorStore(s => s.snapshotDatos)
  const openAgoraPlanConfirm = useSimulatorStore(s => s.openAgoraPlanConfirm)

  const { loading: exportLoading, error: exportError, runExport } = useConsultingExport()

  const handleGenerar = () => {
    openAgoraPlanConfirm(() => {
      useSimulatorStore.getState().setGeneratingPlan(true, 0, 'Iniciando ALQUIMIA...')
    })
  }

  // Fase 2.5: advertencias de datos que afectan confianza del documento
  const advertencias = snapshotDatos?.advertencias ?? []
  const advertenciasBloqueantes = advertencias.filter(a => a.bloquea_agora)
  const advertenciasAlta       = advertencias.filter(a => !a.bloquea_agora && a.tipo === 'manual')
  const scoreDatos              = snapshotDatos?.score_datos ?? null

  return (
    <div id="sim-export-empresa-plan">
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Paquete de exportación para revisión</h2>
      <ScopeAnclaKicker className="mb-4" />

      <ExportStatusPanel />

      <div className="mb-4 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] px-4 py-3 text-[11px] leading-relaxed text-[#6B6760]">
        {EXPORT_SIMULATION_FOOTER_LINE}
      </div>

      {/* Advertencias de datos — Fase 2.5 */}
      {advertenciasBloqueantes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-4">
          <p className="text-[12px] font-semibold text-red-800 mb-1">
            ⚠ Datos insuficientes para documento oficial
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {advertenciasBloqueantes.map(a => (
              <li key={a.kpi_id} className="text-[11px] text-red-700">
                <strong>{a.kpi_label}:</strong> {a.advertencia}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-red-600 mt-2">
            Los documentos generados indicarán que estos datos requieren validación.
          </p>
        </div>
      )}

      {advertenciasAlta.length > 0 && advertenciasBloqueantes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-4 mb-4">
          <p className="text-[12px] font-semibold text-yellow-800 mb-1">
            ~ Algunos datos son estimados o manuales
          </p>
          <p className="text-[11px] text-yellow-700">
            Los documentos incluirán notas de incertidumbre en los KPIs afectados.
          </p>
        </div>
      )}

      {/* Score de datos si disponible */}
      {scoreDatos !== null && (
        <div className="flex items-center gap-3 bg-[#F5F3EF] rounded-[10px] px-4 py-2 mb-4">
          <span className="text-[11px] text-[#6B6760]">Calidad de datos del escenario:</span>
          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                scoreDatos >= 80 ? 'bg-green-500' :
                scoreDatos >= 60 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${scoreDatos}%` }}
            />
          </div>
          <span className={`text-[11px] font-semibold ${
            scoreDatos >= 80 ? 'text-green-700' :
            scoreDatos >= 60 ? 'text-yellow-700' : 'text-red-700'
          }`}>{scoreDatos}/100</span>
        </div>
      )}

      <div className="mb-3 rounded-[10px] border border-[#1A5FA8]/25 bg-[#EBF3FB] px-4 py-2.5 text-[10px] leading-relaxed text-[#4A4740]">
        Los PDF de esta sección son <strong>borradores estructurales</strong> (portada + índice + Times New Roman).
        Contenido sustantivo completo: ZIP de la plataforma y Hub profesional. Gráficas Exhibit: en XLSX o pendientes en PDF — ver revisión interna.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {([
          { label: 'PDF Ejecutivo', icon: '📄', desc: 'Doc 01 · Times New Roman · Cabildo', action: 'executive_pdf' as const, loadingKey: 'executive_pdf' },
          { label: 'Índice maestro', icon: '📑', desc: 'Doc 00 · Inventario completo 01–11', action: 'master_index' as const, loadingKey: 'master_index' },
          { label: 'Excel CFO', icon: '📊', desc: 'Doc 02 · Modelo vía Hub profesional', action: 'hub_professional' as const, loadingKey: null },
          { label: 'Compartir URL', icon: '🔗', desc: 'Enlace permanente a este escenario', action: 'share_url' as const, loadingKey: null },
        ]).map(item => (
          <button
            key={item.action}
            type="button"
            disabled={!resultados && item.action !== 'share_url'}
            onClick={() => void runExport(item.action, { moduleLabel: 'Paquete de exportación S20' })}
            className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 text-left hover:border-[#3B6D11]/30 hover:bg-[#EAF3DE] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-[24px] mb-2 block">{item.icon}</span>
            <p className="text-[13px] font-medium text-[#1C1B18]">{item.label}</p>
            <p className="text-[11px] text-[#6B6760] mt-1">{item.desc}</p>
            {exportLoading && item.loadingKey && (
              <p className="text-[10px] text-[#3B6D11] mt-2">Generando PDF…</p>
            )}
          </button>
        ))}
      </div>
      {exportError && (
        <p className="text-[11px] text-red-700 mb-4">{exportError}</p>
      )}

      {/* CTA principal */}
      <div className="bg-gradient-to-br from-[#1F3B06] to-[#2D5409] rounded-[20px] p-8 text-center text-white">
        <h3 className="font-serif text-[32px] mb-2">Genera tu plan de circularidad</h3>
        <p className="text-[#EAF3DE] text-[14px] mb-6 max-w-lg mx-auto">
          La plataforma producirá en ~10 minutos el paquete consultoría completo: carpetas{' '}
          <span className="font-mono text-[#F6FAD8]">analisis/</span> e{' '}
          <span className="font-mono text-[#F6FAD8]">implementacion/</span>, DOCX, XLSX, PDF
          y kits por actividad — ordenados por el flujo asistido de generación.
        </p>
        <button
          onClick={handleGenerar}
          className="bg-[#F6C84B] text-[#1C1B18] font-medium text-[16px] px-8 py-4 rounded-[10px] hover:bg-[#D4881E] hover:text-white transition-colors"
        >
          Generar paquete consultoría
        </button>
        {resultados && (
          <p className="text-[#A8A49C] text-[11px] mt-3">
            {zmActiva} · TIR {resultados.tir.toFixed(1)}% · {fmt.mxnK(resultados.ingresosBrutos)} total
            {' '}· {fmt.co2(resultados.co2eEvitadasAnualTon)} CO₂e/año
          </p>
        )}
        {/* Nota de trazabilidad de datos */}
        {snapshotDatos && (
          <p className="text-[#8BA06A] text-[10px] mt-1">
            Trazabilidad activa · Score {snapshotDatos.score_datos}/100
            {advertenciasBloqueantes.length > 0 && ' · ⚠ KPIs críticos sin validar'}
          </p>
        )}
      </div>
    </div>
  )
}
