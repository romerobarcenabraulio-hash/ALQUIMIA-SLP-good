'use client'
import { useEffect, useRef, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRESETS_TRAYECTORIA } from '@/lib/constants'
import { CapturaAreaChart } from '@/components/charts/CapturaAreaChart'
import { Slider } from '@/components/ui/Slider'
import { narrativaS9 } from '@/lib/calculator'
import { debounce } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function EditorTrayectoria() {
  const { horizonte, pctCapturaPorAño, presetTrayectoria, setPreset, setPctCapturaAño, resultados } = useSimulatorStore()
  const [narrativa, setNarrativa] = useState('')
  const state = useSimulatorStore()

  const updateNarrativa = useRef(debounce(() => {
    const s = useSimulatorStore.getState()
    const r = s.resultados
    if (r) setNarrativa(narrativaS9(s, r))
  }, 400))

  useEffect(() => { updateNarrativa.current() }, [pctCapturaPorAño, horizonte, resultados])

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S9 — Trayectoria de captura</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">¿A qué ritmo captura RSU?</h2>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(PRESETS_TRAYECTORIA).map(nombre => (
          <button
            key={nombre}
            onClick={() => setPreset(nombre)}
            className={cn(
              'px-3 py-1.5 rounded-[6px] text-[12px] border transition-colors',
              presetTrayectoria === nombre
                ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
            )}
          >
            {nombre}
          </button>
        ))}
      </div>

      {/* N sliders */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 mb-5">
        <div className="flex flex-col gap-4">
          {Array.from({ length: horizonte }, (_, i) => (
            <Slider
              key={i}
              label={`Año ${i + 1}`}
              value={pctCapturaPorAño[i] ?? 0}
              min={1} max={100} step={1}
              unit="%"
              onChange={v => setPctCapturaAño(i, v)}
              formatValue={v => `${v}%`}
            />
          ))}
        </div>
      </div>

      {/* Gráfica */}
      <CapturaAreaChart />

      {/* Narrativa dinámica */}
      {narrativa && (
        <div className="mt-4 px-4 py-3 bg-[#EBF3FB] rounded-[10px] border-l-4 border-[#1A5FA8]">
          <p className="text-[13px] text-[#051D45] italic leading-relaxed">{narrativa}</p>
        </div>
      )}
    </div>
  )
}
