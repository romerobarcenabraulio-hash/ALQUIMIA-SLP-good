'use client'
import { useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function ExportarSection() {
  const { resultados, zmActiva, snapshotDatos, setGeneratingPlan } = useSimulatorStore()
  const [showModal, setShowModal] = useState(false)

  const handleGenerar = () => {
    setShowModal(true)
    useSimulatorStore.getState().setGeneratingPlan(true, 0, 'Iniciando ALQUIMIA...')
  }

  // Fase 2.5: advertencias de datos que afectan confianza del documento
  const advertencias = snapshotDatos?.advertencias ?? []
  const advertenciasBloqueantes = advertencias.filter(a => a.bloquea_agora)
  const advertenciasAlta       = advertencias.filter(a => !a.bloquea_agora && a.tipo === 'manual')
  const scoreDatos              = snapshotDatos?.score_datos ?? null

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S20 — Exportar</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">Paquete de exportación para revisión</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'PDF Ejecutivo', icon: '📄', desc: 'Reporte 1 página para alcalde y cabildo', action: 'pdf' },
          { label: 'Excel CFO',     icon: '📊', desc: 'Modelo financiero completo con 3 escenarios', action: 'excel' },
          { label: 'Compartir URL', icon: '🔗', desc: 'Enlace permanente a este escenario', action: 'share' },
        ].map(item => (
          <button
            key={item.action}
            className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 text-left hover:border-[#3B6D11]/30 hover:bg-[#EAF3DE] transition-all group"
          >
            <span className="text-[24px] mb-2 block">{item.icon}</span>
            <p className="text-[13px] font-medium text-[#1C1B18]">{item.label}</p>
            <p className="text-[11px] text-[#6B6760] mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* CTA principal */}
      <div className="bg-gradient-to-br from-[#1F3B06] to-[#2D5409] rounded-[20px] p-8 text-center text-white">
        <h3 className="font-serif text-[32px] mb-2">Genera tu plan de circularidad</h3>
        <p className="text-[#EAF3DE] text-[14px] mb-6 max-w-lg mx-auto">
          ÁGORA producirá en ~10 minutos todos los documentos: marco legal,
          modelo financiero, Gantt de implementación, presentación para Cabildo
          y carta ciudadana. Listos en tu carpeta de Drive.
        </p>
        <button
          onClick={handleGenerar}
          className="bg-[#F6C84B] text-[#1C1B18] font-medium text-[16px] px-8 py-4 rounded-[10px] hover:bg-[#D4881E] hover:text-white transition-colors"
        >
          [ Genera mi plan de circularidad ]
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
