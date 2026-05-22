'use client'

import { useEffect, useState } from 'react'
import { getApiUrl } from '@/lib/api'

export function KronosGateStatusStack() {
  const [gates, setGates] = useState<Record<string, { status?: string }> | null>(null)
  const [gateActual, setGateActual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/planning/risk/gates`)
      .then(r => r.json())
      .then(d => {
        setGates(d.gates)
        setGateActual(d.gate_actual ?? null)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4">
      <h3 className="text-[13px] font-semibold text-[#4A1C7A]">
        Estado de gates G1–G5 (M21B)
      </h3>
      {gateActual && (
        <p className="mt-1 text-[11px] text-[#4A1C7A]">
          Gate actual: <strong>{gateActual}</strong>
        </p>
      )}
      {loading && <p className="text-[11px] text-[#6B6760]">Cargando gates…</p>}
      {error && <p className="text-[11px] text-red-700">{error}</p>}
      {gates &&
        Object.entries(gates).map(([id, g]) => (
          <div key={id} className="mt-2 flex justify-between text-[11px]">
            <span className="font-medium">{id}</span>
            <span>{g.status ?? '—'}</span>
          </div>
        ))}
    </div>
  )
}
