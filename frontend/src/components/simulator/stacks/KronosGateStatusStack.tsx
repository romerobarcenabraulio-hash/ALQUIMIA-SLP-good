'use client'

/**
 * M21B — Estado de gates G1–G5 enriquecido (KRONOS Control).
 */
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface GateDefinition {
  descripcion: string
  fase: string
  periodo: string
  riesgo_si_no_se_cruza: string
  prerequisitos: string[]
}

interface GateRuntime {
  status?: string
  fecha_objetivo?: string | null
  prerequisitos_completados?: string[]
  notas?: string
}

interface GateAlert {
  gate_id: string
  nivel_alerta: string
  accion_requerida: string
  descripcion?: string
}

const STATUS_STYLE: Record<string, string> = {
  CRUZADO: 'bg-[#EAF3DE] text-[#2D5A0D]',
  EN_PROCESO: 'bg-[#E8F0FA] text-[#1A5FA8]',
  EN_RIESGO: 'bg-[#FEE2E2] text-[#991B1B]',
  NO_INICIADO: 'bg-[#F5F3EF] text-[#6B6760]',
}

const ALERT_STYLE: Record<string, string> = {
  CRITICO: 'text-red-800 bg-red-50',
  ROJO: 'text-red-700 bg-red-50',
  NARANJA: 'text-orange-800 bg-orange-50',
  AMARILLO: 'text-amber-800 bg-amber-50',
}

export function KronosGateStatusStack() {
  const municipioId = useSimulatorStore(s => s.municipiosActivos[0] ?? null)

  const [gates, setGates] = useState<Record<string, GateRuntime> | null>(null)
  const [definitions, setDefinitions] = useState<Record<string, GateDefinition> | null>(null)
  const [gateActual, setGateActual] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<GateAlert[]>([])
  const [evmSemaforo, setEvmSemaforo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const api = getApiUrl()
    Promise.all([
      fetch(`${api}/api/planning/risk/gates`).then(r => r.json()),
      fetch(`${api}/api/planning/budget/evm/snapshots?limit=1${municipioId ? `&municipio_id=${encodeURIComponent(municipioId)}` : ''}`)
        .then(r => r.json())
        .catch(() => ({ snapshots: [] })),
    ])
      .then(([gatesData, evmData]) => {
        setGates(gatesData.gates)
        setDefinitions(gatesData.definitions ?? null)
        setGateActual(gatesData.gate_actual ?? null)
        setAlertas(gatesData.alertas_activas ?? [])
        const last = evmData.snapshots?.[0]
        if (last?.semaforo) setEvmSemaforo(last.semaforo)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [municipioId])

  return (
    <div className="space-y-4 rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {gateActual && (
            <span className="rounded px-2 py-1 text-[10px] font-semibold bg-[#4A1C7A] text-white">
              Gate actual: {gateActual}
            </span>
          )}
          {evmSemaforo && (
            <span className="rounded px-2 py-1 text-[10px] font-semibold bg-white border border-[#D8C4E8] text-[#4A1C7A]">
              EVM: {evmSemaforo}
            </span>
          )}
        </div>
      </div>

      {loading && <p className="text-[11px] text-[#6B6760]">Cargando gates…</p>}
      {error && <p className="text-[11px] text-red-700">{error}</p>}

      {alertas.length > 0 && (
        <div className="space-y-1">
          {alertas.map((a, i) => (
            <div
              key={`${a.gate_id}-${i}`}
              className={cn('rounded px-2 py-1.5 text-[10px]', ALERT_STYLE[a.nivel_alerta] ?? 'bg-amber-50')}
            >
              <strong>{a.gate_id}</strong> [{a.nivel_alerta}] — {a.accion_requerida}
            </div>
          ))}
        </div>
      )}

      {gates &&
        ['G1', 'G2', 'G3', 'G4', 'G5'].map(id => {
          const g = gates[id] ?? {}
          const def = definitions?.[id]
          const isCurrent = gateActual === id
          return (
            <div
              key={id}
              className={cn(
                'rounded-[8px] border bg-white p-3',
                isCurrent ? 'border-[#4A1C7A] ring-1 ring-[#D8C4E8]' : 'border-[#E8E4DC]',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-bold text-[#4A1C7A]">{id}</span>
                  {def && (
                    <span className="ml-2 text-[10px] text-[#6B6760]">
                      {def.fase} · {def.periodo}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-medium',
                  STATUS_STYLE[g.status ?? 'NO_INICIADO'],
                )}>
                  {(g.status ?? 'NO_INICIADO').replace(/_/g, ' ')}
                </span>
              </div>

              {def && (
                <>
                  <p className="text-[11px] text-[#2D2B28]">{def.descripcion}</p>
                  <p className="mt-1 text-[10px] text-amber-800">
                    Riesgo: {def.riesgo_si_no_se_cruza}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold text-[#6B6760]">Prerequisitos</p>
                  <ul className="list-disc pl-4 mt-0.5">
                    {def.prerequisitos.map(p => {
                      const done = g.prerequisitos_completados?.includes(p)
                      return (
                        <li
                          key={p}
                          className={cn('text-[10px]', done ? 'text-[#2D5A0D]' : 'text-[#2D2B28]')}
                        >
                          {done ? '✓ ' : '○ '}{p}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}

              {g.fecha_objetivo && (
                <p className="mt-2 text-[10px] text-[#6B6760]">
                  Fecha objetivo: {g.fecha_objetivo}
                </p>
              )}
            </div>
          )
        })}
    </div>
  )
}
