'use client'

import { useEffect, useState } from 'react'
import { getApiUrl } from '@/lib/api'

type Risk = {
  descripcion: string
  probabilidad: string
  impacto: string
  score: number
  status: string
  categoria: string
  gate_afectado: string
  owner: string | null
  fuente_score: string
}

const SEMAFORO_COLORS: Record<string, string> = {
  ROJO: 'bg-red-100 text-red-800 border-red-300',
  AMARILLO: 'bg-amber-100 text-amber-800 border-amber-300',
  VERDE: 'bg-green-100 text-green-800 border-green-300',
  CERRADO: 'bg-gray-100 text-gray-600 border-gray-300',
}

export function KronosRiskDashboardStack() {
  const [register, setRegister] = useState<Record<string, Risk> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/planning/risk/register`)
      .then(r => r.json())
      .then(data => setRegister(data.register))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3 rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4">
      <p className="text-[10px] text-[#6B6760]">Score = Prob × Impacto (PMBOK 11-5)</p>

      {loading && <p className="text-[11px] text-[#A8A49C] animate-pulse">…</p>}
      {error && <p className="text-[11px] text-red-700">{error}</p>}

      {register &&
        Object.entries(register).map(([id, risk]) => (
          <div
            key={id}
            className={`rounded border p-2 ${SEMAFORO_COLORS[risk.status] ?? 'bg-white'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold">{id}</span>
                <span className="ml-2 text-[10px]">{risk.descripcion}</span>
              </div>
              <span className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
                Score: {risk.score} · {risk.status}
              </span>
            </div>
            <div className="mt-1 text-[9px] text-[#6B6760]">
              {risk.probabilidad} × {risk.impacto} · Gate: {risk.gate_afectado}
              {risk.owner ? ` · Owner: ${risk.owner}` : ' · Sin owner'}
            </div>
          </div>
        ))}
    </div>
  )
}
