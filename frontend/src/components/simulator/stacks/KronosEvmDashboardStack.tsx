'use client'

/**
 * EVM Dashboard — Control presupuestal KRONOS (M20) · Nivel B (proyecto municipal).
 * BAC desde store.resultados.capexTotal — nada hardcodeado.
 */
import { useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getApiUrl } from '@/lib/api'

export function KronosEvmDashboardStack() {
  const capexTotal = useSimulatorStore(s => s.resultados?.capexTotal ?? null)
  const municipioId = useSimulatorStore(s => s.municipiosActivos[0] ?? null)

  const [pv, setPv] = useState('')
  const [ev, setEv] = useState('')
  const [ac, setAc] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bac = capexTotal ?? 0

  async function handleCalcular() {
    if (!bac || !pv || !ev || !ac) {
      setError('Completa todos los campos. BAC se toma del CAPEX del simulador.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiUrl()}/api/planning/budget/evm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bac,
          pv: parseFloat(pv),
          ev: parseFloat(ev),
          ac: parseFloat(ac),
          municipio_id: municipioId,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4">
      {capexTotal != null ? (
        <p className="text-[11px] text-[#4A1C7A]">
          BAC (CAPEX simulador): <strong>${bac.toLocaleString('es-MX')} MXN</strong>
        </p>
      ) : (
        <p className="text-[11px] text-amber-700">
          BAC no disponible — complete M06 para calcular CAPEX.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'PV (Valor Planeado)', val: pv, set: setPv },
          { label: 'EV (Valor Ganado)', val: ev, set: setEv },
          { label: 'AC (Costo Real)', val: ac, set: setAc },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="mb-1 block text-[10px] text-[#6B6760]">{label}</label>
            <input
              type="number"
              className="w-full rounded border border-[#D8C4E8] bg-white px-2 py-1 text-[11px]"
              placeholder="MXN"
              value={val}
              onChange={e => set(e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCalcular}
        disabled={loading || !capexTotal}
        className="rounded bg-[#4A1C7A] px-4 py-1.5 text-[11px] text-white disabled:opacity-40"
      >
        {loading ? 'Calculando…' : 'Calcular EVM'}
      </button>

      {error && <p className="text-[11px] text-red-700">{error}</p>}

      {result && (
        <div className="grid grid-cols-2 gap-1 rounded border border-[#D8C4E8] bg-white p-3">
          {Object.entries(result)
            .filter(([k]) => !['fuente', 'timestamp'].includes(k))
            .map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="font-medium text-[#4A1C7A]">{k.toUpperCase()}</span>
                <span className="text-[#2D2B28]">
                  {typeof v === 'number' ? v.toFixed(4) : String(v)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
