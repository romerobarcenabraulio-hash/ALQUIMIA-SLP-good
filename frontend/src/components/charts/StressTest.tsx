'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { calcular } from '@/lib/calculator'
import { useMemo } from 'react'
import { fmt, cn } from '@/lib/utils'

const SCENARIOS = [
  {
    id: 'A',
    label: 'PET −40%',
    desc: 'Caída precio PET al mínimo histórico',
    modify: (s: ReturnType<typeof useSimulatorStore.getState>) => ({ ...s, precios: { ...s.precios, pet: s.precios.pet * 0.6 } }),
  },
  {
    id: 'B',
    label: 'Adopción −50%',
    desc: 'Ciudadanos adoptan separación 50% más lento',
    modify: (s: ReturnType<typeof useSimulatorStore.getState>) => ({
      ...s, pctCapturaPorAño: s.pctCapturaPorAño.map(p => p * 0.5)
    }),
  },
  {
    id: 'C',
    label: 'Bloqueo concesionario',
    desc: 'Concesionario bloquea 12 meses adicionales',
    modify: (s: ReturnType<typeof useSimulatorStore.getState>) => ({
      ...s, pctCapturaPorAño: [0, ...s.pctCapturaPorAño.slice(0, 4)]
    }),
  },
  {
    id: 'D',
    label: 'Costos operativos +20%',
    desc: 'Inflación de costos operativos 20%',
    modify: (s: ReturnType<typeof useSimulatorStore.getState>) => ({
      ...s, costoComSocial: s.costoComSocial * 1.2, mermaLogPct: Math.min(25, s.mermaLogPct * 1.2)
    }),
  },
]

// Bug 3 fix: semáforo por TIR ABSOLUTA, no por delta vs base.
// Un escenario con TIR -99% SIEMPRE es ROJO sin importar el base.
function semaforo(tir: number) {
  if (tir >= 15) return { color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]', label: 'Verde' }
  if (tir >= 0)  return { color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]', label: 'Amarillo' }
  return { color: 'text-[#C0392B]', bg: 'bg-[#FBEAEA]', label: 'Rojo' }
}

export function StressTest() {
  const state = useSimulatorStore()
  const base  = state.resultados?.tir ?? 0

  const results = useMemo(() =>
    SCENARIOS.map(sc => {
      const mod = sc.modify(state as ReturnType<typeof useSimulatorStore.getState>)
      const res = calcular(mod as ReturnType<typeof useSimulatorStore.getState>)
      return { ...sc, tir: res.tir, vpn: res.vpn, ebitda: res.ebitda }
    }),
    [state.precios, state.pctCapturaPorAño, state.horizonte, state.mermaLogPct]
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      {results.map(sc => {
        const { color, bg, label } = semaforo(sc.tir)
        return (
          <div key={sc.id} className={cn('rounded-[12px] p-4 border', bg,
            label === 'Verde' ? 'border-[#3B6D11]/20' : label === 'Amarillo' ? 'border-[#D4881E]/30' : 'border-[#C0392B]/30'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[#1C1B18]">Escenario {sc.id}: {sc.label}</span>
              <span className={cn('text-[10px] font-medium uppercase', color)}>{label}</span>
            </div>
            <p className="text-[11px] text-[#6B6760] mb-3">{sc.desc}</p>
            <div className="flex gap-4">
              <div>
                <p className="text-[9px] text-[#A8A49C] uppercase">TIR</p>
                <p className={cn('font-mono text-[14px]', color)}>{sc.tir.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-[#A8A49C] uppercase">Δ vs base</p>
                <p className={cn('font-mono text-[14px]', color)}>{(sc.tir - base).toFixed(1)} pp</p>
              </div>
              <div>
                <p className="text-[9px] text-[#A8A49C] uppercase">EBITDA</p>
                <p className={cn('font-mono text-[14px] text-[#1C1B18]')}>{fmt.mxnK(sc.ebitda)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
