'use client'

import { useState } from 'react'
import { createPickupEvent, getOperationsSummary } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { maximumFractionDigits: 2 })
}

export default function OperacionCampo() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const summary = useSimulatorStore(s => s.operationsSummary)
  const setOperationsSummary = useSimulatorStore(s => s.setOperationsSummary)
  const municipio = municipiosActivos[0] ?? 'slp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function registerPickup() {
    setLoading(true)
    setError(null)
    try {
      await createPickupEvent({
        event_id: `ui-pickup-${Date.now()}`,
        shift_id: 'ui-shift',
        municipio_id: municipio,
        ubicacion: 'captura demo controlada',
        generador_id: 'generador-demo',
        material: 'organico',
        peso_estimado_kg: 750,
        pureza_pct: 78,
        contaminacion_pct: 22,
        evidencia_ids: [],
        timestamp: new Date().toISOString(),
        source: 'ui_operacion',
      })
      const next = await getOperationsSummary(municipio)
      setOperationsSummary(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error registrando operación')
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setOperationsSummary(await getOperationsSummary(municipio))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando resumen operativo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">
            S18.95 — Operación de campo
          </p>
          <h3 className="text-base font-semibold text-gray-800">Bitácora operativa — {municipio}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Recolección, pureza, contaminación y advertencias educativas. Propuestas sancionatorias solo con alcance municipal revisado.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Actualizar
          </button>
          <button
            onClick={registerPickup}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar pickup'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <div className="text-xs text-gray-500">Pickups</div>
            <div className="text-lg font-bold text-gray-900">{summary.total_pickups}</div>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <div className="text-xs text-gray-500">Recuperado</div>
            <div className="text-lg font-bold text-gray-900">{fmt(summary.toneladas_recuperadas)} t</div>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <div className="text-xs text-green-700">Pureza</div>
            <div className="text-lg font-bold text-green-800">{fmt(summary.pureza_promedio_pct)}%</div>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-center">
            <div className="text-xs text-yellow-700">Contaminación</div>
            <div className="text-lg font-bold text-yellow-800">{fmt(summary.contaminacion_promedio_pct)}%</div>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
            <div className="text-xs text-blue-700">Advertencias</div>
            <div className="text-lg font-bold text-blue-800">{summary.advertencias_educativas}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
          Sin bitácora cargada. Registra un pickup o actualiza el resumen.
        </div>
      )}

      {summary?.warnings?.length ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-xs font-medium text-yellow-800 mb-1">Warnings operativos</p>
          <ul className="text-xs text-yellow-800 space-y-1">
            {summary.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
