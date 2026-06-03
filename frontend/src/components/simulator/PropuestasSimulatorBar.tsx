'use client'

import type { EscenarioGuardado } from '@/types'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { MarginalNote } from '@/components/editorial'

const SLOT_LABELS = ['Propuesta A', 'Propuesta B', 'Propuesta C'] as const

function menorCostoSimulacionIdx(slots: readonly (EscenarioGuardado | null)[]): number | null {
  const costs = slots.map((s, i) => {
    const c = s?.costoModeloPromedioAnualMxn
    return typeof c === 'number' && Number.isFinite(c) ? ([c, i] as const) : null
  })
  const valid = costs.filter((x): x is readonly [number, number] => x !== null)
  if (valid.length === 0) return null
  valid.sort((a, b) => a[0] - b[0])
  const minCost = valid[0]![0]
  const ties = valid.filter(([c]) => c === minCost)
  if (ties.length !== 1) return null
  return ties[0]![1]
}

export function PropuestasSimulatorBar() {
  const slots = useSimulatorStore(s => s.propuestaSlots)
  const guardar = useSimulatorStore(s => s.guardarPropuestaEnSlot)
  const cargar = useSimulatorStore(s => s.cargarPropuestaDesdeSlot)
  const limpiar = useSimulatorStore(s => s.limpiarPropuestaSlot)

  const winnerIdx = menorCostoSimulacionIdx(slots)

  return (
    <section
      id="propuestas-simulador"
      className="mb-2 scroll-mt-[120px] border-t border-[#E8E4DC] pt-4"
      aria-labelledby="propuestas-simulator-title"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 id="propuestas-simulator-title" className="text-[13px] font-semibold text-[#1C1B18]">
          Propuestas de escenario
        </h2>
        <MarginalNote className="mt-0 text-[10px]">Guarda hasta 3 · Activar restaura la configuración técnica</MarginalNote>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        {SLOT_LABELS.map((label, slot) => {
          const idx = slot as 0 | 1 | 2
          const esc = slots[slot]
          const isWinner = winnerIdx === slot && esc != null
          return (
            <div
              key={label}
              className={cn(
                'rounded-[10px] border bg-white px-3 py-2.5 flex flex-col gap-1.5 min-h-[6rem]',
                isWinner ? 'border-[#3B6D11] shadow-[inset_0_0_0_1px_rgba(59,109,17,0.15)]' : 'border-[#E8E4DC]'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6760]">
                  {label}
                </span>
                {isWinner && (
                  <span className="text-[10px] font-medium uppercase text-[#3B6D11] rounded-full bg-[#EAF3DE] px-2 py-0.5">
                    Menor costo modelo
                  </span>
                )}
              </div>
              {esc ? (
                <>
                  <p className="text-[13px] font-medium text-[#1C1B18] line-clamp-2">{esc.nombre}</p>
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#6B6760]">
                    <dt className="text-[#A8A49C]">Horizonte</dt>
                    <dd className="font-mono text-[#1C1B18]">
                      {typeof esc.inputs.horizonte === 'number' ? `${esc.inputs.horizonte} años` : '—'}
                    </dd>
                    <dt className="text-[#A8A49C]">Costo modelo año</dt>
                    <dd className="font-mono text-[#1C1B18]">
                      {typeof esc.costoModeloPromedioAnualMxn === 'number'
                        ? fmt.mxnM(esc.costoModeloPromedioAnualMxn)
                        : '—'}
                    </dd>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => cargar(idx)}
                      className="rounded-[6px] border border-[#3B6D11] bg-[#3B6D11] px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-95"
                    >
                      Activar
                    </button>
                    <button
                      type="button"
                      onClick={() => guardar(idx)}
                      className="rounded-[6px] border border-[#E8E4DC] bg-[#F8F6F1] px-2.5 py-1 text-[11px] font-medium text-[#1C1B18] hover:border-[#3B6D11]/40"
                    >
                      Sobrescribir
                    </button>
                    <button
                      type="button"
                      onClick={() => limpiar(idx)}
                      className="rounded-[6px] border border-transparent px-2.5 py-1 text-[11px] font-medium text-[#8C8880] hover:bg-[#F0EDE5]"
                    >
                      Vaciar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-[#8C8880]">Espacio disponible para congelar un escenario actual.</p>
                  <button
                    type="button"
                    onClick={() => guardar(idx)}
                    className="mt-auto w-fit rounded-[6px] border border-[#3B6D11] px-3 py-1.5 text-[12px] font-medium text-[#3B6D11] hover:bg-[#EAF3DE]"
                  >
                    Guardar aquí
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
