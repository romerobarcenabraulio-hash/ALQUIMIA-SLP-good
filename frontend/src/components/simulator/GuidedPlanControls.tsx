'use client'

import { useSimulatorStore } from '@/store/simulatorStore'

export function GuidedPlanControls() {
  const municipio = useSimulatorStore(s => s.seleccionMunicipioCatalog?.nombre ?? s.zmActiva)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const setHorizonte = useSimulatorStore(s => s.setHorizonte)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const setGenPercapita = useSimulatorStore(s => s.setGenPercapita)

  return (
    <section className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">Plan guiado</p>
      <h2 className="font-serif text-[22px] text-[#1C1B18]">Variables globales del plan</h2>
      <p className="mt-1 text-[12px] text-[#6B6760]">
        Solo puedes editar tres variables: municipio, tiempo y generación per cápita.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2">
          <p className="text-[11px] text-[#6B6760]">Municipio activo (global)</p>
          <p className="font-medium text-[#1C1B18]">{municipio}</p>
        </div>

        <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2">
          <p className="text-[11px] text-[#6B6760]">Tiempo del plan (años)</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setHorizonte(n)}
                className={
                  horizonte === n
                    ? 'h-8 w-8 rounded-full border border-[#3B6D11] bg-[#3B6D11] text-[12px] text-white'
                    : 'h-8 w-8 rounded-full border border-[#E8E4DC] bg-[#FDFCFA] text-[12px] text-[#6B6760]'
                }
                aria-label={`Horizonte ${n} años`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
        <label htmlFor="guided-percapita" className="text-[11px] text-[#6B6760]">
          Generación per cápita: <span className="font-medium text-[#1C1B18]">{genPercapita.toFixed(2)} kg/hab/día</span>
        </label>
        <input
          id="guided-percapita"
          type="range"
          min={0.7}
          max={1.5}
          step={0.05}
          value={genPercapita}
          onChange={event => setGenPercapita(Number(event.target.value))}
          className="mt-2 h-2 w-full cursor-pointer accent-[#3B6D11]"
        />
      </div>
    </section>
  )
}
