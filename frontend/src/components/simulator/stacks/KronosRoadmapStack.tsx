'use client'

/**
 * M05D — Roadmap de implementación KRONOS (24 meses · G1–G5).
 * Punto de entrada narrativo: fases institucionales + actividades + Gantt API.
 */
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fetchPlanningNarrative, type PlanningNarrativeFase } from '@/lib/api'
import { GanttMaestroView } from '@/components/simulator/GanttMaestroView'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  CRUZADO: 'bg-[#EAF3DE] text-[#2D5A0D] border-[#C9DDB1]',
  EN_PROCESO: 'bg-[#E8F0FA] text-[#1A5FA8] border-[#BDD7F5]',
  EN_RIESGO: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
  NO_INICIADO: 'bg-[#F5F3EF] text-[#6B6760] border-[#E8E4DC]',
}

export function KronosRoadmapStack() {
  const zm = useSimulatorStore(s => s.zmActiva)
  const municipios = useSimulatorStore(s => s.municipiosActivos)
  const mixCAs = useSimulatorStore(s => s.mixCAs)
  const resultados = useSimulatorStore(s => s.resultados)
  const horizonte = useSimulatorStore(s => s.horizonte)

  const municipioId = municipios[0] ?? undefined
  const capex = resultados?.capexTotal ?? 1_500_000

  const [fases, setFases] = useState<PlanningNarrativeFase[]>([])
  const [gateActual, setGateActual] = useState<string | null>(null)
  const [selectedGate, setSelectedGate] = useState<string>('G1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPlanningNarrative({
      municipio_id: municipioId,
      zm: zm ?? 'SLP',
      n_cas_pequeno: mixCAs?.P ?? 1,
      n_cas_mediano: mixCAs?.M ?? 0,
      n_cas_grande: mixCAs?.G ?? 0,
      capex_total_mxn: capex,
      horizonte_semanas: Math.min((horizonte ?? 3) * 52, 260),
    })
      .then(data => {
        if (cancelled) return
        setFases(data.fases)
        setGateActual(data.gate_actual)
        if (data.gate_actual) setSelectedGate(data.gate_actual)
      })
      .catch(e => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [municipioId, zm, mixCAs?.P, mixCAs?.M, mixCAs?.G, capex, horizonte])

  const faseSel = fases.find(f => f.gate_id === selectedGate)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#1A5FA8]">
        <span>Gates <strong>G1–G5</strong></span>
        {gateActual && <span className="rounded px-2 py-0.5 bg-[#1A5FA8] text-white font-semibold">Actual: {gateActual}</span>}
        <span className="text-[#6B6760]">Gantt abajo · seguimiento M21B · presupuesto M20</span>
      </div>

      {loading && <p className="text-[11px] text-[#6B6760]">Cargando roadmap…</p>}
      {error && <p className="text-[11px] text-red-700">{error}</p>}

      {!loading && fases.length > 0 && (
        <>
          {/* Timeline G1–G5 */}
          <div className="flex flex-wrap gap-2">
            {fases.map(f => (
              <button
                key={f.gate_id}
                type="button"
                onClick={() => setSelectedGate(f.gate_id)}
                className={cn(
                  'rounded-[8px] border px-3 py-2 text-left transition-colors min-w-[120px]',
                  selectedGate === f.gate_id
                    ? 'border-[#1A5FA8] bg-white shadow-sm'
                    : 'border-[#E8E4DC] bg-white hover:border-[#BDD7F5]',
                )}
              >
                <span className="block text-[10px] font-bold text-[#1A5FA8]">{f.gate_id}</span>
                <span className="block text-[11px] font-semibold text-[#1C1B18]">{f.fase}</span>
                <span className="block text-[9px] text-[#A8A49C]">{f.periodo}</span>
                <span className={cn(
                  'mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium border',
                  STATUS_COLORS[f.status] ?? STATUS_COLORS.NO_INICIADO,
                )}>
                  {f.status.replace(/_/g, ' ')}
                </span>
              </button>
            ))}
          </div>

          {/* Detalle fase seleccionada */}
          {faseSel && (
            <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 space-y-3">
              <div>
                <h4 className="text-[12px] font-semibold text-[#1C1B18]">
                  {faseSel.fase} — {faseSel.descripcion}
                </h4>
                <p className="mt-1 text-[10px] text-amber-800">
                  Si no se cruza: {faseSel.riesgo_si_no_se_cruza}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[#6B6760] mb-1">Prerequisitos</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {faseSel.prerequisitos.map(p => (
                    <li key={p} className="text-[10px] text-[#2D2B28]">{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[#6B6760] mb-1">
                  Actividades ({faseSel.actividades.length})
                </p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {faseSel.actividades.map(a => (
                    <div key={a.task_id} className="flex justify-between gap-2 text-[10px] border-b border-[#F5F3EF] py-1">
                      <span>
                        <strong>{a.task_id}</strong> — {a.nombre}
                        {a.es_critica && (
                          <span className="ml-1 text-red-600">· crítica</span>
                        )}
                      </span>
                      <span className="text-[#A8A49C] shrink-0">
                        S{a.inicio_semana} · {a.duracion_semanas}sem · {a.responsable}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {faseSel.riesgos.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#6B6760] mb-1">Riesgos asociados</p>
                  {faseSel.riesgos.map(r => (
                    <div key={r.id} className="text-[10px] text-[#2D2B28] py-0.5">
                      <strong>{r.id}</strong> [{r.status}] — {r.descripcion}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-[#1A5FA8]">
                Medición: revisar estado en M21B (gates) · Fase 3+ conciliación en M20B · EVM en M20.
              </p>
            </div>
          )}
        </>
      )}

      {/* Gantt API — fuente operativa (no estático M05) */}
      <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
        <p className="text-[11px] font-semibold text-[#1C1B18] mb-2">
          Gantt maestro (API) — detalle semanal
        </p>
        <GanttMaestroView />
      </div>
    </div>
  )
}
