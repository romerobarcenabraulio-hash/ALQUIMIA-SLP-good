'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { MESES } from '@/lib/utils'

export function HorizonteCircularidad() {
  const { horizonte, setHorizonte, mesInicio, setMesInicio } = useSimulatorStore()

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S8 — Horizonte de circularidad</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">¿Cuántos años abarca el plan?</h2>

      {/* Botones 1–5 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setHorizonte(n)}
            className={cn(
              'w-16 h-16 rounded-[12px] text-center border transition-all font-mono',
              horizonte === n
                ? 'bg-[#3B6D11] text-white border-[#3B6D11] text-[24px]'
                : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC] text-[20px] hover:bg-[#F0EDE5]'
            )}
          >
            {n}
            <br />
            <span className="text-[9px] opacity-70">{n === 1 ? 'año' : 'años'}</span>
          </button>
        ))}
      </div>

      {/* Mes de inicio */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Mes de inicio del programa (estacionalidad)</p>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
          {MESES.map((m, i) => (
            <button
              key={m}
              onClick={() => setMesInicio(i + 1)}
              className={cn(
                'text-[10px] py-1.5 rounded-[4px] border transition-colors',
                mesInicio === i + 1
                  ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                  : 'bg-transparent text-[#A8A49C] border-[#E8E4DC] hover:bg-[#F0EDE5]'
              )}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
