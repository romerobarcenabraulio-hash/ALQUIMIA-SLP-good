'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { getLaunchChecklist } from '@/lib/api'
import type { ChecklistItem, LaunchChecklistResponse } from '@/types'

const FLOW = ['Verificar calidad', 'Verificar seguridad', 'Verificar infraestructura', 'Confirmar lanzamiento']

export function LaunchChecklist() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LaunchChecklistResponse | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>()
    for (const item of result?.items ?? []) {
      const group = map.get(item.categoria) ?? []
      group.push(item)
      map.set(item.categoria, group)
    }
    return Array.from(map.entries())
  }, [result])

  const scoreClass = useMemo(() => {
    const score = result?.score_lanzamiento ?? 0
    if (score >= 100) return 'text-[#2D7A0A]'
    if (score >= 75) return 'text-[#C47E00]'
    return 'text-[#B3261E]'
  }, [result])

  const statusLabel = useMemo(() => {
    const status = result?.status
    if (status === 'listo') return 'Operativo sin pendientes críticos'
    if (status === 'advertencias') return 'Con advertencias documentadas'
    return 'Requiere acciones antes del lanzamiento'
  }, [result])

  const statusClass = useMemo(() => {
    const status = result?.status
    if (status === 'listo') return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    if (status === 'advertencias') return 'bg-amber-50 border-amber-200 text-amber-900'
    return 'bg-red-50 border-red-200 text-red-900'
  }, [result])

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const data = await getLaunchChecklist()
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al cargar checklist de lanzamiento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void run()
  }, [])

  return (
    <section className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
      <h1 className="font-serif text-[24px] text-[#1C1B18]">
        Checklist de lanzamiento · <span className="text-[14px] text-[#6B6860]">interno</span>
      </h1>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {FLOW.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="rounded bg-[#F0EDE5] px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Verificando checklist...' : 'Volver a verificar'}
      </button>

      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 w-2/3 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#E8E4DC]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[#E8E4DC]" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p className="font-semibold">Incidencia operativa</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-5 text-center">
            <p className="text-[12px] text-[#6B6760]">Score de lanzamiento</p>
            <p className={`font-serif text-[48px] leading-none ${scoreClass}`}>{result.score_lanzamiento.toFixed(1)}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] ${statusClass}`}>
                {statusLabel}
              </span>
              <span className="inline-flex rounded-full border border-[#E8E4DC] bg-white px-3 py-1 text-[11px] text-[#6B6760]">
                versión {result.version}
              </span>
            </div>
          </div>

          {grouped.map(([category, items]) => (
            <div key={category} className="overflow-hidden rounded-lg border border-[#E8E4DC]">
              <div className="bg-[#FAF8F4] px-3 py-2">
                <p className="text-[13px] font-semibold text-[#1C1B18]">{category}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="bg-white text-[#6B6760]">
                    <tr>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2">Comando de verificación</th>
                      <th className="px-3 py-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-t border-[#F0EDE5] bg-white">
                        <td className="px-3 py-2">{stateIcon(item.estado)} {item.estado}</td>
                        <td className="px-3 py-2 text-[#1C1B18]">{item.descripcion}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#6B6760]">{item.comando_verificacion}</td>
                        <td className="px-3 py-2 text-[#6B6760]">{item.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
            <p className="font-serif text-[16px] text-[#1C1B18]">{result.resumen}</p>
          </div>
        </div>
      )}
    </section>
  )
}

function stateIcon(state: string) {
  if (state === 'ok') return '✅'
  if (state === 'advertencia') return '⚠️'
  return '❌'
}
