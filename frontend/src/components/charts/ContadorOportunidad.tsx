'use client'
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function ContadorOportunidad() {
  const { resultados, gatesAprobados } = useSimulatorStore()
  const [perdido, setPerdido] = useState(0)

  const gate1 = gatesAprobados[0]
  const ingresoDia = resultados ? resultados.ingresosBrutos / (useSimulatorStore.getState().horizonte * 300) : 1_200_000

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gate1) { setPerdido(0); return }
    const startMs = Date.now()
    const interval = setInterval(() => {
      const segundos = (Date.now() - startMs) / 1000
      setPerdido(segundos * ingresoDia / 86400)
    }, 100)
    return () => clearInterval(interval)
  }, [gate1, ingresoDia])

  if (gate1) return null

  return (
    <div className="bg-gradient-to-r from-[#FBEAEA] to-[#FEF7E7] border border-[#C0392B]/30 rounded-[14px] p-6">
      <p className="text-[11px] uppercase tracking-wide text-[#C0392B] mb-2">
        ⏱ Oportunidad perdida por retraso en reforma
      </p>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[42px] text-[#C0392B] font-medium">
          {fmt.mxn(perdido)}
        </span>
        <span className="text-[14px] text-[#8A4F08]">desde que abriste esta página</span>
      </div>
      <div className="mt-3 flex gap-8">
        <div>
          <p className="text-[10px] text-[#A8A49C] uppercase">Por día</p>
          <p className="font-mono text-[16px] text-[#C0392B]">{fmt.mxn(ingresoDia)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#A8A49C] uppercase">Por semana</p>
          <p className="font-mono text-[16px] text-[#C0392B]">{fmt.mxn(ingresoDia * 7)}</p>
        </div>
      </div>
    </div>
  )
}
