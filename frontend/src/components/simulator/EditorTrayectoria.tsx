'use client'
import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { useDataPermissions } from '@/hooks/useDataPermissions'
import { PRESETS_TRAYECTORIA } from '@/lib/constants'
import { CapturaAreaChart } from '@/components/charts/CapturaAreaChart'
import { Slider } from '@/components/ui/Slider'
import { narrativaS9 } from '@/lib/calculator'
import { debounce } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Conclusion } from '@/components/editorial/Conclusion'

export function EditorTrayectoria() {
  const { horizonte, pctCapturaPorAño, presetTrayectoria, setPreset, setPctCapturaAño, resultados } = useSimulatorStore()
  const { canEditAssumptions } = useDataPermissions()
  const [narrativa, setNarrativa] = useState('')
  const state = useSimulatorStore()

  const updateNarrativa = useRef(debounce(() => {
    const s = useSimulatorStore.getState()
    const r = s.resultados
    if (r) setNarrativa(narrativaS9(s, r))
  }, 400))

  useEffect(() => { updateNarrativa.current() }, [pctCapturaPorAño, horizonte, resultados])

  if (!canEditAssumptions) {
    return (
      <div>
        <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">¿A qué ritmo captura RSU?</h2>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Acceso restringido</p>
            <p className="mt-1 text-sm text-amber-800">
              No tienes permisos para modificar los supuestos de captura. Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
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
        <Conclusion className="mt-4 text-[15px] italic">{narrativa}</Conclusion>
      )}
    </div>
  )
}
