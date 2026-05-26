'use client'

import { useSimulatorStore } from '@/store/simulatorStore'

/**
 * Controles globales editables (2/3): horizonte y generación per cápita.
 * Municipio se elige en `CityFirstSelector` encima de este bloque.
 */
export function PlanGlobalControlsBar({ showGeneration = true }: { showGeneration?: boolean }) {
  const horizonte = useSimulatorStore(s => s.horizonte)
  const setHorizonte = useSimulatorStore(s => s.setHorizonte)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const setGenPercapita = useSimulatorStore(s => s.setGenPercapita)

  return (
    <section className="space-y-4">
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
        <p className="text-[11px] text-[#6B6760]">Horizonte (años)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setHorizonte(n)}
              className={
                horizonte === n
                  ? 'h-9 min-w-[2.25rem] rounded-full border border-[#3B6D11] bg-[#3B6D11] px-3 text-[12px] text-white'
                  : 'h-9 min-w-[2.25rem] rounded-full border border-[#E8E4DC] bg-[#FDFCFA] px-3 text-[12px] text-[#6B6760]'
              }
              aria-label={`Horizonte ${n} años`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {showGeneration && (
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
          <label htmlFor="plan-global-percapita" className="text-[11px] text-[#6B6760]">
            Generación RSU per cápita:{' '}
            <span className="font-medium text-[#1C1B18]">{genPercapita.toFixed(2)} kg/hab/día</span>
          </label>
          <input
            id="plan-global-percapita"
            type="range"
            min={0.65}
            max={1.55}
            step={0.05}
            value={genPercapita}
            onChange={event => setGenPercapita(Number(event.target.value))}
            className="mt-2 h-2 w-full cursor-pointer accent-[#3B6D11]"
          />
        </div>
      )}
    </section>
  )
}
